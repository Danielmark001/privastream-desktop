var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import merge from 'lodash/merge';
import { mutation, Inject } from 'services';
import Utils from '../utils';
import { ScalableRectangle, AnchorPositions, AnchorPoint, } from 'util/ScalableRectangle';
import { SceneItemNode } from './scene-node';
import { v2 } from '../../util/vec2';
import { Rect } from '../../util/rect';
import { ServiceHelper, ExecuteInWorkerProcess } from 'services/core';
import { assertIsDefined } from '../../util/properties-type-guards';
let SceneItem = class SceneItem extends SceneItemNode {
    get scaledWidth() {
        return this.width * this.transform.scale.x;
    }
    get scaledHeight() {
        return this.height * this.transform.scale.y;
    }
    get isVisualSource() {
        return this.video && this.width > 0 && this.height > 0 && !this.locked;
    }
    constructor(sceneId, sceneItemId, sourceId) {
        var _a, _b, _c;
        super();
        this.sceneNodeType = 'item';
        const sceneItemState = this.scenesService.state.scenes[sceneId].nodes.find(item => {
            return item.id === sceneItemId;
        });
        assertIsDefined(sceneItemState);
        const sourceState = this.sourcesService.state.sources[sourceId];
        this.state = sceneItemState;
        Utils.applyProxy(this, sourceState);
        Utils.applyProxy(this, this.state);
        if (this.type === 'scene') {
            const baseResolutions = this.videoSettingsService.baseResolutions[(_a = this.display) !== null && _a !== void 0 ? _a : 'horizontal'];
            assertIsDefined(baseResolutions);
            this.baseWidth = (_b = baseResolutions.baseWidth) !== null && _b !== void 0 ? _b : this.width;
            this.baseHeight = (_c = baseResolutions.baseHeight) !== null && _c !== void 0 ? _c : this.height;
        }
    }
    getModel() {
        return Object.assign(Object.assign({}, this.source.state), this.state);
    }
    getScene() {
        const scene = this.scenesService.views.getScene(this.sceneId);
        assertIsDefined(scene);
        return scene;
    }
    get source() {
        const source = this.sourcesService.views.getSource(this.sourceId);
        assertIsDefined(source);
        return source;
    }
    getSource() {
        return this.source;
    }
    getObsInput() {
        return this.source.getObsInput();
    }
    getObsSceneItem() {
        return this.getScene().getObsScene().findItem(this.obsSceneItemId);
    }
    getSettings() {
        return {
            transform: this.transform,
            locked: this.locked,
            visible: this.visible,
            streamVisible: this.streamVisible,
            recordingVisible: this.recordingVisible,
            scaleFilter: this.scaleFilter,
            blendingMode: this.blendingMode,
            blendingMethod: this.blendingMethod,
            output: this.output,
            display: this.display,
        };
    }
    setSettings(patch) {
        const obsSceneItem = this.getObsSceneItem();
        const changed = Utils.getChangedParams(this.state, patch);
        const newSettings = merge({}, this.state, patch);
        if (changed.transform) {
            const changedTransform = Utils.getChangedParams(this.state.transform, patch.transform);
            if (changedTransform.position) {
                obsSceneItem.position = newSettings.transform.position;
            }
            if (changedTransform.scale) {
                obsSceneItem.scale = newSettings.transform.scale;
            }
            if (changedTransform.crop) {
                const crop = newSettings.transform.crop;
                const cropModel = {
                    top: Math.round(crop.top),
                    right: Math.round(crop.right),
                    bottom: Math.round(crop.bottom),
                    left: Math.round(crop.left),
                };
                changed.transform.crop = cropModel;
                obsSceneItem.crop = cropModel;
            }
            if (changedTransform.rotation !== void 0) {
                const effectiveRotation = ((newSettings.transform.rotation % 360) + 360) % 360;
                this.getObsSceneItem().rotation = effectiveRotation;
                changed.transform.rotation = effectiveRotation;
            }
        }
        if (changed.locked !== void 0) {
            if (changed.locked &&
                this.selectionService.views.globalSelection.isSelected(this.sceneItemId)) {
                this.selectionService.views.globalSelection.deselect(this.sceneItemId);
            }
        }
        if (changed.visible !== void 0) {
            if (!this.source.forceHidden)
                this.getObsSceneItem().visible = newSettings.visible;
        }
        if (changed.streamVisible !== void 0) {
            this.getObsSceneItem().streamVisible = newSettings.streamVisible;
        }
        if (changed.recordingVisible !== void 0) {
            this.getObsSceneItem().recordingVisible = newSettings.recordingVisible;
        }
        if (changed.scaleFilter !== void 0) {
            this.getObsSceneItem().scaleFilter = newSettings.scaleFilter;
        }
        if (changed.blendingMode !== void 0) {
            this.getObsSceneItem().blendingMode = newSettings.blendingMode;
        }
        if (changed.blendingMethod !== void 0) {
            this.getObsSceneItem().blendingMethod = newSettings.blendingMethod;
        }
        if (changed.output !== void 0 || patch.hasOwnProperty('output')) {
            this.getObsSceneItem().video = newSettings.output;
        }
        this.UPDATE(Object.assign({ sceneItemId: this.sceneItemId }, changed));
        this.scenesService.itemUpdated.next(this.getModel());
    }
    remove() {
        this.getScene().removeItem(this.sceneItemId);
    }
    nudgeLeft() {
        this.setDeltaPos('x', -1);
    }
    nudgeRight() {
        this.setDeltaPos('x', 1);
    }
    nudgeUp() {
        this.setDeltaPos('y', -1);
    }
    nudgeDown() {
        this.setDeltaPos('y', 1);
    }
    setDeltaPos(dir, delta) {
        this.setTransform({ position: { [dir]: this.transform.position[dir] + delta } });
    }
    setVisibility(visible) {
        this.setSettings({ visible });
    }
    setLocked(locked) {
        this.setSettings({ locked });
    }
    setStreamVisible(streamVisible) {
        this.setSettings({ streamVisible });
    }
    setRecordingVisible(recordingVisible) {
        this.setSettings({ recordingVisible });
    }
    setDisplay(display) {
        this.setSettings({ display });
    }
    loadItemAttributes(customSceneItem) {
        var _a, _b;
        const visible = customSceneItem.visible;
        const position = { x: customSceneItem.x, y: customSceneItem.y };
        const crop = customSceneItem.crop;
        const display = (_b = (_a = customSceneItem === null || customSceneItem === void 0 ? void 0 : customSceneItem.display) !== null && _a !== void 0 ? _a : this === null || this === void 0 ? void 0 : this.display) !== null && _b !== void 0 ? _b : 'horizontal';
        if (display === 'vertical') {
            this.videoSettingsService.validateVideoContext('vertical');
        }
        const context = this.videoSettingsService.contexts[display];
        const obsSceneItem = this.getObsSceneItem();
        obsSceneItem.video = context;
        this.UPDATE({
            visible,
            sceneItemId: this.sceneItemId,
            transform: {
                position,
                crop,
                scale: { x: customSceneItem.scaleX, y: customSceneItem.scaleY },
                rotation: customSceneItem.rotation,
            },
            locked: !!customSceneItem.locked,
            streamVisible: !!customSceneItem.streamVisible,
            recordingVisible: !!customSceneItem.recordingVisible,
            scaleFilter: customSceneItem.scaleFilter,
            blendingMode: customSceneItem.blendingMode,
            blendingMethod: customSceneItem.blendingMethod,
            display,
            output: context,
            position: obsSceneItem.position,
        });
    }
    setTransform(transform) {
        this.setSettings({ transform });
    }
    resetTransform() {
        this.setTransform({
            position: { x: 0, y: 0 },
            scale: { x: 1, y: 1 },
            rotation: 0,
            crop: {
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
            },
        });
    }
    setScale(newScaleModel, origin = AnchorPositions[AnchorPoint.Center]) {
        const rect = new ScalableRectangle(this.rectangle);
        rect.normalized(() => {
            rect.withOrigin(origin, () => {
                rect.scaleX = newScaleModel.x;
                rect.scaleY = newScaleModel.y;
            });
        });
        this.setTransform({
            position: {
                x: rect.x,
                y: rect.y,
            },
            scale: {
                x: rect.scaleX,
                y: rect.scaleY,
            },
        });
    }
    scale(scaleDelta, origin = AnchorPositions[AnchorPoint.Center]) {
        const rect = new ScalableRectangle(this.rectangle);
        let currentScale = v2();
        rect.normalized(() => {
            currentScale = v2(rect.scaleX, rect.scaleY);
        });
        const newScale = v2(scaleDelta).multiply(currentScale);
        this.setScale(newScale, origin);
    }
    scaleWithOffset(scaleDelta, offset) {
        const origin = this.getBoundingRect().getOriginFromOffset(offset);
        this.scale(scaleDelta, origin);
    }
    flipY() {
        this.preservePosition(() => {
            const rect = new ScalableRectangle(this.rectangle);
            rect.flipY();
            this.setRect(rect);
        });
    }
    flipX() {
        this.preservePosition(() => {
            const rect = new ScalableRectangle(this.rectangle);
            rect.flipX();
            this.setRect(rect);
        });
    }
    stretchToScreen(display) {
        const rect = new ScalableRectangle(this.rectangle);
        rect.stretchAcross(this.videoService.getScreenRectangle(display));
        this.setRect(rect);
    }
    fitToScreen(display) {
        const rect = new ScalableRectangle(this.rectangle);
        rect.fitTo(this.videoService.getScreenRectangle(display));
        this.setRect(rect);
    }
    centerOnScreen(display) {
        const rect = new ScalableRectangle(this.rectangle);
        rect.centerOn(this.videoService.getScreenRectangle(display));
        this.setRect(rect);
    }
    centerOnAxis(axis, display) {
        const rect = new ScalableRectangle(this.rectangle);
        rect.centerOn(this.videoService.getScreenRectangle(display), axis);
        this.setRect(rect);
    }
    rotate(deltaRotation) {
        this.preservePosition(() => {
            this.setTransform({ rotation: this.transform.rotation + deltaRotation });
        });
    }
    getItemIndex() {
        return this.getScene()
            .getItems()
            .findIndex(sceneItemModel => sceneItemModel.id === this.id);
    }
    setScaleFilter(scaleFilter) {
        this.setSettings({ scaleFilter });
    }
    setBlendingMode(blendingMode) {
        this.setSettings({ blendingMode });
    }
    setBlendingMethod(blendingMethod) {
        this.setSettings({ blendingMethod });
    }
    setContentCrop() {
        const source = this.getSource();
        if (source.type !== 'scene')
            return;
        const scene = this.getScene();
        const rect = scene.getSelection().selectAll().getBoundingRect();
        const { width, height } = this.source.getObsInput();
        this.setTransform({
            position: {
                x: rect.x,
                y: rect.y,
            },
            crop: {
                top: rect.y,
                right: width - (rect.x + rect.width),
                bottom: height - (rect.y + rect.height),
                left: rect.x,
            },
        });
    }
    setRect(rect) {
        this.setTransform({
            position: { x: rect.x, y: rect.y },
            scale: { x: rect.scaleX, y: rect.scaleY },
        });
    }
    getSelection() {
        return this.getScene().getSelection(this.id);
    }
    get rectangle() {
        var _a, _b;
        const width = (_a = this.baseWidth) !== null && _a !== void 0 ? _a : this.width;
        const height = (_b = this.baseHeight) !== null && _b !== void 0 ? _b : this.height;
        return {
            x: this.transform.position.x,
            y: this.transform.position.y,
            scaleX: this.transform.scale.x,
            scaleY: this.transform.scale.y,
            width,
            height,
            crop: this.transform.crop,
            rotation: this.transform.rotation,
        };
    }
    getBoundingRect() {
        const rect = new ScalableRectangle(this.rectangle);
        rect.normalize();
        return new Rect({
            x: rect.x,
            y: rect.y,
            width: rect.scaledWidth,
            height: rect.scaledHeight,
        });
    }
    preservePosition(fun) {
        const rect = new ScalableRectangle(this.rectangle);
        rect.normalize();
        const x = rect.x;
        const y = rect.y;
        fun();
        const newRect = new ScalableRectangle(this.rectangle);
        newRect.normalized(() => {
            newRect.x = x;
            newRect.y = y;
        });
        this.setTransform({ position: { x: newRect.x, y: newRect.y } });
    }
    UPDATE(patch) {
        merge(this.state, patch);
    }
};
__decorate([
    Inject()
], SceneItem.prototype, "scenesService", void 0);
__decorate([
    Inject()
], SceneItem.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], SceneItem.prototype, "videoService", void 0);
__decorate([
    Inject()
], SceneItem.prototype, "videoSettingsService", void 0);
__decorate([
    ExecuteInWorkerProcess()
], SceneItem.prototype, "setSettings", null);
__decorate([
    mutation()
], SceneItem.prototype, "UPDATE", null);
SceneItem = __decorate([
    ServiceHelper('ScenesService')
], SceneItem);
export { SceneItem };
//# sourceMappingURL=scene-item.js.map