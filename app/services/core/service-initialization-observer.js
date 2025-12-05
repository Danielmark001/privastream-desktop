import { Service } from './service';
export function InitAfter(observableServiceName) {
    return function (target) {
        const observeList = ObserveList.instance;
        observeList.add({ observableServiceName, observerServiceName: target.name });
    };
}
export class ObserveList extends Service {
    constructor() {
        super(...arguments);
        this.observations = [];
    }
    add(observation) {
        this.observations.push(observation);
    }
}
//# sourceMappingURL=service-initialization-observer.js.map