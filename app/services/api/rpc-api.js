import uuid from 'uuid/v4';
import { Service } from 'services/core/service';
import traverse from 'traverse';
import { Observable, Subject } from 'rxjs';
import { E_JSON_RPC_ERROR, JsonrpcService, } from 'services/api/jsonrpc';
import { ServicesManager } from '../../services-manager';
import { RealmObject } from 'services/realm';
export class RpcApi extends Service {
    constructor() {
        super(...arguments);
        this.serviceEvent = new Subject();
        this.servicesManager = ServicesManager.instance;
        this.mutationsBufferingEnabled = false;
        this.bufferedMutations = [];
        this.requestErrors = [];
        this.subscriptions = {};
    }
    executeServiceRequest(request) {
        let response;
        this.requestErrors = [];
        try {
            response = this.handleServiceRequest(request);
        }
        catch (e) {
            this.requestErrors.push(e);
        }
        if (this.requestErrors.length)
            response = this.onErrorsHandler(request, this.requestErrors);
        return response;
    }
    onErrorsHandler(request, errors) {
        return this.jsonrpc.createError(request, {
            code: E_JSON_RPC_ERROR.INTERNAL_SERVER_ERROR,
            message: errors
                .map(e => {
                return e instanceof Error ? `${e.message} ${e.stack.toString()}` : e;
            })
                .join(';'),
        });
    }
    get jsonrpc() {
        return JsonrpcService;
    }
    handleServiceRequest(request) {
        const methodName = request.method;
        const { resource: resourceId, args, fetchMutations } = request.params;
        const resource = this.getResource(resourceId);
        let errorResponse;
        if (!resource) {
            errorResponse = this.jsonrpc.createError(request, {
                code: E_JSON_RPC_ERROR.INVALID_PARAMS,
                message: `resource not found: ${resourceId}`,
            });
        }
        else if (resource[methodName] === void 0) {
            errorResponse = this.jsonrpc.createError(request, {
                code: E_JSON_RPC_ERROR.METHOD_NOT_FOUND,
                message: methodName,
            });
        }
        if (errorResponse)
            return errorResponse;
        traverse(args).forEach((item) => {
            if (item && item._type === 'HELPER') {
                return this.getResource(item.resourceId);
            }
        });
        if (fetchMutations)
            this.startBufferingMutations();
        const payload = typeof resource[methodName] === 'function'
            ? resource[methodName].apply(resource, args)
            : resource[methodName];
        const response = this.serializePayload(resource, payload, request);
        if (fetchMutations)
            response.mutations = this.stopBufferingMutations();
        return response;
    }
    serializePayload(resource, responsePayload, request) {
        if (!(responsePayload instanceof Object)) {
            return this.jsonrpc.createResponse(request.id, responsePayload);
        }
        if (responsePayload instanceof Observable) {
            const subscriptionId = `${request.params.resource}.${request.method}`;
            if (!this.subscriptions[subscriptionId]) {
                const subscriptionName = subscriptionId.split('.')[1];
                this.subscriptions[subscriptionId] = resource[subscriptionName].subscribe((data) => {
                    this.serviceEvent.next(this.jsonrpc.createEvent({ data, emitter: 'STREAM', resourceId: subscriptionId }));
                });
            }
            return this.jsonrpc.createResponse(request.id, {
                _type: 'SUBSCRIPTION',
                resourceId: subscriptionId,
                emitter: 'STREAM',
            });
        }
        const isPromise = !!responsePayload.then;
        if (isPromise) {
            const promiseId = uuid();
            const promise = responsePayload;
            promise.then(data => this.sendPromiseMessage({ data, promiseId, isRejected: false }), data => {
                if (request.params.noReturn) {
                    console.error(`Rejected promise from async action call to ${request.params.resource}.${request.method}:`, data);
                }
                else {
                    this.sendPromiseMessage({ data, promiseId, isRejected: true });
                }
            });
            return this.jsonrpc.createResponse(request.id, {
                _type: 'SUBSCRIPTION',
                resourceId: promiseId,
                emitter: 'PROMISE',
            });
        }
        if (responsePayload instanceof Service) {
            return this.jsonrpc.createResponse(request.id, Object.assign({ _type: 'SERVICE', resourceId: responsePayload.serviceName }, (!request.params.compactMode ? this.getResourceModel(responsePayload) : {})));
        }
        if (responsePayload._isHelper === true) {
            return this.jsonrpc.createResponse(request.id, Object.assign({ _type: 'HELPER', resourceId: responsePayload._resourceId }, (!request.params.compactMode ? this.getResourceModel(responsePayload) : {})));
        }
        if (responsePayload instanceof RealmObject) {
            return this.jsonrpc.createResponse(request.id, {
                _type: 'REALM_OBJECT',
                resourceId: responsePayload.idString,
                realmType: responsePayload.schema.name,
            });
        }
        traverse(responsePayload).forEach((item) => {
            if (item && item._isHelper === true) {
                const helper = this.getResource(item._resourceId);
                return Object.assign({ _type: 'HELPER', resourceId: helper._resourceId }, (!request.params.compactMode ? this.getResourceModel(helper) : {}));
            }
            if (item && item instanceof RealmObject) {
                return {
                    _type: 'REALM_OBJECT',
                    resourceId: responsePayload.idString,
                    realmType: responsePayload.schema.name,
                };
            }
        });
        return this.jsonrpc.createResponse(request.id, responsePayload);
    }
    getResourceScheme(resourceId) {
        const resource = this.getResource(resourceId);
        if (!resource) {
            this.requestErrors.push(`Resource not found: ${resourceId}`);
            return null;
        }
        const resourceScheme = {};
        const keys = [];
        let proto = resource;
        do {
            keys.push(...Object.getOwnPropertyNames(proto));
            proto = Object.getPrototypeOf(proto);
        } while (proto.constructor.name !== 'Object');
        keys.forEach(key => {
            resourceScheme[key] = typeof resource[key];
        });
        return resourceScheme;
    }
    getResourceModel(helper) {
        if ('getModel' in helper && typeof helper.getModel === 'function') {
            return helper.getModel();
        }
        return {};
    }
    startBufferingMutations() {
        this.mutationsBufferingEnabled = true;
    }
    stopBufferingMutations() {
        this.mutationsBufferingEnabled = false;
        const mutations = this.bufferedMutations;
        this.bufferedMutations = [];
        return mutations;
    }
    handleMutation(mutation) {
        if (this.mutationsBufferingEnabled)
            this.bufferedMutations.push(mutation);
    }
    sendPromiseMessage(info) {
        let serializedDataPromise;
        if (info.data instanceof Response) {
            const contentType = info.data.headers.get('content-type');
            const isJson = contentType && contentType.includes('application/json');
            const serialized = { url: info.data.url, status: info.data.status };
            if (isJson) {
                serializedDataPromise = info.data
                    .json()
                    .then(j => {
                    return Object.assign(Object.assign({}, serialized), { body: j });
                })
                    .catch(e => {
                    return Object.assign(Object.assign({}, serialized), { body: e });
                });
            }
            else {
                serializedDataPromise = info.data.text().then(b => {
                    return Object.assign(Object.assign({}, serialized), { body: b });
                });
            }
        }
        else if (info.data instanceof Error) {
            serializedDataPromise = Promise.resolve({
                error: `${info.data.name}: ${info.data.message}`,
                stack: info.data.stack,
            });
        }
        else {
            serializedDataPromise = Promise.resolve(info.data);
        }
        serializedDataPromise.then(d => {
            this.serviceEvent.next(this.jsonrpc.createEvent({
                emitter: 'PROMISE',
                data: d,
                resourceId: info.promiseId,
                isRejected: info.isRejected,
            }));
        });
    }
}
//# sourceMappingURL=rpc-api.js.map