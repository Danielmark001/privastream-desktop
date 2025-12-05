import React from 'react';
import { createApp, inject, ReactModules, Store } from 'slap';
import { getResource, StatefulService } from '../../services';
import { AppServices } from '../../app-services';
class VuexModule {
    constructor() {
        this.store = inject(Store);
        this.modules = {};
    }
    init() {
        StatefulService.onStateRead = serviceName => {
            if (this.store.recordingAccessors) {
                const module = this.resolveState(serviceName);
                this.store.affectedModules[serviceName] = module.state.revision;
            }
        };
        StatefulService.store.subscribe(mutation => {
            if (mutation.payload && !mutation.payload.__vuexSyncIgnore)
                return;
            const serviceName = mutation.type.split('.')[0];
            const module = this.resolveState(serviceName);
            module.incrementRevision();
        });
    }
    resolveState(serviceName) {
        if (!this.modules[serviceName]) {
            const module = this.store.createState(serviceName, {
                revision: 0,
                incrementRevision() {
                    this.revision++;
                },
            });
            module.finishInitialization();
            this.modules[serviceName] = module;
        }
        return this.modules[serviceName];
    }
}
let modulesApp;
function resolveApp() {
    if (modulesApp)
        return modulesApp;
    const app = createApp({ VuexModule });
    const scope = app.servicesScope;
    scope.init(VuexModule);
    Object.keys(AppServices).forEach(serviceName => {
        scope.register(() => getResource(serviceName), serviceName, { shouldCallHooks: false });
    });
    modulesApp = app;
    return modulesApp;
}
export function createRoot(ChildComponent) {
    return function ReactRoot(childProps) {
        const app = resolveApp();
        return (<ReactModules app={app}>
        <ChildComponent {...childProps}/>
      </ReactModules>);
    };
}
//# sourceMappingURL=ReactRoot.jsx.map