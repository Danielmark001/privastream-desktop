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
import { StatefulService, ViewHandler } from 'services/core/stateful-service';
import fs from 'fs';
import path from 'path';
import { Inject } from 'services/core/injector';
import * as obs from '../../obs-api';
import { RunInLoadingMode } from 'services/app/app-decorators';
import defaultTo from 'lodash/defaultTo';
import { $t } from 'services/i18n';
import * as remote from '@electron/remote';
class ObsImporterViews extends ViewHandler {
    get OBSconfigFileDirectory() {
        return path.join(remote.app.getPath('appData'), 'obs-studio');
    }
    get sceneCollectionsDirectory() {
        return path.join(this.OBSconfigFileDirectory, 'basic/scenes/');
    }
    get profilesDirectory() {
        return path.join(this.OBSconfigFileDirectory, 'basic/profiles');
    }
    isOBSinstalled() {
        return fs.existsSync(this.OBSconfigFileDirectory);
    }
}
export class ObsImporterService extends StatefulService {
    constructor() {
        super(...arguments);
        this.combinedIdToSceneItemMap = new Map();
        this.combinedIdToFolderMap = new Map();
    }
    get views() {
        return new ObsImporterViews(this.state);
    }
    import() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.load();
        });
    }
    load(selectedProfile) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.views.isOBSinstalled())
                return;
            const collections = this.getSceneCollections();
            for (const collection of collections) {
                yield this.importCollection(collection);
            }
            if (selectedProfile)
                this.importProfile(selectedProfile);
            const globalConfigFile = path.join(this.views.OBSconfigFileDirectory, 'global.ini');
            const data = fs.readFileSync(globalConfigFile).toString();
            if (data) {
                const match = data.match(/^SceneCollection\=(.*)$/m);
                if (match && match[1]) {
                    const coll = this.sceneCollectionsService.collections.find(co => co.name === match[1]);
                    if (coll)
                        this.sceneCollectionsService.load(coll.id);
                }
            }
            obs.NodeObs.OBS_service_resetVideoContext();
            obs.NodeObs.OBS_service_resetAudioContext();
            this.settingsService.loadSettingsIntoStore();
        });
    }
    importCollection(collection) {
        return __awaiter(this, void 0, void 0, function* () {
            const sceneCollectionPath = path.join(this.views.sceneCollectionsDirectory, collection.filename);
            if (sceneCollectionPath.indexOf('.json') === -1) {
                return true;
            }
            const configJSON = JSON.parse(fs.readFileSync(sceneCollectionPath).toString());
            yield this.sceneCollectionsService.create({
                name: collection.name,
                setupFunction: () => {
                    this.importSources(configJSON);
                    this.importScenes(configJSON);
                    this.importSceneOrder(configJSON);
                    this.importMixerSources(configJSON);
                    this.importTransitions(configJSON);
                    this.importFolders(configJSON);
                    return this.scenesService.views.scenes.length !== 0;
                },
            });
        });
    }
    importFilters(filtersJSON, source) {
        if (Array.isArray(filtersJSON)) {
            filtersJSON.forEach(filterJSON => {
                const isFilterAvailable = this.filtersService.state.types.find(availableFilter => {
                    return availableFilter.type === filterJSON.id;
                });
                if (isFilterAvailable) {
                    const sourceId = this.sourcesService.views.getSourcesByName(source.name)[0].sourceId;
                    const filter = this.filtersService.add(sourceId, filterJSON.id, filterJSON.name);
                    filter.enabled = filterJSON.enabled;
                    const properties = this.filtersService.getPropertiesFormData(sourceId, filterJSON.name);
                    if (properties) {
                        if (Array.isArray(properties)) {
                            properties.forEach(property => {
                                if (filterJSON.settings[property.name]) {
                                    property.value = filterJSON.settings[property.name];
                                }
                            });
                        }
                    }
                    this.filtersService.setPropertiesFormData(sourceId, filterJSON.name, properties);
                }
                else {
                }
            });
        }
    }
    importSources(configJSON) {
        const sourcesJSON = configJSON.sources;
        if (Array.isArray(sourcesJSON)) {
            sourcesJSON.forEach(sourceJSON => {
                const isSourceAvailable = this.sourcesService
                    .getAvailableSourcesTypes()
                    .includes(sourceJSON.id);
                if (isSourceAvailable) {
                    if (sourceJSON.id !== 'scene') {
                        let propertiesManager = 'default';
                        let propertiesManagerSettings = {};
                        if (sourceJSON.id === 'browser_source') {
                            sourceJSON.settings.shutdown = true;
                            const widgetType = this.widgetsService.getWidgetTypeByUrl(sourceJSON.settings.url);
                            if (widgetType !== -1) {
                                propertiesManager = 'widget';
                                propertiesManagerSettings = { widgetType };
                            }
                        }
                        const source = this.sourcesService.createSource(sourceJSON.name, sourceJSON.id, sourceJSON.settings, {
                            propertiesManager,
                            propertiesManagerSettings,
                            channel: sourceJSON.channel !== 0 ? sourceJSON.channel : void 0,
                            deinterlaceMode: sourceJSON.deinterlace_mode,
                            deinterlaceFieldOrder: sourceJSON.deinterlace_field_order,
                        });
                        if (source.audio) {
                            const defaultMonitoring = source.type === 'browser_source'
                                ? 1
                                : 0;
                            this.audioService.views.getSource(source.sourceId).setMuted(sourceJSON.muted);
                            this.audioService.views.getSource(source.sourceId).setMul(sourceJSON.volume);
                            this.audioService.views.getSource(source.sourceId).setSettings({
                                audioMixers: defaultTo(sourceJSON.mixers, 255),
                                monitoringType: defaultTo(sourceJSON.monitoring_type, defaultMonitoring),
                                syncOffset: defaultTo(sourceJSON.sync / 1000000, 0),
                                forceMono: !!(sourceJSON.flags & 2),
                            });
                        }
                        const filtersJSON = sourceJSON.filters;
                        this.importFilters(filtersJSON, source);
                    }
                }
                else {
                }
            });
        }
    }
    importScenes(configJSON) {
        const sourcesJSON = configJSON.sources;
        const groupsJSON = configJSON.groups;
        const currentScene = configJSON.current_scene;
        const nameToIdMap = {};
        if (!Array.isArray(sourcesJSON)) {
            return;
        }
        if (!Array.isArray(groupsJSON)) {
            return;
        }
        sourcesJSON.forEach(sourceJSON => {
            if (sourceJSON.id === 'scene') {
                const scene = this.scenesService.createScene(sourceJSON.name, {
                    makeActive: sourceJSON.name === currentScene,
                });
                nameToIdMap[scene.name] = scene.id;
            }
        });
        sourcesJSON.forEach(sourceJSON => {
            if (sourceJSON.id === 'scene') {
                const scene = this.scenesService.views.getScene(nameToIdMap[sourceJSON.name]);
                if (!scene)
                    return;
                const sceneItems = sourceJSON.settings.items;
                if (!Array.isArray(sceneItems)) {
                    return;
                }
                sceneItems.forEach(item => {
                    const sourceToAdd = this.sourcesService.views.getSources().find(source => {
                        return source.name === item.name;
                    });
                    const obsGroupToAdd = groupsJSON.find(groupJSON => {
                        return groupJSON.uuid === item.source_uuid;
                    });
                    if (sourceToAdd) {
                        const sceneItem = scene.addSource(sourceToAdd.sourceId);
                        const combinedId = scene.id + '&' + item.id + '&' + item.source_uuid;
                        this.combinedIdToSceneItemMap.set(combinedId, sceneItem);
                        const crop = {
                            bottom: item.crop_bottom,
                            left: item.crop_left,
                            right: item.crop_right,
                            top: item.crop_top,
                        };
                        const pos = item.pos;
                        const scale = item.scale;
                        const rot = item.rot;
                        if (item.bounds &&
                            item.bounds.x &&
                            item.bounds.y &&
                            item.bounds_align === 0 &&
                            [1, 2].includes(item.bounds_type)) {
                            scale.x = item.bounds.x / sourceToAdd.width;
                            scale.y = item.bounds.y / sourceToAdd.height;
                            if (item.bounds_type === 2) {
                                if (scale.x > scale.y) {
                                    scale.x = scale.y;
                                    const actualWidth = sourceToAdd.width * scale.x;
                                    pos.x += (item.bounds.x - actualWidth) / 2;
                                }
                                else {
                                    scale.y = scale.x;
                                    const actualHeight = sourceToAdd.height * scale.y;
                                    pos.y += (item.bounds.y - actualHeight) / 2;
                                }
                            }
                        }
                        let blendingMode;
                        switch (item.blend_type) {
                            case 'normal': {
                                blendingMode = 0;
                                break;
                            }
                            case 'additive': {
                                blendingMode = 1;
                                break;
                            }
                            case 'subtract': {
                                blendingMode = 2;
                                break;
                            }
                            case 'screen': {
                                blendingMode = 3;
                                break;
                            }
                            case 'multiply': {
                                blendingMode = 4;
                                break;
                            }
                            case 'lighten': {
                                blendingMode = 5;
                                break;
                            }
                            case 'darken': {
                                blendingMode = 6;
                                break;
                            }
                            default: {
                                blendingMode = 0;
                                break;
                            }
                        }
                        let blendingMethod;
                        switch (item.blend_method) {
                            case 'default': {
                                blendingMethod = 0;
                                break;
                            }
                            case 'srgb_off': {
                                blendingMethod = 1;
                                break;
                            }
                            default: {
                                blendingMethod = 0;
                                break;
                            }
                        }
                        let scaleFilter;
                        switch (item.scale_filter) {
                            case 'disable': {
                                scaleFilter = 0;
                                break;
                            }
                            case 'point': {
                                scaleFilter = 1;
                                break;
                            }
                            case 'bilinear': {
                                scaleFilter = 3;
                                break;
                            }
                            case 'bicubic': {
                                scaleFilter = 2;
                                break;
                            }
                            case 'lanczos': {
                                scaleFilter = 4;
                                break;
                            }
                            case 'area': {
                                scaleFilter = 5;
                                break;
                            }
                            default: {
                                scaleFilter = 0;
                                break;
                            }
                        }
                        sceneItem.setSettings({
                            visible: item.visible,
                            locked: item.locked,
                            transform: {
                                crop,
                                scale,
                                position: pos,
                                rotation: rot,
                            },
                            blendingMode,
                            blendingMethod,
                            scaleFilter,
                        });
                    }
                    else if (obsGroupToAdd) {
                        const folder = scene.createFolder(item.name);
                        this.combinedIdToFolderMap.set(scene.id + '&' + item.source_uuid, [
                            folder,
                            item.locked,
                            item.visible,
                        ]);
                    }
                });
            }
        });
    }
    importSceneOrder(configJSON) {
        const sceneNames = [];
        const sceneOrderJSON = configJSON.scene_order;
        const listScene = this.scenesService.views.scenes;
        if (Array.isArray(sceneOrderJSON)) {
            sceneOrderJSON.forEach(obsScene => {
                sceneNames.push(listScene.find(scene => {
                    return scene.name === obsScene.name;
                }).id);
            });
        }
        this.scenesService.setSceneOrder(sceneNames);
    }
    importMixerSources(configJSON) {
        const channelNames = [
            'DesktopAudioDevice1',
            'DesktopAudioDevice2',
            'AuxAudioDevice1',
            'AuxAudioDevice2',
            'AuxAudioDevice3',
        ];
        channelNames.forEach((channelName, i) => {
            const obsAudioSource = configJSON[channelName];
            if (obsAudioSource) {
                const isSourceAvailable = this.sourcesService
                    .getAvailableSourcesTypes()
                    .includes(obsAudioSource.id);
                if (!isSourceAvailable)
                    return;
                const newSource = this.sourcesService.createSource(obsAudioSource.name, obsAudioSource.id, { device_id: obsAudioSource.settings.device_id }, { channel: i + 1 });
                const audioSource = this.audioService.views.getSource(newSource.sourceId);
                audioSource.setMuted(obsAudioSource.muted);
                audioSource.setMul(obsAudioSource.volume);
                audioSource.setSettings({
                    audioMixers: obsAudioSource.mixers,
                    monitoringType: obsAudioSource.monitoring_type,
                    syncOffset: obsAudioSource.sync / 1000000,
                    forceMono: !!(obsAudioSource.flags & 2),
                });
                this.importFilters(obsAudioSource.filters, newSource);
            }
        });
    }
    importTransitions(configJSON) {
        if (configJSON.transitions &&
            configJSON.transitions.length > 0 &&
            this.transitionsService.views
                .getTypes()
                .map(t => t.value)
                .includes(configJSON.transitions[0].id)) {
            this.transitionsService.deleteAllTransitions();
            this.transitionsService.createTransition(configJSON.transitions[0].id, $t('Global Transition'), { duration: configJSON.transition_duration });
        }
    }
    importProfile(profile) {
        const profileDirectory = path.join(this.views.profilesDirectory, profile);
        const files = fs.readdirSync(profileDirectory);
        files.forEach(file => {
            if (file === 'basic.ini' || file === 'streamEncoder.json' || file === 'recordEncoder.json') {
                const obsFilePath = path.join(profileDirectory, file);
                const appData = this.appService.appDataDirectory;
                const currentFilePath = path.join(appData, file);
                const readData = fs.readFileSync(obsFilePath);
                fs.writeFileSync(currentFilePath, readData);
            }
        });
    }
    importFolders(configJSON) {
        if (configJSON.groups && configJSON.groups.length > 0) {
            const groupsJSON = configJSON.groups;
            for (const [combinedId, folderTuple] of this.combinedIdToFolderMap) {
                const [sceneId, obsGroupUuid] = combinedId.split('&');
                const [folder, locked, visible] = folderTuple;
                const groupJSON = groupsJSON.find(v => v.uuid === obsGroupUuid);
                if (!groupJSON) {
                    continue;
                }
                for (const item of groupJSON.settings.items) {
                    const combinedId = sceneId + '&' + item.id + '&' + item.source_uuid;
                    const sceneItem = this.combinedIdToSceneItemMap.get(combinedId);
                    if (sceneItem) {
                        sceneItem.setParent(folder.id);
                        if (locked) {
                            sceneItem.setSettings({ locked: true });
                        }
                        if (!visible) {
                            sceneItem.setSettings({ visible: false });
                        }
                    }
                }
            }
        }
    }
    getSceneCollections() {
        if (!this.views.isOBSinstalled())
            return [];
        if (!fs.existsSync(this.views.sceneCollectionsDirectory))
            return [];
        let files = fs.readdirSync(this.views.sceneCollectionsDirectory);
        files = files.filter(file => !file.match(/\.bak$/));
        return files.map(file => {
            return {
                filename: file,
                name: file.replace('_', ' ').replace('.json', ''),
            };
        });
    }
    getProfiles() {
        if (!this.views.isOBSinstalled())
            return [];
        let profiles = fs.readdirSync(this.views.profilesDirectory);
        profiles = profiles.filter(profile => !profile.match(/\./));
        return profiles;
    }
}
__decorate([
    Inject()
], ObsImporterService.prototype, "scenesService", void 0);
__decorate([
    Inject()
], ObsImporterService.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], ObsImporterService.prototype, "widgetsService", void 0);
__decorate([
    Inject('SourceFiltersService')
], ObsImporterService.prototype, "filtersService", void 0);
__decorate([
    Inject()
], ObsImporterService.prototype, "transitionsService", void 0);
__decorate([
    Inject()
], ObsImporterService.prototype, "sceneCollectionsService", void 0);
__decorate([
    Inject()
], ObsImporterService.prototype, "audioService", void 0);
__decorate([
    Inject()
], ObsImporterService.prototype, "settingsService", void 0);
__decorate([
    Inject()
], ObsImporterService.prototype, "appService", void 0);
__decorate([
    RunInLoadingMode()
], ObsImporterService.prototype, "import", null);
//# sourceMappingURL=obs-importer.js.map