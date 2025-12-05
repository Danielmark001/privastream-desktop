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
import { SettingsService } from 'services/settings';
import { Inject } from 'services/core/injector';
import { InitAfter, mutation, PersistentStatefulService, ViewHandler } from '../../core';
import { getPlatformService } from 'services/platforms';
import pick from 'lodash/pick';
import invert from 'lodash/invert';
import cloneDeep from 'lodash/cloneDeep';
import Vue from 'vue';
const platformToServiceNameMap = {
    twitch: 'Twitch',
    youtube: 'YouTube / YouTube Gaming',
    facebook: 'Facebook Live',
    trovo: 'Trovo',
    tiktok: 'Custom',
    twitter: 'Custom',
    instagram: 'Custom',
    kick: 'Custom',
};
let StreamSettingsService = class StreamSettingsService extends PersistentStatefulService {
    init() {
        super.init();
        this.userService.userLogin.subscribe((_) => __awaiter(this, void 0, void 0, function* () {
            yield this.migrateOffProtectedModeIfRequired();
        }));
        this.userService.userLogout.subscribe((_) => __awaiter(this, void 0, void 0, function* () {
            this.resetStreamSettings();
        }));
    }
    get views() {
        return new StreamSettingsView(this.state);
    }
    setSettings(patch, context) {
        const streamName = !context || context === 'horizontal' ? 'Stream' : 'StreamSecond';
        const localStorageSettings = [
            'protectedModeEnabled',
            'protectedModeMigrationRequired',
            'title',
            'description',
            'warnNoVideoSources',
            'goLiveSettings',
        ];
        localStorageSettings.forEach(prop => {
            if (prop in patch) {
                this.SET_LOCAL_STORAGE_SETTINGS({ [prop]: patch[prop] });
            }
        });
        let streamFormData = streamName === 'StreamSecond'
            ? cloneDeep(this.views.obsStreamSecondSettings)
            : cloneDeep(this.views.obsStreamSettings);
        streamFormData.forEach(subCategory => {
            subCategory.parameters.forEach(parameter => {
                if (parameter.name === 'streamType' && patch.streamType !== void 0) {
                    parameter.value = patch.streamType;
                    this.settingsService.setSettings(streamName, streamFormData);
                }
            });
        });
        const mustUpdateObsSettings = Object.keys(patch).find(key => ['platform', 'key', 'server', 'bearer_token'].includes(key));
        if (!mustUpdateObsSettings)
            return;
        streamFormData =
            streamName === 'StreamSecond'
                ? cloneDeep(this.views.obsStreamSecondSettings)
                : cloneDeep(this.views.obsStreamSettings);
        streamFormData.forEach(subCategory => {
            subCategory.parameters.forEach(parameter => {
                if (parameter.name === 'service' && patch.platform !== void 0) {
                    parameter.value = platformToServiceNameMap[patch.platform];
                }
                if (parameter.name === 'key' && patch.key !== void 0) {
                    parameter.value = patch.key;
                }
                if (parameter.name === 'server' && patch.server !== void 0) {
                    parameter.value = patch.server;
                }
            });
        });
        this.settingsService.setSettings(streamName, streamFormData);
    }
    setGoLiveSettings(settingsPatch) {
        const patch = settingsPatch;
        if (settingsPatch.platforms) {
            const pickedFields = ['enabled', 'useCustomFields', 'display'];
            const platforms = {};
            Object.keys(settingsPatch.platforms).map(platform => {
                const platformSettings = pick(settingsPatch.platforms[platform], pickedFields);
                if (this.streamingService.views.isDualOutputMode) {
                    this.videoSettingsService.validateVideoContext();
                    const display = this.streamingService.views.getPlatformDisplayType(platform);
                    platformSettings.video = this.videoSettingsService.contexts[display];
                }
                return (platforms[platform] = platformSettings);
            });
            patch.platforms = platforms;
        }
        this.setSettings({
            goLiveSettings: Object.assign(Object.assign({}, this.state.goLiveSettings), settingsPatch),
        });
    }
    get settings() {
        const obsStreamSettings = this.settingsService.views.values.Stream;
        const obsGeneralSettings = this.settingsService.views.values.General;
        const obsAdvancedSettings = this.settingsService.views.values.Advanced;
        return {
            protectedModeEnabled: this.state.protectedModeEnabled,
            title: this.state.title,
            description: this.state.description,
            warnNoVideoSources: this.state.warnNoVideoSources,
            protectedModeMigrationRequired: this.state.protectedModeMigrationRequired,
            goLiveSettings: this.state.goLiveSettings,
            platform: invert(platformToServiceNameMap)[obsStreamSettings.service],
            key: obsStreamSettings.key,
            server: obsStreamSettings.server,
            service: obsStreamSettings.service,
            streamType: obsStreamSettings.streamType,
            warnBeforeStartingStream: obsGeneralSettings.WarnBeforeStartingStream,
            recordWhenStreaming: obsGeneralSettings.RecordWhenStreaming,
            replayBufferWhileStreaming: obsGeneralSettings.ReplayBufferWhileStreaming,
            warnBeforeStoppingStream: obsGeneralSettings.WarnBeforeStoppingStream,
            keepRecordingWhenStreamStops: obsGeneralSettings.KeepRecordingWhenStreamStops,
            keepReplayBufferStreamStops: obsGeneralSettings.KeepReplayBufferStreamStops,
            delayEnable: obsAdvancedSettings.DelayEnable,
            delaySec: obsAdvancedSettings.DelaySec,
        };
    }
    setObsStreamSettings(formData, context) {
        const streamName = !context || context === 0 ? 'Stream' : 'StreamSecond';
        this.settingsService.setSettings(streamName, formData);
    }
    get protectedModeEnabled() {
        return this.userService.isLoggedIn && this.state.protectedModeEnabled;
    }
    isSafeToModifyStreamKey() {
        if (this.platformAppsService.state.loadedApps.find(app => app.id === '3ed9cf0dd4' && app.enabled)) {
            if (this.streamSettingsService.settings.streamType === 'rtmp_custom' &&
                this.streamSettingsService.settings.server === 'rtmp://live.mobcrush.net/slobs') {
                return false;
            }
        }
        return true;
    }
    resetStreamSettings() {
        this.setSettings({
            protectedModeEnabled: true,
            protectedModeMigrationRequired: false,
            key: '',
            streamType: 'rtmp_common',
            goLiveSettings: null,
        });
    }
    migrateOffProtectedModeIfRequired() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentStreamSettings = this.settings;
            if (!currentStreamSettings.protectedModeMigrationRequired)
                return;
            this.setSettings({ protectedModeMigrationRequired: false });
            if (this.userService.platformType === 'youtube') {
                if (currentStreamSettings.platform !== 'youtube') {
                    this.setSettings({ protectedModeEnabled: false });
                }
                return;
            }
            if (this.userService.platformType === 'facebook') {
                if (currentStreamSettings.platform !== 'facebook') {
                    this.setSettings({ protectedModeEnabled: false });
                }
                return;
            }
            if (currentStreamSettings.server !== 'auto') {
                this.setSettings({ protectedModeEnabled: false });
                return;
            }
            if (!currentStreamSettings.key)
                return;
            const platform = getPlatformService(this.userService.platformType);
            if ((yield platform.fetchStreamKey()) !== currentStreamSettings.key) {
                this.setSettings({ protectedModeEnabled: false });
                return;
            }
            return false;
        });
    }
    SET_LOCAL_STORAGE_SETTINGS(settings) {
        Object.keys(settings).forEach(prop => {
            Vue.set(this.state, prop, settings[prop]);
        });
    }
};
StreamSettingsService.defaultState = {
    protectedModeEnabled: true,
    protectedModeMigrationRequired: true,
    title: '',
    description: '',
    warnNoVideoSources: true,
    goLiveSettings: undefined,
};
__decorate([
    Inject()
], StreamSettingsService.prototype, "settingsService", void 0);
__decorate([
    Inject()
], StreamSettingsService.prototype, "userService", void 0);
__decorate([
    Inject()
], StreamSettingsService.prototype, "platformAppsService", void 0);
__decorate([
    Inject()
], StreamSettingsService.prototype, "streamSettingsService", void 0);
__decorate([
    Inject()
], StreamSettingsService.prototype, "dualOutputService", void 0);
__decorate([
    Inject()
], StreamSettingsService.prototype, "streamingService", void 0);
__decorate([
    Inject()
], StreamSettingsService.prototype, "videoSettingsService", void 0);
__decorate([
    mutation()
], StreamSettingsService.prototype, "SET_LOCAL_STORAGE_SETTINGS", null);
StreamSettingsService = __decorate([
    InitAfter('UserService')
], StreamSettingsService);
export { StreamSettingsService };
class StreamSettingsView extends ViewHandler {
    get settingsViews() {
        return this.getServiceViews(SettingsService);
    }
    get obsStreamSettings() {
        return this.getServiceViews(SettingsService).state.Stream.formData;
    }
    get obsStreamSecondSettings() {
        return this.getServiceViews(SettingsService).state.StreamSecond.formData;
    }
    get settings() {
        const obsStreamSettings = this.settingsViews.values.Stream;
        const obsGeneralSettings = this.settingsViews.values.General;
        const obsAdvancedSettings = this.settingsViews.values.Advanced;
        return {
            protectedModeEnabled: this.state.protectedModeEnabled,
            title: this.state.title,
            description: this.state.description,
            warnNoVideoSources: this.state.warnNoVideoSources,
            protectedModeMigrationRequired: this.state.protectedModeMigrationRequired,
            goLiveSettings: this.state.goLiveSettings,
            platform: invert(platformToServiceNameMap)[obsStreamSettings.service],
            key: obsStreamSettings.key,
            server: obsStreamSettings.server,
            service: obsStreamSettings.service,
            streamType: obsStreamSettings.streamType,
            warnBeforeStartingStream: obsGeneralSettings.WarnBeforeStartingStream,
            recordWhenStreaming: obsGeneralSettings.RecordWhenStreaming,
            replayBufferWhileStreaming: obsGeneralSettings.ReplayBufferWhileStreaming,
            warnBeforeStoppingStream: obsGeneralSettings.WarnBeforeStoppingStream,
            keepRecordingWhenStreamStops: obsGeneralSettings.KeepRecordingWhenStreamStops,
            keepReplayBufferStreamStops: obsGeneralSettings.KeepReplayBufferStreamStops,
            delayEnable: obsAdvancedSettings.DelayEnable,
            delaySec: obsAdvancedSettings.DelaySec,
        };
    }
}
//# sourceMappingURL=stream-settings.js.map