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
import { Service } from 'services/core/service';
import { Inject } from 'services/core/injector';
import { RootNode } from './nodes/root';
import { SourcesNode } from './nodes/sources';
import { ScenesNode } from './nodes/scenes';
import { SceneItemsNode } from './nodes/scene-items';
import { TransitionsNode } from './nodes/transitions';
import { HotkeysNode } from './nodes/hotkeys';
import { SceneFiltersNode } from './nodes/scene-filters';
import path from 'path';
import { parse } from './parse';
import { Scene } from 'services/scenes';
import { E_AUDIO_CHANNELS } from 'services/audio';
import { RunInLoadingMode } from 'services/app/app-decorators';
import namingHelpers from '../../util/NamingHelpers';
import { Subject } from 'rxjs';
import { $t } from '../i18n';
import { EStreamingState } from 'services/streaming';
import { byOS, OS, getOS } from 'util/operating-systems';
import Utils from 'services/utils';
import * as remote from '@electron/remote';
import { GuestCamNode } from './nodes/guest-cam';
import { NodeMapNode } from './nodes/node-map';
import { WidgetType } from 'services/widgets';
const uuid = window['require']('uuid/v4');
export const NODE_TYPES = {
    RootNode,
    NodeMapNode,
    SourcesNode,
    ScenesNode,
    SceneItemsNode,
    TransitionsNode,
    HotkeysNode,
    SceneFiltersNode,
    GuestCamNode,
    TransitionNode: TransitionsNode,
};
const DEFAULT_COLLECTION_NAME = 'Scenes';
export class SceneCollectionsService extends Service {
    constructor() {
        super(...arguments);
        this.collectionAdded = new Subject();
        this.collectionRemoved = new Subject();
        this.collectionSwitched = new Subject();
        this.collectionWillSwitch = new Subject();
        this.collectionUpdated = new Subject();
        this.collectionInitialized = new Subject();
        this.collectionLoaded = false;
        this.collectionErrorOpen = false;
        this.syncPending = false;
        this.newUserFirstLogin = false;
        this.downloadProgress = new Subject();
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.stateService.loadManifestFile();
            yield this.migrateOS();
            yield this.safeSync();
            if (this.activeCollection && this.activeCollection.operatingSystem === getOS()) {
                yield this.load(this.activeCollection.id, true);
            }
            else if (this.loadableCollections.length > 0) {
                let latestId = this.loadableCollections[0].id;
                let latestModified = this.loadableCollections[0].modified;
                this.loadableCollections.forEach(collection => {
                    if (collection.modified > latestModified) {
                        latestModified = collection.modified;
                        latestId = collection.id;
                    }
                });
                yield this.load(latestId);
            }
            else {
                yield this.create({ auto: true });
            }
            this.collectionInitialized.next();
        });
    }
    setupNewUser() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialize();
        });
    }
    deinitialize() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.disableAutoSave();
            yield this.save();
            yield this.deloadCurrentApplicationState();
            yield this.safeSync();
            yield this.stateService.flushManifestFile();
        });
    }
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.collectionLoaded)
                return;
            if (!this.activeCollection)
                return;
            yield this.saveCurrentApplicationStateAs(this.activeCollection.id);
            this.stateService.SET_MODIFIED(this.activeCollection.id, new Date().toISOString());
        });
    }
    load(id_1) {
        return __awaiter(this, arguments, void 0, function* (id, shouldAttemptRecovery = true) {
            yield this.deloadCurrentApplicationState();
            try {
                yield this.setActiveCollection(id);
                yield this.readCollectionDataAndLoadIntoApplicationState(id);
                this.collectionSwitched.next(this.getCollection(id));
            }
            catch (e) {
                console.error('Error loading collection!', e);
                if (shouldAttemptRecovery) {
                    yield this.attemptRecovery(id);
                }
                else {
                    console.warn(`Unsuccessful recovery of scene collection ${id} attempted`);
                    this.handleCollectionLoadError();
                }
            }
        });
    }
    create() {
        return __awaiter(this, arguments, void 0, function* (options = {}) {
            yield this.deloadCurrentApplicationState();
            const name = options.name || this.suggestName(DEFAULT_COLLECTION_NAME);
            const id = uuid();
            const collection = yield this.insertCollection(id, name, getOS(), options.auto || false);
            yield this.setActiveCollection(id);
            if (options.needsRename)
                this.stateService.SET_NEEDS_RENAME(id);
            if (options.setupFunction && (yield options.setupFunction())) {
            }
            else {
                this.setupEmptyCollection();
            }
            this.collectionLoaded = true;
            yield this.save();
            this.collectionSwitched.next(collection);
            return collection;
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const collId = id !== null && id !== void 0 ? id : (_a = this.activeCollection) === null || _a === void 0 ? void 0 : _a.id;
            if (collId == null)
                return;
            const removingActiveCollection = collId === ((_b = this.activeCollection) === null || _b === void 0 ? void 0 : _b.id);
            if (removingActiveCollection) {
                yield this.appService.runInLoadingMode(() => __awaiter(this, void 0, void 0, function* () {
                    yield this.removeCollection(collId);
                    if (this.loadableCollections.length > 0) {
                        yield this.load(this.loadableCollections[0].id);
                    }
                    else {
                        yield this.create();
                    }
                }));
            }
            else {
                yield this.removeCollection(collId);
            }
        });
    }
    rename(name, id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const collId = id !== null && id !== void 0 ? id : (_a = this.activeCollection) === null || _a === void 0 ? void 0 : _a.id;
            if (!collId)
                return;
            this.stateService.RENAME_COLLECTION(collId, name, new Date().toISOString());
            yield this.safeSync();
            const coll = this.getCollection(collId);
            if (coll)
                this.collectionUpdated.next(coll);
        });
    }
    safeSync() {
        return __awaiter(this, arguments, void 0, function* (retries = 2) {
            if (!this.canSync())
                return;
            if (this.syncPending) {
                console.error('Unable to start the scenes-collection sync process while prev process is not finished');
                return;
            }
            this.syncPending = true;
            try {
                yield this.sync();
                this.syncPending = false;
            }
            catch (e) {
                this.syncPending = false;
                console.error(`Scene collection sync failed (Attempt ${3 - retries}/3)`, e);
                if (retries > 0)
                    yield this.safeSync(retries - 1);
            }
        });
    }
    duplicate(name, id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const oldId = id !== null && id !== void 0 ? id : (_a = this.activeCollection) === null || _a === void 0 ? void 0 : _a.id;
            if (oldId == null)
                return;
            const oldColl = this.getCollection(oldId);
            if (!oldColl)
                return;
            yield this.disableAutoSave();
            const newId = uuid();
            const duplicatedName = $t('Copy of %{collectionName}', { collectionName: name });
            const collection = yield this.insertCollection(newId, duplicatedName, oldColl.operatingSystem, false, oldId);
            this.enableAutoSave();
            return collection.id;
        });
    }
    convertDualOutputCollection() {
        return __awaiter(this, arguments, void 0, function* (assignToHorizontal = false, collectionId) {
            const collection = collectionId ? this.getCollection(collectionId) : this.activeCollection;
            const name = `${collection === null || collection === void 0 ? void 0 : collection.name} - Converted`;
            const newCollectionId = yield this.duplicate(name, collectionId);
            if (!newCollectionId)
                return;
            this.dualOutputService.setDualOutputModeIfPossible(false);
            yield this.load(newCollectionId);
            yield this.convertToVanillaSceneCollection(assignToHorizontal);
            return this.stateService.getCollectionFilePath(newCollectionId);
        });
    }
    installOverlay(url, name) {
        return __awaiter(this, void 0, void 0, function* () {
            const pathName = yield this.overlaysPersistenceService.downloadOverlay(url, (progress) => {
                this.downloadProgress.next(progress);
            });
            const collectionName = this.suggestName(name);
            yield this.loadOverlay(pathName, collectionName);
            this.scenesService.repair();
        });
    }
    loadOverlay(filePath, name) {
        return __awaiter(this, void 0, void 0, function* () {
            const desktopAudioDevice = this.getDeviceIdFor('Desktop Audio') || 'default';
            const micDevice = this.getDeviceIdFor('Mic/Aux');
            yield this.deloadCurrentApplicationState();
            const id = uuid();
            const collection = yield this.insertCollection(id, name, getOS());
            yield this.setActiveCollection(id);
            try {
                yield this.overlaysPersistenceService.loadOverlay(filePath);
                this.setupDefaultAudio(desktopAudioDevice, micDevice);
            }
            catch (e) {
                console.error('Overlay installation failed', e);
            }
            this.collectionSwitched.next(collection);
            this.collectionLoaded = true;
            yield this.save();
        });
    }
    getDeviceIdFor(sourceName) {
        var _a, _b;
        return (_b = (_a = this.sourcesService.views.getSourcesByName(sourceName)[0]) === null || _a === void 0 ? void 0 : _a.getSettings()) === null || _b === void 0 ? void 0 : _b.device_id;
    }
    suggestName(name) {
        return namingHelpers.suggestName(name, (name) => {
            return !!this.collections.find(collection => {
                return collection.name === name;
            });
        });
    }
    showManageWindow() {
        this.windowsService.showWindow({
            componentName: 'ManageSceneCollections',
            title: $t('Manage Scene Collections'),
            size: {
                width: 700,
                height: 800,
            },
        });
    }
    get loadableCollections() {
        return this.collections.filter(c => c.operatingSystem === getOS());
    }
    getCollection(id) {
        var _a;
        return (_a = this.collections.find(coll => coll.id === id)) !== null && _a !== void 0 ? _a : null;
    }
    fetchSceneCollectionsSchema() {
        const promises = [];
        this.collections.forEach(collection => {
            const data = this.stateService.readCollectionFile(collection.id);
            promises.push(new Promise(resolve => {
                const root = parse(data, NODE_TYPES);
                const collectionSchema = {
                    id: collection.id,
                    name: collection.name,
                    scenes: root.data.scenes.data.items.map((sceneData) => {
                        return {
                            id: sceneData.id,
                            name: sceneData.name,
                            sceneItems: sceneData.sceneItems.data.items.map((sceneItemData) => {
                                return {
                                    sceneItemId: sceneItemData.id,
                                    sourceId: sceneItemData.sourceId,
                                };
                            }),
                        };
                    }),
                    sources: root.data.sources.data.items.map((sourceData) => {
                        return {
                            id: sourceData.id,
                            name: sourceData.name,
                            type: sourceData.type,
                            channel: sourceData.channel,
                        };
                    }),
                };
                resolve(collectionSchema);
            }));
        });
        return Promise.all(promises);
    }
    get collections() {
        return this.stateService.collections;
    }
    get activeCollection() {
        return this.stateService.activeCollection;
    }
    get sceneNodeMaps() {
        return this.stateService.sceneNodeMaps;
    }
    readCollectionDataAndLoadIntoApplicationState(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const exists = yield this.stateService.collectionFileExists(id);
            this.dualOutputService.setIsLoading(true);
            if (exists) {
                let data;
                try {
                    data = this.stateService.readCollectionFile(id);
                    if (!data)
                        throw new Error('Got blank data from collection file');
                    yield this.loadDataIntoApplicationState(data);
                }
                catch (e) {
                    console.error('Error while loading collection, restoring backup:', e instanceof Error ? e.message : e);
                    try {
                        this.deloadPartialApplicationState();
                        const backupExists = yield this.stateService.collectionFileExists(id, true);
                        if (!backupExists)
                            throw e;
                        data = this.stateService.readCollectionFile(id, true);
                        if (!data)
                            throw new Error('Got blank data from backup collection file');
                        yield this.loadDataIntoApplicationState(data);
                    }
                    catch (backupError) {
                        console.error('Error while loading backup collection:', backupError instanceof Error ? backupError.message : backupError);
                        return;
                    }
                }
                if (!data) {
                    yield this.create({ auto: true });
                    return;
                }
                if (this.scenesService.views.scenes.length === 0) {
                    console.error('Scene collection was loaded but there were no scenes.');
                    this.setupEmptyCollection();
                    this.collectionLoaded = true;
                    return;
                }
                this.stateService.writeDataToCollectionFile(id, data, true);
                this.collectionLoaded = true;
            }
            else {
                try {
                    yield this.attemptRecovery(id);
                }
                catch (recoveryError) {
                    console.error('Error during collection recovery:', recoveryError instanceof Error ? recoveryError.message : recoveryError);
                    yield this.handleCollectionLoadError();
                    this.setupEmptyCollection();
                }
                this.collectionLoaded = true;
            }
        });
    }
    handleCollectionLoadError() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.collectionErrorOpen)
                return;
            remote.dialog
                .showMessageBox(Utils.getMainWindow(), {
                title: 'Streamlabs Desktop',
                message: $t('Failed to load scene collection.  A new one will be created instead.'),
            })
                .then(() => (this.collectionErrorOpen = false));
            this.collectionErrorOpen = true;
        });
    }
    loadDataIntoApplicationState(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const root = parse(data, NODE_TYPES);
            if (root.data.sources.removeUnsupported()) {
                this.showUnsupportedSourcesDialog();
            }
            yield root.load();
            this.hotkeysService.bindHotkeys();
            if (this.sourcesService.missingInputs.length > 0) {
                yield remote.dialog
                    .showMessageBox(Utils.getMainWindow(), {
                    title: 'Unsupported Sources',
                    type: 'warning',
                    message: $t('Scene items were removed because there was an error loading them: %{inputs}.\n\nPlease accept or reject permissions to view the Streamlabs Editor panel', { inputs: this.sourcesService.missingInputs.join(', ') }),
                })
                    .then(() => {
                    this.collectionErrorOpen = false;
                });
                this.collectionErrorOpen = true;
            }
            if (this.newUserFirstLogin) {
                this.newUserFirstLogin = false;
            }
        });
    }
    showUnsupportedSourcesDialog(e) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = e && e instanceof Error ? e.message : e !== null && e !== void 0 ? e : '';
            console.error('Error during sources creation when loading scene collection:', message);
            yield remote.dialog
                .showMessageBox(Utils.getMainWindow(), {
                title: 'Unsupported Sources',
                type: 'warning',
                message: $t('One or more scene items were removed because they are not supported'),
            })
                .then(() => (this.collectionErrorOpen = false));
            this.collectionErrorOpen = true;
        });
    }
    saveCurrentApplicationStateAs(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const root = new RootNode();
            yield root.save();
            const data = JSON.stringify(root, null, 2);
            this.stateService.writeDataToCollectionFile(id, data);
        });
    }
    attemptRecovery(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = this.collections.find(coll => coll.id === id);
            if (collection == null)
                return;
            if (collection.serverId && this.userService.isLoggedIn) {
                const coll = yield this.serverApi.fetchSceneCollection(collection.serverId);
                if (coll.scene_collection.data) {
                    this.stateService.HARD_DELETE_COLLECTION(id);
                    yield this.safeSync();
                    const newCollection = this.collections.find(coll => coll.serverId === collection.serverId);
                    if (newCollection) {
                        yield this.load(newCollection.id, false);
                        return;
                    }
                }
            }
        });
    }
    deloadCurrentApplicationState() {
        return __awaiter(this, void 0, void 0, function* () {
            this.tcpServerService.stopRequestsHandling();
            this.collectionWillSwitch.next();
            yield this.disableAutoSave();
            yield this.save();
            try {
                this.scenesService.views.scenes.forEach(scene => {
                    if (scene.id === this.scenesService.views.activeSceneId)
                        return;
                    scene.remove(true);
                });
                if (this.scenesService.views.activeScene) {
                    this.scenesService.views.activeScene.remove(true);
                }
                this.sourcesService.views.sources.forEach(source => {
                    if (source.type !== 'scene')
                        source.remove();
                });
                this.transitionsService.deleteAllTransitions();
                this.transitionsService.deleteAllConnections();
                this.streamingService.setSelectiveRecording(false);
            }
            catch (e) {
                console.error('Error deloading application state', e);
            }
            this.hotkeysService.clearAllHotkeys();
            this.collectionLoaded = false;
        });
    }
    deloadPartialApplicationState() {
        return __awaiter(this, void 0, void 0, function* () {
            this.tcpServerService.stopRequestsHandling();
            yield this.disableAutoSave();
            this.collectionWillSwitch.next();
            const scenesState = this.scenesService.state.scenes;
            const activeSceneId = this.scenesService.state.activeSceneId;
            for (const sceneId in scenesState) {
                if (sceneId === activeSceneId)
                    continue;
                if (scenesState[sceneId]) {
                    const scene = new Scene(sceneId);
                    scene.remove();
                }
            }
            if (scenesState[activeSceneId]) {
                const scene = new Scene(activeSceneId);
                scene.remove();
            }
            const sources = this.sourcesService.state.sources;
            for (const sourceId in sources) {
                if (sources[sourceId].type === 'scene')
                    continue;
                try {
                    this.sourcesService.removeSource(sourceId);
                }
                catch (e) {
                    console.error('Attempted to deload source from partial state: ', e);
                }
            }
            if (this.transitionsService.state.transitions.length > 0) {
                this.transitionsService.deleteAllTransitions();
                this.transitionsService.state.transitions.forEach(transition => {
                    if (transition.id !== this.transitionsService.studioModeTransition.id) {
                        this.transitionsService.deleteTransition(transition.id);
                    }
                });
            }
            if (this.transitionsService.state.connections) {
                this.transitionsService.deleteAllConnections();
            }
            this.streamingService.setSelectiveRecording(false);
            this.hotkeysService.clearAllHotkeys();
            this.collectionLoaded = false;
        });
    }
    setupEmptyCollection() {
        this.scenesService.createScene('Scene', { makeActive: true });
        this.setupDefaultAudio();
        this.transitionsService.ensureTransition();
    }
    setupDefaultAudio(desktopAudioDevice, micDevice) {
        if (getOS() === OS.Windows) {
            this.sourcesService.createSource('Desktop Audio', byOS({ [OS.Windows]: 'wasapi_output_capture', [OS.Mac]: 'coreaudio_output_capture' }), { device_id: desktopAudioDevice }, { channel: E_AUDIO_CHANNELS.OUTPUT_1 });
        }
        const defaultId = this.defaultHardwareService.state.defaultAudioDevice
            ? this.defaultHardwareService.state.defaultAudioDevice
            : undefined;
        this.sourcesService.createSource('Mic/Aux', byOS({ [OS.Windows]: 'wasapi_input_capture', [OS.Mac]: 'coreaudio_input_capture' }), { device_id: micDevice || defaultId }, { channel: E_AUDIO_CHANNELS.INPUT_1 });
    }
    insertCollection(id_1, name_1, os_1) {
        return __awaiter(this, arguments, void 0, function* (id, name, os, auto = false, fromId) {
            if (fromId) {
                yield this.stateService.copyCollectionFile(fromId, id);
            }
            else {
                yield this.saveCurrentApplicationStateAs(id);
            }
            this.stateService.ADD_COLLECTION(id, name, new Date().toISOString(), os, auto);
            yield this.safeSync();
            const collection = this.getCollection(id);
            this.collectionAdded.next(collection);
            return collection;
        });
    }
    removeCollection(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.collectionRemoved.next(this.collections.find(coll => {
                const skip = (coll === null || coll === void 0 ? void 0 : coll.sceneNodeMaps) && Object.values(coll === null || coll === void 0 ? void 0 : coll.sceneNodeMaps).length > 0;
                if (coll.id === id && !skip) {
                    return coll;
                }
            }));
            this.stateService.DELETE_COLLECTION(id);
            yield this.safeSync();
        });
    }
    enableAutoSave() {
        if (this.autoSaveInterval)
            return;
        this.autoSaveInterval = window.setInterval(() => __awaiter(this, void 0, void 0, function* () {
            if (this.streamingService.state.streamingStatus === EStreamingState.Live)
                return;
            this.autoSavePromise = this.save();
            yield this.autoSavePromise;
            this.stateService.flushManifestFile();
        }), 60 * 1000);
    }
    disableAutoSave() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.autoSaveInterval)
                clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
            if (this.autoSavePromise)
                yield this.autoSavePromise;
        });
    }
    setActiveCollection(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = this.collections.find(coll => coll.id === id);
            if (collection) {
                if (collection.serverId && this.userService.isLoggedIn) {
                    this.serverApi
                        .makeSceneCollectionActive(collection.serverId)
                        .catch(e => console.warn('Failed setting active collection'));
                }
                this.stateService.SET_ACTIVE_COLLECTION(id);
            }
        });
    }
    get legacyDirectory() {
        return path.join(this.appService.appDataDirectory, 'SceneConfigs');
    }
    sync() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.canSync())
                return;
            const serverCollections = (yield this.serverApi.fetchSceneCollections()).data;
            if (!serverCollections || serverCollections.length === 0) {
                this.newUserFirstLogin = true;
            }
            else {
                this.newUserFirstLogin = false;
            }
            let failed = false;
            const collectionsToInsert = [];
            const collectionsToUpdate = [];
            for (const onServer of serverCollections) {
                const inManifest = this.stateService.state.collections.find(coll => coll.serverId === onServer.id);
                if (inManifest) {
                    if (inManifest.deleted) {
                        const success = yield this.performSyncStep('Delete on server', () => __awaiter(this, void 0, void 0, function* () {
                            if (inManifest.serverId) {
                                yield this.serverApi.deleteSceneCollection(inManifest.serverId);
                            }
                            this.stateService.HARD_DELETE_COLLECTION(inManifest.id);
                        }));
                        if (!success)
                            failed = true;
                    }
                    else if (new Date(inManifest.modified) > new Date(onServer.last_updated_at)) {
                        const success = yield this.performSyncStep('Update on server', () => __awaiter(this, void 0, void 0, function* () {
                            const exists = yield this.stateService.collectionFileExists(inManifest.id);
                            if (exists) {
                                const data = this.stateService.readCollectionFile(inManifest.id);
                                if (data && inManifest.serverId) {
                                    yield this.serverApi.updateSceneCollection({
                                        data,
                                        id: inManifest.serverId,
                                        name: inManifest.name,
                                        last_updated_at: inManifest.modified,
                                    });
                                }
                            }
                        }));
                        if (!success)
                            failed = true;
                    }
                    else if (new Date(inManifest.modified) < new Date(onServer.last_updated_at)) {
                        collectionsToUpdate.push(onServer.id);
                    }
                    else {
                        console.log('Up to date file: ', inManifest.id);
                    }
                }
                else {
                    collectionsToInsert.push(onServer.id);
                }
            }
            if (collectionsToUpdate.length > 0) {
                const serverCollectionsToUpdate = yield this.serverApi.fetchSceneCollectionsById(collectionsToUpdate);
                const success = yield this.performSyncStep('Update from Server', () => __awaiter(this, void 0, void 0, function* () {
                    this.updateCollectionsFromServer(serverCollectionsToUpdate.scene_collections);
                }));
                if (!success)
                    failed = true;
            }
            if (collectionsToInsert.length > 0) {
                const serverCollectionsToInsert = yield this.serverApi.fetchSceneCollectionsById(collectionsToInsert);
                const success = yield this.performSyncStep('Insert from Server', () => __awaiter(this, void 0, void 0, function* () {
                    this.insertCollectionsFromServer(serverCollectionsToInsert.scene_collections);
                }));
                if (!success)
                    failed = true;
            }
            for (const inManifest of this.stateService.state.collections) {
                const onServer = serverCollections.find(coll => coll.id === inManifest.serverId);
                if (!onServer) {
                    if (!inManifest.serverId) {
                        if (this.loadableCollections.filter(c => c.id !== inManifest.id).length &&
                            inManifest.auto) {
                            const success = this.performSyncStep('Delete from server', () => __awaiter(this, void 0, void 0, function* () {
                                this.stateService.HARD_DELETE_COLLECTION(inManifest.id);
                            }));
                            if (!success)
                                failed = true;
                        }
                        else {
                            const success = yield this.performSyncStep('Insert on server', () => __awaiter(this, void 0, void 0, function* () {
                                const data = this.stateService.readCollectionFile(inManifest.id);
                                const response = yield this.serverApi.createSceneCollection({
                                    data,
                                    name: inManifest.name,
                                    last_updated_at: inManifest.modified,
                                });
                                this.stateService.SET_SERVER_ID(inManifest.id, response.id);
                            }));
                            if (!success)
                                failed = true;
                        }
                    }
                    else {
                        const success = this.performSyncStep('Delete from server', () => __awaiter(this, void 0, void 0, function* () {
                            this.stateService.HARD_DELETE_COLLECTION(inManifest.id);
                        }));
                        if (!success)
                            failed = true;
                    }
                }
            }
            yield this.stateService.flushManifestFile();
            if (failed)
                throw new Error('Sync failed!');
        });
    }
    updateCollectionsFromServer(collections) {
        collections.forEach(collection => {
            const inManifest = this.stateService.state.collections.find(coll => coll.serverId === collection.id);
            if (!inManifest)
                return console.error('Scene Collection not found');
            if (collection.data) {
                this.stateService.writeDataToCollectionFile(inManifest.id, collection.data);
            }
            else {
                console.error(`Server returned empty data for collection ${inManifest.id}`);
            }
            this.stateService.RENAME_COLLECTION(inManifest.id, collection.name, collection.last_updated_at);
        });
    }
    insertCollectionsFromServer(collections) {
        collections.forEach(collection => {
            const id = uuid();
            let operatingSystem = getOS();
            if (collection.data != null) {
                this.stateService.writeDataToCollectionFile(id, collection.data);
                operatingSystem = JSON.parse(collection.data).operatingSystem || OS.Windows;
            }
            this.stateService.ADD_COLLECTION(id, collection.name, collection.last_updated_at, operatingSystem);
            this.stateService.SET_SERVER_ID(id, collection.id);
        });
    }
    performSyncStep(name, stepRunner) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield stepRunner();
                console.debug(`Sync step succeeded: ${name}`);
                return true;
            }
            catch (e) {
                console.error(`Sync step failed: ${name}`, e);
                return false;
            }
        });
    }
    migrateOS() {
        this.collections
            .filter(c => !c.operatingSystem)
            .forEach(c => {
            this.stateService.SET_OPERATING_SYSTEM(c.id, OS.Windows);
        });
    }
    canSync() {
        return (this.userService.isLoggedIn &&
            !this.appService.state.argv.includes('--nosync') &&
            !process.argv.includes('--nosync'));
    }
    setupDefaultSources(shouldAddDefaultSources) {
        var _a;
        if (!shouldAddDefaultSources) {
            this.newUserFirstLogin = false;
            return;
        }
        const scene = (_a = this.scenesService.views.activeScene) !== null && _a !== void 0 ? _a : this.scenesService.createScene('Scene', { makeActive: true });
        if (!scene) {
            console.error('Default scene not found, failed to create default sources.');
            return;
        }
        scene.createAndAddSource('Game Capture', 'game_capture', {}, { display: 'horizontal' });
        const type = byOS({
            [OS.Windows]: 'dshow_input',
            [OS.Mac]: 'av_capture_input',
        });
        const defaultSource = this.defaultHardwareService.state.defaultVideoDevice;
        const webCam = defaultSource
            ? this.sourcesService.views.getSource(defaultSource)
            : this.sourcesService.views.sources.find(s => (s === null || s === void 0 ? void 0 : s.type) === type);
        if (!webCam) {
            scene.createAndAddSource('Webcam', type, { display: 'horizontal' });
        }
        else {
            scene.addSource(webCam.sourceId, { display: 'horizontal' });
        }
        this.widgetsService.createWidget(WidgetType.AlertBox, 'Alert Box');
        this.newUserFirstLogin = false;
    }
    initNodeMaps(sceneNodeMap) {
        this.videoSettingsService.validateVideoContext();
        if (!this.activeCollection)
            return;
        this.stateService.initNodeMaps(sceneNodeMap);
    }
    restoreNodeMap(sceneId, nodeMap) {
        if (!this.activeCollection)
            return;
        if (!this.activeCollection.hasOwnProperty('sceneNodeMaps')) {
            this.activeCollection.sceneNodeMaps = {};
        }
        this.activeCollection.sceneNodeMaps = Object.assign(Object.assign({}, this.activeCollection.sceneNodeMaps), { [sceneId]: nodeMap !== null && nodeMap !== void 0 ? nodeMap : {} });
    }
    createNodeMapEntry(sceneId, horizontalNodeId, verticalNodeId) {
        var _a;
        if (!this.activeCollection)
            return;
        if (!this.activeCollection.hasOwnProperty('sceneNodeMaps')) {
            this.activeCollection.sceneNodeMaps = {};
        }
        if (this.activeCollection.sceneNodeMaps &&
            !((_a = this.activeCollection) === null || _a === void 0 ? void 0 : _a.sceneNodeMaps.hasOwnProperty(sceneId))) {
            this.activeCollection.sceneNodeMaps = Object.assign(Object.assign({}, this.activeCollection.sceneNodeMaps), { [sceneId]: {} });
        }
        this.stateService.createNodeMapEntry(sceneId, horizontalNodeId, verticalNodeId);
    }
    removeNodeMapEntry(horizontalNodeId, sceneId) {
        var _a, _b, _c;
        if (!this.activeCollection ||
            !((_a = this.activeCollection) === null || _a === void 0 ? void 0 : _a.sceneNodeMaps) ||
            !((_b = this.activeCollection) === null || _b === void 0 ? void 0 : _b.sceneNodeMaps.hasOwnProperty(sceneId))) {
            return;
        }
        const nodeMap = (_c = this.activeCollection) === null || _c === void 0 ? void 0 : _c.sceneNodeMaps[sceneId];
        delete nodeMap[horizontalNodeId];
        this.activeCollection.sceneNodeMaps[sceneId] = Object.assign({}, nodeMap);
        this.stateService.removeNodeMapEntry(horizontalNodeId, sceneId);
    }
    removeNodeMap(sceneId) {
        this.stateService.removeNodeMap(sceneId);
    }
    convertToVanillaSceneCollection(assignToHorizontal) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (!((_a = this.activeCollection) === null || _a === void 0 ? void 0 : _a.sceneNodeMaps))
                return;
            const allSceneIds = this.scenesService.getSceneIds();
            const dualOutputSceneIds = Object.keys((_b = this.activeCollection) === null || _b === void 0 ? void 0 : _b.sceneNodeMaps);
            allSceneIds.forEach(sceneId => {
                if (!sceneId)
                    return;
                const scene = this.scenesService.views.getScene(sceneId);
                if (!scene)
                    return;
                const nodes = scene.getNodes();
                if (!nodes)
                    return;
                const isDualOutputScene = dualOutputSceneIds.includes(sceneId);
                nodes.forEach(node => {
                    if ((node === null || node === void 0 ? void 0 : node.display) && (node === null || node === void 0 ? void 0 : node.display) === 'vertical') {
                        if (!assignToHorizontal) {
                            if (node.isFolder()) {
                                node.ungroup();
                            }
                            else {
                                node.remove();
                            }
                            if (isDualOutputScene) {
                                const horizontalNodeId = this.dualOutputService.views.getHorizontalNodeId(node.id);
                                if (horizontalNodeId)
                                    this.removeNodeMapEntry(sceneId, horizontalNodeId);
                            }
                        }
                        else {
                            node.setDisplay('horizontal');
                        }
                    }
                });
                if (isDualOutputScene) {
                    this.stateService.removeNodeMap(sceneId);
                }
            });
            yield this.save();
        });
    }
}
__decorate([
    Inject('SceneCollectionsServerApiService')
], SceneCollectionsService.prototype, "serverApi", void 0);
__decorate([
    Inject('SceneCollectionsStateService')
], SceneCollectionsService.prototype, "stateService", void 0);
__decorate([
    Inject()
], SceneCollectionsService.prototype, "scenesService", void 0);
__decorate([
    Inject()
], SceneCollectionsService.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], SceneCollectionsService.prototype, "appService", void 0);
__decorate([
    Inject()
], SceneCollectionsService.prototype, "hotkeysService", void 0);
__decorate([
    Inject()
], SceneCollectionsService.prototype, "windowsService", void 0);
__decorate([
    Inject()
], SceneCollectionsService.prototype, "userService", void 0);
__decorate([
    Inject()
], SceneCollectionsService.prototype, "overlaysPersistenceService", void 0);
__decorate([
    Inject()
], SceneCollectionsService.prototype, "tcpServerService", void 0);
__decorate([
    Inject()
], SceneCollectionsService.prototype, "transitionsService", void 0);
__decorate([
    Inject()
], SceneCollectionsService.prototype, "streamingService", void 0);
__decorate([
    Inject()
], SceneCollectionsService.prototype, "dualOutputService", void 0);
__decorate([
    Inject()
], SceneCollectionsService.prototype, "videoSettingsService", void 0);
__decorate([
    Inject()
], SceneCollectionsService.prototype, "defaultHardwareService", void 0);
__decorate([
    Inject()
], SceneCollectionsService.prototype, "widgetsService", void 0);
__decorate([
    RunInLoadingMode()
], SceneCollectionsService.prototype, "setupNewUser", null);
__decorate([
    RunInLoadingMode()
], SceneCollectionsService.prototype, "load", null);
__decorate([
    RunInLoadingMode()
], SceneCollectionsService.prototype, "create", null);
__decorate([
    RunInLoadingMode()
], SceneCollectionsService.prototype, "convertDualOutputCollection", null);
__decorate([
    RunInLoadingMode({ hideStyleBlockers: false })
], SceneCollectionsService.prototype, "installOverlay", null);
__decorate([
    RunInLoadingMode()
], SceneCollectionsService.prototype, "loadOverlay", null);
//# sourceMappingURL=scene-collections.js.map