var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Inject } from 'services/core/injector';
import { InjectFromExternalApi, Fallback } from 'services/api/external-api';
export class SceneNode {
    constructor(sceneId, nodeId) {
        this.sceneId = sceneId;
        this.nodeId = nodeId;
        this.scene = this.internalScenesService.views.getScene(sceneId);
        this.sceneNode = this.scene.getNode(this.nodeId);
    }
    isDestroyed() {
        return this.sceneNode.isDestroyed();
    }
    getModel() {
        return getExternalNodeModel(this.sceneNode);
    }
    getScene() {
        return this.scenesService.getScene(this.sceneId);
    }
    getParent() {
        return this.getScene().getFolder(this.sceneNode.parentId);
    }
    setParent(parentId) {
        this.sceneNode.setParent(parentId);
    }
    hasParent() {
        return this.sceneNode.hasParent();
    }
    detachParent() {
        return this.sceneNode.detachParent();
    }
    placeBefore(nodeId) {
        return this.sceneNode.placeBefore(nodeId);
    }
    placeAfter(nodeId) {
        return this.sceneNode.placeAfter(nodeId);
    }
    isItem() {
        return this.sceneNode.isItem();
    }
    isFolder() {
        return this.sceneNode.isFolder();
    }
    remove() {
        return this.sceneNode.remove();
    }
    isSelected() {
        return this.sceneNode.isSelected();
    }
    select() {
        return this.sceneNode.select();
    }
    addToSelection() {
        return this.sceneNode.addToSelection();
    }
    deselect() {
        return this.sceneNode.deselect();
    }
    getNodeIndex() {
        return this.sceneNode.getNodeIndex();
    }
    getItemIndex() {
        return this.sceneNode.getNodeIndex();
    }
    getPrevNode() {
        const node = this.sceneNode.getPrevNode();
        return this.getScene().getNode(node.id);
    }
    getNextNode() {
        const node = this.sceneNode.getNextNode();
        return this.getScene().getNode(node.id);
    }
    getNextItem() {
        const item = this.sceneNode.getNextItem();
        return this.getScene().getItem(item.id);
    }
    getPrevItem() {
        const item = this.sceneNode.getPrevItem();
        return this.getScene().getItem(item.id);
    }
    getPath() {
        return this.sceneNode.getPath();
    }
}
__decorate([
    Inject('ScenesService')
], SceneNode.prototype, "internalScenesService", void 0);
__decorate([
    InjectFromExternalApi()
], SceneNode.prototype, "scenesService", void 0);
__decorate([
    Fallback()
], SceneNode.prototype, "sceneNode", void 0);
export function getExternalNodeModel(internalModel) {
    return {
        id: internalModel.id,
        sceneId: internalModel.sceneId,
        sceneNodeType: internalModel.sceneNodeType,
        parentId: internalModel.parentId,
    };
}
//# sourceMappingURL=scene-node.js.map