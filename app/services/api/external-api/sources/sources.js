var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { map } from 'rxjs/operators';
import { Inject } from 'services/core/injector';
import { Fallback, Singleton } from 'services/api/external-api';
import { Source } from './source';
let SourcesService = class SourcesService {
    createSource(name, type, settings, options) {
        const source = this.sourcesService.createSource(name, type, settings, options);
        return this.getSource(source.sourceId);
    }
    getSource(sourceId) {
        const source = this.sourcesService.views.getSource(sourceId);
        return source ? new Source(sourceId) : null;
    }
    getSources() {
        return this.sourcesService.views.getSources().map(source => this.getSource(source.sourceId));
    }
    removeSource(id) {
        this.sourcesService.removeSource(id);
    }
    getAvailableSourcesTypesList() {
        return this.sourcesService.getAvailableSourcesTypesList();
    }
    getSourcesByName(name) {
        return this.sourcesService.views
            .getSourcesByName(name)
            .map(source => this.getSource(source.sourceId));
    }
    addFile(path) {
        return this.getSource(this.sourcesService.addFile(path).sourceId);
    }
    showSourceProperties(sourceId) {
        return this.sourcesService.showSourceProperties(sourceId);
    }
    showShowcase() {
        return this.sourcesService.showShowcase();
    }
    showAddSource(sourceType) {
        return this.sourcesService.showAddSource(sourceType);
    }
    get sourceAdded() {
        return this.exposeSourceEvent(this.sourcesService.sourceAdded);
    }
    get sourceUpdated() {
        return this.exposeSourceEvent(this.sourcesService.sourceUpdated);
    }
    get sourceRemoved() {
        return this.exposeSourceEvent(this.sourcesService.sourceRemoved);
    }
    exposeSourceEvent(observable) {
        return observable.pipe(map(internalSourceModel => this.convertInternalModelToExternal(internalSourceModel)));
    }
    convertInternalModelToExternal(internalModel) {
        return {
            sourceId: internalModel.sourceId,
            id: internalModel.sourceId,
            name: internalModel.name,
            type: internalModel.type,
            audio: internalModel.audio,
            video: internalModel.video,
            async: internalModel.async,
            muted: internalModel.muted,
            width: internalModel.width,
            height: internalModel.height,
            doNotDuplicate: internalModel.doNotDuplicate,
            channel: internalModel.channel,
            configurable: internalModel.configurable,
            resourceId: `Source["${internalModel.sourceId}"]`,
        };
    }
};
__decorate([
    Fallback(),
    Inject()
], SourcesService.prototype, "sourcesService", void 0);
SourcesService = __decorate([
    Singleton()
], SourcesService);
export { SourcesService };
//# sourceMappingURL=sources.js.map