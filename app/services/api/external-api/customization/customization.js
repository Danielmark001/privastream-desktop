var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Inject } from 'services/core/injector';
import { Fallback, Singleton } from 'services/api/external-api';
import pick from 'lodash/pick';
import { map } from 'rxjs/operators';
let CustomizationService = class CustomizationService {
    constructor() {
        this.settingsChanged = this.customizationService.settingsChanged.pipe(map(_ => this.getModel()));
    }
    getModel() {
        const state = this.customizationService.state;
        return pick(state, [
            'hideViewerCount',
            'livedockCollapsed',
            'performanceMode',
            'chatZoomFactor',
            'pinnedStatistics',
            'theme',
            'legacyAlertbox',
        ]);
    }
    setSettings(settingsPatch) {
        const settings = pick(settingsPatch, [
            'hideViewerCount',
            'livedockCollapsed',
            'performanceMode',
            'legacyAlertbox',
        ]);
        this.customizationService.setSettings(settings);
    }
};
__decorate([
    Fallback(),
    Inject()
], CustomizationService.prototype, "customizationService", void 0);
CustomizationService = __decorate([
    Singleton()
], CustomizationService);
export { CustomizationService };
//# sourceMappingURL=customization.js.map