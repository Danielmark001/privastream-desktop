var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import os from 'os';
import crypto from 'crypto';
import { PersistentStatefulService, Inject, mutation, ViewHandler } from 'services/core';
import { E_JSON_RPC_ERROR, } from 'services/api/jsonrpc/index';
import { $t } from 'services/i18n';
import { OS, getOS } from 'util/operating-systems';
const net = require('net');
const LOCAL_HOST_NAME = '127.0.0.1';
const WILDCARD_HOST_NAME = '0.0.0.0';
const TCP_PORT = 28194;
class TcpServerServiceViews extends ViewHandler {
    get settings() {
        return this.state;
    }
    get metadata() {
        return {
            namedPipe: {
                enabled: {
                    type: 'checkbox',
                    label: $t('Enabled'),
                    children: {
                        pipeName: {
                            type: 'text',
                            label: $t('Pipe Name'),
                            displayed: this.state.namedPipe.enabled,
                        },
                    },
                },
            },
            websockets: {
                enabled: {
                    type: 'checkbox',
                    label: $t('Enabled'),
                    children: {
                        allowRemote: {
                            type: 'checkbox',
                            label: $t('Allow Remote Connections'),
                            displayed: this.state.websockets.enabled,
                        },
                        port: {
                            type: 'number',
                            label: $t('Port'),
                            min: 0,
                            max: 65535,
                            displayed: this.state.websockets.enabled,
                        },
                    },
                },
            },
        };
    }
}
export class TcpServerService extends PersistentStatefulService {
    constructor() {
        super(...arguments);
        this.clients = {};
        this.nextClientId = 1;
        this.servers = [];
        this.isRequestsHandlingStopped = false;
        this.isEventsSendingStopped = true;
        this.forceRequests = false;
        this.enableLogs = false;
    }
    get views() {
        return new TcpServerServiceViews(this.state);
    }
    init() {
        super.init();
        this.externalApiService.serviceEvent.subscribe(event => this.onServiceEventHandler(event));
    }
    listen() {
        this.listenConnections(this.createTcpServer());
        if (this.state.namedPipe.enabled && getOS() === OS.Windows) {
            this.listenConnections(this.createNamedPipeServer());
        }
        if (this.state.websockets.enabled)
            this.listenConnections(this.createWebsoketsServer());
    }
    stopRequestsHandling(stopEventsToo = true) {
        this.isRequestsHandlingStopped = true;
        this.isEventsSendingStopped = stopEventsToo;
    }
    startRequestsHandling() {
        this.isRequestsHandlingStopped = false;
        this.isEventsSendingStopped = false;
    }
    stopListening() {
        this.servers.forEach(server => server.close());
        Object.keys(this.clients).forEach(clientId => this.disconnectClient(Number(clientId)));
    }
    get websocketRemoteConnectionEnabled() {
        return this.state.websockets.enabled && this.state.websockets.allowRemote;
    }
    enableWebsoketsRemoteConnections() {
        this.stopListening();
        const defaultWebsoketsSettings = TcpServerService.defaultState.websockets;
        this.setSettings({
            websockets: Object.assign(Object.assign({}, defaultWebsoketsSettings), { enabled: true, allowRemote: true }),
        });
        this.listen();
    }
    disableWebsocketsRemoteConnections() {
        this.stopListening();
        const defaultWebsoketsSettings = TcpServerService.defaultState.websockets;
        this.setSettings({
            websockets: Object.assign({}, defaultWebsoketsSettings),
        });
        this.listen();
    }
    restoreDefaultSettings() {
        this.setSettings(TcpServerService.defaultState);
    }
    setSettings(settings) {
        const needToGenerateToken = settings.websockets && settings.websockets.allowRemote && !this.state.token;
        if (needToGenerateToken)
            this.generateToken();
        this.SET_SETTINGS(settings);
    }
    getSettings() {
        return this.state;
    }
    getIPAddresses() {
        const ifaces = os.networkInterfaces();
        const addresses = [];
        Object.keys(ifaces).forEach(ifaceName => {
            const iface = ifaces[ifaceName];
            iface.forEach(interfaceInfo => {
                addresses.push({
                    interface: ifaceName,
                    address: interfaceInfo.address,
                    family: interfaceInfo.family,
                    internal: interfaceInfo.internal,
                });
            });
        });
        return addresses.sort((a, b) => parseInt(a.family[3], 10) - parseInt(b.family[3], 10));
    }
    generateToken() {
        const buf = new Uint8Array(20);
        crypto.randomFillSync(buf);
        let token = '';
        buf.forEach(val => (token += val.toString(16)));
        this.setSettings({ token });
        return token;
    }
    listenConnections(server) {
        this.servers.push(server);
        server.nativeServer.on('connection', socket => this.onConnectionHandler(socket, server));
        server.nativeServer.on('error', error => {
            throw error;
        });
    }
    createNamedPipeServer() {
        const settings = this.state.namedPipe;
        const server = net.createServer();
        server.listen(`\\\\.\\pipe\\${settings.pipeName}`);
        return {
            type: 'namedPipe',
            nativeServer: server,
            close() {
                server.close();
            },
        };
    }
    createTcpServer() {
        const server = net.createServer();
        server.listen(TCP_PORT, LOCAL_HOST_NAME);
        return {
            type: 'tcp',
            nativeServer: server,
            close() {
                server.close();
            },
        };
    }
    createWebsoketsServer() {
        const settings = this.state.websockets;
        const http = require('http');
        const sockjs = require('sockjs');
        const websocketsServer = sockjs.createServer();
        const httpServer = http.createServer();
        websocketsServer.installHandlers(httpServer, { prefix: '/api' });
        httpServer.listen(settings.port, settings.allowRemote ? WILDCARD_HOST_NAME : LOCAL_HOST_NAME);
        return {
            type: 'websockets',
            nativeServer: websocketsServer,
            close() {
                httpServer.close();
            },
        };
    }
    onConnectionHandler(socket, server) {
        this.log('new connection');
        const id = this.nextClientId++;
        const client = {
            id,
            socket,
            subscriptions: [],
            listenAllSubscriptions: false,
            isAuthorized: false,
        };
        this.clients[id] = client;
        this.log(`Id assigned ${id}`);
        if (server.type === 'namedPipe' || (server.type === 'tcp' && this.isLocalClient(client))) {
            this.authorizeClient(client);
        }
        socket.on('data', (data) => {
            this.onRequestHandler(client, data.toString());
        });
        socket.on('end', () => {
            this.onDisconnectHandler(client);
        });
        socket.on('close', () => {
            this.onDisconnectHandler(client);
        });
        socket.on('error', e => {
            if (e.code === 'EPIPE') {
                console.debug('TCP Server: Socket was disconnected', e);
                this.onDisconnectHandler(client);
            }
            else {
                throw e;
            }
        });
        this.log(`Client ${id} ready`);
    }
    authorizeClient(client) {
        client.isAuthorized = true;
    }
    isLocalClient(client) {
        const localAddresses = this.getIPAddresses()
            .filter(addressDescr => addressDescr.internal)
            .map(addressDescr => addressDescr.address);
        return localAddresses.includes(client.socket.remoteAddress);
    }
    onRequestHandler(client, data) {
        this.log(`tcp request from ${client.id}`, data);
        if (this.isRequestsHandlingStopped && !this.forceRequests) {
            this.sendResponse(client, this.jsonrpcService.createError(null, {
                code: E_JSON_RPC_ERROR.INTERNAL_JSON_RPC_ERROR,
                message: 'API server is busy. Try again later',
            }), true);
            return;
        }
        const requests = data.split('\n');
        for (const requestString of requests) {
            if (!requestString)
                return;
            try {
                const request = JSON.parse(requestString);
                const errorMessage = this.validateRequest(request);
                if (errorMessage) {
                    const errorResponse = this.jsonrpcService.createError(request, {
                        code: E_JSON_RPC_ERROR.INVALID_PARAMS,
                        message: errorMessage,
                    });
                    this.sendResponse(client, errorResponse);
                    return;
                }
                if (this.hadleTcpServerDirectives(client, request))
                    return;
                const response = this.externalApiService.executeServiceRequest(request);
                if (response.result && response.result._type === 'SUBSCRIPTION') {
                    const subscriptionId = response.result.resourceId;
                    if (!client.subscriptions.includes(subscriptionId)) {
                        client.subscriptions.push(subscriptionId);
                    }
                }
                this.sendResponse(client, response);
            }
            catch (e) {
                this.sendResponse(client, this.jsonrpcService.createError(null, {
                    code: E_JSON_RPC_ERROR.INVALID_REQUEST,
                    message: 'Make sure that the request is valid json. ' +
                        'If request string contains multiple requests, ensure requests are separated ' +
                        'by a single newline character LF ( ASCII code 10)',
                }));
                this.disconnectClient(client.id);
                return;
            }
        }
    }
    onServiceEventHandler(event) {
        Object.keys(this.clients).forEach(clientId => {
            const client = this.clients[clientId];
            const eventName = event.result.resourceId.split('.')[1];
            const allowlistedEvents = [
                'collectionWillSwitch',
                'collectionAdded',
                'collectionRemoved',
                'collectionSwitched',
                'collectionUpdated',
                'studioModeChanged',
            ];
            const force = allowlistedEvents.includes(eventName);
            const needToSendEvent = client.listenAllSubscriptions || client.subscriptions.includes(event.result.resourceId);
            if (needToSendEvent)
                this.sendResponse(client, event, force);
        });
    }
    validateRequest(request) {
        let message = '';
        if (!request.id)
            message += ' id is required;';
        if (!request.params)
            message += ' params is required;';
        if (request.params && !request.params.resource)
            message += ' resource is required;';
        return message;
    }
    hadleTcpServerDirectives(client, request) {
        const protectedResources = ['FileManagerService'];
        if (protectedResources.includes(request.params.resource)) {
            this.sendResponse(client, this.jsonrpcService.createError(request, {
                code: E_JSON_RPC_ERROR.INTERNAL_JSON_RPC_ERROR,
                message: 'The requested resource is not available.',
            }));
            return true;
        }
        if (request.method === 'auth' && request.params.resource === 'TcpServerService') {
            if (this.state.token && request.params.args[0] === this.state.token) {
                this.authorizeClient(client);
                this.sendResponse(client, {
                    jsonrpc: '2.0',
                    id: request.id,
                    result: true,
                });
            }
            else {
                this.sendResponse(client, this.jsonrpcService.createError(request, {
                    code: E_JSON_RPC_ERROR.INTERNAL_JSON_RPC_ERROR,
                    message: 'Invalid token',
                }));
            }
            return true;
        }
        if (!client.isAuthorized) {
            this.sendResponse(client, this.jsonrpcService.createError(request, {
                code: E_JSON_RPC_ERROR.INTERNAL_JSON_RPC_ERROR,
                message: 'Authorization required. Use TcpServerService.auth(token) method',
            }));
            return true;
        }
        if (request.method === 'unsubscribe' &&
            this.externalApiService.subscriptions[request.params.resource]) {
            const subscriptionInd = client.subscriptions.indexOf(request.params.resource);
            if (subscriptionInd !== -1)
                client.subscriptions.splice(subscriptionInd, 1);
            this.sendResponse(client, {
                jsonrpc: '2.0',
                id: request.id,
                result: subscriptionInd !== -1,
            });
            return true;
        }
        if (request.method === 'listenAllSubscriptions' &&
            request.params.resource === 'TcpServerService') {
            client.listenAllSubscriptions = true;
            this.sendResponse(client, {
                jsonrpc: '2.0',
                id: request.id,
                result: true,
            });
            return true;
        }
        if (request.method === 'forceRequests' && request.params.resource === 'TcpServerService') {
            this.forceRequests = request.params.args[0];
            this.sendResponse(client, {
                jsonrpc: '2.0',
                id: request.id,
                result: true,
            });
            return true;
        }
    }
    onDisconnectHandler(client) {
        this.log(`client disconnected ${client.id}`);
        delete this.clients[client.id];
    }
    sendResponse(client, response, force = false) {
        if (this.isEventsSendingStopped) {
            if (!force && !this.forceRequests)
                return;
        }
        if (!client.socket.writable) {
            this.log('cannot write to closed socket to send response', response);
            return;
        }
        try {
            this.log('send response', response);
            client.socket.write(`${JSON.stringify(response)}\n`);
        }
        catch (e) {
            console.info('unable to send response', response, e);
        }
    }
    disconnectClient(clientId) {
        const client = this.clients[clientId];
        client.socket.end();
        delete this.clients[clientId];
    }
    log(...messages) {
        if (!this.enableLogs)
            return;
        console.log(...messages);
    }
    SET_SETTINGS(patch) {
        this.state = Object.assign(Object.assign({}, this.state), patch);
    }
}
TcpServerService.defaultState = {
    token: '',
    namedPipe: {
        enabled: true,
        pipeName: 'slobs',
    },
    websockets: {
        enabled: false,
        port: 59650,
        allowRemote: false,
    },
};
__decorate([
    Inject()
], TcpServerService.prototype, "jsonrpcService", void 0);
__decorate([
    Inject()
], TcpServerService.prototype, "usageStatisticsService", void 0);
__decorate([
    Inject()
], TcpServerService.prototype, "externalApiService", void 0);
__decorate([
    mutation()
], TcpServerService.prototype, "SET_SETTINGS", null);
//# sourceMappingURL=tcp-server.js.map