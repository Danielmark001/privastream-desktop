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
import { EEncoderFamily, } from 'services/settings';
import { EStreamingState } from 'services/streaming';
import { Inject, mutation, PersistentStatefulService } from 'services/core';
import cloneDeep from 'lodash/cloneDeep';
import { camelize, handleErrors } from '../../util/requests';
export * from './definitions';
export class VideoEncodingOptimizationService extends PersistentStatefulService {
    constructor() {
        super(...arguments);
        this.isUsingEncodingOptimizations = false;
    }
    init() {
        super.init();
        if (this.state.canSeeOptimizedProfile == null) {
            this.SET_CAN_SEE_OPTIMIZED_PROFILE(this.state.useOptimizedProfile);
        }
        this.streamingService.streamingStatusChange.subscribe(status => {
            if (status === EStreamingState.Offline && this.isUsingEncodingOptimizations) {
                this.isUsingEncodingOptimizations = false;
                this.restorePreviousValues();
            }
        });
    }
    fetchOptimizedProfile(game) {
        return __awaiter(this, void 0, void 0, function* () {
            const settings = this.outputSettingsService.getSettings().streaming;
            const profiles = yield this.fetchAvailableGameProfiles(game);
            const encoder = settings.encoder === EEncoderFamily.jim_nvenc ? EEncoderFamily.nvenc : settings.encoder;
            const filteredProfiles = profiles.filter(profile => {
                return (profile.encoder === encoder &&
                    profile.bitrateMax >= settings.bitrate &&
                    profile.bitrateMin <= settings.bitrate &&
                    (!settings.preset || settings.preset === profile.presetIn));
            });
            if (!filteredProfiles.length)
                return null;
            const resInPx = resToPx(settings.outputResolution);
            const profile = filteredProfiles.sort((profileA, profileZ) => {
                return (Math.abs(resToPx(profileA.resolutionIn) - resInPx) -
                    Math.abs(resToPx(profileZ.resolutionIn) - resInPx));
            })[0];
            profile.encoder = settings.encoder;
            return profile;
        });
    }
    fetchAvailableGameProfiles(game) {
        return __awaiter(this, void 0, void 0, function* () {
            let profiles = [];
            if (game === this.state.lastLoadedGame) {
                profiles = this.state.lastLoadedProfiles;
            }
            else if (game) {
                try {
                    profiles = yield fetch(this.urlService.getStreamlabsApi(`gamepresets/${encodeURIComponent(game.toUpperCase())}`))
                        .then(handleErrors)
                        .then(camelize);
                }
                catch (e) {
                }
            }
            if (!profiles.length) {
                try {
                    profiles = yield fetch(this.urlService.getStreamlabsApi('gamepresets/DEFAULT'))
                        .then(handleErrors)
                        .then(camelize);
                }
                catch (e) {
                    console.error('Error fetching game presets', e);
                }
            }
            if (profiles.length)
                this.CACHE_PROFILES(game, profiles);
            return cloneDeep(profiles);
        });
    }
    applyProfile(encoderProfile) {
        this.previousSettings = {
            output: cloneDeep(this.settingsService.state.Output.formData),
            video: cloneDeep(this.settingsService.state.Video.formData),
        };
        this.SAVE_LAST_SELECTED_PROFILE(encoderProfile);
        const currentSettings = this.outputSettingsService.getSettings();
        const newStreamingSettings = {
            encoder: encoderProfile.encoder,
            encoderOptions: encoderProfile.options,
            preset: encoderProfile.presetOut,
            rescaleOutput: false,
            bitrate: currentSettings.streaming.bitrate,
        };
        if (!currentSettings.streaming.hasCustomResolution &&
            this.userService.platformType !== 'tiktok') {
            newStreamingSettings.outputResolution = encoderProfile.resolutionOut;
        }
        console.log('Apply encoder settings', newStreamingSettings);
        this.outputSettingsService.setSettings({
            mode: 'Advanced',
            streaming: newStreamingSettings,
            recording: currentSettings.recording,
            replayBuffer: currentSettings.replayBuffer,
        });
        this.isUsingEncodingOptimizations = true;
    }
    canApplyProfileFromCache() {
        return !!(this.state.useOptimizedProfile && this.state.lastSelectedProfile);
    }
    applyProfileFromCache() {
        if (!this.canApplyProfileFromCache()) {
            return;
        }
        this.applyProfile(this.state.lastSelectedProfile);
    }
    useOptimizedProfile(enabled) {
        this.USE_OPTIMIZED_PROFILE(enabled);
    }
    restorePreviousValues() {
        this.outputSettingsService.setSettings({ streaming: { encoderOptions: '' } });
        this.settingsService.setSettings('Output', this.previousSettings.output);
        this.settingsService.setSettings('Video', this.previousSettings.video);
    }
    USE_OPTIMIZED_PROFILE(enabled) {
        this.state.useOptimizedProfile = enabled;
    }
    CACHE_PROFILES(game, profiles) {
        this.state.lastLoadedGame = game;
        this.state.lastLoadedProfiles = profiles;
    }
    SAVE_LAST_SELECTED_PROFILE(profile) {
        this.state.lastSelectedProfile = profile;
    }
    SET_CAN_SEE_OPTIMIZED_PROFILE(val) {
        this.state.canSeeOptimizedProfile = val;
    }
}
VideoEncodingOptimizationService.defaultState = {
    useOptimizedProfile: false,
    lastLoadedGame: '',
    lastLoadedProfiles: [],
    lastSelectedProfile: null,
    canSeeOptimizedProfile: null,
};
__decorate([
    Inject()
], VideoEncodingOptimizationService.prototype, "settingsService", void 0);
__decorate([
    Inject()
], VideoEncodingOptimizationService.prototype, "streamingService", void 0);
__decorate([
    Inject()
], VideoEncodingOptimizationService.prototype, "outputSettingsService", void 0);
__decorate([
    Inject()
], VideoEncodingOptimizationService.prototype, "urlService", void 0);
__decorate([
    Inject()
], VideoEncodingOptimizationService.prototype, "userService", void 0);
__decorate([
    mutation()
], VideoEncodingOptimizationService.prototype, "USE_OPTIMIZED_PROFILE", null);
__decorate([
    mutation()
], VideoEncodingOptimizationService.prototype, "CACHE_PROFILES", null);
__decorate([
    mutation()
], VideoEncodingOptimizationService.prototype, "SAVE_LAST_SELECTED_PROFILE", null);
__decorate([
    mutation()
], VideoEncodingOptimizationService.prototype, "SET_CAN_SEE_OPTIMIZED_PROFILE", null);
function resToPx(res) {
    return res
        .split('x')
        .map(px => Number(px))
        .reduce((prev, current) => prev * current);
}
//# sourceMappingURL=video-encoding-optimizations.js.map