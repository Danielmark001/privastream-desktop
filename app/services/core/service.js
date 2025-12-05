import { Subject } from 'rxjs';
const singleton = Symbol('singleton');
const singletonEnforcer = Symbol('singletonEnforcer');
const instances = [];
const proxies = [];
function getActionProxy(service, isReturn = false) {
    return new Proxy(service, {
        get: (target, key) => {
            if (key === 'return' && !isReturn) {
                return getActionProxy(target, true);
            }
            return (...args) => {
                return new Promise((resolve, reject) => {
                    try {
                        const result = target[key].apply(target, args);
                        isReturn ? resolve(result) : resolve(undefined);
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            };
        },
    });
}
export class Service {
    static get instance() {
        const instance = !this.hasInstance ? Service.createInstance(this) : this[singleton];
        if (this.proxyFn) {
            if (!proxies[this.name])
                proxies[this.name] = this.proxyFn(instance);
            return proxies[this.name];
        }
        else {
            return instance;
        }
    }
    static get hasInstance() {
        return !!instances[this.name];
    }
    static setupProxy(fn) {
        this.proxyFn = fn;
    }
    static setupInitFunction(fn) {
        this.initFn = fn;
    }
    static createInstance(ServiceClass) {
        if (ServiceClass.hasInstance) {
            throw new Error('Unable to create more than one singleton service');
        }
        ServiceClass.isSingleton = true;
        const instance = new ServiceClass(singletonEnforcer);
        ServiceClass[singleton] = instance;
        instances[ServiceClass.name] = instance;
        const mustInit = !this.initFn;
        if (this.initFn)
            this.initFn(instance);
        if (mustInit)
            instance.init();
        instance.mounted();
        Service.serviceAfterInit.next(instance);
        if (mustInit)
            instance.afterInit();
        return instance;
    }
    static getResourceId(resource) {
        const resourceId = resource.resourceId || resource.serviceName;
        if (!resourceId)
            throw new Error('invalid resource');
        return resourceId;
    }
    constructor(enforcer) {
        this.serviceName = this.constructor.name;
        if (enforcer !== singletonEnforcer) {
            throw new Error('Cannot construct singleton');
        }
    }
    init() { }
    mounted() { }
    afterInit() { }
    get actions() {
        return getActionProxy(this);
    }
}
Service.isSingleton = true;
Service.serviceAfterInit = new Subject();
//# sourceMappingURL=service.js.map