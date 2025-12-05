var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { PropertiesManager } from './properties-manager';
import { Inject } from 'services/core/injector';
export class PlatformAppManager extends PropertiesManager {
    constructor() {
        super(...arguments);
        this.customUIComponent = 'PlatformAppProperties';
    }
    get denylist() {
        return ['url', 'is_local_file'];
    }
    init() {
        this.loadSub = this.platformAppsService.appLoad.subscribe(app => {
            if (app.id === this.settings.appId) {
                this.updateUrl();
            }
        });
        this.refreshSub = this.platformAppsService.sourceRefresh.subscribe(appId => {
            if (appId === this.settings.appId) {
                this.updateUrl();
                this.obsSource.properties.get('refreshnocache').buttonClicked(this.obsSource);
            }
        });
        this.unloadSub = this.platformAppsService.appUnload.subscribe(appId => {
            if (appId === this.settings.appId) {
                this.transitionsService.clearPlatformAppTransitions(appId);
                this.updateUrl();
            }
        });
    }
    destroy() {
        this.loadSub.unsubscribe();
        this.refreshSub.unsubscribe();
        this.unloadSub.unsubscribe();
    }
    applySettings(settings) {
        super.applySettings(settings);
        this.updateUrl();
    }
    updateUrl() {
        const url = this.platformAppsService.getPageUrlForSource(this.settings.appId, this.settings.appSourceId, this.settings.appSettings);
        if (!url) {
            this.obsSource.update({ url: '' });
            return;
        }
        if (this.obsSource.settings['url'] !== url) {
            this.obsSource.update({ url });
        }
    }
}
__decorate([
    Inject()
], PlatformAppManager.prototype, "platformAppsService", void 0);
__decorate([
    Inject()
], PlatformAppManager.prototype, "transitionsService", void 0);
//# sourceMappingURL=platform-app-manager.js.map