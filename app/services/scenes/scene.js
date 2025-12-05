var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ServiceHelper, mutation, Inject } from 'services';
import { SceneItem, SceneItemFolder, } from './index';
import Utils from 'services/utils';
import * as obs from '../../../obs-api';
import { Selection } from 'services/selection';
import uniqBy from 'lodash/uniqBy';
import * as fs from 'fs';
import * as path from 'path';
import uuid from 'uuid/v4';
import { assertIsDefined } from 'util/properties-type-guards';
let Scene = class Scene {
    constructor(sceneId) {
        if (!sceneId)
            console.trace('undefined scene id');
        this.state = this.scenesService.state.scenes[sceneId];
        assertIsDefined(this.state);
        Utils.applyProxy(this, this.state);
    }
    isDestroyed() {
        return !this.scenesService.state.scenes[this.id];
    }
    isActive() {
        return this.scenesService.views.activeSceneId === this.id;
    }
    get items() {
        return this.nodes.filter(node => node.sceneNodeType === 'item');
    }
    getModel() {
        return this.state;
    }
    getObsScene() {
        return obs.SceneFactory.fromName(this.id);
    }
    getNode(sceneNodeId) {
        const nodeModel = this.state.nodes.find(sceneItemModel => sceneItemModel && sceneItemModel.id === sceneNodeId);
        if (!nodeModel)
            return null;
        return nodeModel.sceneNodeType === 'item'
            ? new SceneItem(this.id, nodeModel.id, nodeModel.sourceId)
            : new SceneItemFolder(this.id, nodeModel.id);
    }
    getItem(sceneItemId) {
        const node = this.getNode(sceneItemId);
        return node && node.isItem() ? node : null;
    }
    getFolder(sceneFolderId) {
        const node = this.getNode(sceneFolderId);
        return node && node.isFolder() ? node : null;
    }
    getNodeByName(name) {
        return this.getNodes().find(node => node && node.name === name) || null;
    }
    getItems() {
        return this.state.nodes
            .filter(node => node.sceneNodeType === 'item')
            .map(item => this.getItem(item.id));
    }
    getFolders() {
        return this.state.nodes
            .filter(node => node.sceneNodeType === 'folder')
            .map(item => this.getFolder(item.id));
    }
    getNodes() {
        return this.state.nodes.map(node => {
            return node.sceneNodeType === 'folder' ? this.getFolder(node.id) : this.getItem(node.id);
        });
    }
    getRootNodes() {
        return this.getNodes().filter(node => !node.parentId);
    }
    getRootNodesIds() {
        return this.getRootNodes().map(node => node.id);
    }
    getNodesIds() {
        return this.state.nodes.map(item => item.id);
    }
    getSourceSelectorNodes() {
        let nodes = this.getNodes();
        const populateWithVerticalNodes = !this.dualOutputService.views.activeDisplays.horizontal &&
            this.dualOutputService.views.activeDisplays.vertical;
        nodes = nodes.filter(node => {
            if (populateWithVerticalNodes && (node === null || node === void 0 ? void 0 : node.display) === 'vertical') {
                return node;
            }
            if (!populateWithVerticalNodes && (node === null || node === void 0 ? void 0 : node.display) === 'horizontal') {
                return node;
            }
        });
        return nodes;
    }
    getSelection(itemsList) {
        return new Selection(this.id, itemsList);
    }
    getItemsForNode(sceneNodeId) {
        const node = this.state.nodes.find(n => n.id === sceneNodeId);
        if (!node)
            return [];
        if (node.sceneNodeType === 'item') {
            return [node];
        }
        const children = this.state.nodes.filter(n => n.parentId === sceneNodeId);
        let childrenItems = [];
        children.forEach(c => (childrenItems = childrenItems.concat(this.getItemsForNode(c.id))));
        return childrenItems;
    }
    getIsDualOutputScene() {
        return this.dualOutputService.views.hasNodeMap(this.id);
    }
    setName(newName) {
        const sceneSource = this.getSource();
        sceneSource.setName(newName);
        this.SET_NAME(newName);
    }
    createAndAddSource(sourceName, type, settings, options = {}) {
        const sourceAddOptions = options.sourceAddOptions || {};
        const source = this.sourcesService.createSource(sourceName, type, settings, sourceAddOptions);
        return this.addSource(source.sourceId, options);
    }
    addSource(sourceId, options = {}) {
        var _a, _b;
        const source = this.sourcesService.views.getSource(sourceId);
        if (!source)
            throw new Error(`Source ${sourceId} not found`);
        if (!this.canAddSource(sourceId)) {
            throw new Error('Can not add this source to the scene');
        }
        const sceneItemId = options.id || uuid();
        const obsSceneItem = this.getObsScene().add(source.getObsInput());
        if (source.forceHidden)
            obsSceneItem.visible = false;
        const display = (_a = options === null || options === void 0 ? void 0 : options.display) !== null && _a !== void 0 ? _a : 'horizontal';
        const context = (_b = this.videoSettingsService.contexts[display]) !== null && _b !== void 0 ? _b : this.videoSettingsService.contexts.horizontal;
        this.ADD_SOURCE_TO_SCENE(sceneItemId, source.sourceId, obsSceneItem.id, display, obsSceneItem.position);
        const sceneItem = this.getItem(sceneItemId);
        sceneItem.setSettings(Object.assign(Object.assign({}, sceneItem.getSettings()), { display, output: context }));
        if (options.select == null)
            options.select = true;
        if (options.select)
            this.selectionService.views.globalSelection.select(sceneItemId);
        if (options.initialTransform) {
            sceneItem.setTransform(options.initialTransform);
        }
        this.scenesService.itemAdded.next(sceneItem.getModel());
        return sceneItem;
    }
    addFile(addPath, folderId) {
        const fstat = fs.lstatSync(addPath);
        if (!fstat)
            return null;
        const fname = path.parse(addPath).name;
        if (fstat.isDirectory()) {
            if (this.dualOutputService.views.hasNodeMap()) {
                const horizontalFolder = this.createFolder(fname, { display: 'horizontal' });
                const verticalFolder = this.createFolder(fname, { display: 'vertical' });
                if (folderId) {
                    horizontalFolder.setParent(folderId);
                    const verticalFolderParentId = this.dualOutputService.views.getVerticalNodeId(folderId);
                    if (verticalFolderParentId)
                        verticalFolder.setParent(verticalFolderParentId);
                }
                this.sceneCollectionsService.createNodeMapEntry(this.id, horizontalFolder.id, verticalFolder.id);
                const files = fs.readdirSync(addPath).reverse();
                files.forEach(filePath => {
                    this.addFile(path.join(addPath, filePath), horizontalFolder.id);
                    this.addFile(path.join(addPath, filePath), verticalFolder.id);
                });
                return horizontalFolder;
            }
            else {
                const folder = this.createFolder(fname);
                if (folderId)
                    folder.setParent(folderId);
                const files = fs.readdirSync(addPath).reverse();
                files.forEach(filePath => this.addFile(path.join(addPath, filePath), folder.id));
                return folder;
            }
        }
        const source = this.sourcesService.addFile(addPath);
        if (!source)
            return null;
        const item = this.addSource(source.sourceId, { display: 'horizontal' });
        if (folderId) {
            item.setParent(folderId);
        }
        if (this.dualOutputService.views.hasNodeMap()) {
            Promise.resolve(this.dualOutputService.actions.return.createOrAssignOutputNode(item, 'vertical', false, this.id)).then(node => {
                if (folderId) {
                    const verticalFolderId = this.dualOutputService.views.getVerticalNodeId(folderId);
                    if (node && verticalFolderId)
                        node.setParent(verticalFolderId);
                }
                return node;
            });
        }
        return item;
    }
    createFolder(name, options = {}) {
        var _a;
        const id = options.id || uuid();
        this.ADD_FOLDER_TO_SCENE({
            id,
            name,
            sceneNodeType: 'folder',
            sceneId: this.id,
            parentId: '',
            display: (_a = options === null || options === void 0 ? void 0 : options.display) !== null && _a !== void 0 ? _a : 'horizontal',
        });
        return this.getFolder(id);
    }
    removeFolder(folderId) {
        const sceneFolder = this.getFolder(folderId);
        if (!sceneFolder)
            return;
        if (sceneFolder.isSelected())
            sceneFolder.deselect();
        sceneFolder.getSelection().remove();
        sceneFolder.detachParent();
        this.REMOVE_NODE_FROM_SCENE(folderId);
    }
    remove(force) {
        return this.scenesService.removeScene(this.id, force);
    }
    removeItem(sceneItemId) {
        const sceneItem = this.getItem(sceneItemId);
        if (!sceneItem)
            return;
        const sceneItemModel = sceneItem.getModel();
        if (sceneItem.isSelected())
            sceneItem.deselect();
        sceneItem.detachParent();
        sceneItem.getObsSceneItem().remove();
        this.REMOVE_NODE_FROM_SCENE(sceneItemId);
        this.scenesService.itemRemoved.next(sceneItemModel);
    }
    clear() {
        this.getSelection().selectAll().remove();
    }
    setLockOnAllItems(locked) {
        this.getItems().forEach(item => item.setSettings({ locked }));
    }
    placeAfter(sourceNodeId, destNodeId) {
        const sourceNode = this.getNode(sourceNodeId);
        if (!sourceNode)
            return;
        const destNode = destNodeId && this.getNode(destNodeId);
        if (destNode && destNode.id === sourceNode.id)
            return;
        const destNodeIsParentForSourceNode = destNode && destNode.id === sourceNode.parentId;
        let destFolderId = '';
        if (destNode) {
            if (destNode.isItem()) {
                destFolderId = destNode.parentId;
            }
            else {
                if (destNode.id === sourceNode.parentId) {
                    destFolderId = destNode.id;
                }
                else {
                    destFolderId = destNode.parentId;
                }
            }
        }
        if (sourceNode.parentId !== destFolderId) {
            this.SET_PARENT(sourceNode.id, destFolderId);
        }
        const sceneNodesIds = this.getNodesIds();
        const nodesToMoveIds = sourceNode.sceneNodeType === 'folder'
            ? [sourceNode.id].concat(sourceNode.getNestedNodesIds())
            : [sourceNode.id];
        const firstNodeIndex = this.getNode(nodesToMoveIds[0]).getNodeIndex();
        let newNodeIndex = 0;
        if (destNode) {
            const destNodeIndex = destNode.getNodeIndex();
            newNodeIndex =
                destNode.isFolder() && !destNodeIsParentForSourceNode
                    ? destNodeIndex + destNode.getNestedNodes().length + 1
                    : destNodeIndex + 1;
            if (destNodeIndex > firstNodeIndex) {
                newNodeIndex -= nodesToMoveIds.length;
            }
        }
        sceneNodesIds.splice(firstNodeIndex, nodesToMoveIds.length);
        sceneNodesIds.splice(newNodeIndex, 0, ...nodesToMoveIds);
        this.SET_NODES_ORDER(sceneNodesIds);
        this.reconcileNodeOrderWithObs();
    }
    setNodesOrder(order) {
        this.SET_NODES_ORDER(order);
        this.reconcileNodeOrderWithObs();
    }
    reconcileNodeOrderWithObs() {
        this.getItems().forEach((item, index) => {
            const currentIndex = this.getObsScene()
                .getItems()
                .reverse()
                .findIndex(obsItem => obsItem.id === item.obsSceneItemId);
            this.getObsScene().moveItem(currentIndex, index);
        });
    }
    placeBefore(sourceNodeId, destNodeId) {
        const destNode = this.getNode(destNodeId);
        if (!destNode)
            return;
        const newDestNode = destNode.getPrevSiblingNode();
        if (newDestNode) {
            this.placeAfter(sourceNodeId, newDestNode.id);
        }
        else if (destNode.parentId) {
            const sourceNode = this.getNode(sourceNodeId);
            assertIsDefined(sourceNode);
            this.SET_PARENT(sourceNode.id, destNode.parentId);
        }
        else {
            this.placeAfter(sourceNodeId);
        }
    }
    addSources(nodes) {
        const arrayItems = [];
        nodes = nodes.filter(sceneNode => {
            if (sceneNode.sceneNodeType === 'folder')
                return true;
            const source = this.sourcesService.views.getSource(sceneNode.sourceId);
            if (!source)
                return false;
            arrayItems.push({
                name: source.sourceId,
                id: sceneNode.id,
                sourceId: source.sourceId,
                crop: sceneNode.crop,
                scaleX: sceneNode.scaleX == null ? 1 : sceneNode.scaleX,
                scaleY: sceneNode.scaleY == null ? 1 : sceneNode.scaleY,
                visible: sceneNode.visible,
                x: sceneNode.x == null ? 0 : sceneNode.x,
                y: sceneNode.y == null ? 0 : sceneNode.y,
                locked: sceneNode.locked,
                rotation: sceneNode.rotation || 0,
                streamVisible: sceneNode.streamVisible,
                recordingVisible: sceneNode.recordingVisible,
                scaleFilter: sceneNode.scaleFilter,
                blendingMode: sceneNode.blendingMode,
                blendingMethod: sceneNode.blendingMethod,
                display: sceneNode.display,
            });
            return true;
        });
        const obsSceneItems = obs.addItems(this.getObsScene(), arrayItems);
        let itemIndex = 0;
        nodes.forEach(nodeModel => {
            var _a;
            const display = (_a = nodeModel === null || nodeModel === void 0 ? void 0 : nodeModel.display) !== null && _a !== void 0 ? _a : 'horizontal';
            const obsSceneItem = obsSceneItems[itemIndex];
            if (nodeModel.sceneNodeType === 'folder') {
                this.createFolder(nodeModel.name, { id: nodeModel.id, display });
            }
            else {
                this.ADD_SOURCE_TO_SCENE(nodeModel.id, nodeModel.sourceId, obsSceneItem.id, display, obsSceneItem.position);
                const item = this.getItem(nodeModel.id);
                item.loadItemAttributes(nodeModel);
                itemIndex++;
            }
        });
        nodes.reverse().forEach(nodeModel => {
            if (nodeModel.sceneNodeType !== 'folder')
                return;
            this.getSelection(nodeModel.childrenIds).moveTo(this.id, nodeModel.id);
        });
    }
    canAddSource(sourceId) {
        const source = this.sourcesService.views.getSource(sourceId);
        if (!source)
            return false;
        if (source.type !== 'scene')
            return true;
        if (this.id === source.sourceId)
            return false;
        const sceneToAdd = this.scenesService.views.getScene(source.sourceId);
        if (!sceneToAdd)
            return false;
        return !sceneToAdd.hasNestedScene(this.id);
    }
    hasNestedScene(sceneId) {
        const childScenes = this.getItems()
            .filter(sceneItem => sceneItem.type === 'scene')
            .map(sceneItem => this.scenesService.views.getScene(sceneItem.sourceId));
        for (const childScene of childScenes) {
            if (childScene.id === sceneId)
                return true;
            if (childScene.hasNestedScene(sceneId))
                return true;
        }
        return false;
    }
    getNestedItems(options = { excludeScenes: false }) {
        let result = this.getItems();
        result
            .filter(sceneItem => sceneItem.type === 'scene')
            .map(sceneItem => {
            return this.scenesService.views.getScene(sceneItem.sourceId).getNestedItems();
        })
            .forEach(sceneItems => {
            result = result.concat(sceneItems);
        });
        if (options.excludeScenes)
            result = result.filter(sceneItem => sceneItem.type !== 'scene');
        return uniqBy(result, 'sceneItemId');
    }
    makeActive() {
        this.scenesService.makeSceneActive(this.id);
    }
    getNestedSources(options = { excludeScenes: false }) {
        const sources = this.getNestedItems(options).map(sceneItem => sceneItem.getSource());
        return uniqBy(sources, 'sourceId');
    }
    getNestedScenes() {
        const scenes = this.getNestedSources()
            .filter(source => source.type === 'scene')
            .map(sceneSource => this.scenesService.views.getScene(sceneSource.sourceId));
        const resultScenes = [];
        scenes.forEach(scene => {
            resultScenes.push(...scene.getNestedScenes());
            if (!resultScenes.find(foundScene => foundScene.id === scene.id)) {
                resultScenes.push(scene);
            }
        });
        return resultScenes;
    }
    getSource() {
        const source = this.sourcesService.views.getSource(this.id);
        assertIsDefined(source);
        return source;
    }
    getResourceId() {
        return this._resourceId;
    }
    SET_NAME(newName) {
        this.state.name = newName;
    }
    ADD_SOURCE_TO_SCENE(sceneItemId, sourceId, obsSceneItemId, display, position) {
        this.state.nodes.unshift({
            sceneItemId,
            sourceId,
            obsSceneItemId,
            id: sceneItemId,
            parentId: '',
            sceneNodeType: 'item',
            sceneId: this.state.id,
            transform: {
                position: { x: 0, y: 0 },
                scale: { x: 1.0, y: 1.0 },
                crop: {
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                },
                rotation: 0,
            },
            visible: true,
            locked: false,
            streamVisible: true,
            recordingVisible: true,
            scaleFilter: 0,
            blendingMode: 0,
            blendingMethod: 0,
            display,
            position,
        });
    }
    ADD_FOLDER_TO_SCENE(folderModel) {
        this.state.nodes.unshift(folderModel);
    }
    REMOVE_NODE_FROM_SCENE(nodeId) {
        const item = this.state.nodes.find(item => item.id === nodeId);
        item.isRemoved = true;
        this.state.nodes = this.state.nodes.filter(item => {
            return item.id !== nodeId;
        });
    }
    SET_NODES_ORDER(order) {
        this.state.nodes = order.map(id => {
            return this.state.nodes.find(item => {
                return item.id === id;
            });
        });
    }
    SET_PARENT(childNodeId, parentFolderId) {
        if (childNodeId === parentFolderId) {
            throw new Error('The parent id should not be equal the child id');
        }
        const childNodeState = this.state.nodes.find(node => node.id === childNodeId);
        assertIsDefined(childNodeState);
        childNodeState.parentId = parentFolderId;
    }
};
__decorate([
    Inject()
], Scene.prototype, "scenesService", void 0);
__decorate([
    Inject()
], Scene.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], Scene.prototype, "selectionService", void 0);
__decorate([
    Inject()
], Scene.prototype, "videoSettingsService", void 0);
__decorate([
    Inject()
], Scene.prototype, "dualOutputService", void 0);
__decorate([
    Inject()
], Scene.prototype, "sceneCollectionsService", void 0);
__decorate([
    mutation()
], Scene.prototype, "SET_NAME", null);
__decorate([
    mutation()
], Scene.prototype, "ADD_SOURCE_TO_SCENE", null);
__decorate([
    mutation()
], Scene.prototype, "ADD_FOLDER_TO_SCENE", null);
__decorate([
    mutation()
], Scene.prototype, "REMOVE_NODE_FROM_SCENE", null);
__decorate([
    mutation()
], Scene.prototype, "SET_NODES_ORDER", null);
__decorate([
    mutation()
], Scene.prototype, "SET_PARENT", null);
Scene = __decorate([
    ServiceHelper('ScenesService')
], Scene);
export { Scene };
//# sourceMappingURL=scene.js.map