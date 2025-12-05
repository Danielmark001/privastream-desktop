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
import { mutation, StatefulService } from 'services/core/stateful-service';
import Vue from 'vue';
import fs from 'fs';
import path from 'path';
import { Inject } from 'services/core/injector';
import omit from 'lodash/omit';
export class SceneCollectionsStateService extends StatefulService {
    get collections() {
        return this.state.collections.filter(coll => !coll.deleted);
    }
    get activeCollection() {
        return this.collections.find(coll => coll.id === this.state.activeId);
    }
    get sceneNodeMaps() {
        var _a;
        return (_a = this.activeCollection) === null || _a === void 0 ? void 0 : _a.sceneNodeMaps;
    }
    loadManifestFile() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureDirectory();
            try {
                const data = this.readCollectionFile('manifest');
                if (data) {
                    const parsed = JSON.parse(data);
                    const recovered = yield this.checkAndRecoverManifest(parsed);
                    if (recovered)
                        this.LOAD_STATE(recovered);
                }
            }
            catch (e) {
                console.warn('Error loading manifest file from disk');
            }
            this.flushManifestFile();
        });
    }
    checkAndRecoverManifest(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Array.isArray(obj.collections))
                return;
            obj.collections = obj.collections.filter(coll => {
                if (coll.id == null)
                    return false;
                if (coll.deleted == null)
                    coll.deleted = false;
                if (coll.modified == null)
                    coll.modified = new Date().toISOString();
                return true;
            });
            return obj;
        });
    }
    flushManifestFile() {
        const data = JSON.stringify(omit(this.state, 'auto'), null, 2);
        this.writeDataToCollectionFile('manifest', data);
    }
    collectionFileExists(id, backup) {
        return __awaiter(this, void 0, void 0, function* () {
            let filePath = this.getCollectionFilePath(id);
            if (backup)
                filePath = `${filePath}.bak`;
            return this.fileManagerService.exists(filePath);
        });
    }
    readCollectionFile(id, backup) {
        let filePath = this.getCollectionFilePath(id);
        if (backup)
            filePath = `${filePath}.bak`;
        return this.fileManagerService.read(filePath, {
            validateJSON: true,
            retries: 2,
        });
    }
    writeDataToCollectionFile(id, data, backup) {
        let collectionPath = this.getCollectionFilePath(id);
        if (backup)
            collectionPath = `${collectionPath}.bak`;
        this.fileManagerService.write(collectionPath, data);
    }
    copyCollectionFile(sourceId, destId) {
        this.fileManagerService.copy(this.getCollectionFilePath(sourceId), this.getCollectionFilePath(destId));
    }
    ensureDirectory() {
        return __awaiter(this, void 0, void 0, function* () {
            const exists = yield new Promise(resolve => {
                fs.exists(this.collectionsDirectory, exists => resolve(exists));
            });
            if (!exists) {
                yield new Promise((resolve, reject) => {
                    fs.mkdir(this.collectionsDirectory, err => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve();
                    });
                });
            }
        });
    }
    get collectionsDirectory() {
        return path.join(this.appService.appDataDirectory, 'SceneCollections');
    }
    getCollectionFilePath(id) {
        return path.join(this.collectionsDirectory, `${id}.json`);
    }
    initNodeMaps(sceneNodeMap) {
        this.INIT_NODE_MAPS(sceneNodeMap);
    }
    createNodeMapEntry(sceneId, horizontalNodeId, verticalNodeId) {
        this.CREATE_NODE_MAP_ENTRY(sceneId, horizontalNodeId, verticalNodeId);
    }
    removeNodeMapEntry(horizontalNodeId, sceneId) {
        this.REMOVE_NODE_MAP_ENTRY(horizontalNodeId, sceneId);
    }
    removeNodeMap(sceneId) {
        this.REMOVE_NODE_MAP(sceneId);
    }
    SET_ACTIVE_COLLECTION(id) {
        this.state.activeId = id;
    }
    ADD_COLLECTION(id, name, modified, os, auto = false) {
        this.state.collections.unshift({
            id,
            name,
            modified,
            auto,
            operatingSystem: os,
            deleted: false,
            needsRename: false,
        });
    }
    SET_NEEDS_RENAME(id) {
        const coll = this.state.collections.find(coll => coll.id === id);
        if (coll)
            coll.needsRename = true;
    }
    SET_OPERATING_SYSTEM(id, os) {
        const coll = this.state.collections.find(coll => coll.id === id);
        if (coll)
            Vue.set(coll, 'operatingSystem', os);
    }
    SET_MODIFIED(id, modified) {
        const coll = this.state.collections.find(coll => coll.id === id);
        if (coll)
            coll.modified = modified;
    }
    SET_SERVER_ID(id, serverId) {
        const coll = this.state.collections.find(coll => coll.id === id);
        if (coll)
            coll.serverId = serverId;
    }
    RENAME_COLLECTION(id, name, modified) {
        const coll = this.state.collections.find(coll => coll.id === id);
        if (coll) {
            coll.name = name;
            coll.modified = modified;
            coll.needsRename = false;
        }
    }
    DELETE_COLLECTION(id) {
        const coll = this.state.collections.find(coll => coll.id === id);
        if (coll)
            coll.deleted = true;
    }
    HARD_DELETE_COLLECTION(id) {
        this.state.collections = this.state.collections.filter(coll => coll.id !== id);
    }
    LOAD_STATE(state) {
        Object.keys(state).forEach(key => {
            Vue.set(this.state, key, state[key]);
        });
    }
    INIT_NODE_MAPS(sceneNodeMap) {
        const activeId = this.state.activeId;
        const coll = this.state.collections.find(coll => coll.id === activeId);
        if (!coll)
            return;
        coll.sceneNodeMaps = sceneNodeMap !== null && sceneNodeMap !== void 0 ? sceneNodeMap : {};
    }
    CREATE_NODE_MAP_ENTRY(sceneId, horizontalNodeId, verticalNodeId) {
        const activeId = this.state.activeId;
        const coll = this.state.collections.find(coll => coll.id === activeId);
        if (!coll)
            return;
        if (!coll.sceneNodeMaps)
            coll.sceneNodeMaps = {};
        if (!coll.sceneNodeMaps[sceneId])
            coll.sceneNodeMaps[sceneId] = {};
        coll.sceneNodeMaps[sceneId] = Object.assign(Object.assign({}, coll.sceneNodeMaps[sceneId]), { [horizontalNodeId]: verticalNodeId });
    }
    REMOVE_NODE_MAP_ENTRY(horizontalNodeId, sceneId) {
        const activeId = this.state.activeId;
        const coll = this.state.collections.find(coll => coll.id === activeId);
        if (!coll || !coll.sceneNodeMaps || !coll.sceneNodeMaps[sceneId])
            return;
        const nodeMap = coll.sceneNodeMaps[sceneId];
        delete nodeMap[horizontalNodeId];
        coll.sceneNodeMaps[sceneId] = Object.assign({}, nodeMap);
    }
    REMOVE_NODE_MAP(sceneId) {
        const activeId = this.state.activeId;
        const coll = this.state.collections.find(coll => coll.id === activeId);
        if (!coll || !coll.sceneNodeMaps || !coll.sceneNodeMaps[sceneId])
            return;
        const nodeMaps = coll.sceneNodeMaps;
        delete nodeMaps[sceneId];
        coll.sceneNodeMaps = Object.assign({}, nodeMaps);
    }
}
SceneCollectionsStateService.initialState = {
    activeId: null,
    collections: [],
};
__decorate([
    Inject()
], SceneCollectionsStateService.prototype, "fileManagerService", void 0);
__decorate([
    Inject()
], SceneCollectionsStateService.prototype, "appService", void 0);
__decorate([
    mutation()
], SceneCollectionsStateService.prototype, "SET_ACTIVE_COLLECTION", null);
__decorate([
    mutation()
], SceneCollectionsStateService.prototype, "ADD_COLLECTION", null);
__decorate([
    mutation()
], SceneCollectionsStateService.prototype, "SET_NEEDS_RENAME", null);
__decorate([
    mutation()
], SceneCollectionsStateService.prototype, "SET_OPERATING_SYSTEM", null);
__decorate([
    mutation()
], SceneCollectionsStateService.prototype, "SET_MODIFIED", null);
__decorate([
    mutation()
], SceneCollectionsStateService.prototype, "SET_SERVER_ID", null);
__decorate([
    mutation()
], SceneCollectionsStateService.prototype, "RENAME_COLLECTION", null);
__decorate([
    mutation()
], SceneCollectionsStateService.prototype, "DELETE_COLLECTION", null);
__decorate([
    mutation()
], SceneCollectionsStateService.prototype, "HARD_DELETE_COLLECTION", null);
__decorate([
    mutation()
], SceneCollectionsStateService.prototype, "LOAD_STATE", null);
__decorate([
    mutation()
], SceneCollectionsStateService.prototype, "INIT_NODE_MAPS", null);
__decorate([
    mutation()
], SceneCollectionsStateService.prototype, "CREATE_NODE_MAP_ENTRY", null);
__decorate([
    mutation()
], SceneCollectionsStateService.prototype, "REMOVE_NODE_MAP_ENTRY", null);
__decorate([
    mutation()
], SceneCollectionsStateService.prototype, "REMOVE_NODE_MAP", null);
//# sourceMappingURL=state.js.map