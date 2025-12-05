var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import electron from 'electron';
let PlatformAppProperties = class PlatformAppProperties extends Vue {
    get managerSettings() {
        return this.source.getPropertiesManagerSettings();
    }
    navigateApp() {
        this.navigationService.navigate('PlatformAppMainPage', {
            appId: this.appId,
            sourceId: this.source.sourceId,
        });
        this.sideNavService.setCurrentMenuItem(this.appId);
        this.windowsService.closeChildWindow();
    }
    get appId() {
        return this.managerSettings.appId;
    }
    get app() {
        return this.platformAppsService.views.getApp(this.appId);
    }
    get appName() {
        return this.app ? this.app.manifest.name : '';
    }
    copyUrl() {
        electron.clipboard.writeText(this.browserUrl);
    }
    get browserUrl() {
        return this.source.getSettings().url;
    }
    get isUnpacked() {
        return this.app.unpacked;
    }
};
__decorate([
    Prop()
], PlatformAppProperties.prototype, "source", void 0);
__decorate([
    Inject()
], PlatformAppProperties.prototype, "navigationService", void 0);
__decorate([
    Inject()
], PlatformAppProperties.prototype, "platformAppsService", void 0);
__decorate([
    Inject()
], PlatformAppProperties.prototype, "windowsService", void 0);
__decorate([
    Inject()
], PlatformAppProperties.prototype, "sideNavService", void 0);
PlatformAppProperties = __decorate([
    Component({})
], PlatformAppProperties);
export default PlatformAppProperties;
//# sourceMappingURL=PlatformAppProperties.vue.js.map