var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { RpcApi } from './rpc-api';
import { getResource, Inject } from 'services/core/injector';
import * as apiResources from './external-api/resources';
import * as traverse from 'traverse';
import { E_JSON_RPC_ERROR } from './jsonrpc';
const MAX_POINTS_PER_SECOND = 2;
export function Singleton() {
    return function (Klass) {
        Klass.isSingleton = true;
    };
}
export function InjectFromExternalApi(serviceName) {
    return function (target, key) {
        Object.defineProperty(target, key, {
            get() {
                const name = serviceName || key.charAt(0).toUpperCase() + key.slice(1);
                const externalApiService = getResource('ExternalApiService');
                const singletonInstance = externalApiService.getResource(name);
                if (!singletonInstance)
                    throw new Error(`Resource not found: ${name}`);
                return singletonInstance;
            },
        });
    };
}
export function Fallback() {
    return function (target, key) {
        Object.defineProperty(target, '_fallback', {
            get() {
                return this[key];
            },
        });
    };
}
export class ExternalApiService extends RpcApi {
    constructor() {
        super(...arguments);
        this.resources = Object.assign({}, apiResources);
        this.instances = {};
        this.points = MAX_POINTS_PER_SECOND;
    }
    init() {
        Object.keys(this.resources).forEach(resourceName => {
            const Resource = this.resources[resourceName];
            if (Resource && Resource.isSingleton)
                this.instances[resourceName] = new Resource();
        });
        setInterval(() => {
            this.points = MAX_POINTS_PER_SECOND;
        }, 1000);
    }
    getResource(resourceId) {
        if (this.instances[resourceId])
            return this.applyFallbackProxy(this.instances[resourceId]);
        const helperName = resourceId.split('[')[0];
        const constructorArgsStr = resourceId.slice(helperName.length);
        const constructorArgs = constructorArgsStr ? JSON.parse(constructorArgsStr) : void 0;
        const Helper = this.resources[helperName];
        if (Helper) {
            return this.applyFallbackProxy(new Helper(...constructorArgs));
        }
        return this.internalApiService.getResource(resourceId);
    }
    getResourceScheme(resourceId) {
        const resource = this.getResource(resourceId);
        const resourceScheme = super.getResourceScheme(resourceId);
        if (!resource._fallback)
            return resourceScheme;
        const fallbackResourceScheme = this.internalApiService.getResourceScheme(resourceId);
        return Object.assign(Object.assign({}, fallbackResourceScheme), resourceScheme);
    }
    applyFallbackProxy(resource) {
        if (!resource || !resource._fallback)
            return resource;
        return new Proxy(resource, {
            get: (target, key) => {
                if (!(key in target))
                    return target._fallback[key];
                if (typeof target[key] !== 'function') {
                    return this.applyFallbackProxy(target[key]);
                }
                return (...args) => {
                    const result = target[key](...args);
                    traverse(result).forEach((item) => {
                        if (item && item._fallback)
                            return this.applyFallbackProxy(item);
                    });
                    return result;
                };
            },
        });
    }
    handleServiceRequest(request) {
        const methodName = request.method;
        const resourceId = request.params.resource;
        const resourceName = resourceId.split('[')[0];
        const { costPerSecond, comment } = this.externalApiLimitsService.getMethodCost(resourceName, methodName);
        if (this.points < costPerSecond) {
            return this.jsonrpc.createError(request, {
                code: E_JSON_RPC_ERROR.INVALID_REQUEST,
                message: `Reached the limit of calls for "${resourceName}.${methodName}"${comment ? ' ' + comment : ''}`,
            });
        }
        this.points -= costPerSecond;
        return super.handleServiceRequest(request);
    }
}
__decorate([
    Inject()
], ExternalApiService.prototype, "internalApiService", void 0);
__decorate([
    Inject()
], ExternalApiService.prototype, "externalApiLimitsService", void 0);
//# sourceMappingURL=external-api.js.map