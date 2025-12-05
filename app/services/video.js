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
import { Service } from './core/service';
import { InitAfter } from 'services/core';
import * as obs from '../../obs-api';
import { Inject } from './core/injector';
import Utils from './utils';
import { ScalableRectangle } from '../util/ScalableRectangle';
import { byOS, OS, getOS } from 'util/operating-systems';
import * as remote from '@electron/remote';
import { onUnload } from 'util/unload';
let nwr;
if (getOS() === OS.Mac) {
    nwr = remote.require('node-window-rendering');
}
const DISPLAY_ELEMENT_POLLING_INTERVAL = 500;
export class Display {
    constructor(name, options = {}) {
        var _a;
        this.name = name;
        this.isDestroyed = false;
        this.currentPosition = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
        };
        this.existingWindow = false;
        this.drawingUI = true;
        this.sourceId = options.sourceId;
        this.electronWindowId = options.electronWindowId || remote.getCurrentWindow().id;
        this.slobsWindowId = options.slobsWindowId || Utils.getCurrentUrlParams().windowId;
        this.renderingMode = options.renderingMode
            ? options.renderingMode
            : 0;
        const electronWindow = remote.BrowserWindow.fromId(this.electronWindowId);
        this.currentScale = this.windowsService.state[this.slobsWindowId].scaleFactor;
        this.type = (_a = options.type) !== null && _a !== void 0 ? _a : 'horizontal';
        this.videoService.actions.createOBSDisplay(this.electronWindowId, name, this.renderingMode, this.type, this.sourceId);
        this.displayDestroyed = false;
        if (this.selectionService.views.globalSelection.getSize() > 1) {
            this.switchGridlines(false);
        }
        this.selectionSubscription = this.selectionService.updated.subscribe((state) => {
            this.switchGridlines(state.selectedIds.length <= 1);
        });
        if (options.paddingColor) {
            this.videoService.actions.setOBSDisplayPaddingColor(name, options.paddingColor.r, options.paddingColor.g, options.paddingColor.b);
        }
        else {
            this.videoService.actions.setOBSDisplayPaddingColor(name, 11, 22, 28);
        }
        if (options.paddingSize != null) {
            this.videoService.actions.setOBSDisplayPaddingSize(name, options.paddingSize);
        }
        this.outputRegionCallbacks = [];
        this.boundClose = this.remoteClose.bind(this);
        electronWindow.on('close', this.boundClose);
        this.cancelUnload = onUnload(() => this.boundClose());
    }
    trackElement(element) {
        if (this.trackingInterval)
            clearInterval(this.trackingInterval);
        this.trackingFun = () => {
            const rect = this.getScaledRectangle(element.getBoundingClientRect());
            const shouldMoveResize = byOS({
                [OS.Windows]: false,
                [OS.Mac]: () => {
                    const scaleFactor = this.windowsService.state[this.slobsWindowId].scaleFactor;
                    const ret = this.currentScale !== scaleFactor;
                    this.currentScale = scaleFactor;
                    return ret;
                },
            });
            if (rect.x !== this.currentPosition.x ||
                rect.y !== this.currentPosition.y ||
                rect.width !== this.currentPosition.width ||
                rect.height !== this.currentPosition.height ||
                shouldMoveResize) {
                this.resize(rect.width, rect.height);
                this.move(rect.x, rect.y);
            }
        };
        window.setTimeout(() => this.trackingFun(), 0);
        this.trackingInterval = window.setInterval(this.trackingFun, DISPLAY_ELEMENT_POLLING_INTERVAL);
    }
    getScaledRectangle(rect) {
        const factor = byOS({
            [OS.Windows]: this.windowsService.state[this.slobsWindowId].scaleFactor,
            [OS.Mac]: 1,
        });
        const yCoord = byOS({ [OS.Windows]: rect.top, [OS.Mac]: window.innerHeight - rect.bottom });
        return {
            x: rect.left * factor,
            y: yCoord * factor,
            width: rect.width * factor,
            height: rect.height * factor,
        };
    }
    move(x, y) {
        this.currentPosition.x = x;
        this.currentPosition.y = y;
        byOS({
            [OS.Windows]: () => this.videoService.actions.moveOBSDisplay(this.name, x, y),
            [OS.Mac]: () => nwr.moveWindow(this.name, x, y),
        });
    }
    resize(width, height) {
        return __awaiter(this, void 0, void 0, function* () {
            if (getOS() === OS.Mac && (width === 0 || height === 0 || this.displayDestroyed)) {
                return;
            }
            this.currentPosition.width = width;
            this.currentPosition.height = height;
            this.videoService.actions.resizeOBSDisplay(this.name, width, height);
            if (getOS() === OS.Mac) {
                if (this.existingWindow) {
                    nwr.destroyWindow(this.name);
                    nwr.destroyIOSurface(this.name);
                }
                try {
                    const surface = this.videoService.createOBSIOSurface(this.name);
                    nwr.createWindow(this.name, remote.BrowserWindow.fromId(this.electronWindowId).getNativeWindowHandle());
                    this.existingWindow = true;
                    nwr.connectIOSurface(this.name, surface);
                    if (this.outputRegionCallbacks.length) {
                        yield this.refreshOutputRegion();
                    }
                }
                catch (ex) {
                    console.log(`Error encountered creating iosurface: ${ex}`);
                }
            }
            else if (this.outputRegionCallbacks.length) {
                yield this.refreshOutputRegion();
            }
        });
    }
    remoteClose() {
        this.outputRegionCallbacks = [];
        if (this.trackingInterval)
            clearInterval(this.trackingInterval);
        if (this.selectionSubscription)
            this.selectionSubscription.unsubscribe();
        if (!this.displayDestroyed) {
            this.videoService.actions.destroyOBSDisplay(this.name);
            if (getOS() === OS.Mac) {
                nwr.destroyWindow(this.name);
                nwr.destroyIOSurface(this.name);
            }
            this.displayDestroyed = true;
        }
    }
    destroy() {
        const win = remote.BrowserWindow.fromId(this.electronWindowId);
        if (win) {
            win.removeListener('close', this.boundClose);
        }
        window.removeEventListener('beforeunload', this.boundClose);
        this.cancelUnload();
        this.remoteClose();
    }
    onOutputResize(cb) {
        this.outputRegionCallbacks.push(cb);
    }
    refreshOutputRegion() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.displayDestroyed)
                return;
            const position = yield this.videoService.actions.return.getOBSDisplayPreviewOffset(this.name);
            if (this.displayDestroyed)
                return;
            const size = yield this.videoService.actions.return.getOBSDisplayPreviewSize(this.name);
            this.outputRegion = Object.assign(Object.assign({}, position), size);
            this.outputRegionCallbacks.forEach(cb => {
                cb(this.outputRegion);
            });
        });
    }
    setShoulddrawUI(drawUI) {
        this.drawingUI = drawUI;
        this.videoService.actions.setOBSDisplayShouldDrawUI(this.name, drawUI);
    }
    switchGridlines(enabled) {
        if (!this.drawingUI)
            return;
        this.videoService.actions.setOBSDisplayDrawGuideLines(this.name, enabled);
    }
}
__decorate([
    Inject()
], Display.prototype, "settingsService", void 0);
__decorate([
    Inject()
], Display.prototype, "videoService", void 0);
__decorate([
    Inject()
], Display.prototype, "windowsService", void 0);
__decorate([
    Inject()
], Display.prototype, "selectionService", void 0);
let VideoService = class VideoService extends Service {
    init() {
        this.settingsService.loadSettingsIntoStore();
    }
    getScreenRectangle(display = 'horizontal') {
        return new ScalableRectangle({
            x: 0,
            y: 0,
            width: this.baseResolutions[display].baseWidth,
            height: this.baseResolutions[display].baseHeight,
        });
    }
    get baseResolutions() {
        const baseResolutions = this.videoSettingsService.baseResolutions;
        return {
            horizontal: {
                baseWidth: baseResolutions.horizontal.baseWidth,
                baseHeight: baseResolutions.horizontal.baseHeight,
            },
            vertical: {
                baseWidth: baseResolutions.vertical.baseWidth,
                baseHeight: baseResolutions.vertical.baseHeight,
            },
        };
    }
    setBaseResolution(resolutions) {
        var _a, _b;
        const baseWidth = (_a = resolutions === null || resolutions === void 0 ? void 0 : resolutions.horizontal.baseWidth) !== null && _a !== void 0 ? _a : this.videoSettingsService.baseResolutions.horizontal.baseWidth;
        const baseHeight = (_b = resolutions === null || resolutions === void 0 ? void 0 : resolutions.horizontal.baseHeight) !== null && _b !== void 0 ? _b : this.videoSettingsService.baseResolutions.horizontal.baseHeight;
        this.settingsService.setSettingValue('Video', 'Base', `${baseWidth}x${baseHeight}`);
    }
    createOBSDisplay(electronWindowId, name, renderingMode, type, sourceId) {
        var _a;
        const electronWindow = remote.BrowserWindow.fromId(electronWindowId);
        const context = (_a = this.videoSettingsService.contexts[type]) !== null && _a !== void 0 ? _a : this.videoSettingsService.contexts.horizontal;
        if (sourceId) {
            obs.NodeObs.OBS_content_createSourcePreviewDisplay(electronWindow.getNativeWindowHandle(), sourceId, name, false, context);
        }
        else {
            obs.NodeObs.OBS_content_createDisplay(electronWindow.getNativeWindowHandle(), name, renderingMode, false, context);
        }
    }
    setOBSDisplayPaddingColor(name, r, g, b) {
        obs.NodeObs.OBS_content_setPaddingColor(name, r, g, b);
    }
    setOBSDisplayPaddingSize(name, size) {
        obs.NodeObs.OBS_content_setPaddingSize(name, size);
    }
    moveOBSDisplay(name, x, y) {
        obs.NodeObs.OBS_content_moveDisplay(name, x, y);
    }
    resizeOBSDisplay(name, width, height) {
        obs.NodeObs.OBS_content_resizeDisplay(name, width, height);
    }
    destroyOBSDisplay(name) {
        obs.NodeObs.OBS_content_destroyDisplay(name);
    }
    getOBSDisplayPreviewOffset(name) {
        return obs.NodeObs.OBS_content_getDisplayPreviewOffset(name);
    }
    getOBSDisplayPreviewSize(name) {
        return obs.NodeObs.OBS_content_getDisplayPreviewSize(name);
    }
    setOBSDisplayShouldDrawUI(name, drawUI) {
        obs.NodeObs.OBS_content_setShouldDrawUI(name, drawUI);
    }
    setOBSDisplayDrawGuideLines(name, drawGuideLines) {
        obs.NodeObs.OBS_content_setDrawGuideLines(name, drawGuideLines);
    }
    createOBSIOSurface(name) {
        return obs.NodeObs.OBS_content_createIOSurface(name);
    }
};
__decorate([
    Inject()
], VideoService.prototype, "settingsService", void 0);
__decorate([
    Inject()
], VideoService.prototype, "scenesService", void 0);
__decorate([
    Inject()
], VideoService.prototype, "videoSettingsService", void 0);
__decorate([
    Inject()
], VideoService.prototype, "dualOutputService", void 0);
__decorate([
    Inject()
], VideoService.prototype, "sourcesService", void 0);
VideoService = __decorate([
    InitAfter('UserService'),
    InitAfter('VideoSettingsService')
], VideoService);
export { VideoService };
//# sourceMappingURL=video.js.map