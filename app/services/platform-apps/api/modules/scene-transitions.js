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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import path from 'path';
import { getType } from 'mime';
import { apiMethod, EApiPermissions, Module } from './module';
import { ETransitionType, } from 'services/transitions';
import { Inject } from 'services/core/injector';
import url from 'url';
var ObsAudioFadeStyle;
(function (ObsAudioFadeStyle) {
    ObsAudioFadeStyle[ObsAudioFadeStyle["FadeOut"] = 0] = "FadeOut";
    ObsAudioFadeStyle[ObsAudioFadeStyle["CrossFade"] = 1] = "CrossFade";
})(ObsAudioFadeStyle || (ObsAudioFadeStyle = {}));
var ETransitionPointType;
(function (ETransitionPointType) {
    ETransitionPointType[ETransitionPointType["Time"] = 0] = "Time";
    ETransitionPointType[ETransitionPointType["Frame"] = 1] = "Frame";
})(ETransitionPointType || (ETransitionPointType = {}));
const stingerTransitionDefaultOptions = {
    type: 'stinger',
    transitionPointType: 'time',
    shouldMonitorAudio: false,
    audioFadeStyle: 'fadeOut',
    shouldLock: false,
};
export class SceneTransitionsModule extends Module {
    constructor() {
        super(...arguments);
        this.moduleName = 'SceneTransitions';
        this.permissions = [EApiPermissions.SceneTransitions];
    }
    createTransition(ctx, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (options.type === 'stinger') {
                const appId = ctx.app.id;
                if (!this.isVideo(options.url)) {
                    throw new Error('Invalid file specified, you must provide a video file.');
                }
                const parsed = url.parse(options.url);
                if (parsed.protocol) {
                    const allowlist = ctx.app.manifest.mediaDomains || [];
                    if (!allowlist.includes(parsed.hostname)) {
                        throw new Error(`The host ${parsed.hostname} was not found in the mediaDomains list`);
                    }
                }
                const assetUrl = this.platformAppAssetsService.assetPathOrUrlToUrl(appId, options.url);
                options.url = this.platformAppAssetsService.hasAsset(appId, assetUrl)
                    ? (yield this.platformAppAssetsService.getAssetDiskInfo(appId, assetUrl)).filePath
                    : yield this.platformAppAssetsService.addPlatformAppAsset(appId, assetUrl);
                const { shouldLock = false, name } = options, settings = __rest(options, ["shouldLock", "name"]);
                const transitionOptions = this.createTransitionOptions(appId, shouldLock, Object.assign(Object.assign({}, stingerTransitionDefaultOptions), settings));
                const transition = this.transitionsService.createTransition(ETransitionType.Stinger, name, transitionOptions);
                this.platformAppAssetsService.linkAsset(appId, assetUrl, 'transition', transition.id);
                return transition;
            }
            throw new Error('Not Implemented');
        });
    }
    getTransitions(_ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.transitionsService.state.transitions;
        });
    }
    getAppTransitions(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getTransitions(ctx).then(transitions => transitions.filter(transition => {
                const settings = this.transitionsService.getPropertiesManagerSettings(transition.id);
                return settings && settings.appId === ctx.app.id;
            }));
        });
    }
    setDefaultTransition(_ctx, transitionId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.transitionsService.setDefaultTransition(transitionId);
            return true;
        });
    }
    deleteTransition(_ctx, transitionId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.transitionsService.deleteTransition(transitionId);
            return true;
        });
    }
    createConnection(_ctx, transitionId, fromSceneId, toSceneId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.transitionsService.addConnection(fromSceneId, toSceneId, transitionId);
        });
    }
    getConnections(_ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.transitionsService.state.connections;
        });
    }
    deleteConnection(_ctx, connectionId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.transitionsService.deleteConnection(connectionId);
            return true;
        });
    }
    createTransitionOptions(appId, shouldLock, options) {
        const obsKeyMapping = {
            audioFadeStyle: 'audio_fade_style',
            transitionPointType: 'tp_type',
            shouldMonitorAudio: 'audio_monitoring',
            transitionPoint: 'transition_point',
            url: 'path',
        };
        const obsValueMapping = {
            type: (type) => {
                if (type === 'stinger') {
                    return ETransitionType.Stinger;
                }
            },
            audioFadeStyle: (x) => x === 'fadeOut' ? ObsAudioFadeStyle.FadeOut : ObsAudioFadeStyle.CrossFade,
            shouldMonitorAudio: (shouldMonitor) => (shouldMonitor ? 1 : 0),
            transitionPointType: (transitionPoint) => transitionPoint === 'time' ? ETransitionPointType.Time : ETransitionPointType.Frame,
        };
        const settings = {};
        Object.keys(options).forEach(key => {
            const val = options[key];
            if (obsKeyMapping[key]) {
                settings[obsKeyMapping[key]] = obsValueMapping[key] ? obsValueMapping[key](val) : val;
            }
        });
        return {
            propertiesManagerSettings: {
                appId,
                locked: shouldLock,
            },
            settings: Object.assign(Object.assign({}, settings), { path: options.url }),
        };
    }
    isVideo(url) {
        const mimeType = getType(path.basename(url));
        return /^video\/.*$/.test(mimeType);
    }
}
__decorate([
    Inject()
], SceneTransitionsModule.prototype, "transitionsService", void 0);
__decorate([
    Inject()
], SceneTransitionsModule.prototype, "platformAppAssetsService", void 0);
__decorate([
    apiMethod()
], SceneTransitionsModule.prototype, "createTransition", null);
__decorate([
    apiMethod()
], SceneTransitionsModule.prototype, "getTransitions", null);
__decorate([
    apiMethod()
], SceneTransitionsModule.prototype, "getAppTransitions", null);
__decorate([
    apiMethod()
], SceneTransitionsModule.prototype, "setDefaultTransition", null);
__decorate([
    apiMethod()
], SceneTransitionsModule.prototype, "deleteTransition", null);
__decorate([
    apiMethod()
], SceneTransitionsModule.prototype, "createConnection", null);
__decorate([
    apiMethod()
], SceneTransitionsModule.prototype, "getConnections", null);
__decorate([
    apiMethod()
], SceneTransitionsModule.prototype, "deleteConnection", null);
//# sourceMappingURL=scene-transitions.js.map