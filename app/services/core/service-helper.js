import { inheritMutations } from './stateful-service';
import Utils from 'services/utils';
export function ServiceHelper(parentServiceName) {
    return function (constr) {
        constr['_isHelperFor'] = parentServiceName;
        const klass = class extends constr {
            constructor(...args) {
                super(...args);
                this['_isHelper'] = true;
                this['_constructorArgs'] = args;
                this['_resourceId'] = constr.name + JSON.stringify(args);
                return new Proxy(this, {
                    get: (target, key) => {
                        if (typeof target[key] === 'function' &&
                            key !== 'isDestroyed' &&
                            target['isDestroyed']()) {
                            return () => {
                                throw new Error(`Trying to call the method "${key}" on destroyed object "${this['_resourceId']}"`);
                            };
                        }
                        return target[key];
                    },
                });
            }
        };
        Object.defineProperty(klass, 'name', { value: constr.name });
        inheritMutations(klass);
        return klass;
    };
}
export function ExecuteInWorkerProcess() {
    return function (target, property, descriptor) {
        return Object.assign({}, descriptor, {
            value(...args) {
                if (Utils.isWorkerWindow()) {
                    return descriptor.value.apply(this, args);
                }
                return window['servicesManager'].internalApiClient.getRequestHandler(this, property, {
                    isAction: false,
                    shouldReturn: true,
                })(...args);
            },
        });
    };
}
export function ExecuteInCurrentWindow() {
    return function (target, property, descriptor) {
        descriptor.value['__executeInCurrentWindow'] = true;
        return descriptor;
    };
}
//# sourceMappingURL=service-helper.js.map