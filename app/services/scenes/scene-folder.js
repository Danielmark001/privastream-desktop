var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import merge from 'lodash/merge';
import { mutation, Inject } from 'services';
import Utils from '../utils';
import { isFolder, isItem } from 'services/scenes';
import { SceneItemNode } from './scene-node';
import { ServiceHelper } from 'services/core';
import compact from 'lodash/compact';
import { assertIsDefined } from '../../util/properties-type-guards';
let SceneItemFolder = class SceneItemFolder extends SceneItemNode {
    constructor(sceneId, id) {
        super();
        this.sceneNodeType = 'folder';
        this.id = id;
        const state = this.scenesService.state.scenes[sceneId].nodes.find(item => {
            return item.id === id;
        });
        assertIsDefined(state);
        Utils.applyProxy(this, state);
        this.state = state;
    }
    add(sceneNodeId) {
        const node = this.getScene().getNode(sceneNodeId);
        if (!node) {
            throw new Error(`Can not add a non-existing ${sceneNodeId} item to the folder ${this.name}:{${this.id}`);
        }
        node.setParent(this.id);
    }
    ungroup() {
        this.getNodes()
            .reverse()
            .forEach(item => item.setParent(this.parentId));
        this.remove();
    }
    getSelection() {
        return this.getScene().getSelection(this.childrenIds);
    }
    getNodes() {
        const scene = this.getScene();
        return compact(this.childrenIds.map(nodeId => scene.getNode(nodeId)));
    }
    getItems() {
        return this.getNodes().filter(isItem);
    }
    getFolders() {
        return this.getNodes().filter(isFolder);
    }
    getScene() {
        const scene = this.scenesService.views.getScene(this.sceneId);
        assertIsDefined(scene);
        return scene;
    }
    getItemIndex() {
        const nodeInd = this.getNodeIndex();
        if (nodeInd === 0)
            return 0;
        return this.getPrevNode().getItemIndex();
    }
    getHierarchy() {
        const nodes = this.getNodes();
        return nodes.map(node => {
            return Object.assign(Object.assign({}, node.getModel()), { children: node.isFolder() ? node.getHierarchy() : [] });
        });
    }
    getNestedNodes(traversedNodesIds = []) {
        traversedNodesIds = Object.assign([], traversedNodesIds);
        const nodes = [];
        this.getNodes().forEach(node => {
            if (traversedNodesIds.includes(node.id)) {
                console.warn(`Loop in folders structure detected', ${this.name} -> ${node.name}`);
                return;
            }
            nodes.push(node);
            traversedNodesIds.push(node.id);
            if (!node.isFolder())
                return;
            nodes.push(...node.getNestedNodes(traversedNodesIds));
        });
        return nodes;
    }
    getNestedItems() {
        return this.getNestedNodes().filter(isItem);
    }
    getNestedFolders() {
        return this.getNestedNodes().filter(isFolder);
    }
    getNestedNodesIds() {
        return this.getNestedNodes().map(node => node.id);
    }
    getNestedItemsIds() {
        return this.getNestedItems().map(item => item.id);
    }
    getNestedFoldersIds() {
        return this.getNestedFolders().map(folder => folder.id);
    }
    setName(name) {
        this.UPDATE({ name, id: this.id });
    }
    setDisplay(display) {
        this.UPDATE({ display, id: this.id });
    }
    remove() {
        this.getScene().removeFolder(this.id);
    }
    getModel() {
        return this.state;
    }
    UPDATE(patch) {
        merge(this.state, patch);
    }
};
__decorate([
    Inject()
], SceneItemFolder.prototype, "scenesService", void 0);
__decorate([
    Inject()
], SceneItemFolder.prototype, "selectionService", void 0);
__decorate([
    mutation()
], SceneItemFolder.prototype, "UPDATE", null);
SceneItemFolder = __decorate([
    ServiceHelper('ScenesService')
], SceneItemFolder);
export { SceneItemFolder };
//# sourceMappingURL=scene-folder.js.map