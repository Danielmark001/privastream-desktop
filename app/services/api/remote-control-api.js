var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import os from 'os';
import { authorizedHeaders, jfetch } from 'util/requests';
import { importSocketIOClient } from 'util/slow-imports';
import { InitAfter, Inject, Service } from 'services/core';
import { RealmObject } from 'services/realm';
import { E_JSON_RPC_ERROR, } from 'services/api/jsonrpc/index';
class ConnectedDevice extends RealmObject {
}
ConnectedDevice.schema = {
    name: 'ConnectedDevice',
    embedded: true,
    properties: {
        socketId: 'string',
        deviceName: 'string',
        clientType: 'string',
    },
};
ConnectedDevice.register();
class RemoteControlEphemeralState extends RealmObject {
}
RemoteControlEphemeralState.schema = {
    name: 'RemoteControlEphemeralState',
    properties: {
        devices: {
            type: 'list',
            objectType: 'ConnectedDevice',
            default: [],
        },
    },
};
RemoteControlEphemeralState.register();
class RemoteControlPresistentState extends RealmObject {
}
RemoteControlPresistentState.schema = {
    name: 'RemoteControlPersistentState',
    properties: {
        enabled: { type: 'bool', default: false },
    },
};
RemoteControlPresistentState.register({ persist: true });
let RemoteControlService = class RemoteControlService extends Service {
    constructor() {
        super(...arguments);
        this.state = RemoteControlPresistentState.inject();
        this.connectedDevices = RemoteControlEphemeralState.inject();
    }
    init() {
        super.init();
        this.userService.userLogin.subscribe(() => {
            if (this.state.enabled)
                this.createStreamlabsRemoteConnection();
        });
        this.externalApiService.serviceEvent.subscribe(event => {
            this.sendMessage(event);
        });
    }
    disconnect() {
        this.setEnableRemoteConnection(false);
        this.socket.disconnect();
        this.socket = undefined;
        this.setConnectedDevices([]);
    }
    disconnectDevice(socketId) {
        if (this.socket) {
            this.socket.emit('disconnectDevice', { socketId }, (response) => {
                if (!response.error) {
                    this.removeConnectedDevice(socketId);
                }
            });
        }
    }
    createStreamlabsRemoteConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.userService.isLoggedIn)
                return;
            this.setEnableRemoteConnection(true);
            const io = yield importSocketIOClient();
            const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/modules/mobile-remote-io/config?device_name=${os.hostname()}`;
            const headers = authorizedHeaders(this.userService.apiToken);
            const resp = yield jfetch(new Request(url, { headers }));
            if (resp.success) {
                const socket = io.default(`${resp.data.url}?token=${resp.data.token}`, {
                    transports: ['websocket'],
                    reconnection: false,
                });
                socket.emit('getDevices', {}, (devices) => {
                    this.setConnectedDevices(devices);
                });
                this.socket = socket;
                this.listen();
            }
        });
    }
    listen() {
        if (this.socket) {
            this.socket.on('message', (data, callback) => {
                const response = this.requestHandler(data.toString());
                callback(this.formatEvent(response));
            });
            this.socket.on('deviceConnected', (device) => {
                const devices = this.connectedDevices.devices;
                if (devices.find(d => d.socketId === device.socketId))
                    return;
                this.setConnectedDevices(devices.concat([device]));
            });
            this.socket.on('deviceDisconnected', (device) => {
                this.removeConnectedDevice(device.socketId);
            });
            this.socket.on('error', (e) => {
                throw e;
            });
            this.socket.on('disconnect', (reason) => {
                if (reason !== 'io client disconnect') {
                    this.createStreamlabsRemoteConnection();
                }
            });
        }
    }
    sendMessage(event) {
        if (this.socket) {
            try {
                this.socket.emit('message', this.formatEvent(event), (response) => {
                    if (response.error)
                        throw response.error;
                });
            }
            catch (e) {
                console.error('Unable to send message', e);
            }
        }
    }
    requestHandler(data) {
        const requests = data.split('\n');
        for (const requestString of requests) {
            if (!requestString)
                return;
            try {
                const request = JSON.parse(requestString);
                const errorMessage = this.validateRequest(request);
                if (errorMessage) {
                    const errorResponse = this.jsonRpcService.createError(request, {
                        code: E_JSON_RPC_ERROR.INVALID_PARAMS,
                        message: errorMessage,
                    });
                    return errorResponse;
                }
                const protectedResources = ['FileManagerService'];
                if (protectedResources.includes(request.params.resource)) {
                    const err = this.jsonRpcService.createError(request, {
                        code: E_JSON_RPC_ERROR.INTERNAL_JSON_RPC_ERROR,
                        message: 'The requested resource is not available.',
                    });
                    return err;
                }
                const response = this.externalApiService.executeServiceRequest(request);
                return response;
            }
            catch (e) {
                const errorResponse = this.jsonRpcService.createError(null, {
                    code: E_JSON_RPC_ERROR.INVALID_REQUEST,
                    message: 'Make sure that the request is valid json. ' +
                        'If request string contains multiple requests, ensure requests are separated ' +
                        'by a single newline character LF ( ASCII code 10)',
                });
                this.disconnect();
                return errorResponse;
            }
        }
    }
    formatEvent(event) {
        return `${JSON.stringify(event)}\n`;
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
    setEnableRemoteConnection(val) {
        this.state.db.write(() => {
            this.state.enabled = val;
        });
    }
    setConnectedDevices(devices) {
        this.connectedDevices.db.write(() => {
            this.connectedDevices.devices = devices.filter(device => device.deviceName !== os.hostname());
        });
    }
    removeConnectedDevice(socketId) {
        this.connectedDevices.db.write(() => {
            this.connectedDevices.devices = this.connectedDevices.devices.filter(d => d.socketId !== socketId);
        });
    }
};
__decorate([
    Inject()
], RemoteControlService.prototype, "hostsService", void 0);
__decorate([
    Inject()
], RemoteControlService.prototype, "userService", void 0);
__decorate([
    Inject()
], RemoteControlService.prototype, "externalApiService", void 0);
__decorate([
    Inject()
], RemoteControlService.prototype, "jsonRpcService", void 0);
RemoteControlService = __decorate([
    InitAfter('UserService')
], RemoteControlService);
export { RemoteControlService };
//# sourceMappingURL=remote-control-api.js.map