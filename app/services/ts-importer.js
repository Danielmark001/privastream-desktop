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
import { RunInLoadingMode } from './app/app-decorators';
import { Inject, StatefulService, ViewHandler, mutation } from './core';
import * as remote from '@electron/remote';
import path from 'path';
import fs from 'fs';
import Utils from './utils';
import { WidgetType } from './widgets';
export class TwitchStudioImporterService extends StatefulService {
    get views() {
        return new TwitchStudioImporterViews(this.state);
    }
    init() {
        if (fs.existsSync(this.views.dataDir)) {
            this.SET_IS_TWITCH_STUDIO_INSTALLED(true);
        }
    }
    SET_IS_TWITCH_STUDIO_INSTALLED(val) {
        this.state.isTwitchStudioInstalled = val;
    }
    import() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.load();
        });
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.views.isTwitchStudioInstalled()) {
                console.error('Twitch Studio is not installed!');
                return;
            }
            const config = JSON.parse(fs.readFileSync(this.views.layoutsFile).toString());
            yield this.sceneCollectionsService.create({
                name: 'Twitch Studio Imported',
                setupFunction: () => __awaiter(this, void 0, void 0, function* () {
                    this.setupVideo(config);
                    this.importScenes(config);
                    return this.scenesService.views.scenes.length !== 0;
                }),
            });
        });
    }
    setupVideo(config) {
        this.videoSettingsService.setVideoSetting('baseWidth', config.graphics.canvasWidth);
        this.videoSettingsService.setVideoSetting('baseHeight', config.graphics.canvasHeight);
    }
    importScenes(config) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            for (const layout of config.layoutSettings.layouts) {
                if (((_a = layout.collections[0]) === null || _a === void 0 ? void 0 : _a.name) === 'unlisted')
                    continue;
                const scene = this.scenesService.createScene(layout.displayName, { makeActive: true });
                const compositor = config.graph.nodes.find(n => n.id === layout.videoOutput);
                if (compositor.pluginId === 'compositor') {
                    for (const input of compositor.inputs) {
                        try {
                            yield this.importSource(compositor.pluginSettings.layers[input], config.graph.nodes.find(n => n.id === input));
                        }
                        catch (e) {
                            console.error('Got error importing source!', input, e);
                        }
                    }
                }
                else {
                    console.error(`Expected layout videoOutput to be a compositor but instead is ${compositor.pluginId}`);
                }
            }
        });
    }
    importSource(layer, node) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
            let item;
            let noCrop = false;
            let widthOverride;
            let heightOverride;
            if (node.pluginId === 'windowsVideoCapture') {
                let webcamSource = this.sourcesService.views.getSourcesByType('dshow_input')[0];
                if (!webcamSource) {
                    webcamSource = this.sourcesService.createSource(layer.name, 'dshow_input');
                    const input = webcamSource.getObsInput();
                    const deviceProperty = input.properties.get('video_device_id');
                    if (deviceProperty.details.items.length === 0)
                        return;
                    const device = this.defaultHardwareService.state.defaultVideoDevice
                        ? this.defaultHardwareService.state.defaultVideoDevice
                        : (_a = deviceProperty.details.items.find(i => i.value)) === null || _a === void 0 ? void 0 : _a.value;
                    if (!device)
                        return;
                    input.update({ video_device_id: device });
                    yield this.waitForNonzeroSize(webcamSource);
                }
                item = this.scenesService.views.activeScene.addSource(webcamSource.sourceId);
            }
            else if (node.pluginId === 'nativeMedia') {
                if (node.pluginSettings.media.type === 'image') {
                    item = this.scenesService.views.activeScene.createAndAddSource(layer.name, 'image_source');
                    item.getObsInput().update({ file: node.pluginSettings.media.filePath });
                    yield this.waitForNonzeroSize(item.getSource());
                }
                else {
                    item = this.scenesService.views.activeScene.createAndAddSource(layer.name, 'ffmpeg_source');
                    item.getObsInput().update({ local_file: node.pluginSettings.media.filePath });
                    yield this.waitForNonzeroSize(item.getSource());
                }
            }
            else if (node.pluginId === 'nativeText') {
                item = this.scenesService.views.activeScene.createAndAddSource(layer.name, 'text_gdiplus');
                item.getObsInput().update({
                    font: {
                        face: (_c = (_b = node.pluginSettings.font) === null || _b === void 0 ? void 0 : _b.family) !== null && _c !== void 0 ? _c : 'Arial',
                        size: (_e = (_d = node.pluginSettings.font) === null || _d === void 0 ? void 0 : _d.size) !== null && _e !== void 0 ? _e : 40,
                    },
                    text: node.pluginSettings.text,
                    extents: true,
                    extents_cx: node.pluginSettings.outputSize.width,
                    extents_cy: node.pluginSettings.outputSize.height,
                    color: Utils.rgbaToInt(((_g = (_f = node.pluginSettings.color) === null || _f === void 0 ? void 0 : _f.r) !== null && _g !== void 0 ? _g : 1) * 255, ((_j = (_h = node.pluginSettings.color) === null || _h === void 0 ? void 0 : _h.g) !== null && _j !== void 0 ? _j : 1) * 255, ((_l = (_k = node.pluginSettings.color) === null || _k === void 0 ? void 0 : _k.b) !== null && _l !== void 0 ? _l : 1) * 255, ((_o = (_m = node.pluginSettings.color) === null || _m === void 0 ? void 0 : _m.a) !== null && _o !== void 0 ? _o : 1) * 255),
                });
                yield this.waitForNonzeroSize(item.getSource());
                noCrop = true;
            }
            else if (node.pluginId === 'browserSource') {
                item = this.scenesService.views.activeScene.createAndAddSource(layer.name, 'browser_source');
                item.getObsInput().update({
                    width: node.pluginSettings.outputSize.width,
                    height: node.pluginSettings.outputSize.height,
                });
                if (node.pluginSettings.url.match(/firstPartyAlerts/)) {
                    item.getSource().replacePropertiesManager('widget', { widgetType: WidgetType.AlertBox });
                }
                else if (node.pluginSettings.url.match(/twitch\.tv\/layer\/chat/)) {
                    item.getSource().replacePropertiesManager('widget', { widgetType: WidgetType.ChatBox });
                }
                else if (node.pluginSettings.url.match(/twitch\.tv\/layer\/channelGoal/)) {
                    item
                        .getSource()
                        .replacePropertiesManager('widget', { widgetType: WidgetType.FollowerGoal });
                }
                else {
                    item.getObsInput().update({ url: node.pluginSettings.url });
                }
                widthOverride = node.pluginSettings.outputSize.width;
                heightOverride = node.pluginSettings.outputSize.height;
            }
            else if (node.pluginId === 'colorInput') {
                item = this.scenesService.views.activeScene.createAndAddSource(layer.name, 'color_source');
                item.getObsInput().update({
                    color: Utils.rgbaToInt(((_q = (_p = node.pluginSettings.color) === null || _p === void 0 ? void 0 : _p.r) !== null && _q !== void 0 ? _q : 1) * 255, ((_s = (_r = node.pluginSettings.color) === null || _r === void 0 ? void 0 : _r.g) !== null && _s !== void 0 ? _s : 1) * 255, ((_u = (_t = node.pluginSettings.color) === null || _t === void 0 ? void 0 : _t.b) !== null && _u !== void 0 ? _u : 1) * 255, ((_w = (_v = node.pluginSettings.color) === null || _v === void 0 ? void 0 : _v.a) !== null && _w !== void 0 ? _w : 1) * 255),
                    width: node.pluginSettings.outputSize.width,
                    height: node.pluginSettings.outputSize.height,
                });
                widthOverride = node.pluginSettings.outputSize.width;
                heightOverride = node.pluginSettings.outputSize.height;
            }
            else if (node.pluginId === 'primaryScreenShare') {
                item = this.scenesService.views.activeScene.createAndAddSource(layer.name, 'screen_capture');
                widthOverride = this.videoService.baseResolutions.horizontal.baseWidth;
                heightOverride = this.videoService.baseResolutions.horizontal.baseHeight;
            }
            else {
                console.warn(`Twitch Studio Importer: Unknown plugin type ${layer.plugin.id}`);
            }
            if (item) {
                const targetWidth = (1 - layer.position.right - layer.position.left) *
                    this.videoService.baseResolutions.horizontal.baseWidth;
                const targetHeight = (1 - layer.position.bottom - layer.position.top) *
                    this.videoService.baseResolutions.horizontal.baseHeight;
                const sourceWidth = widthOverride !== null && widthOverride !== void 0 ? widthOverride : item.getSource().width;
                const sourceHeight = heightOverride !== null && heightOverride !== void 0 ? heightOverride : item.getSource().height;
                const scaleX = targetWidth / sourceWidth;
                const scaleY = targetHeight / sourceHeight;
                let scale = 0;
                const crop = { left: 0, right: 0, top: 0, bottom: 0 };
                if (scaleX > scaleY) {
                    scale = scaleX;
                    const height = sourceHeight * scale;
                    if (!noCrop) {
                        crop.top = (height - targetHeight) / 2;
                        crop.bottom = (height - targetHeight) / 2;
                    }
                }
                else {
                    scale = scaleY;
                    const width = sourceWidth * scale;
                    if (!noCrop) {
                        crop.left = (width - targetWidth) / 2;
                        crop.right = (width - targetWidth) / 2;
                    }
                }
                const x = this.videoService.baseResolutions.horizontal.baseWidth * layer.position.left;
                const y = this.videoService.baseResolutions.horizontal.baseHeight * layer.position.top;
                item.setTransform({ scale: { x: scale, y: scale }, position: { x, y }, crop });
            }
        });
    }
    waitForNonzeroSize(source) {
        return new Promise(resolve => {
            const sub = this.sourcesService.sourceUpdated.subscribe(s => {
                if (s.sourceId === source.sourceId && s.width) {
                    sub.unsubscribe();
                    resolve();
                }
            });
            setTimeout(() => {
                sub.unsubscribe();
                resolve();
            }, 5 * 1000);
        });
    }
}
TwitchStudioImporterService.initialState = {
    isTwitchStudioInstalled: false,
};
__decorate([
    Inject()
], TwitchStudioImporterService.prototype, "sceneCollectionsService", void 0);
__decorate([
    Inject()
], TwitchStudioImporterService.prototype, "scenesService", void 0);
__decorate([
    Inject()
], TwitchStudioImporterService.prototype, "settingsService", void 0);
__decorate([
    Inject()
], TwitchStudioImporterService.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], TwitchStudioImporterService.prototype, "defaultHardwareService", void 0);
__decorate([
    Inject()
], TwitchStudioImporterService.prototype, "videoService", void 0);
__decorate([
    Inject()
], TwitchStudioImporterService.prototype, "videoSettingsService", void 0);
__decorate([
    mutation()
], TwitchStudioImporterService.prototype, "SET_IS_TWITCH_STUDIO_INSTALLED", null);
__decorate([
    RunInLoadingMode()
], TwitchStudioImporterService.prototype, "import", null);
class TwitchStudioImporterViews extends ViewHandler {
    get dataDir() {
        return path.join(remote.app.getPath('appData'), 'Twitch Studio');
    }
    get layoutsFile() {
        return path.join(this.dataDir, 'layouts.json');
    }
    isTwitchStudioInstalled() {
        return this.state.isTwitchStudioInstalled;
    }
}
//# sourceMappingURL=ts-importer.js.map