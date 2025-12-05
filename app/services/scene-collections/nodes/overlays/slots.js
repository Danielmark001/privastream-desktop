var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Inject } from 'services/core/injector';
import { byOS, getOS, OS } from 'util/operating-systems';
import { ArrayNode } from '../array-node';
import { Node } from '../node';
import { GameCaptureNode } from './game-capture';
import { IconLibraryNode } from './icon-library';
import { ImageNode } from './image';
import { SceneSourceNode } from './scene';
import { SmartBrowserNode } from './smartBrowserSource';
import { StreamlabelNode } from './streamlabel';
import { TextNode } from './text';
import { VideoNode } from './video';
import { WebcamNode } from './webcam';
import { WidgetNode } from './widget';
export class SlotsNode extends ArrayNode {
    constructor() {
        super(...arguments);
        this.schemaVersion = 1;
    }
    getItems(context) {
        return context.scene.getNodes().slice().reverse();
    }
    saveItem(sceneNode, context) {
        return __awaiter(this, void 0, void 0, function* () {
            if (sceneNode.isFolder()) {
                return {
                    id: sceneNode.id,
                    sceneNodeType: 'folder',
                    name: sceneNode.name,
                    childrenIds: sceneNode.childrenIds || [],
                    display: sceneNode === null || sceneNode === void 0 ? void 0 : sceneNode.display,
                };
            }
            const details = {
                id: sceneNode.id,
                sceneNodeType: 'item',
                name: sceneNode.name,
                x: sceneNode.transform.position.x / this.videoSettingsService.baseWidth,
                y: sceneNode.transform.position.y / this.videoSettingsService.baseHeight,
                scaleX: sceneNode.transform.scale.x / this.videoSettingsService.baseWidth,
                scaleY: sceneNode.transform.scale.y / this.videoSettingsService.baseHeight,
                crop: sceneNode.transform.crop,
                rotation: sceneNode.transform.rotation,
                visible: sceneNode.visible,
                display: sceneNode === null || sceneNode === void 0 ? void 0 : sceneNode.display,
                filters: sceneNode.getObsInput().filters.map(filter => {
                    filter.save();
                    return {
                        name: filter.name,
                        type: filter.id,
                        settings: filter.settings,
                    };
                }),
                locked: sceneNode.locked,
            };
            if (sceneNode.getObsInput().audioMixers) {
                details.mixerHidden = this.audioService.views.getSource(sceneNode.sourceId).mixerHidden;
            }
            const manager = sceneNode.source.getPropertiesManagerType();
            if (manager === 'smartBrowserSource') {
                const content = new SmartBrowserNode();
                yield content.save({ sceneItem: sceneNode, assetsPath: context.assetsPath });
                return Object.assign(Object.assign({}, details), { content });
            }
            if (manager === 'streamlabels') {
                const content = new StreamlabelNode();
                yield content.save({ sceneItem: sceneNode, assetsPath: context.assetsPath });
                return Object.assign(Object.assign({}, details), { content });
            }
            if (manager === 'widget') {
                const content = new WidgetNode();
                yield content.save({ sceneItem: sceneNode, assetsPath: context.assetsPath });
                return Object.assign(Object.assign({}, details), { content });
            }
            if (manager === 'iconLibrary') {
                const content = new IconLibraryNode();
                yield content.save({
                    sceneItem: sceneNode,
                    assetsPath: context.assetsPath,
                    savedAssets: context.savedAssets,
                });
                return Object.assign(Object.assign({}, details), { content });
            }
            if (sceneNode.type === 'image_source') {
                const content = new ImageNode();
                yield content.save({
                    sceneItem: sceneNode,
                    assetsPath: context.assetsPath,
                    savedAssets: context.savedAssets,
                });
                return Object.assign(Object.assign({}, details), { content });
            }
            if (sceneNode.type === 'text_gdiplus') {
                const content = new TextNode();
                yield content.save({ sceneItem: sceneNode, assetsPath: context.assetsPath });
                return Object.assign(Object.assign({}, details), { content });
            }
            if (sceneNode.type === 'dshow_input') {
                const content = new WebcamNode();
                yield content.save({ sceneItem: sceneNode, assetsPath: context.assetsPath });
                return Object.assign(Object.assign({}, details), { content });
            }
            if (sceneNode.type === 'ffmpeg_source') {
                const content = new VideoNode();
                yield content.save({
                    sceneItem: sceneNode,
                    assetsPath: context.assetsPath,
                    savedAssets: context.savedAssets,
                });
                return Object.assign(Object.assign({}, details), { content });
            }
            if (sceneNode.type === 'game_capture') {
                const content = new GameCaptureNode();
                yield content.save({ sceneItem: sceneNode, assetsPath: context.assetsPath });
                return Object.assign(Object.assign({}, details), { content });
            }
            if (sceneNode.type === 'scene') {
                const content = new SceneSourceNode();
                yield content.save({ sceneItem: sceneNode, assetsPath: context.assetsPath });
                return Object.assign(Object.assign({}, details), { content });
            }
        });
    }
    loadItem(obj, context) {
        return __awaiter(this, void 0, void 0, function* () {
            let sceneItem;
            const id = obj.id;
            const display = obj.display;
            if (obj.sceneNodeType === 'folder') {
                context.scene.createFolder(obj.name, { id, display });
                return;
            }
            if (!(obj.content instanceof Node))
                return;
            const webcamSourceType = byOS({
                [OS.Windows]: 'dshow_input',
                [OS.Mac]: 'av_capture_input',
            });
            if (obj.content instanceof WebcamNode) {
                const existingWebcam = this.sourcesService.views.sources.find(source => {
                    return source.type === webcamSourceType;
                });
                if (existingWebcam) {
                    sceneItem = context.scene.addSource(existingWebcam.sourceId, {
                        id,
                        select: false,
                        display,
                    });
                }
                else {
                    sceneItem = context.scene.createAndAddSource(obj.name, webcamSourceType, {}, { id, select: false, display });
                }
                delete obj.crop;
                this.adjustTransform(sceneItem, obj);
                yield obj.content.load({
                    sceneItem,
                    assetsPath: context.assetsPath,
                    existing: existingWebcam !== void 0,
                });
                return;
            }
            let existing = false;
            if (obj.content instanceof ImageNode) {
                sceneItem = context.scene.createAndAddSource(obj.name, 'image_source', {}, { id, select: false, display });
            }
            else if (obj.content instanceof GameCaptureNode) {
                if (getOS() === OS.Windows) {
                    sceneItem = context.scene.createAndAddSource(obj.name, 'game_capture', {}, { id, select: false, display });
                    obj.scaleX *= obj.content.data.width / this.videoSettingsService.baseWidth;
                    obj.scaleY *= obj.content.data.height / this.videoSettingsService.baseHeight;
                }
                else {
                    return;
                }
            }
            else if (obj.content instanceof TextNode) {
                sceneItem = context.scene.createAndAddSource(obj.name, byOS({ [OS.Windows]: 'text_gdiplus', [OS.Mac]: 'text_ft2_source' }), {}, { id, select: false, display });
            }
            else if (obj.content instanceof VideoNode) {
                sceneItem = context.scene.createAndAddSource(obj.name, 'ffmpeg_source', {}, { id, select: false, display });
            }
            else if (obj.content instanceof IconLibraryNode) {
                sceneItem = context.scene.createAndAddSource(obj.name, 'image_source', {}, { id, select: false, sourceAddOptions: { propertiesManager: 'iconLibrary' }, display });
            }
            else if (obj.content instanceof StreamlabelNode) {
                sceneItem = context.scene.createAndAddSource(obj.name, byOS({ [OS.Windows]: 'text_gdiplus', [OS.Mac]: 'text_ft2_source' }), {}, { id, select: false, display });
            }
            else if (obj.content instanceof WidgetNode) {
                const widgetType = obj.content.data.type;
                this.sourcesService.views.sources.forEach(source => {
                    if (source.getPropertiesManagerType() === 'widget') {
                        const type = source.getPropertiesManagerSettings().widgetType;
                        if (widgetType === type) {
                            sceneItem = context.scene.addSource(source.sourceId, { id, select: false, display });
                            existing = true;
                        }
                    }
                });
                if (!sceneItem) {
                    sceneItem = context.scene.createAndAddSource(obj.name, 'browser_source', {}, { id, select: false, display });
                }
            }
            else if (obj.content instanceof SceneSourceNode) {
                const sceneId = obj.content.data.sceneId;
                sceneItem = context.scene.addSource(sceneId, { select: false, display });
                obj.scaleX *= obj.content.data.width / this.videoSettingsService.baseWidth;
                obj.scaleY *= obj.content.data.height / this.videoSettingsService.baseHeight;
            }
            else if (obj.content instanceof SmartBrowserNode) {
                sceneItem = context.scene.createAndAddSource(obj.name, 'browser_source', {}, {
                    id,
                    select: false,
                    sourceAddOptions: { propertiesManager: 'smartBrowserSource' },
                    display,
                });
            }
            this.adjustTransform(sceneItem, obj);
            this.setExtraSettings(sceneItem, obj);
            if (!existing) {
                yield obj.content.load({
                    sceneItem,
                    assetsPath: context.assetsPath,
                    savedAssets: context.savedAssets,
                });
            }
            if (sceneItem.getObsInput().audioMixers) {
                this.audioService.views.getSource(sceneItem.sourceId).setHidden(obj.mixerHidden);
            }
            if (obj.filters) {
                obj.filters.forEach(filter => {
                    this.sourceFiltersService.add(sceneItem.sourceId, filter.type, filter.name, filter.settings);
                });
            }
        });
    }
    adjustTransform(item, obj) {
        if (item.type === 'game_capture') {
            item.setTransform({
                position: {
                    x: obj.x * this.videoSettingsService.baseWidth,
                    y: obj.y * this.videoSettingsService.baseHeight,
                },
                crop: obj.crop,
                rotation: obj.rotation,
            });
        }
        else {
            item.setTransform({
                position: {
                    x: obj.x * this.videoSettingsService.baseWidth,
                    y: obj.y * this.videoSettingsService.baseHeight,
                },
                scale: {
                    x: obj.scaleX * this.videoSettingsService.baseWidth,
                    y: obj.scaleY * this.videoSettingsService.baseHeight,
                },
                crop: obj.crop,
                rotation: obj.rotation,
            });
        }
    }
    setExtraSettings(item, obj) {
        var _a, _b;
        item.setSettings({
            visible: (_a = obj.visible) !== null && _a !== void 0 ? _a : true,
            locked: (_b = obj.locked) !== null && _b !== void 0 ? _b : false,
        });
    }
}
__decorate([
    Inject()
], SlotsNode.prototype, "videoSettingsService", void 0);
__decorate([
    Inject()
], SlotsNode.prototype, "sourceFiltersService", void 0);
__decorate([
    Inject()
], SlotsNode.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], SlotsNode.prototype, "scenesService", void 0);
__decorate([
    Inject()
], SlotsNode.prototype, "audioService", void 0);
//# sourceMappingURL=slots.js.map