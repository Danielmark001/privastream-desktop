var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { mutation, Inject } from 'services';
import { assertIsDefined } from 'util/properties-type-guards';
export function isFolder(node) {
    return node.sceneNodeType === 'folder';
}
export function isItem(node) {
    return node.sceneNodeType === 'item';
}
export class SceneItemNode {
    constructor() {
        this.display = 'horizontal';
    }
    isDestroyed() {
        return !!this.state.isRemoved;
    }
    getScene() {
        const scene = this.scenesService.views.getScene(this.sceneId);
        assertIsDefined(scene);
        return scene;
    }
    get childrenIds() {
        return this.getScene()
            .getModel()
            .nodes.filter(node => node.parentId === this.id && node.id !== this.id)
            .map(node => node.id);
    }
    setParent(parentId) {
        if (this.isFolder() && this.getNestedNodesIds().indexOf(parentId) !== -1) {
            return;
        }
        this.SET_PARENT(parentId);
        this.placeAfter(parentId);
    }
    detachParent() {
        if (this.parentId)
            this.SET_PARENT('');
    }
    getParent() {
        return this.getScene().getFolder(this.parentId);
    }
    hasParent() {
        return !!this.state.parentId;
    }
    getNodeIndex() {
        return this.getScene().getNodesIds().indexOf(this.id);
    }
    placeAfter(nodeId) {
        this.getScene().placeAfter(this.id, nodeId);
    }
    placeBefore(nodeId) {
        this.getScene().placeBefore(this.id, nodeId);
    }
    getPrevNode() {
        const nodeInd = this.getNodeIndex();
        return this.getScene().getNodes()[nodeInd - 1];
    }
    getNextNode() {
        const nodeInd = this.getNodeIndex();
        return this.getScene().getNodes()[nodeInd + 1];
    }
    getPrevSiblingNode() {
        const parent = this.getParent();
        const siblingsIds = parent ? parent.getNestedNodesIds() : this.getScene().getRootNodesIds();
        const childInd = siblingsIds.indexOf(this.id);
        if (childInd !== 0)
            return this.getScene().getNode(siblingsIds[childInd - 1]);
        return null;
    }
    getNextSiblingNode() {
        const parent = this.getParent();
        const siblingsIds = parent ? parent.getNestedNodesIds() : this.getScene().getRootNodesIds();
        const childInd = siblingsIds.indexOf(this.id);
        if (childInd !== 0)
            return this.getScene().getNode(siblingsIds[childInd + 1]);
        return null;
    }
    getPrevItem() {
        let nodeInd = this.getNodeIndex();
        const nodes = this.getScene().getNodes();
        while (nodeInd--) {
            const node = nodes[nodeInd];
            if (!node)
                return null;
            if (node.isItem())
                return node;
        }
        return null;
    }
    getNextItem() {
        let nodeInd = this.getNodeIndex();
        const nodes = this.getScene().getNodes();
        while (nodeInd++) {
            const node = nodes[nodeInd];
            if (!node)
                return null;
            if (node.isItem())
                return node;
        }
        return null;
    }
    getPath() {
        const parent = this.getParent();
        return parent ? parent.getPath().concat([this.id]) : [this.id];
    }
    isSelected() {
        return this.selectionService.views.globalSelection.isSelected(this.id);
    }
    select(sync = false) {
        this.selectionService.views.globalSelection.select(this.id, sync);
    }
    addToSelection() {
        this.selectionService.views.globalSelection.add(this.id);
    }
    deselect() {
        this.selectionService.views.globalSelection.deselect(this.id);
    }
    isFolder() {
        return isFolder(this);
    }
    isItem() {
        return isItem(this);
    }
    getResourceId() {
        return this._resourceId;
    }
    SET_PARENT(parentId) {
        if (parentId && this.state.id === parentId) {
            throw new Error('The parent id should not be equal the child id');
        }
        this.state.parentId = parentId;
    }
    MARK_AS_DESTROYED() {
        this.state.isRemoved = false;
    }
}
__decorate([
    Inject()
], SceneItemNode.prototype, "scenesService", void 0);
__decorate([
    Inject()
], SceneItemNode.prototype, "selectionService", void 0);
__decorate([
    mutation()
], SceneItemNode.prototype, "SET_PARENT", null);
__decorate([
    mutation()
], SceneItemNode.prototype, "MARK_AS_DESTROYED", null);
//# sourceMappingURL=scene-node.js.map