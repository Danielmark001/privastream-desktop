import { Service } from 'services/core';
export class ExternalApiLimitsService extends Service {
    constructor() {
        super(...arguments);
        this.expensiveMethods = {};
    }
    markMethodAsExpensive(resourceName, method, costPerSecond = 1, comment = '') {
        this.expensiveMethods[`${resourceName}.${method}`] = { costPerSecond, comment };
    }
    getMethodCost(resourceName, method) {
        return this.expensiveMethods[`${resourceName}.${method}`] || { costPerSecond: 0, comment: '' };
    }
}
export function Expensive(costPerSecond = 1, comment = '') {
    const externalApiLimitsService = ExternalApiLimitsService.instance;
    return function (target, method) {
        const resourceName = target.constructor.name;
        externalApiLimitsService.markMethodAsExpensive(resourceName, method, costPerSecond, comment);
    };
}
//# sourceMappingURL=external-api-limits.js.map