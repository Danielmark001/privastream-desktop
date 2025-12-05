var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ServiceHelper, Inject, mutation } from 'services';
import Utils from '../utils';
let WidgetSource = class WidgetSource {
    constructor(sourceId) {
        this.state = this.widgetsService.state.widgetSources[sourceId];
        Utils.applyProxy(this, this.state);
    }
    isDestroyed() {
        return !this.widgetsService.state.widgetSources[this.sourceId];
    }
    getSource() {
        return this.sourcesService.views.getSource(this.sourceId);
    }
    getSettingsService() {
        return this.widgetsService.getWidgetSettingsService(this.type);
    }
    refresh() {
        this.getSource().refresh();
    }
    createPreviewSource() {
        if (this.previewSourceId) {
            throw new Error('Only one preview source is allowed for widget');
        }
        const config = this.widgetsService.widgetsConfig[this.type];
        const source = this.getSource();
        const apiSettings = config || this.getSettingsService().getApiSettings();
        const previewSourceSettings = Object.assign(Object.assign({}, source.getSettings()), { shutdown: false, url: apiSettings.previewUrl });
        const previewSource = this.sourcesService.createSource(source.name, source.type, previewSourceSettings, { isTemporary: true });
        this.SET_PREVIEW_SOURCE_ID(previewSource.sourceId);
        this.widgetsService.syncPreviewSource(this.sourceId, this.previewSourceId);
        return previewSource;
    }
    getPreviewSource() {
        return this.sourcesService.views.getSource(this.previewSourceId);
    }
    destroyPreviewSource() {
        var _a;
        this.widgetsService.stopSyncPreviewSource(this.previewSourceId);
        (_a = this.sourcesService.views.getSource(this.previewSourceId)) === null || _a === void 0 ? void 0 : _a.remove();
        this.SET_PREVIEW_SOURCE_ID('');
    }
    SET_PREVIEW_SOURCE_ID(previewSourceId) {
        Object.assign(this.state, { previewSourceId });
    }
};
__decorate([
    Inject()
], WidgetSource.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], WidgetSource.prototype, "widgetsService", void 0);
__decorate([
    mutation()
], WidgetSource.prototype, "SET_PREVIEW_SOURCE_ID", null);
WidgetSource = __decorate([
    ServiceHelper('WidgetsService')
], WidgetSource);
export { WidgetSource };
//# sourceMappingURL=widget-source.js.map