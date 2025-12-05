import { ViewHandler } from '../core';
import { EStreamingState, ERecordingState, EReplayBufferState, } from './streaming-api';
import { StreamSettingsService } from '../settings/streaming';
import { UserService } from '../user';
import { RestreamService } from '../restream';
import { DualOutputService } from '../dual-output';
import { getPlatformService, platformList } from '../platforms';
import { TwitterService } from '../../app-services';
import cloneDeep from 'lodash/cloneDeep';
import difference from 'lodash/difference';
import { Services } from '../../components-react/service-provider';
import { getDefined } from '../../util/properties-type-guards';
import { IncrementalRolloutService } from 'services/incremental-rollout';
export class StreamInfoView extends ViewHandler {
    get settings() {
        return this.savedSettings;
    }
    get userView() {
        return this.getServiceViews(UserService);
    }
    get restreamView() {
        return this.getServiceViews(RestreamService);
    }
    get streamSettingsView() {
        return this.getServiceViews(StreamSettingsService);
    }
    get twitterView() {
        return this.getServiceViews(TwitterService);
    }
    get dualOutputView() {
        return this.getServiceViews(DualOutputService);
    }
    get incrementalRolloutView() {
        return this.getServiceViews(IncrementalRolloutService);
    }
    get streamingState() {
        return Services.StreamingService.state;
    }
    get streamingStatus() {
        return this.streamingState.streamingStatus;
    }
    get info() {
        return this.streamingState.info;
    }
    get error() {
        return this.info.error;
    }
    get lifecycle() {
        return this.info.lifecycle;
    }
    get customDestinations() {
        return this.settings.customDestinations || [];
    }
    get platforms() {
        return this.settings.platforms;
    }
    get checklist() {
        return this.info.checklist;
    }
    get game() {
        var _a, _b, _c;
        return ((((_a = this.platforms.twitch) === null || _a === void 0 ? void 0 : _a.enabled) && this.platforms.twitch.game) ||
            (((_b = this.platforms.facebook) === null || _b === void 0 ? void 0 : _b.enabled) && this.platforms.facebook.game) ||
            (((_c = this.platforms.trovo) === null || _c === void 0 ? void 0 : _c.enabled) && this.platforms.trovo.game) ||
            '');
    }
    getPlatformDisplayName(platform) {
        return getPlatformService(platform).displayName;
    }
    get warning() {
        return this.info.warning;
    }
    get allPlatforms() {
        return this.getSortedPlatforms(platformList);
    }
    get linkedPlatforms() {
        if (!this.userView.state.auth)
            return [];
        return this.allPlatforms.filter(p => this.isPlatformLinked(p));
    }
    get protectedModeEnabled() {
        return this.streamSettingsView.state.protectedModeEnabled;
    }
    get enabledPlatforms() {
        return this.getEnabledPlatforms(this.settings.platforms);
    }
    get enabledCustomDestinationHosts() {
        return (this.settings.customDestinations
            .filter(dest => dest.enabled)
            .map(dest => dest.url.split('/')[2]) || []);
    }
    get alwaysEnabledPlatforms() {
        return [
            ...(this.userView.isPrime || this.restreamView.state.tiktokGrandfathered
                ? ['tiktok']
                : []),
        ];
    }
    get alwaysShownPlatforms() {
        return [];
    }
    get platformsWithoutCustomFields() {
        return this.enabledPlatforms.filter(platform => !this.platforms[platform].useCustomFields);
    }
    checkEnabled(platform) {
        return this.enabledPlatforms.includes(platform);
    }
    getEnabledPlatforms(platforms) {
        return Object.keys(platforms).filter((platform) => { var _a; return this.linkedPlatforms.includes(platform) && ((_a = platforms[platform]) === null || _a === void 0 ? void 0 : _a.enabled); });
    }
    get isMultiplatformMode() {
        if (this.isStreamShiftMode)
            return true;
        if (this.isDualOutputMode)
            return false;
        return this.hasMultipleTargetsEnabled;
    }
    get hasMultipleTargetsEnabled() {
        return (this.protectedModeEnabled &&
            (this.enabledPlatforms.length > 1 ||
                this.settings.customDestinations.filter(dest => dest.enabled).length > 0));
    }
    get isStreamShiftMode() {
        return ((this.userView.isPrime && this.settings.streamShift && this.enabledPlatforms.length > 0) ||
            false);
    }
    get isStreamShiftMultistream() {
        return this.isStreamShiftMode && this.enabledPlatforms.length > 1;
    }
    get streamShiftStatus() {
        var _a;
        return (_a = this.restreamView.streamShiftStatus) !== null && _a !== void 0 ? _a : 'inactive';
    }
    get shouldSwitchStreams() {
        return this.restreamView.hasStreamShiftTargets;
    }
    get isSwitchingStream() {
        return this.restreamView.streamShiftStatus === 'active';
    }
    get shouldSetupRestream() {
        if (this.isStreamShiftMode)
            return true;
        const restreamDualOutputMode = this.isDualOutputMode && (this.horizontalStream.length > 1 || this.verticalStream.length > 1);
        return this.isMultiplatformMode || restreamDualOutputMode;
    }
    get displaysToRestream() {
        const displays = [];
        if (!this.isDualOutputMode)
            return displays;
        if (this.horizontalStream.length > 1) {
            displays.push('horizontal');
        }
        if (this.verticalStream.length > 1) {
            displays.push('vertical');
        }
        return displays;
    }
    get isDualOutputMode() {
        return this.dualOutputView.dualOutputMode && this.userView.isLoggedIn;
    }
    getPlatformDisplayType(platform) {
        var _a, _b;
        const display = (_b = (_a = this.settings.platforms[platform]) === null || _a === void 0 ? void 0 : _a.display) !== null && _b !== void 0 ? _b : 'horizontal';
        return display === 'both' ? 'horizontal' : display;
    }
    get activeDisplayPlatforms() {
        return this.enabledPlatforms.reduce((displayPlatforms, platform) => {
            var _a;
            const display = this.getPlatformDisplayType(platform);
            displayPlatforms[display].push(platform);
            if (((_a = this.settings.platforms[platform]) === null || _a === void 0 ? void 0 : _a.display) === 'both') {
                displayPlatforms.vertical.push(platform);
            }
            return displayPlatforms;
        }, { horizontal: [], vertical: [] });
    }
    get activeDisplayDestinations() {
        const destinations = this.customDestinations;
        return destinations.reduce((displayDestinations, destination) => {
            var _a;
            if (destination.enabled && !destination.dualStream) {
                displayDestinations[(_a = destination.display) !== null && _a !== void 0 ? _a : 'horizontal'].push(destination.url);
            }
            return displayDestinations;
        }, { horizontal: [], vertical: [] });
    }
    get horizontalStream() {
        return this.activeDisplayDestinations.horizontal.concat(this.activeDisplayPlatforms.horizontal);
    }
    get verticalStream() {
        const verticalDestinations = this.customDestinations.reduce((displayDestinations, destination) => {
            if (destination.enabled && !destination.dualStream) {
                displayDestinations.push(destination.url);
            }
            return displayDestinations;
        }, []);
        return verticalDestinations.concat(this.activeDisplayPlatforms.vertical);
    }
    get hasDualStream() {
        return this.enabledPlatforms.some((platform) => {
            var _a;
            return this.supports('dualStream', [platform]) &&
                ((_a = this.settings.platforms[platform]) === null || _a === void 0 ? void 0 : _a.display) === 'both';
        });
    }
    getCanStreamDualOutput(settings) {
        var _a, _b, _c;
        const platforms = (settings === null || settings === void 0 ? void 0 : settings.platforms) || this.settings.platforms;
        const customDestinations = (settings === null || settings === void 0 ? void 0 : settings.customDestinations) || this.customDestinations;
        const platformDisplays = { horizontal: [], vertical: [] };
        for (const platform in platforms) {
            if (((_a = platforms[platform]) === null || _a === void 0 ? void 0 : _a.enabled) &&
                ((_b = platforms[platform]) === null || _b === void 0 ? void 0 : _b.display) === 'both') {
                return true;
            }
            if ((_c = platforms[platform]) === null || _c === void 0 ? void 0 : _c.enabled) {
                const display = this.getPlatformDisplayType(platform);
                platformDisplays[display].push(platform);
            }
        }
        const destinationDisplays = customDestinations.reduce((displays, destination) => {
            if (destination.enabled && (destination === null || destination === void 0 ? void 0 : destination.display)) {
                displays[destination.display].push(destination.name);
            }
            return displays;
        }, { horizontal: [], vertical: [] });
        const horizontalHasDestinations = platformDisplays.horizontal.length > 0 || destinationDisplays.horizontal.length > 0;
        const verticalHasDestinations = platformDisplays.vertical.length > 0 || destinationDisplays.vertical.length > 0;
        return horizontalHasDestinations && verticalHasDestinations;
    }
    getIsValidRestreamConfig() {
        if (this.restreamView.canEnableRestream)
            return true;
        const numTargets = this.enabledPlatforms.length + this.customDestinations.filter(dest => dest.enabled).length;
        return (!this.isDualOutputMode &&
            this.enabledPlatforms.some(platform => {
                return this.alwaysEnabledPlatforms.includes(platform) && numTargets === 2;
            }));
    }
    get isMidStreamMode() {
        return this.streamingState.streamingStatus !== 'offline';
    }
    get viewerCount() {
        if (!this.enabledPlatforms.length)
            return 0;
        return this.enabledPlatforms
            .map(platform => getPlatformService(platform).state.viewersCount)
            .reduce((c1, c2) => c1 + c2);
    }
    get chatUrl() {
        if (!this.userView.isLoggedIn || !this.userView.auth)
            return '';
        const enabledPlatforms = this.enabledPlatforms;
        const platform = this.enabledPlatforms.includes(this.userView.auth.primaryPlatform)
            ? this.userView.auth.primaryPlatform
            : enabledPlatforms[0];
        if (platform) {
            return getPlatformService(platform).chatUrl;
        }
        return '';
    }
    getTweetText(streamTitle) {
        return `${streamTitle} ${this.twitterView.url}`;
    }
    get savedSettings() {
        var _a, _b;
        const destinations = {};
        this.linkedPlatforms.forEach(platform => {
            destinations[platform] = this.getSavedPlatformSettings(platform);
        });
        const platforms = this.applyCommonFields(destinations);
        const savedGoLiveSettings = this.streamSettingsView.state.goLiveSettings;
        const areNoPlatformsEnabled = () => Object.values(platforms).every(p => !p.enabled);
        if (areNoPlatformsEnabled()) {
            const primaryPlatform = (_a = this.userView.auth) === null || _a === void 0 ? void 0 : _a.primaryPlatform;
            if (primaryPlatform && platforms[primaryPlatform]) {
                platforms[primaryPlatform].enabled = true;
            }
        }
        return {
            platforms,
            advancedMode: !!((_b = this.streamSettingsView.state.goLiveSettings) === null || _b === void 0 ? void 0 : _b.advancedMode),
            optimizedProfile: undefined,
            customDestinations: (savedGoLiveSettings === null || savedGoLiveSettings === void 0 ? void 0 : savedGoLiveSettings.customDestinations) || [],
            recording: this.dualOutputView.recording || [],
            streamShift: (savedGoLiveSettings === null || savedGoLiveSettings === void 0 ? void 0 : savedGoLiveSettings.streamShift) || false,
        };
    }
    get isAdvancedMode() {
        return (this.isMultiplatformMode || this.isDualOutputMode) && this.settings.advancedMode;
    }
    get canShowAdvancedMode() {
        if (this.isStreamShiftMode) {
            return this.enabledPlatforms.length > 1;
        }
        return this.isMultiplatformMode || this.isDualOutputMode;
    }
    getCommonFields(platforms) {
        const commonFields = {
            title: '',
            description: '',
        };
        const destinations = Object.keys(platforms);
        const enabledDestinations = destinations.filter(dest => { var _a; return (_a = platforms[dest]) === null || _a === void 0 ? void 0 : _a.enabled; });
        const destinationsWithCommonSettings = enabledDestinations.filter(dest => !platforms[dest].useCustomFields);
        const destinationWithCustomSettings = difference(enabledDestinations, destinationsWithCommonSettings);
        destinationsWithCommonSettings.forEach(platform => {
            const destSettings = getDefined(platforms[platform]);
            Object.keys(commonFields).forEach(fieldName => {
                if (commonFields[fieldName] || !destSettings[fieldName])
                    return;
                commonFields[fieldName] = destSettings[fieldName];
            });
        });
        destinationWithCustomSettings.forEach(platform => {
            const destSettings = getDefined(platforms[platform]);
            Object.keys(commonFields).forEach(fieldName => {
                if (commonFields[fieldName] || !destSettings[fieldName])
                    return;
                commonFields[fieldName] = destSettings[fieldName];
            });
        });
        return commonFields;
    }
    applyCommonFields(platforms) {
        const commonFields = this.getCommonFields(platforms);
        const result = {};
        Object.keys(platforms).forEach(platform => {
            result[platform] = platforms[platform];
            result[platform].title = platforms[platform].title || commonFields.title;
            result[platform].description = platforms[platform].description || commonFields.description;
        });
        return result;
    }
    get commonFields() {
        return this.getCommonFields(this.settings.platforms);
    }
    getSortedPlatforms(platforms) {
        platforms = platforms.sort();
        return [
            ...platforms.filter(p => this.isPlatformLinked(p)),
            ...platforms.filter(p => !this.isPlatformLinked(p)),
        ];
    }
    isPrepopulated() {
        return this.enabledPlatforms.map(getPlatformService).every(p => p.state.isPrepopulated);
    }
    supports(capability, targetPlatforms) {
        const platforms = targetPlatforms || this.enabledPlatforms;
        for (const platform of platforms) {
            if (getPlatformService(platform).hasCapability(capability))
                return true;
        }
        return false;
    }
    isPlatformLinked(platform) {
        var _a, _b;
        if (!((_a = this.userView.auth) === null || _a === void 0 ? void 0 : _a.platforms))
            return false;
        return !!((_b = this.userView.auth) === null || _b === void 0 ? void 0 : _b.platforms[platform]);
    }
    isPrimaryPlatform(platform) {
        var _a;
        return platform === ((_a = this.userView.auth) === null || _a === void 0 ? void 0 : _a.primaryPlatform);
    }
    get isLoading() {
        const { error, lifecycle } = this.info;
        return !error && ['empty', 'prepopulate'].includes(lifecycle);
    }
    validateSettings(settings) {
        return '';
    }
    hasFailedChecks() {
        return !!Object.keys(this.info.checklist).find(check => this.info.checklist[check] === 'failed');
    }
    hasPendingChecks() {
        return !!Object.keys(this.info.checklist).find(check => this.info.checklist[check] === 'pending');
    }
    getPlatformSettings(platform) {
        return this.settings.platforms[platform];
    }
    setPrimaryPlatform(platform) {
        this.userView.setPrimaryPlatform(platform);
    }
    getSavedPlatformSettings(platform) {
        var _a, _b;
        const service = getPlatformService(platform);
        const savedDestinations = (_a = this.streamSettingsView.state.goLiveSettings) === null || _a === void 0 ? void 0 : _a.platforms;
        const { enabled, useCustomFields } = (savedDestinations && savedDestinations[platform]) || {
            enabled: false,
            useCustomFields: false,
        };
        const settings = cloneDeep(service.state.settings);
        if (settings && settings['broadcastId'])
            settings['broadcastId'] = '';
        if (settings && settings['thumbnail'])
            settings['thumbnail'] = '';
        if (platform === 'facebook' && settings && settings['liveVideoId']) {
            settings['liveVideoId'] = '';
        }
        const display = this.isDualOutputMode && savedDestinations
            ? (_b = savedDestinations[platform]) === null || _b === void 0 ? void 0 : _b.display
            : 'horizontal';
        return Object.assign(Object.assign({}, settings), { display,
            enabled,
            useCustomFields });
    }
    get delayEnabled() {
        return this.streamSettingsView.settings.delayEnable;
    }
    get delaySeconds() {
        return this.streamSettingsView.settings.delaySec;
    }
    get isStreaming() {
        return this.streamingState.streamingStatus !== EStreamingState.Offline;
    }
    get isRecording() {
        return this.streamingState.recordingStatus !== ERecordingState.Offline;
    }
    get isReplayBufferActive() {
        return this.streamingState.replayBufferStatus !== EReplayBufferState.Offline;
    }
    get isHorizontalStreaming() {
        return this.isStreaming;
    }
    get isVerticalStreaming() {
        return this.isStreaming;
    }
    get isHorizontalRecording() {
        return this.isRecording;
    }
    get isVerticalRecording() {
        return this.isRecording;
    }
    get isIdle() {
        return !this.isStreaming && !this.isRecording;
    }
    get replayBufferStatus() {
        return this.streamingState.replayBufferStatus;
    }
    get hasDestinations() {
        return this.enabledPlatforms.length > 0 || this.customDestinations.length > 0;
    }
    get selectiveRecording() {
        return this.streamingState.selectiveRecording;
    }
}
//# sourceMappingURL=streaming-view.js.map