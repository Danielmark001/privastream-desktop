var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import uniq from 'lodash/uniq';
import { ServiceHelper, Inject } from 'services';
import { Rect } from 'util/rect';
import { AnchorPoint, AnchorPositions, CenteringAxis } from 'util/ScalableRectangle';
let Selection = class Selection {
    get state() {
        return this._state;
    }
    get sceneId() {
        return this._sceneId;
    }
    constructor(_sceneId, itemsList = []) {
        this._sceneId = _sceneId;
        this.isFrozen = false;
        this._state = {
            selectedIds: [],
            lastSelectedId: '',
        };
        if (_sceneId && itemsList)
            this.select(itemsList);
    }
    isDestroyed() {
        return false;
    }
    getScene() {
        return this.scenesService.views.getScene(this.sceneId);
    }
    add(itemsList) {
        const ids = this.resolveItemsList(itemsList);
        this.select(this.state.selectedIds.concat(ids));
        return this;
    }
    freeze() {
        this.isFrozen = true;
    }
    select(itemsList) {
        if (this.isFrozen) {
            throw new Error('Attempted to modify frozen selection');
        }
        let ids = this.resolveItemsList(itemsList);
        ids = uniq(ids);
        const scene = this.getScene();
        const selectedIds = [];
        ids.forEach(id => {
            const node = scene.getNode(id);
            if (!node)
                return;
            selectedIds.push(id);
            if (node.sceneNodeType !== 'folder')
                return;
            selectedIds.push(...node.getNestedNodesIds());
        });
        this.setState({ selectedIds });
        if (!this.state.selectedIds.includes(this.state.lastSelectedId)) {
            this.setState({ lastSelectedId: selectedIds[selectedIds.length - 1] });
        }
        this._resourceId = `Selection${JSON.stringify([this.sceneId, this.state.selectedIds])}`;
        return this;
    }
    deselect(itemsList) {
        const ids = this.resolveItemsList(itemsList);
        this.select(this.state.selectedIds.filter(id => !ids.includes(id)));
        return this;
    }
    reset() {
        this.select([]);
        return this;
    }
    clone() {
        return this.getScene().getSelection(this.getIds());
    }
    getItems(display) {
        const scene = this.getScene();
        if (!this.getSize())
            return [];
        const items = scene.getItems().filter(item => this.state.selectedIds.includes(item.id));
        return display ? items.filter(item => item.display === display) : items;
    }
    getNodes() {
        const scene = this.getScene();
        if (!this.getSize())
            return [];
        const nodes = scene.getNodes();
        const ids = this.state.selectedIds;
        return nodes.filter(node => node && ids.includes(node.id));
    }
    getFolders() {
        const scene = this.getScene();
        if (!this.getSize())
            return [];
        return scene.getFolders().filter(folder => this.state.selectedIds.includes(folder.id));
    }
    isSceneItem() {
        return this.getSize() === 1 && this.getNodes()[0].isItem();
    }
    isSceneFolder() {
        const rootNodes = this.getRootNodes();
        return rootNodes.length === 1 && rootNodes[0].sceneNodeType === 'folder';
    }
    isScaleFilterSelected(filter) {
        const items = this.getItems().filter(item => item.scaleFilter === filter);
        return items.length > 0;
    }
    isBlendingModeSelected(mode) {
        const items = this.getItems().filter(item => item.blendingMode === mode);
        return items.length > 0;
    }
    isBlendingMethodSelected(method) {
        const items = this.getItems().filter(item => item.blendingMethod === method);
        return items.length > 0;
    }
    isDeinterlacingModeSelected(mode) {
        const items = this.getItems().filter(item => item.source.deinterlaceMode === mode);
        return items.length > 0;
    }
    isDeinterlacingFieldOrderSelected(order) {
        const items = this.getItems().filter(item => item.source.deinterlaceFieldOrder === order);
        return items.length > 0;
    }
    getVisualItems(display) {
        const items = this.getItems().filter(item => item.isVisualSource);
        return display ? items.filter(item => item.display === display) : items;
    }
    isGameCaptureSelected() {
        const items = this.getItems().filter(item => item.source.type === 'game_capture');
        return items.length > 0;
    }
    getIds() {
        return this.state.selectedIds;
    }
    getInvertedIds() {
        const selectedIds = this.getIds();
        return this.getScene()
            .getNodesIds()
            .filter(id => {
            return !selectedIds.includes(id);
        });
    }
    getLastSelected() {
        return this.getScene().getNode(this.state.lastSelectedId);
    }
    getLastSelectedId() {
        return this.state.lastSelectedId;
    }
    getSize() {
        return this.state.selectedIds.length;
    }
    getBoundingRect(display) {
        const items = this.getVisualItems(display);
        if (!items.length)
            return null;
        let minTop = Infinity;
        let minLeft = Infinity;
        let maxRight = -Infinity;
        let maxBottom = -Infinity;
        items.forEach(item => {
            const rect = item.getBoundingRect();
            minTop = Math.min(minTop, rect.y);
            minLeft = Math.min(minLeft, rect.x);
            maxRight = Math.max(maxRight, rect.x + rect.width);
            maxBottom = Math.max(maxBottom, rect.y + rect.height);
        });
        return new Rect({
            x: minLeft,
            y: minTop,
            width: maxRight - minLeft,
            height: maxBottom - minTop,
        });
    }
    getInverted() {
        const scene = this.getScene();
        return this.getInvertedIds().map(id => scene.getNode(id));
    }
    invert() {
        const items = this.getInverted();
        this.select(items.map(item => item.id));
        return this;
    }
    isSelected(sceneNode) {
        const itemId = typeof sceneNode === 'string' ? sceneNode : sceneNode.sceneItemId;
        return this.getIds().includes(itemId);
    }
    selectAll() {
        this.select(this.getScene()
            .getNodes()
            .map(node => node.id));
        return this;
    }
    copyTo(sceneId, folderId, duplicateSources = false) {
        const insertedNodes = [];
        const scene = this.scenesService.views.getScene(sceneId);
        const foldersMap = {};
        let prevInsertedNode;
        let insertedNode;
        const sourcesMap = {};
        const notDuplicatedSources = [];
        if (duplicateSources) {
            this.getSources().forEach(source => {
                const duplicatedSource = source.duplicate();
                if (!duplicatedSource) {
                    notDuplicatedSources.push(source);
                    return;
                }
                sourcesMap[source.sourceId] = duplicatedSource;
            });
        }
        this.getNodes().forEach(sceneNode => {
            if (sceneNode.isFolder()) {
                insertedNode = scene.createFolder(sceneNode.name, { display: sceneNode === null || sceneNode === void 0 ? void 0 : sceneNode.display });
                foldersMap[sceneNode.id] = insertedNode.id;
                insertedNodes.push(insertedNode);
            }
            else if (sceneNode.isItem()) {
                insertedNode = scene.addSource(sourcesMap[sceneNode.sourceId]
                    ? sourcesMap[sceneNode.sourceId].sourceId
                    : sceneNode.sourceId, { display: sceneNode === null || sceneNode === void 0 ? void 0 : sceneNode.display });
                insertedNode.setSettings(sceneNode.getSettings());
                insertedNodes.push(insertedNode);
            }
            const newParentId = foldersMap[sceneNode.parentId] || '';
            if (newParentId) {
                insertedNode.setParent(newParentId);
            }
            if (prevInsertedNode && prevInsertedNode.parentId === newParentId) {
                insertedNode.placeAfter(prevInsertedNode.id);
            }
            prevInsertedNode = insertedNode;
        });
        return insertedNodes;
    }
    moveTo(sceneId, folderId) {
        if (this.sceneId === sceneId) {
            if (!folderId)
                return;
            this.getRootNodes()
                .reverse()
                .forEach(sceneNode => sceneNode.setParent(folderId));
        }
        else {
            const insertedItems = this.copyTo(sceneId, folderId);
            this.remove();
            return insertedItems;
        }
    }
    isVisible() {
        return this.getItems().some(item => item.visible);
    }
    isLocked() {
        return this.getItems().every(item => item.locked);
    }
    isAnyLocked() {
        return this.getItems().some(item => item.locked);
    }
    isStreamVisible() {
        return this.getItems().every(item => item.streamVisible);
    }
    isRecordingVisible() {
        return this.getItems().every(item => item.recordingVisible);
    }
    getRootNodes() {
        const rootNodes = [];
        const foldersIds = [];
        this.getNodes().forEach(node => {
            if (!foldersIds.includes(node.parentId)) {
                rootNodes.push(node);
            }
            if (node.isFolder())
                foldersIds.push(node.id);
        });
        return rootNodes;
    }
    getClosestParent() {
        const rootNodes = this.getRootNodes();
        const paths = [];
        for (const node of rootNodes) {
            if (!node.parentId)
                return null;
            paths.push(node.getPath());
        }
        const minPathLength = Math.min(...paths.map(path => path.length));
        let closestParentId = '';
        for (let ind = 0; ind < minPathLength; ind++) {
            const parents = paths.map(path => path[ind]);
            if (uniq(parents).length === 1) {
                closestParentId = parents[0];
            }
            else {
                return this.getScene().getFolder(closestParentId);
            }
        }
    }
    canGroupIntoFolder() {
        const selectedNodes = this.getRootNodes();
        const nodesFolders = selectedNodes.map(node => node.parentId || null);
        const nodesHaveTheSameParent = uniq(nodesFolders).length === 1;
        return selectedNodes.length > 1 && nodesHaveTheSameParent;
    }
    getSources() {
        const sourcesIds = [];
        const sources = [];
        this.getItems().forEach(item => {
            const source = item.getSource();
            if (sourcesIds.includes(source.sourceId))
                return;
            sources.push(source);
        });
        return sources;
    }
    setStreamVisible(streamVisible) {
        this.getItems().forEach(item => item.setStreamVisible(streamVisible));
    }
    setRecordingVisible(recordingVisible) {
        this.getItems().forEach(item => item.setRecordingVisible(recordingVisible));
    }
    setSettings(settings) {
        this.getItems().forEach(item => item.setSettings(settings));
    }
    setVisibility(isVisible) {
        this.getItems().forEach(item => item.setVisibility(isVisible));
    }
    setTransform(transform) {
        this.getItems().forEach(item => item.setTransform(transform));
    }
    resetTransform() {
        this.getItems().forEach(item => item.resetTransform());
    }
    setScaleFilter(filter) {
        this.getItems().forEach(item => item.setScaleFilter(filter));
    }
    setBlendingMode(mode) {
        this.getItems().forEach(item => item.setBlendingMode(mode));
    }
    setBlendingMethod(method) {
        this.getItems().forEach(item => item.setBlendingMethod(method));
    }
    setDeinterlaceMode(mode) {
        this.getItems().forEach(item => item.source.setDeinterlaceMode(mode));
    }
    setDeinterlaceFieldOrder(order) {
        this.getItems().forEach(item => item.source.setDeinterlaceFieldOrder(order));
    }
    scale(scale, origin = AnchorPositions[AnchorPoint.Center]) {
        const originPos = this.getBoundingRect().getOffsetFromOrigin(origin);
        this.getItems().forEach(item => item.scaleWithOffset(scale, originPos));
    }
    scaleWithOffset(scale, offset) {
        this.scale(scale, this.getBoundingRect().getOriginFromOffset(offset));
    }
    setDeltaPos(dir, delta) {
        this.getItems().forEach(item => item.setDeltaPos(dir, delta));
    }
    flipY() {
        this.getItems().forEach(item => item.flipY());
    }
    flipX() {
        this.getItems().forEach(item => item.flipX());
    }
    stretchToScreen() {
        this.getItems().forEach(item => item.stretchToScreen(item.display));
    }
    fitToScreen() {
        this.getItems().forEach(item => item.fitToScreen(item.display));
    }
    centerOnScreen() {
        this.getItems().forEach(item => item.centerOnScreen(item.display));
    }
    centerOnHorizontal() {
        this.getItems().forEach(item => item.centerOnAxis(CenteringAxis.X, item.display));
    }
    centerOnVertical() {
        this.getItems().forEach(item => item.centerOnAxis(CenteringAxis.Y, item.display));
    }
    rotate(deg) {
        this.getItems().forEach(item => item.rotate(deg));
    }
    setContentCrop() {
        this.getItems().forEach(item => item.setContentCrop());
    }
    remove() {
        this.getNodes().forEach(node => !node.isDestroyed() && node.remove());
    }
    nudgeLeft() {
        this.getItems().forEach(item => item.nudgeLeft());
    }
    nudgeRight() {
        this.getItems().forEach(item => item.nudgeRight());
    }
    nudgeUp() {
        this.getItems().forEach(item => item.nudgeUp());
    }
    nudgeDown() {
        this.getItems().forEach(item => item.nudgeDown());
    }
    getModel() {
        return Object.assign({ sceneId: this.sceneId }, this.state);
    }
    placeAfter(sceneNodeId) {
        this.getRootNodes()
            .reverse()
            .forEach(node => node.placeAfter(sceneNodeId));
    }
    placeBefore(sceneNodeId) {
        this.getRootNodes().forEach(node => node.placeBefore(sceneNodeId));
    }
    setParent(sceneNodeId) {
        this.getRootNodes()
            .reverse()
            .forEach(node => node.setParent(sceneNodeId));
    }
    resolveItemsList(itemsList) {
        if (!itemsList)
            return [];
        if (Array.isArray(itemsList)) {
            if (!itemsList.length) {
                return [];
            }
            if (typeof itemsList[0] === 'string') {
                return itemsList;
            }
            return itemsList.map(item => item.id);
        }
        if (typeof itemsList === 'string') {
            return [itemsList];
        }
        return [itemsList.id];
    }
    setState(state) {
        Object.assign(this.state, state);
    }
};
__decorate([
    Inject()
], Selection.prototype, "scenesService", void 0);
__decorate([
    Inject()
], Selection.prototype, "dualOutputService", void 0);
Selection = __decorate([
    ServiceHelper('SelectionService')
], Selection);
export { Selection };
//# sourceMappingURL=selection.js.map