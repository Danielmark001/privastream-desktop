var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Node } from './node';
import { HotkeysNode } from './hotkeys';
import { macSources, windowsSources, } from 'services/sources';
import { AudioService } from 'services/audio';
import { Inject } from '../../core/injector';
import * as obs from '../../../../obs-api';
import defaultTo from 'lodash/defaultTo';
import { byOS, OS } from 'util/operating-systems';
import { EFilterDisplayType } from 'services/source-filters';
export class SourcesNode extends Node {
    constructor() {
        super(...arguments);
        this.schemaVersion = 4;
    }
    getItems() {
        const linkedSourcesIds = this.scenesService.views
            .getSceneItems()
            .map(sceneItem => sceneItem.sourceId);
        return this.sourcesService.views.sources.filter(source => {
            if (source.type === 'scene')
                return false;
            if (source.channel)
                return true;
            return linkedSourcesIds.includes(source.sourceId);
        });
    }
    save(context) {
        const promises = this.getItems().map(source => {
            return new Promise(resolve => {
                const hotkeys = new HotkeysNode();
                return hotkeys.save({ sourceId: source.sourceId }).then(() => {
                    const audioSource = this.audioService.views.getSource(source.sourceId);
                    const obsInput = source.getObsInput();
                    obsInput.save();
                    const filters = this.sourceFiltersService.views
                        .filtersBySourceId(source.sourceId, true)
                        .filter(f => f.displayType !== EFilterDisplayType.Hidden)
                        .map(f => {
                        const filterInput = this.sourceFiltersService.getObsFilter(source.sourceId, f.name);
                        filterInput.save();
                        return {
                            name: f.name,
                            type: f.type,
                            settings: filterInput.settings,
                            enabled: f.visible,
                            visible: f.visible,
                            displayType: f.displayType,
                        };
                    });
                    let data = {
                        hotkeys,
                        id: source.sourceId,
                        name: source.name,
                        type: source.type,
                        settings: obsInput.settings,
                        volume: obsInput.volume,
                        channel: source.channel,
                        muted: source.muted,
                        deinterlaceMode: source.deinterlaceMode,
                        deinterlaceFieldOrder: source.deinterlaceFieldOrder,
                        filters: {
                            items: filters,
                        },
                        propertiesManager: source.getPropertiesManagerType(),
                        propertiesManagerSettings: source.getPropertiesManagerSettings(),
                    };
                    if (source.type === 'mediasoupconnector') {
                        data.settings = {};
                    }
                    if (audioSource) {
                        data = Object.assign(Object.assign({}, data), { forceMono: audioSource.forceMono, syncOffset: AudioService.msToTimeSpec(audioSource.syncOffset), audioMixers: audioSource.audioMixers, monitoringType: audioSource.monitoringType, mixerHidden: audioSource.mixerHidden });
                    }
                    if (data.propertiesManager === 'replay') {
                        delete data.settings['local_file'];
                    }
                    resolve(data);
                });
            });
        });
        return new Promise(resolve => {
            Promise.all(promises).then(items => {
                this.data = { items };
                resolve();
            });
        });
    }
    sanitizeSources() {
        const ids = new Set();
        const channels = new Set();
        this.data.items = this.data.items.filter(item => {
            if (ids.has(item.id))
                return false;
            ids.add(item.id);
            if (item.channel != null) {
                if (channels.has(item.channel))
                    return false;
                channels.add(item.channel);
            }
            return true;
        });
    }
    removeUnsupported() {
        const supportedSources = byOS({ [OS.Windows]: windowsSources, [OS.Mac]: macSources });
        const itemsCopy = this.data.items.slice();
        this.data.items = [];
        let removed = false;
        itemsCopy.forEach(source => {
            if (supportedSources.includes(source.type)) {
                this.data.items.push(source);
            }
            else {
                console.log("Removed the source with id: '%s', name: '%s', and type: '%s' from the scene because it is not suppported", source.id, source.name, source.type);
                removed = true;
            }
        });
        return removed;
    }
    load(context) {
        this.sanitizeSources();
        const supportedSources = this.data.items.filter(source => {
            return byOS({
                [OS.Windows]: () => windowsSources.includes(source.type),
                [OS.Mac]: () => macSources.includes(source.type),
            });
        });
        const supportedPresets = this.sourceFiltersService.views.presetFilterOptions.map(opt => opt.value);
        const sourceData = {};
        const sourceCreateData = supportedSources.map(source => {
            if (source.settings.is_media_flag) {
                source.settings.is_media_flag = false;
            }
            const filters = source.filters.items
                .filter(filter => {
                if (filter.type === 'face_mask_filter') {
                    return false;
                }
                if (filter.name === '__PRESET' &&
                    !supportedPresets.includes(this.sourceFiltersService.views.parsePresetValue(filter.settings.image_path))) {
                    return false;
                }
                return true;
            })
                .map(filter => {
                if (filter.type === 'vst_filter') {
                    this.usageStatisticsService.recordFeatureUsage('VST');
                }
                let displayType = filter.displayType;
                if (displayType == null) {
                    if (filter.name === '__PRESET') {
                        displayType = EFilterDisplayType.Preset;
                    }
                    else {
                        displayType = EFilterDisplayType.Normal;
                    }
                }
                return {
                    name: filter.name,
                    type: filter.type,
                    settings: filter.settings,
                    visible: filter.enabled === void 0 ? true : filter.enabled,
                    enabled: filter.enabled === void 0 ? true : filter.enabled,
                    displayType,
                };
            });
            const sourceDataFilters = filters.map((f) => {
                return {
                    name: f.name,
                    type: f.type,
                    visible: f.visible,
                    enabled: f.visible,
                    settings: f.settings,
                    displayType: f.displayType,
                };
            });
            sourceData[source.id] = Object.assign(Object.assign({}, source), { filters: { items: sourceDataFilters } });
            return {
                name: source.id,
                type: source.type,
                muted: source.muted || false,
                settings: source.settings,
                volume: source.volume,
                syncOffset: source.syncOffset,
                deinterlaceMode: source.deinterlaceMode || 0,
                deinterlaceFieldOrder: source.deinterlaceFieldOrder || 0,
                filters,
            };
        });
        this.sourcesService;
        const sources = obs.createSources(sourceCreateData);
        const promises = [];
        let sourcesNotCreatedNames = [];
        if (sourceCreateData.length !== sources.length) {
            const sourcesNotCreated = sourceCreateData.filter(source => !sources.some(s => s.name === source.name));
            sourcesNotCreatedNames = sourcesNotCreated.map(source => source.name);
            console.error('Error during sources creation when loading scene collection.', JSON.stringify(sourcesNotCreatedNames.join(', ')));
            this.sourcesService.missingInputs = sourcesNotCreated.map(source => { var _a; return (_a = this.sourcesService.sourceDisplayData[source.type]) === null || _a === void 0 ? void 0 : _a.name; });
        }
        sources.forEach((source) => __awaiter(this, void 0, void 0, function* () {
            const sourceInfo = sourceData[source.name];
            this.sourcesService.addSource(source, sourceInfo.name, {
                channel: sourceInfo.channel,
                propertiesManager: sourceInfo.propertiesManager,
                propertiesManagerSettings: sourceInfo.propertiesManagerSettings || {},
                deinterlaceMode: sourceInfo.deinterlaceMode,
                deinterlaceFieldOrder: sourceInfo.deinterlaceFieldOrder,
            });
            if (source.audioMixers) {
                const audioSource = this.audioService.views.getSource(sourceInfo.id);
                if (audioSource) {
                    audioSource.setMul(sourceInfo.volume != null ? sourceInfo.volume : 1);
                    const defaultMonitoring = source.id === 'browser_source'
                        ? 1
                        : 0;
                    audioSource.setSettings({
                        forceMono: defaultTo(sourceInfo.forceMono, false),
                        syncOffset: AudioService.timeSpecToMs(defaultTo(sourceInfo.syncOffset, { sec: 0, nsec: 0 })),
                        audioMixers: defaultTo(sourceInfo.audioMixers, 255),
                        monitoringType: defaultTo(sourceInfo.monitoringType, defaultMonitoring),
                    });
                    audioSource.setHidden(!!sourceInfo.mixerHidden);
                }
            }
            if (sourceInfo.hotkeys) {
                if (sourcesNotCreatedNames.length > 0 && sourcesNotCreatedNames.includes(sourceInfo.id)) {
                    console.error('Attempting to load hotkey for not created source:', sourceInfo.id);
                }
                promises.push(sourceInfo.hotkeys.load({ sourceId: sourceInfo.id }));
            }
            this.sourceFiltersService.loadFilterData(sourceInfo.id, sourceInfo.filters.items);
        }));
        return new Promise(resolve => {
            Promise.all(promises).then(() => resolve());
        });
    }
    migrate(version) {
        if (version < 3) {
            this.data.items.forEach(source => {
                const desktopDeviceMatch = /^DesktopAudioDevice(\d)$/.exec(source.name);
                if (desktopDeviceMatch) {
                    const index = parseInt(desktopDeviceMatch[1], 10);
                    source.name = 'Desktop Audio' + (index > 1 ? ' ' + index : '');
                    return;
                }
                const auxDeviceMatch = /^AuxAudioDevice(\d)$/.exec(source.name);
                if (auxDeviceMatch) {
                    const index = parseInt(auxDeviceMatch[1], 10);
                    source.name = 'Mic/Aux' + (index > 1 ? ' ' + index : '');
                    return;
                }
            });
        }
        if (version < 4) {
            this.data.items.forEach(source => {
                if (source.type === 'ffmpeg_source') {
                    source.settings.hw_decode = false;
                }
            });
        }
    }
}
__decorate([
    Inject()
], SourcesNode.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], SourcesNode.prototype, "audioService", void 0);
__decorate([
    Inject()
], SourcesNode.prototype, "scenesService", void 0);
__decorate([
    Inject()
], SourcesNode.prototype, "usageStatisticsService", void 0);
__decorate([
    Inject()
], SourcesNode.prototype, "sourceFiltersService", void 0);
//# sourceMappingURL=sources.js.map