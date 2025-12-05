var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { PropertiesManager } from './properties-manager';
import { Inject } from 'services/core/injector';
export class WidgetManager extends PropertiesManager {
    constructor() {
        super(...arguments);
        this.displayOrder = ['widgetType'];
        this.customUIComponent = 'WidgetProperties';
    }
    get denylist() {
        return ['url', 'is_local_file'];
    }
    applySettings(settings) {
        settings.widgetType = parseInt(settings.widgetType, 10);
        super.applySettings(settings);
        this.setWidgetType(this.settings.widgetType);
    }
    setWidgetType(type) {
        const url = this.widgetsService.getWidgetUrl(type);
        if (this.obsSource.settings['url'] !== url) {
            this.obsSource.update({ url });
        }
    }
}
__decorate([
    Inject()
], WidgetManager.prototype, "widgetsService", void 0);
//# sourceMappingURL=widget-manager.js.map