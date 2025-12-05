import electron from 'electron';
import { Observable, Subject } from 'rxjs';
import { JsonrpcService } from 'services/api/jsonrpc';
import * as traverse from 'traverse';
import { ServicesManager } from '../../services-manager';
import { commitMutation } from '../../store';
import Utils from 'services/utils';
import { RealmService } from 'services/realm';
const { ipcRenderer } = electron;
export class InternalApiClient {
    constructor() {
        this.servicesManager = ServicesManager.instance;
        this.promises = {};
        this.actionResponses = {};
        this.subscriptions = {};
        this.windowId = Utils.getWindowId();
        this.listenWorkerWindowMessages();
    }
    applyIpcProxy(service, isAction = false, shouldReturn = false) {
        const availableServices = Object.keys(this.servicesManager.services);
        if (!availableServices.includes(service.constructor.name))
            return service;
        return new Proxy(service, {
            get: (target, property, receiver) => {
                if (property === 'actions') {
                    return this.applyIpcProxy(target, true);
                }
                if (isAction && property === 'return') {
                    return this.applyIpcProxy(target, true, true);
                }
                if (!target[property])
                    return target[property];
                if (typeof target[property] !== 'function' && !(target[property] instanceof Observable)) {
                    return target[property];
                }
                if (typeof target[property] === 'function' &&
                    target[property]['__executeInCurrentWindow']) {
                    return target[property];
                }
                const methodName = property.toString();
                const isHelper = target['_isHelper'];
                if (isHelper) {
                    throw new Error('ATTEMPTED TO PROXY HELPER METHOD');
                }
                const handler = this.getRequestHandler(target, methodName, {
                    isAction,
                    shouldReturn,
                });
                if (typeof target[property] === 'function')
                    return handler;
                if (target[property] instanceof Observable)
                    return handler();
            },
        });
    }
    getRequestHandler(target, methodName, options) {
        const serviceName = target.constructor.name;
        const isHelper = target['_isHelper'];
        const resourceId = isHelper ? target['_resourceId'] : serviceName;
        const isObservable = target[methodName] instanceof Observable;
        const isDevMode = Utils.isDevMode();
        return (...args) => {
            traverse(args).forEach((item) => {
                if (item && item._isHelper) {
                    return {
                        _type: 'HELPER',
                        resourceId: item._resourceId,
                    };
                }
            });
            if (options.isAction || isObservable) {
                const request = this.jsonrpc.createRequestWithOptions(resourceId, methodName, {
                    compactMode: true,
                    fetchMutations: options.shouldReturn,
                    noReturn: !options.shouldReturn,
                }, ...args);
                try {
                    ipcRenderer.send('services-request-async', request);
                }
                catch (e) {
                    console.error('Failed to send async services request', e, {
                        request,
                    });
                    throw e;
                }
                if (isObservable) {
                    const observableResourceId = `${resourceId}.${methodName}`;
                    return (this.subscriptions[observableResourceId] =
                        this.subscriptions[observableResourceId] || new Subject());
                }
                if (options.shouldReturn) {
                    return new Promise((resolve, reject) => {
                        this.actionResponses[request.id] = [resolve, reject];
                    });
                }
                return;
            }
            let startMark;
            if (isDevMode) {
                const msg = `Calling synchronous service method from renderer process: ${resourceId}.${methodName} - Consider calling as an action instead`;
                const func = Utils.env.SLOBS_TRACE_SYNC_IPC ? console.trace : console.warn;
                func(msg);
                startMark = performance.now();
            }
            const response = electron.ipcRenderer.sendSync('services-request', this.jsonrpc.createRequestWithOptions(resourceId, methodName, { compactMode: true, fetchMutations: true, windowId: this.windowId }, ...args));
            if (isDevMode) {
                const measure = performance.now() - startMark;
                if (measure > 50) {
                    console.warn(`Synchronous method ${resourceId}.${methodName} took ${measure.toFixed(2)}ms to execute`);
                }
            }
            if (response.error) {
                throw new Error('IPC request failed: check the errors in the worker window');
            }
            const result = response.result;
            const mutations = response.mutations;
            mutations.forEach(commitMutation);
            return this.handleResult(result);
        };
    }
    handleResult(result) {
        if (result && result._type === 'SUBSCRIPTION') {
            if (result.emitter === 'PROMISE') {
                return new Promise((resolve, reject) => {
                    const promiseId = result.resourceId;
                    this.promises[promiseId] = [resolve, reject];
                });
            }
            if (result.emitter === 'STREAM') {
                return (this.subscriptions[result.resourceId] =
                    this.subscriptions[result.resourceId] || new Subject());
            }
        }
        if (result && (result._type === 'HELPER' || result._type === 'SERVICE')) {
            const helper = this.getResource(result.resourceId);
            return helper;
        }
        if (result && result._type === 'REALM_OBJECT') {
            return RealmService.registeredClasses[result.realmType].fromId(result.resourceId);
        }
        traverse(result).forEach((item) => {
            if (item && item._type === 'HELPER') {
                return this.getResource(item.resourceId);
            }
            if (item && item._type === 'REALM_OBJECT') {
                return RealmService.registeredClasses[result.realmType].fromId(result.resourceId);
            }
        });
        return result;
    }
    getResource(resourceId) {
        return this.servicesManager.getResource(resourceId);
    }
    get jsonrpc() {
        return JsonrpcService;
    }
    listenWorkerWindowMessages() {
        const promises = this.promises;
        ipcRenderer.on('services-response-async', (e, response) => {
            if (response.error) {
                this.actionResponses[response.id][1](response.error);
                return;
            }
            response.mutations.forEach(commitMutation);
            const result = this.handleResult(response.result);
            if (result instanceof Promise) {
                result
                    .then(r => this.actionResponses[response.id][0](r))
                    .catch(r => this.actionResponses[response.id][1](r));
            }
            else {
                this.actionResponses[response.id][0](result);
            }
        });
        ipcRenderer.on('services-message', (event, message) => {
            if (message.result._type !== 'EVENT')
                return;
            if (message.result.emitter === 'PROMISE') {
                const promisePayload = message.result;
                if (promisePayload) {
                    if (!promises[promisePayload.resourceId])
                        return;
                    const [resolve, reject] = promises[promisePayload.resourceId];
                    const callback = promisePayload.isRejected ? reject : resolve;
                    callback(promisePayload.data);
                    delete promises[promisePayload.resourceId];
                }
            }
            else if (message.result.emitter === 'STREAM') {
                const resourceId = message.result.resourceId;
                if (!this.subscriptions[resourceId])
                    return;
                this.subscriptions[resourceId].next(message.result.data);
            }
        });
    }
}
//# sourceMappingURL=internal-api-client.js.map