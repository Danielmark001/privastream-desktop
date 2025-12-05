var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module, EApiPermissions, apiMethod } from './module';
import { Inject } from 'services/core/injector';
export class ObsSettingsModule extends Module {
    constructor() {
        super(...arguments);
        this.moduleName = 'ObsSettings';
        this.permissions = [EApiPermissions.ObsSettings];
    }
    getSettings() {
        this.settingsService.loadSettingsIntoStore();
        return this.settingsService.views.values;
    }
    setSettings(ctx, settingsPatch) {
        this.settingsService.setSettingsPatch(settingsPatch);
    }
}
__decorate([
    Inject()
], ObsSettingsModule.prototype, "settingsService", void 0);
__decorate([
    apiMethod()
], ObsSettingsModule.prototype, "getSettings", null);
__decorate([
    apiMethod()
], ObsSettingsModule.prototype, "setSettings", null);
//# sourceMappingURL=obs-settings.js.map