var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { InjectFromExternalApi, Fallback } from 'services/api/external-api';
import { ServiceHelper } from 'services/core';
import { Selection as InternalSelection, } from 'services/selection';
let Selection = class Selection {
    constructor(sceneId, itemsList = []) {
        this.internalSelection = new InternalSelection(sceneId, itemsList);
    }
    isDestroyed() {
        return this.internalSelection.isDestroyed();
    }
    get sceneId() {
        return this.internalSelection.sceneId;
    }
    get selection() {
        return this.internalSelection;
    }
    getModel() {
        return {
            lastSelectedId: this.selection.getLastSelectedId(),
            selectedIds: this.selection.getIds(),
        };
    }
    getScene() {
        return this.scenesService.getScene(this.sceneId);
    }
    add(ids) {
        this.selection.add(ids);
        return this;
    }
    select(ids) {
        this.selection.select(ids);
        return this;
    }
    deselect(ids) {
        this.selection.deselect(ids);
        return this;
    }
    reset() {
        this.selection.reset();
        return this;
    }
    invert() {
        this.selection.invert();
        return this;
    }
    selectAll() {
        this.selection.selectAll();
        return this;
    }
    clone() {
        return this.scenesService.getScene(this.sceneId).getSelection(this.getIds());
    }
    getItems() {
        const scene = this.scenesService.getScene(this.sceneId);
        return this.selection.getItems().map(item => scene.getItem(item.id));
    }
    getFolders() {
        const scene = this.scenesService.getScene(this.sceneId);
        return this.selection.getFolders().map(folder => scene.getFolder(folder.id));
    }
    getVisualItems() {
        const scene = this.scenesService.getScene(this.sceneId);
        return this.selection.getVisualItems().map(item => scene.getItem(item.id));
    }
    getIds() {
        return this.selection.getIds();
    }
    getInvertedIds() {
        return this.selection.getInvertedIds();
    }
    getInverted() {
        const scene = this.getScene();
        return this.selection.getInvertedIds().map(id => scene.getNode(id));
    }
    getBoundingRect() {
        return this.selection.getBoundingRect();
    }
    getLastSelected() {
        return this.getScene().getNode(this.getLastSelectedId());
    }
    getLastSelectedId() {
        return this.selection.getLastSelectedId();
    }
    getSize() {
        return this.selection.getSize();
    }
    isSelected(nodeId) {
        return this.selection.isSelected(nodeId);
    }
    copyTo(sceneId, folderId, duplicateSources) {
        this.selection.copyTo(sceneId, folderId, duplicateSources);
    }
    moveTo(sceneId, folderId) {
        this.selection.moveTo(sceneId, folderId);
    }
    placeAfter(sceneNodeId) {
        this.selection.placeAfter(sceneNodeId);
    }
    placeBefore(sceneNodeId) {
        this.selection.placeBefore(sceneNodeId);
    }
    setParent(folderId) {
        this.selection.setParent(folderId);
    }
    getRootNodes() {
        const scene = this.getScene();
        return this.selection.getRootNodes().map(node => scene.getNode(node.id));
    }
    getSources() {
        return this.selection
            .getSources()
            .map(source => this.sourcesService.getSource(source.sourceId));
    }
    setSettings(settings) {
        return this.selection.setSettings(settings);
    }
    setVisibility(visible) {
        return this.selection.setVisibility(visible);
    }
    setStreamVisible(streamVisible) {
        return this.selection.setStreamVisible(streamVisible);
    }
    setRecordingVisible(recordingVisible) {
        return this.selection.setRecordingVisible(recordingVisible);
    }
    setTransform(transform) {
        return this.selection.setTransform(transform);
    }
    resetTransform() {
        return this.selection.resetTransform();
    }
    flipX() {
        return this.selection.flipX();
    }
    flipY() {
        return this.selection.flipY();
    }
    stretchToScreen() {
        return this.selection.stretchToScreen();
    }
    fitToScreen() {
        return this.selection.fitToScreen();
    }
    centerOnScreen() {
        return this.selection.centerOnScreen();
    }
    rotate(deg) {
        return this.selection.rotate(deg);
    }
    remove() {
        return this.selection.remove();
    }
    setContentCrop() {
        return this.selection.setContentCrop();
    }
    scale(scale, origin) {
        return this.selection.scale(scale, origin);
    }
    scaleWithOffset(scale, offset) {
        return this.selection.scale(scale, offset);
    }
    isSceneFolder() {
        return this.selection.isSceneFolder();
    }
    isSceneItem() {
        return this.selection.isSceneFolder();
    }
    setScaleFilter(filter) {
        return this.selection.setScaleFilter(filter);
    }
    setBlendingMode(mode) {
        return this.selection.setBlendingMode(mode);
    }
    setBlendingMethod(method) {
        return this.selection.setBlendingMethod(method);
    }
};
__decorate([
    InjectFromExternalApi()
], Selection.prototype, "sourcesService", void 0);
__decorate([
    InjectFromExternalApi()
], Selection.prototype, "scenesService", void 0);
__decorate([
    Fallback()
], Selection.prototype, "internalSelection", void 0);
Selection = __decorate([
    ServiceHelper('SelectionService')
], Selection);
export { Selection };
//# sourceMappingURL=selection.js.map