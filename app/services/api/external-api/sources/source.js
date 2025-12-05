var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ServiceHelper, Inject } from 'services';
import { Fallback, InjectFromExternalApi } from '../../external-api';
import Utils from '../../../utils';
let Source = class Source {
    constructor(sourceId) {
        this.sourceId = sourceId;
        this.source = this.internalSourcesService.views.getSource(sourceId);
        Utils.applyProxy(this, () => this.getModel());
    }
    isDestroyed() {
        return this.source.isDestroyed();
    }
    getModel() {
        return this.sourcesService.convertInternalModelToExternal(this.source.getModel());
    }
    updateSettings(settings) {
        this.source.updateSettings(settings);
    }
    getSettings() {
        return this.source.getSettings();
    }
    getPropertiesFormData() {
        return this.source.getPropertiesFormData();
    }
    setPropertiesFormData(properties) {
        return this.source.setPropertiesFormData(properties);
    }
    hasProps() {
        return this.source.hasProps();
    }
    setName(newName) {
        return this.source.setName(newName);
    }
    refresh() {
        this.source.refresh();
    }
    duplicate() {
        return this.sourcesService.getSource(this.source.duplicate().sourceId);
    }
};
__decorate([
    Inject('SourcesService')
], Source.prototype, "internalSourcesService", void 0);
__decorate([
    Fallback()
], Source.prototype, "source", void 0);
__decorate([
    InjectFromExternalApi()
], Source.prototype, "sourcesService", void 0);
Source = __decorate([
    ServiceHelper('SourcesService')
], Source);
export { Source };
//# sourceMappingURL=source.js.map