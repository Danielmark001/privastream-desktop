import Vue from 'vue';
import { Service } from './service';
import Utils from 'services/utils';
export function mutation(options = {}) {
    return function (target, methodName, descriptor) {
        return registerMutation(target, methodName, descriptor, options);
    };
}
function registerMutation(target, methodName, descriptor, options = {}) {
    var _a;
    const serviceName = (_a = target.constructor._isHelperFor) !== null && _a !== void 0 ? _a : target.constructor.name;
    const mutationName = target.constructor._isHelperFor
        ? `${serviceName}.${target.constructor.name}.${methodName}`
        : `${serviceName}.${methodName}`;
    const opts = Object.assign({ unsafe: false, sync: true }, options);
    target.originalMethods = target.originalMethods || {};
    target.originalMethods[methodName] = target[methodName];
    target.mutationOptions = target.mutationOptions || {};
    target.mutationOptions[methodName] = opts;
    target.mutations = target.mutations || {};
    target.mutations[mutationName] = function (localState, payload) {
        const targetIsSingleton = !!target.constructor.instance;
        let context;
        if (targetIsSingleton) {
            context = target.constructor.instance;
        }
        else {
            context = new target.constructor(...payload.constructorArgs);
        }
        let contextProxy = context;
        if (Utils.isDevMode() && !opts.unsafe) {
            const errorMsg = (key) => `Mutation ${mutationName} attempted to access this.${key}. ` +
                'To ensure mutations can safely execute in any context, mutations are restricted ' +
                'to only accessing this.state and their arguments.';
            contextProxy = new Proxy({}, {
                get(_, key) {
                    if (key === 'state') {
                        return context.state;
                    }
                    throw new Error(errorMsg(key.toString()));
                },
                set(_, key, val) {
                    if (key === 'state') {
                        Vue.set(context, 'state', val);
                        return true;
                    }
                    throw new Error(errorMsg(key.toString()));
                },
            });
        }
        descriptor.value.call(contextProxy, ...payload.args);
    };
    Object.defineProperty(target, methodName, Object.assign(Object.assign({}, descriptor), { value(...args) {
            const constructorArgs = this['_constructorArgs'];
            const store = StatefulService.getStore();
            store.commit(mutationName, {
                args,
                constructorArgs,
                __vuexSyncIgnore: opts.sync ? undefined : true,
            });
        } }));
    return Object.getOwnPropertyDescriptor(target, methodName);
}
export function inheritMutations(target) {
    const baseClassProto = Object.getPrototypeOf(target.prototype).constructor.prototype;
    if (baseClassProto.originalMethods) {
        Object.keys(baseClassProto.originalMethods).forEach(methodName => {
            if (Object.getOwnPropertyDescriptor(target.prototype, methodName))
                return;
            target.prototype[methodName] = baseClassProto.originalMethods[methodName];
            registerMutation(target.prototype, methodName, Object.getOwnPropertyDescriptor(target.prototype, methodName), baseClassProto.mutationOptions[methodName]);
        });
    }
}
export class StatefulService extends Service {
    static setupVuexStore(store) {
        this.store = store;
    }
    static getStore() {
        if (!this.store)
            throw new Error('vuex store is not set');
        return this.store;
    }
    get store() {
        return StatefulService.store;
    }
    get state() {
        StatefulService.onStateRead && StatefulService.onStateRead(this.serviceName);
        return this.store.state[this.serviceName];
    }
    set state(newState) {
        Vue.set(this.store.state, this.serviceName, newState);
    }
    get views() {
        return;
    }
}
StatefulService.onStateRead = null;
export function getModule(ModuleContainer) {
    var _a;
    const prototypeMutations = ModuleContainer.prototype.mutations;
    const mutations = {};
    for (const mutationName in prototypeMutations) {
        const serviceName = mutationName.split('.')[0];
        if (serviceName !== ((_a = ModuleContainer._isHelperFor) !== null && _a !== void 0 ? _a : ModuleContainer.name))
            continue;
        mutations[mutationName] = prototypeMutations[mutationName];
    }
    return {
        mutations,
        state: ModuleContainer.initialState
            ? JSON.parse(JSON.stringify(ModuleContainer.initialState))
            : {},
    };
}
export function InheritMutations() {
    return function (target) {
        inheritMutations(target);
    };
}
export class ViewHandler {
    constructor(state) {
        this.state = state;
    }
    getServiceViews(service) {
        return window['servicesManager'].getResource(service.name).views;
    }
}
//# sourceMappingURL=stateful-service.js.map