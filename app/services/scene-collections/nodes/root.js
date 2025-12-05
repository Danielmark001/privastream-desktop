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
import { Node } from './node';
import { SourcesNode } from './sources';
import { ScenesNode } from './scenes';
import { TransitionsNode } from './transitions';
import { HotkeysNode } from './hotkeys';
import { NodeMapNode } from './node-map';
import { Inject } from 'services/core';
import { GuestCamNode } from './guest-cam';
export class RootNode extends Node {
    constructor() {
        super(...arguments);
        this.schemaVersion = 4;
    }
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const nodeMap = new NodeMapNode();
            const sources = new SourcesNode();
            const scenes = new ScenesNode();
            const transitions = new TransitionsNode();
            const hotkeys = new HotkeysNode();
            const guestCam = new GuestCamNode();
            yield nodeMap.save();
            yield sources.save({});
            yield scenes.save({});
            yield transitions.save();
            yield hotkeys.save({});
            yield guestCam.save();
            this.data = {
                sources,
                scenes,
                transitions,
                hotkeys,
                guestCam,
                nodeMap,
                baseResolution: (_a = this.videoSettingsService.baseResolutions) === null || _a === void 0 ? void 0 : _a.horizontal,
                baseResolutions: this.videoSettingsService.baseResolutions,
                selectiveRecording: this.streamingService.state.selectiveRecording,
                dualOutputMode: this.dualOutputService.views.dualOutputMode,
                operatingSystem: process.platform,
            };
        });
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.videoSettingsService.contexts.horizontal) {
                const establishedContext = this.videoSettingsService.establishedContext.subscribe(() => __awaiter(this, void 0, void 0, function* () {
                    this.videoService.setBaseResolution(this.data.baseResolutions);
                    this.streamingService.setSelectiveRecording(!!this.data.selectiveRecording);
                    this.streamingService.setDualOutputMode(this.data.dualOutputMode);
                    yield this.data.transitions.load();
                    yield this.data.sources.load({});
                    yield this.data.scenes.load({});
                    if (this.data.nodeMap) {
                        yield this.data.nodeMap.load();
                    }
                    if (this.data.hotkeys) {
                        yield this.data.hotkeys.load({});
                    }
                    if (this.data.guestCam) {
                        yield this.data.guestCam.load();
                    }
                    establishedContext.unsubscribe();
                }));
            }
            else {
                this.videoService.setBaseResolution(this.data.baseResolutions);
                this.streamingService.setSelectiveRecording(!!this.data.selectiveRecording);
                this.streamingService.setDualOutputMode(this.data.dualOutputMode);
                if (this.data.nodeMap) {
                    yield this.data.nodeMap.load();
                }
                yield this.data.transitions.load();
                yield this.data.sources.load({});
                yield this.data.scenes.load({});
                if (this.data.hotkeys) {
                    yield this.data.hotkeys.load({});
                }
                if (this.data.guestCam) {
                    yield this.data.guestCam.load();
                }
            }
        });
    }
    migrate(version) {
        if (version < 2) {
            this.data.transitions = this.data['transition'];
        }
        if (version < 3) {
            this.data.baseResolution = this.videoSettingsService.baseResolution;
        }
        if (version < 4) {
            this.data.baseResolutions = this.videoSettingsService.baseResolutions;
        }
    }
}
__decorate([
    Inject()
], RootNode.prototype, "videoService", void 0);
__decorate([
    Inject()
], RootNode.prototype, "streamingService", void 0);
__decorate([
    Inject()
], RootNode.prototype, "videoSettingsService", void 0);
__decorate([
    Inject()
], RootNode.prototype, "dualOutputService", void 0);
__decorate([
    Inject()
], RootNode.prototype, "settingsService", void 0);
__decorate([
    Inject()
], RootNode.prototype, "sceneCollectionsService", void 0);
//# sourceMappingURL=root.js.map