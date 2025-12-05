import { ServicesManager } from 'services-manager';
export function Inject(serviceName) {
    return function (target, key) {
        Object.defineProperty(target, key, {
            get() {
                const name = serviceName || key.charAt(0).toUpperCase() + key.slice(1);
                const service = ServicesManager.instance.getService(name);
                if (!service)
                    throw new Error(`Service not found: ${name}`);
                return service.instance;
            },
        });
    };
}
export function getResource(name) {
    return ServicesManager.instance.getResource(name);
}
//# sourceMappingURL=injector.js.map