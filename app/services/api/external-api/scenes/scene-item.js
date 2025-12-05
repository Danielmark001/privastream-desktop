var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { InjectFromExternalApi, Fallback } from 'services/api/external-api';
import { getExternalNodeModel, SceneNode } from './scene-node';
import Utils from '../../../utils';
import { ServiceHelper } from '../../../core';
let SceneItem = class SceneItem extends SceneNode {
    constructor(sceneId, nodeId, sourceId) {
        super(sceneId, nodeId);
        this.sceneId = sceneId;
        this.nodeId = nodeId;
        this.sceneItem = this.internalScenesService.views.getSceneItem(this.nodeId);
        Utils.applyProxy(this, () => this.getModel());
    }
    getSource() {
        return this.sourcesService.getSource(this.sceneItem.sourceId);
    }
    getModel() {
        const sourceModel = this.getSource().getModel();
        return getExternalSceneItemModel(this.sceneItem, sourceModel.name);
    }
    setSettings(settings) {
        return this.sceneItem.setSettings(settings);
    }
    setVisibility(visible) {
        return this.sceneItem.setVisibility(visible);
    }
    setTransform(transform) {
        return this.sceneItem.setTransform(transform);
    }
    resetTransform() {
        return this.sceneItem.resetTransform();
    }
    flipX() {
        return this.sceneItem.flipX();
    }
    flipY() {
        return this.sceneItem.flipY();
    }
    stretchToScreen() {
        return this.sceneItem.stretchToScreen(this.sceneItem.display);
    }
    fitToScreen() {
        return this.sceneItem.fitToScreen(this.sceneItem.display);
    }
    centerOnScreen() {
        return this.sceneItem.centerOnScreen(this.sceneItem.display);
    }
    rotate(deg) {
        return this.sceneItem.rotate(deg);
    }
    remove() {
        return this.sceneItem.remove();
    }
    setScale(newScaleModel, origin) {
        return this.sceneItem.setScale(newScaleModel, origin);
    }
    setContentCrop() {
        return this.sceneItem.setContentCrop();
    }
};
__decorate([
    Fallback()
], SceneItem.prototype, "sceneItem", void 0);
__decorate([
    InjectFromExternalApi()
], SceneItem.prototype, "sourcesService", void 0);
SceneItem = __decorate([
    ServiceHelper('ScenesService')
], SceneItem);
export { SceneItem };
export function getExternalSceneItemModel(internalModel, name) {
    const resourceId = `SceneItem["${internalModel.sceneId}", "${internalModel.sceneItemId}", "${internalModel.sourceId}"]`;
    return Object.assign(Object.assign({}, getExternalNodeModel(internalModel)), { sourceId: internalModel.sourceId, sceneItemId: internalModel.sceneItemId, name,
        resourceId, transform: internalModel.transform, visible: internalModel.visible, locked: internalModel.locked, streamVisible: internalModel.streamVisible, recordingVisible: internalModel.recordingVisible, scaleFilter: internalModel.scaleFilter, blendingMode: internalModel.blendingMode, blendingMethod: internalModel.blendingMethod, output: internalModel.output, display: internalModel.display });
}
//# sourceMappingURL=scene-item.js.map