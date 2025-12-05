import { getResource } from '../services/core';
export const Services = new Proxy({}, {
    get(target, propName, receiver) {
        return getResource(propName);
    },
});
//# sourceMappingURL=service-provider.js.map