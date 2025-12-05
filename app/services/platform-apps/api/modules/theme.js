var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module, apiMethod, apiEvent } from './module';
import { Inject } from 'services/core/injector';
import { Subject } from 'rxjs';
var ETheme;
(function (ETheme) {
    ETheme["Day"] = "day";
    ETheme["Night"] = "night";
})(ETheme || (ETheme = {}));
const themeTable = {
    'day-theme': ETheme.Day,
    'night-theme': ETheme.Night,
};
export class ThemeModule extends Module {
    constructor() {
        super();
        this.moduleName = 'Theme';
        this.permissions = [];
        this.themeChanged = new Subject();
        this.customizationService.settingsChanged.subscribe(patch => {
            if (patch.theme != null) {
                this.themeChanged.next(themeTable[patch.theme]);
            }
        });
    }
    getTheme() {
        return themeTable[this.customizationService.currentTheme];
    }
}
__decorate([
    Inject()
], ThemeModule.prototype, "customizationService", void 0);
__decorate([
    apiEvent()
], ThemeModule.prototype, "themeChanged", void 0);
__decorate([
    apiMethod()
], ThemeModule.prototype, "getTheme", null);
//# sourceMappingURL=theme.js.map