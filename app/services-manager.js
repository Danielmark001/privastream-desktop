import { Service } from 'services/core/service';
import Utils from 'services/utils';
import { ObserveList } from 'services/core';
import * as appServices from './app-services';
import { InternalApiClient } from 'services/api/internal-api-client';
export class ServicesManager extends Service {
    constructor() {
        super(...arguments);
        this.services = Object.assign({}, appServices);
        this.instances = {};
    }
    init() {
        if (Utils.isDevMode() || process.env.SLOBS_PRODUCTION_DEBUG) {
            window.sm = this;
        }
        if (!Utils.isWorkerWindow()) {
            this.internalApiClient = new InternalApiClient();
            Service.setupProxy(service => this.internalApiClient.applyIpcProxy(service));
            Service.setupInitFunction(service => null);
        }
        else {
            Service.serviceAfterInit.subscribe(service => this.initObservers(service));
        }
    }
    initObservers(observableService) {
        const observeList = ObserveList.instance;
        const items = observeList.observations.filter(item => {
            return item.observableServiceName === observableService.serviceName;
        });
        return items.map(item => this.getService(item.observerServiceName).instance);
    }
    getService(serviceName) {
        return this.services[serviceName];
    }
    getStatefulServicesAndMutators() {
        const statefulServices = {};
        Object.keys(this.services).forEach(serviceName => {
            const ServiceClass = this.services[serviceName];
            if (typeof ServiceClass === 'object')
                return;
            const isStatefulService = ServiceClass['initialState'];
            const isMutator = ServiceClass.prototype.mutations;
            if (!isStatefulService && !isMutator)
                return;
            statefulServices[serviceName] = this.services[serviceName];
        });
        return statefulServices;
    }
    getResource(resourceId) {
        if (resourceId === 'ServicesManager') {
            return this;
        }
        if (this.services[resourceId]) {
            return this.getInstance(resourceId) || this.initService(resourceId);
        }
        const helperName = resourceId.split('[')[0];
        const constructorArgsStr = resourceId.slice(helperName.length);
        const constructorArgs = constructorArgsStr ? JSON.parse(constructorArgsStr) : void 0;
        return this.getHelper(helperName, constructorArgs);
    }
    getHelper(name, constructorArgs) {
        const Helper = this.services[name];
        if (!Helper)
            return null;
        return new Helper(...constructorArgs);
    }
    initService(serviceName) {
        const ServiceClass = this.services[serviceName];
        if (!ServiceClass)
            throw new Error(`unknown service: ${serviceName}`);
        if (this.instances[serviceName])
            return;
        this.instances[serviceName] = ServiceClass.instance;
        return ServiceClass.instance;
    }
    getInstance(serviceName) {
        return this.instances[serviceName];
    }
}
//# sourceMappingURL=services-manager.js.map