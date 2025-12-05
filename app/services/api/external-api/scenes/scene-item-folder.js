var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { InjectFromExternalApi, Fallback } from 'services/api/external-api';
import { SceneNode } from './scene-node';
import Utils from '../../../utils';
import { ServiceHelper } from '../../../core';
let SceneItemFolder = class SceneItemFolder extends SceneNode {
    constructor(sceneId, nodeId) {
        super(sceneId, nodeId);
        this.sceneId = sceneId;
        this.nodeId = nodeId;
        this.sceneFolder = this.internalScenesService.views.getScene(sceneId).getFolder(this.nodeId);
        Utils.applyProxy(this, () => this.getModel());
    }
    getModel() {
        return Object.assign(Object.assign({}, super.getModel()), { name: this.sceneFolder.name, childrenIds: this.sceneNode.childrenIds });
    }
    getNodes() {
        const scene = this.getScene();
        return this.sceneFolder.getNodes().map(node => scene.getNode(node.id));
    }
    getItems() {
        const scene = this.getScene();
        return this.sceneFolder.getItems().map(item => scene.getItem(item.id));
    }
    getFolders() {
        const scene = this.getScene();
        return this.sceneFolder.getFolders().map(folder => scene.getFolder(folder.id));
    }
    getNestedNodes() {
        const scene = this.getScene();
        return this.sceneFolder.getNestedNodes().map(node => scene.getNode(node.id));
    }
    setName(newName) {
        return this.sceneFolder.setName(newName);
    }
    add(sceneNodeId) {
        return this.sceneFolder.add(sceneNodeId);
    }
    ungroup() {
        return this.sceneFolder.ungroup();
    }
    getSelection() {
        return this.getScene().getSelection(this.sceneFolder.getSelection().getIds());
    }
};
__decorate([
    Fallback()
], SceneItemFolder.prototype, "sceneFolder", void 0);
__decorate([
    InjectFromExternalApi()
], SceneItemFolder.prototype, "sourcesService", void 0);
SceneItemFolder = __decorate([
    ServiceHelper('ScenesService')
], SceneItemFolder);
export { SceneItemFolder };
//# sourceMappingURL=scene-item-folder.js.map