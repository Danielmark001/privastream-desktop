var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { debounce } from 'lodash-decorators';
import { Inject } from 'services/core/injector';
import { mutation, StatefulService } from '../core/stateful-service';
import { VideoFactory, Video, } from '../../../obs-api';
import { Subject } from 'rxjs';
const displays = ['horizontal', 'vertical'];
export var ESettingsVideoProperties;
(function (ESettingsVideoProperties) {
    ESettingsVideoProperties["baseRes"] = "Base";
    ESettingsVideoProperties["outputRes"] = "Output";
    ESettingsVideoProperties["scaleType"] = "ScaleType";
    ESettingsVideoProperties["fpsType"] = "FPSType";
    ESettingsVideoProperties["fpsCom"] = "FPSCommon";
    ESettingsVideoProperties["fpsNum"] = "FPSNum";
    ESettingsVideoProperties["fpsDen"] = "FPSDen";
    ESettingsVideoProperties["fpsInt"] = "FPSInt";
})(ESettingsVideoProperties || (ESettingsVideoProperties = {}));
const scaleTypeNames = {
    0: 'Disable',
    1: 'Point',
    2: 'Bicubic',
    3: 'Bilinear',
    4: 'Lanczos',
    5: 'Area',
};
const fpsTypeNames = {
    0: 'Common',
    1: 'Integer',
    2: 'Fractional',
};
export function invalidFps(num, den) {
    return num / den > 1000 || num / den < 1;
}
export class VideoSettingsService extends StatefulService {
    constructor() {
        super(...arguments);
        this.initialState = {
            horizontal: null,
            vertical: null,
        };
        this.establishedContext = new Subject();
        this.contexts = {
            horizontal: null,
            vertical: null,
        };
    }
    init() {
        this.establishVideoContext();
        if (this.dualOutputService.views.activeDisplays.vertical) {
            this.establishVideoContext('vertical');
        }
        this.establishedContext.next();
    }
    get values() {
        return {
            horizontal: this.formatVideoSettings('horizontal'),
            vertical: this.formatVideoSettings('vertical'),
        };
    }
    get baseResolution() {
        return this.baseResolutions.horizontal;
    }
    get baseWidth() {
        return this.baseResolutions.horizontal.baseWidth;
    }
    get baseHeight() {
        return this.baseResolutions.horizontal.baseHeight;
    }
    get baseResolutions() {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return {
            horizontal: {
                baseWidth: (_b = (_a = this.state.horizontal) === null || _a === void 0 ? void 0 : _a.baseWidth) !== null && _b !== void 0 ? _b : 1920,
                baseHeight: (_d = (_c = this.state.horizontal) === null || _c === void 0 ? void 0 : _c.baseHeight) !== null && _d !== void 0 ? _d : 1080,
            },
            vertical: {
                baseWidth: (_f = (_e = this.state.vertical) === null || _e === void 0 ? void 0 : _e.baseWidth) !== null && _f !== void 0 ? _f : 720,
                baseHeight: (_h = (_g = this.state.vertical) === null || _g === void 0 ? void 0 : _g.baseHeight) !== null && _h !== void 0 ? _h : 1280,
            },
        };
    }
    get outputResolutions() {
        var _a, _b, _c, _d;
        return {
            horizontal: {
                outputWidth: (_a = this.state.horizontal) === null || _a === void 0 ? void 0 : _a.outputWidth,
                outputHeight: (_b = this.state.horizontal) === null || _b === void 0 ? void 0 : _b.outputHeight,
            },
            vertical: {
                outputWidth: (_c = this.state.vertical) === null || _c === void 0 ? void 0 : _c.outputWidth,
                outputHeight: (_d = this.state.vertical) === null || _d === void 0 ? void 0 : _d.outputHeight,
            },
        };
    }
    formatVideoSettings(display = 'horizontal', typeStrings) {
        var _a, _b;
        const settings = (_b = (_a = this.state[display]) !== null && _a !== void 0 ? _a : this.dualOutputService.views.videoSettings[display]) !== null && _b !== void 0 ? _b : this.dualOutputService.views.videoSettings.vertical;
        const scaleType = typeStrings ? scaleTypeNames[settings === null || settings === void 0 ? void 0 : settings.scaleType] : settings === null || settings === void 0 ? void 0 : settings.scaleType;
        const fpsType = typeStrings ? fpsTypeNames[settings === null || settings === void 0 ? void 0 : settings.fpsType] : settings === null || settings === void 0 ? void 0 : settings.fpsType;
        return {
            baseRes: `${settings === null || settings === void 0 ? void 0 : settings.baseWidth}x${settings === null || settings === void 0 ? void 0 : settings.baseHeight}`,
            outputRes: `${settings === null || settings === void 0 ? void 0 : settings.outputWidth}x${settings === null || settings === void 0 ? void 0 : settings.outputHeight}`,
            scaleType,
            fpsType,
            fpsCom: `${settings === null || settings === void 0 ? void 0 : settings.fpsNum}-${settings === null || settings === void 0 ? void 0 : settings.fpsDen}`,
            fpsNum: settings === null || settings === void 0 ? void 0 : settings.fpsNum,
            fpsDen: settings === null || settings === void 0 ? void 0 : settings.fpsDen,
            fpsInt: settings === null || settings === void 0 ? void 0 : settings.fpsNum,
        };
    }
    loadLegacySettings(display = 'horizontal') {
        var _a, _b;
        const legacySettings = (_a = this.contexts[display]) === null || _a === void 0 ? void 0 : _a.legacySettings;
        const videoSettings = (_b = this.contexts[display]) === null || _b === void 0 ? void 0 : _b.video;
        if (!legacySettings && !videoSettings)
            return;
        if ((legacySettings === null || legacySettings === void 0 ? void 0 : legacySettings.baseHeight) === 0 || (legacySettings === null || legacySettings === void 0 ? void 0 : legacySettings.baseWidth) === 0) {
            if (!videoSettings)
                return;
            Object.keys(videoSettings).forEach((key) => {
                this.SET_VIDEO_SETTING(key, videoSettings[key]);
                this.dualOutputService.setVideoSetting({ [key]: videoSettings[key] }, display);
            });
        }
        else {
            if (!legacySettings)
                return;
            Object.keys(legacySettings).forEach((key) => {
                this.SET_VIDEO_SETTING(key, legacySettings[key]);
                this.dualOutputService.setVideoSetting({ [key]: legacySettings[key] }, display);
            });
            this.contexts[display].video = this.contexts[display].legacySettings;
        }
        if (invalidFps(this.contexts[display].video.fpsNum, this.contexts[display].video.fpsDen)) {
            this.createDefaultFps(display);
        }
    }
    migrateSettings(display = 'horizontal') {
        var _a;
        if (display === 'horizontal' && !((_a = this.dualOutputService.views.videoSettings) === null || _a === void 0 ? void 0 : _a.horizontal)) {
            this.loadLegacySettings();
            this.contexts.horizontal.video = this.contexts.horizontal.legacySettings;
        }
        else {
            const settings = this.dualOutputService.views.videoSettings[display];
            Object.keys(settings).forEach((key) => {
                this.SET_VIDEO_SETTING(key, settings[key], display);
            });
            this.contexts[display].video = settings;
            if (invalidFps(this.contexts[display].video.fpsNum, this.contexts[display].video.fpsDen)) {
                this.createDefaultFps(display);
            }
        }
        this.SET_VIDEO_CONTEXT(display, this.contexts[display].video);
    }
    establishVideoContext(display = 'horizontal') {
        if (this.contexts[display])
            return;
        this.SET_VIDEO_CONTEXT(display);
        this.contexts[display] = VideoFactory.create();
        this.migrateSettings(display);
        this.contexts[display].video = this.state[display];
        this.contexts[display].legacySettings = this.state[display];
        Video.video = this.state.horizontal;
        Video.legacySettings = this.state.horizontal;
        if (display === 'vertical') {
            const updated = this.syncFPSSettings();
            if (updated) {
                this.settingsService.refreshVideoSettings();
            }
            this.settingsService.setSettingValue('Video', 'Base', `${this.baseWidth}x${this.baseHeight}`);
            this.settingsService.setSettingValue('Video', 'Output', `${this.outputResolutions.horizontal.outputWidth}x${this.outputResolutions.horizontal.outputHeight}`);
        }
        return !!this.contexts[display];
    }
    validateVideoContext(display = 'vertical') {
        if (!this.contexts[display]) {
            this.establishVideoContext(display);
        }
    }
    createDefaultFps(display = 'horizontal') {
        this.setVideoSetting('fpsNum', 30, display);
        this.setVideoSetting('fpsDen', 1, display);
    }
    migrateAutoConfigSettings() {
        var _a;
        this.loadLegacySettings('horizontal');
        if ((_a = this.contexts) === null || _a === void 0 ? void 0 : _a.vertical) {
            const newVerticalSettings = Object.assign(Object.assign({}, this.contexts.horizontal.video), { baseWidth: this.state.vertical.baseWidth, baseHeight: this.state.vertical.baseHeight, outputWidth: this.state.vertical.outputWidth, outputHeight: this.state.vertical.outputHeight });
            this.updateVideoSettings(newVerticalSettings, 'vertical');
            const base = `${this.state.horizontal.baseWidth}x${this.state.horizontal.baseHeight}`;
            const output = `${this.state.horizontal.outputWidth}x${this.state.horizontal.outputHeight}`;
            this.settingsService.setSettingValue('Video', 'Base', base);
            this.settingsService.setSettingValue('Video', 'Output', output);
        }
        else {
            const horizontalScaleType = this.contexts.horizontal.video.scaleType;
            const horizontalFpsType = this.contexts.horizontal.video.fpsType;
            const horizontalFpsNum = this.contexts.horizontal.video.fpsNum;
            const horizontalFpsDen = this.contexts.horizontal.video.fpsDen;
            this.dualOutputService.setVideoSetting({ scaleType: horizontalScaleType }, 'vertical');
            this.dualOutputService.setVideoSetting({ fpsType: horizontalFpsType }, 'vertical');
            this.dualOutputService.setVideoSetting({ fpsNum: horizontalFpsNum }, 'vertical');
            this.dualOutputService.setVideoSetting({ fpsDen: horizontalFpsDen }, 'vertical');
        }
    }
    confirmVideoSettingDimensions() {
        const [baseWidth, baseHeight] = this.settingsService.views.values.Video.Base.split('x');
        const [outputWidth, outputHeight] = this.settingsService.views.values.Video.Output.split('x');
        if (Number(baseWidth) !== this.state.horizontal.baseWidth ||
            Number(baseHeight) !== this.state.horizontal.baseHeight) {
            const base = `${this.state.horizontal.baseWidth}x${this.state.horizontal.baseHeight}`;
            this.settingsService.setSettingValue('Video', 'Base', base);
        }
        if (Number(outputWidth) !== this.state.horizontal.outputWidth ||
            Number(outputHeight) !== this.state.horizontal.outputHeight) {
            const output = `${this.state.horizontal.outputWidth}x${this.state.horizontal.outputHeight}`;
            this.settingsService.setSettingValue('Video', 'Output', output);
        }
    }
    updateObsSettings(display = 'horizontal', shouldSyncFPS = false) {
        this.contexts[display].video = this.state[display];
        this.contexts[display].legacySettings = this.state[display];
        if (shouldSyncFPS) {
            this.syncFPSSettings();
        }
    }
    updateVideoSettings(patch, display = 'horizontal') {
        const newVideoSettings = Object.assign(Object.assign({}, this.state[display]), patch);
        this.SET_VIDEO_CONTEXT(display, newVideoSettings);
        this.updateObsSettings(display);
        this.dualOutputService.updateVideoSettings(newVideoSettings, display);
    }
    setVideoSetting(key, value, display = 'horizontal', shouldSyncFPS = false) {
        this.SET_VIDEO_SETTING(key, value, display);
        this.updateObsSettings(display, shouldSyncFPS);
        this.dualOutputService.setVideoSetting({ [key]: value }, display);
        this.settingsService.refreshVideoSettings();
    }
    setVideoSettings(display = 'horizontal', settings) {
        for (let i = 0; i < settings.length; i++) {
            const setting = settings[i];
            this.SET_VIDEO_SETTING(setting.key, setting.value, display);
            if (i === settings.length - 1) {
                this.updateObsSettings(display, true);
            }
            this.dualOutputService.setVideoSetting({ [setting.key]: setting.value }, display);
            this.settingsService.refreshVideoSettings();
        }
    }
    setSettings(settings, display = 'horizontal') {
        this.SET_SETTINGS(settings, display);
        this.updateObsSettings(display);
        this.dualOutputService.setVideoSetting(settings, display);
        this.settingsService.refreshVideoSettings();
    }
    syncFPSSettings(updateContexts) {
        const fpsSettings = ['scaleType', 'fpsType', 'fpsCom', 'fpsNum', 'fpsDen', 'fpsInt'];
        const verticalVideoSetting = this.contexts.vertical
            ? this.state.vertical
            : this.dualOutputService.views.videoSettings.vertical;
        let updated = false;
        fpsSettings.forEach((setting) => {
            const hasSameVideoSetting = this.contexts.horizontal.video[setting] ===
                verticalVideoSetting[setting];
            let shouldUpdate = hasSameVideoSetting;
            if (this.contexts.vertical) {
                const hasSameLegacySetting = this.contexts.horizontal.legacySettings[setting] ===
                    this.contexts.vertical.legacySettings[setting];
                shouldUpdate = !hasSameVideoSetting || !hasSameLegacySetting;
            }
            if (shouldUpdate) {
                const value = this.state.horizontal[setting];
                this.dualOutputService.setVideoSetting({ [setting]: value }, 'vertical');
                if (this.contexts.vertical) {
                    this.SET_VIDEO_SETTING(setting, value, 'vertical');
                }
                updated = true;
            }
        });
        if ((updateContexts || updated) && this.contexts.vertical) {
            this.contexts.vertical.video = this.state.vertical;
            this.contexts.vertical.legacySettings = this.state.vertical;
        }
        return updated;
    }
    shutdown() {
        displays.forEach(display => {
            if (this.contexts[display]) {
                this.contexts[display].legacySettings = this.state[display];
                this.contexts[display].destroy();
                this.contexts[display] = null;
                this.DESTROY_VIDEO_CONTEXT(display);
            }
        });
    }
    DESTROY_VIDEO_CONTEXT(display = 'horizontal') {
        this.state[display] = null;
    }
    SET_VIDEO_SETTING(key, value, display = 'horizontal') {
        this.state[display] = Object.assign(Object.assign({}, this.state[display]), { [key]: value });
    }
    SET_SETTINGS(settings, display = 'horizontal') {
        this.state[display] = Object.assign(Object.assign({}, this.state[display]), settings);
    }
    SET_VIDEO_CONTEXT(display = 'horizontal', settings) {
        if (settings) {
            this.state[display] = settings;
        }
        else {
            this.state[display] = {};
        }
    }
}
__decorate([
    Inject()
], VideoSettingsService.prototype, "dualOutputService", void 0);
__decorate([
    Inject()
], VideoSettingsService.prototype, "settingsService", void 0);
__decorate([
    Inject()
], VideoSettingsService.prototype, "outputSettingsService", void 0);
__decorate([
    debounce(200)
], VideoSettingsService.prototype, "updateObsSettings", null);
__decorate([
    mutation()
], VideoSettingsService.prototype, "DESTROY_VIDEO_CONTEXT", null);
__decorate([
    mutation()
], VideoSettingsService.prototype, "SET_VIDEO_SETTING", null);
__decorate([
    mutation()
], VideoSettingsService.prototype, "SET_SETTINGS", null);
__decorate([
    mutation()
], VideoSettingsService.prototype, "SET_VIDEO_CONTEXT", null);
//# sourceMappingURL=video.js.map