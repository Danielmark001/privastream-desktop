var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ServiceHelper, Inject } from 'services';
import { InjectFromExternalApi, Fallback } from 'services/api/external-api';
import { Selection } from './selection';
import { SceneItem } from './scene-item';
import { SceneItemFolder } from './scene-item-folder';
import Utils from '../../../utils';
let Scene = class Scene {
    constructor(sceneId) {
        this.sceneId = sceneId;
        this.scene = this.internalScenesService.views.getScene(sceneId);
        Utils.applyProxy(this, () => this.getModel());
    }
    isDestroyed() {
        return this.scene.isDestroyed();
    }
    getModel() {
        return {
            id: this.scene.id,
            name: this.scene.name,
            nodes: this.getNodes().map(node => node.getModel()),
        };
    }
    getNode(sceneNodeId) {
        const node = this.scene.getNode(sceneNodeId);
        if (!node)
            return null;
        return node.sceneNodeType === 'folder'
            ? this.getFolder(sceneNodeId)
            : this.getItem(sceneNodeId);
    }
    getNodeByName(name) {
        const node = this.scene.getNodeByName(name);
        return node ? this.getNode(node.id) : null;
    }
    getItem(sceneItemId) {
        const item = this.scene.getItem(sceneItemId);
        if (!item)
            return null;
        return item ? new SceneItem(item.sceneId, item.id, item.sourceId) : null;
    }
    getFolder(sceneFolderId) {
        const folder = this.scene.getFolder(sceneFolderId);
        if (!folder)
            return null;
        return folder ? new SceneItemFolder(folder.sceneId, folder.id) : null;
    }
    getNodes() {
        return this.scene.getNodes().map(node => this.getNode(node.id));
    }
    getRootNodes() {
        return this.scene.getRootNodes().map(node => this.getNode(node.id));
    }
    getItems() {
        return this.scene.getItems().map(item => this.getItem(item.id));
    }
    getFolders() {
        return this.scene.getFolders().map(folder => this.getFolder(folder.id));
    }
    getNestedItems() {
        return this.scene
            .getNestedItems()
            .map(item => this.scenesService.getScene(item.sceneId).getItem(item.id));
    }
    getNestedSources() {
        return this.scene
            .getNestedSources()
            .map(source => this.sourcesService.getSource(source.sourceId));
    }
    getNestedScenes() {
        return this.scene.getNestedScenes().map(scene => this.scenesService.getScene(scene.id));
    }
    getSource() {
        return this.sourcesService.getSource(this.scene.id);
    }
    addSource(sourceId, options) {
        const newItem = this.scene.addSource(sourceId, options);
        return newItem ? this.getItem(newItem.sceneItemId) : null;
    }
    createAndAddSource(name, type, settings) {
        const newItem = this.scene.createAndAddSource(name, type, settings);
        return newItem ? this.getItem(newItem.sceneItemId) : null;
    }
    createFolder(name) {
        return this.getFolder(this.scene.createFolder(name).id);
    }
    addFile(path, folderId) {
        const newNode = this.scene.addFile(path, folderId);
        return newNode ? this.getNode(newNode.id) : null;
    }
    clear() {
        return this.scene.clear();
    }
    removeFolder(folderId) {
        return this.scene.removeFolder(folderId);
    }
    removeItem(sceneItemId) {
        return this.scene.removeItem(sceneItemId);
    }
    remove() {
        this.scene.remove();
    }
    canAddSource(sourceId) {
        return this.scene.canAddSource(sourceId);
    }
    setName(newName) {
        return this.scene.setName(newName);
    }
    makeActive() {
        return this.scene.makeActive();
    }
    getSelection(ids) {
        return new Selection(this.sceneId, ids);
    }
};
__decorate([
    InjectFromExternalApi()
], Scene.prototype, "scenesService", void 0);
__decorate([
    InjectFromExternalApi()
], Scene.prototype, "sourcesService", void 0);
__decorate([
    Inject('ScenesService')
], Scene.prototype, "internalScenesService", void 0);
__decorate([
    Fallback()
], Scene.prototype, "scene", void 0);
Scene = __decorate([
    ServiceHelper('ScenesService')
], Scene);
export { Scene };
//# sourceMappingURL=scene.js.map