var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module, EApiPermissions, apiMethod, apiEvent } from './module';
import { Inject } from 'services/core/injector';
import { Subject } from 'rxjs';
export class SourcesModule extends Module {
    constructor() {
        super();
        this.moduleName = 'Sources';
        this.permissions = [EApiPermissions.ScenesSources];
        this.sourceAdded = new Subject();
        this.sourceUpdated = new Subject();
        this.sourceRemoved = new Subject();
        this.sourcesService.sourceAdded.subscribe(sourceData => {
            const source = this.sourcesService.views.getSource(sourceData.sourceId);
            this.sourceAdded.next(this.serializeSource(source));
        });
        this.sourcesService.sourceUpdated.subscribe(sourceData => {
            const source = this.sourcesService.views.getSource(sourceData.sourceId);
            this.sourceUpdated.next(this.serializeSource(source));
        });
        this.sourcesService.sourceRemoved.subscribe(sourceData => {
            this.sourceRemoved.next(sourceData.sourceId);
        });
    }
    getAvailableSourceTypes() {
        return this.sourcesService.getAvailableSourcesTypes();
    }
    getSources() {
        return this.sourcesService.views.getSources().map(source => this.serializeSource(source));
    }
    getSource(_ctx, id) {
        const source = this.sourcesService.views.getSource(id);
        return source ? this.serializeSource(source) : null;
    }
    getAppSources(ctx) {
        return this.getSources().filter(source => {
            return source.appId === ctx.app.id;
        });
    }
    getAppSourceSettings(ctx, sourceId) {
        const source = this.getAppSourceForApp(sourceId, ctx.app.id);
        return source.getPropertiesManagerSettings().appSettings;
    }
    setAppSourceSettings(ctx, sourceId, settings) {
        const source = this.getAppSourceForApp(sourceId, ctx.app.id);
        source.setPropertiesManagerSettings({
            appSettings: settings,
        });
    }
    getAppSourceForApp(sourceId, appId) {
        const source = this.sourcesService.views.getSource(sourceId);
        if (!source) {
            throw new Error(`The source with id ${sourceId} does not exist!`);
        }
        if (source.getPropertiesManagerSettings().appId !== appId) {
            throw new Error(`The source ${sourceId} does not belong to this app!`);
        }
        return source;
    }
    createSource(ctx, name, type, settings = {}) {
        const source = this.sourcesService.createSource(name, type, settings);
        return this.serializeSource(source);
    }
    createAppSource(ctx, name, appSourceId) {
        const size = this.platformAppsService.getAppSourceSize(ctx.app.id, appSourceId);
        const source = this.sourcesService.createSource(name, 'browser_source', size, {
            propertiesManager: 'platformApp',
            propertiesManagerSettings: {
                appSourceId,
                appId: ctx.app.id,
                appSettings: {},
            },
        });
        return this.serializeSource(source);
    }
    updateSource(ctx, patch) {
        const requiredKeys = ['id'];
        this.validatePatch(requiredKeys, patch);
        const source = this.sourcesService.views.getSource(patch.id);
        if (patch.name) {
            source.setName(patch.name);
        }
        if (patch.muted != null) {
            this.audioService.views.getSource(patch.id).setMuted(patch.muted);
        }
        if (patch.volume != null) {
            this.audioService.views.getSource(patch.id).setDeflection(patch.volume);
        }
        if (patch.monitoringType) {
            const monitorTypes = ['none', 'monitor-only', 'monitor-and-output'];
            const type = monitorTypes.findIndex(t => t === patch.monitoringType);
            if (type != null) {
                this.audioService.setSettings(patch.id, { monitoringType: type });
            }
        }
    }
    removeSource(ctx, sourceId) {
        const item = this.scenesService.views.getSceneItems().find(sceneItem => {
            return sceneItem.sourceId === sourceId;
        });
        if (item) {
            throw new Error(`Source ${sourceId} exists in at least 1 scene and cannot be removed!`);
        }
        this.sourcesService.removeSource(sourceId);
    }
    getObsSettings(ctx, sourceId) {
        return this.sourcesService.views.getSource(sourceId).getSettings();
    }
    setObsSettings(ctx, sourceId, settingsPatch) {
        return this.sourcesService.views.getSource(sourceId).updateSettings(settingsPatch);
    }
    serializeSource(source) {
        const serialized = {
            id: source.sourceId,
            name: source.name,
            type: source.type,
            managerType: source.propertiesManagerType,
            flags: {
                audio: source.audio,
                video: source.video,
                async: source.async,
            },
            size: {
                width: source.width,
                height: source.height,
            },
            deinterlaceMode: source.deinterlaceMode,
            deinterlaceFieldOrder: source.deinterlaceFieldOrder,
        };
        if (source.getPropertiesManagerType() === 'platformApp') {
            const settings = source.getPropertiesManagerSettings();
            serialized.appId = settings.appId;
            serialized.appSourceId = settings.appSourceId;
        }
        if (source.audio) {
            const audioSource = this.audioService.views.getSource(source.sourceId);
            serialized.volume = audioSource.fader.deflection;
            serialized.muted = audioSource.muted;
            const monitorTypes = ['none', 'monitor-only', 'monitor-and-output'];
            serialized.monitoringType = monitorTypes[audioSource.monitoringType];
        }
        return serialized;
    }
    getFilterPresetOptions() {
        return this.sourceFiltersService.views.presetFilterOptions;
    }
    setFilterPreset(ctx, sourceId, preset) {
        this.sourceFiltersService.addPresetFilter(sourceId, preset);
    }
    getCurrentFilterPreset(ctx, sourceId) {
        const preset = this.sourceFiltersService.views.presetFilterBySourceId(sourceId);
        if (preset) {
            return this.sourceFiltersService.views.parsePresetValue(preset.settings.image_path);
        }
        return '';
    }
    addFilter(ctx, sourceId, filterType, filterName, settings) {
        this.sourceFiltersService.add(sourceId, filterType, filterName, settings);
    }
}
__decorate([
    Inject()
], SourcesModule.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], SourcesModule.prototype, "platformAppsService", void 0);
__decorate([
    Inject()
], SourcesModule.prototype, "scenesService", void 0);
__decorate([
    Inject()
], SourcesModule.prototype, "audioService", void 0);
__decorate([
    Inject()
], SourcesModule.prototype, "sourceFiltersService", void 0);
__decorate([
    apiEvent()
], SourcesModule.prototype, "sourceAdded", void 0);
__decorate([
    apiEvent()
], SourcesModule.prototype, "sourceUpdated", void 0);
__decorate([
    apiEvent()
], SourcesModule.prototype, "sourceRemoved", void 0);
__decorate([
    apiMethod()
], SourcesModule.prototype, "getAvailableSourceTypes", null);
__decorate([
    apiMethod()
], SourcesModule.prototype, "getSources", null);
__decorate([
    apiMethod()
], SourcesModule.prototype, "getSource", null);
__decorate([
    apiMethod()
], SourcesModule.prototype, "getAppSources", null);
__decorate([
    apiMethod()
], SourcesModule.prototype, "getAppSourceSettings", null);
__decorate([
    apiMethod()
], SourcesModule.prototype, "setAppSourceSettings", null);
__decorate([
    apiMethod()
], SourcesModule.prototype, "createSource", null);
__decorate([
    apiMethod()
], SourcesModule.prototype, "createAppSource", null);
__decorate([
    apiMethod()
], SourcesModule.prototype, "updateSource", null);
__decorate([
    apiMethod()
], SourcesModule.prototype, "removeSource", null);
__decorate([
    apiMethod()
], SourcesModule.prototype, "getObsSettings", null);
__decorate([
    apiMethod()
], SourcesModule.prototype, "setObsSettings", null);
__decorate([
    apiMethod()
], SourcesModule.prototype, "getFilterPresetOptions", null);
__decorate([
    apiMethod()
], SourcesModule.prototype, "setFilterPreset", null);
__decorate([
    apiMethod()
], SourcesModule.prototype, "getCurrentFilterPreset", null);
__decorate([
    apiMethod()
], SourcesModule.prototype, "addFilter", null);
//# sourceMappingURL=sources.js.map