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
import Vue from 'vue';
import { mutation, StatefulService } from 'services/core/stateful-service';
import { Global, NodeObs, } from '../../../obs-api';
import { Inject } from 'services/core/injector';
import moment from 'moment';
import padStart from 'lodash/padStart';
import { Subject } from 'rxjs';
import { ERecordingState, EReplayBufferState, EStreamingState, } from './streaming-api';
import { $t } from 'services/i18n';
import { getPlatformService, platformLabels, } from 'services/platforms';
import { ENotificationSubType, ENotificationType, } from 'services/notifications';
import Utils from 'services/utils';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import { createStreamError, StreamError, formatUnknownErrorMessage, formatStreamErrorMessage, throwStreamError, } from './stream-error';
import { authorizedHeaders } from 'util/requests';
import { assertIsDefined, getDefined } from 'util/properties-type-guards';
import { StreamInfoView } from './streaming-view';
import * as remote from '@electron/remote';
import { byOS, OS } from 'util/operating-systems';
import { capitalize } from 'lodash';
import { EOBSOutputType, EOBSOutputSignal } from 'services/core/signals';
const outputType = (type) => ({
    [EOBSOutputType.Streaming]: $t('Streaming'),
    [EOBSOutputType.Recording]: $t('Recording'),
    [EOBSOutputType.ReplayBuffer]: $t('Replay Buffer'),
    [EOBSOutputType.VirtualCam]: $t('Virtual Cam'),
}[type]);
export class StreamingService extends StatefulService {
    constructor() {
        super(...arguments);
        this.streamingStatusChange = new Subject();
        this.recordingStatusChange = new Subject();
        this.replayBufferStatusChange = new Subject();
        this.replayBufferFileWrite = new Subject();
        this.streamInfoChanged = new Subject();
        this.signalInfoChanged = new Subject();
        this.latestRecordingPath = new Subject();
        this.streamErrorCreated = new Subject();
        this.streamShiftEvent = new Subject();
        this.streamingStateChange = new Subject();
        this.resolveStartStreaming = () => { };
        this.rejectStartStreaming = () => { };
        this.outputErrorOpen = false;
        this.streamErrorUserMessage = '';
        this.streamErrorReportMessage = '';
    }
    init() {
        this.signalsService.addCallback((info) => {
            this.signalInfoChanged.next(info);
            this.handleOBSOutputSignal(info);
        });
        this.store.watch(() => {
            this.views.chatUrl;
            return this.views;
        }, val => {
            if (val.info.error &&
                !this.windowsService.state.child.isShown &&
                this.streamSettingsService.protectedModeEnabled) {
                this.showGoLiveWindow();
            }
            this.streamInfoChanged.next(val);
        }, {
            deep: true,
        });
        this.settingsService.settingsUpdated.subscribe(patch => {
        });
    }
    get views() {
        return new StreamInfoView(this.state);
    }
    prepopulateInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const platforms = this.views.enabledPlatforms;
            this.UPDATE_STREAM_INFO({ lifecycle: 'prepopulate', error: null });
            yield Promise.all(platforms.map((platform) => __awaiter(this, void 0, void 0, function* () {
                const service = getPlatformService(platform);
                const primeRequired = this.isPrimeRequired(platform);
                if (primeRequired && !this.views.isDualOutputMode) {
                    this.setError('PRIME_REQUIRED');
                    this.UPDATE_STREAM_INFO({ lifecycle: 'empty' });
                    return;
                }
                try {
                    yield service.prepopulateInfo();
                }
                catch (e) {
                    if (e instanceof StreamError) {
                        e.type =
                            e.type === 'PLATFORM_REQUEST_FAILED'
                                ? 'PREPOPULATE_FAILED'
                                : e.type || 'UNKNOWN_ERROR';
                        this.setError(e, platform);
                    }
                    else {
                        this.setError('PREPOPULATE_FAILED', platform);
                    }
                    this.UPDATE_STREAM_INFO({ lifecycle: 'empty' });
                    return;
                }
            })));
            this.UPDATE_STREAM_INFO({ lifecycle: 'waitForNewSettings' });
        });
    }
    isPrimeRequired(platform) {
        var _a;
        const { isPrime } = this.userService;
        if (isPrime) {
            return false;
        }
        if (platform === 'tiktok' && this.restreamService.tiktokGrandfathered) {
            return false;
        }
        if (this.views.isPrimaryPlatform(platform)) {
            return false;
        }
        else {
            const primaryPlatform = (_a = this.userService.state.auth) === null || _a === void 0 ? void 0 : _a.primaryPlatform;
            const allowFacebook = isEqual([primaryPlatform, platform], ['twitch', 'facebook']) ||
                isEqual([primaryPlatform, platform], ['youtube', 'facebook']);
            if (this.restreamService.facebookGrandfathered && allowFacebook) {
                return false;
            }
        }
        return true;
    }
    goLive(newSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            if (!this.userService.isLoggedIn ||
                (!this.streamSettingsService.state.protectedModeEnabled &&
                    ((_a = this.userService.state.auth) === null || _a === void 0 ? void 0 : _a.primaryPlatform) !== 'twitch')) {
                this.finishStartStreaming();
                return;
            }
            this.RESET_STREAM_INFO();
            const unattendedMode = !newSettings;
            const settings = newSettings || cloneDeep(this.views.savedSettings);
            if (settings.streamShift && this.restreamService.views.hasStreamShiftTargets) {
                yield this.restreamService.fetchTargetData();
                const targets = this.restreamService.views.streamShiftTargets.reduce((platforms, target) => {
                    if (target.platform !== 'relay') {
                        platforms.push(target.platform);
                    }
                    return platforms;
                }, []);
                this.views.linkedPlatforms.forEach(p => {
                    if (!settings.platforms[p])
                        return;
                    if (targets.includes(p)) {
                        settings.platforms[p].enabled = true;
                    }
                    else {
                        settings.platforms[p].enabled = false;
                    }
                });
                if (!targets.some(p => { var _a; return p === ((_a = this.userService.state.auth) === null || _a === void 0 ? void 0 : _a.primaryPlatform); })) {
                    this.userService.setPrimaryPlatform(targets[0]);
                }
            }
            settings.customDestinations.forEach(destination => {
                if (!destination.enabled)
                    return;
                if (!destination.display) {
                    destination.display = 'horizontal';
                }
                const display = this.views.isDualOutputMode ? destination.display : 'horizontal';
                destination.video = this.videoSettingsService.contexts[display];
                destination.mode = display === 'horizontal' ? 'landscape' : 'portrait';
            });
            this.streamSettingsService.setSettings({ goLiveSettings: settings });
            this.SET_GO_LIVE_SETTINGS(settings);
            this.UPDATE_STREAM_INFO({ lifecycle: 'runChecklist' });
            const platforms = this.views.enabledPlatforms;
            for (const platform of platforms) {
                yield this.setPlatformSettings(platform, settings, unattendedMode);
            }
            this.SET_GO_LIVE_SETTINGS(this.views.savedSettings);
            if (this.views.isDualOutputMode) {
                try {
                    yield this.runCheck('setupDualOutput', () => __awaiter(this, void 0, void 0, function* () {
                        const currentCustomDestinations = this.views.settings.customDestinations;
                        const isVerticalCustomDestination = this.views.activeDisplayDestinations.vertical.length === 1 &&
                            this.views.activeDisplayPlatforms.vertical.length === 0;
                        const isVerticalDualStreamDestination = this.views.hasDualStream &&
                            this.views.activeDisplayPlatforms.vertical.length === 1 &&
                            currentCustomDestinations.length > 0;
                        if (isVerticalCustomDestination || isVerticalDualStreamDestination) {
                            this.streamSettingsService.setSettings({
                                streamType: 'rtmp_custom',
                            }, 'vertical');
                            currentCustomDestinations.forEach(destination => {
                                if (!destination.enabled || destination.display !== 'vertical')
                                    return;
                                this.streamSettingsService.setSettings({
                                    key: destination.streamKey,
                                    server: destination.url,
                                }, 'vertical');
                                destination.video = this.videoSettingsService.contexts.vertical;
                            });
                            const updatedSettings = Object.assign(Object.assign({}, settings), { currentCustomDestinations });
                            this.streamSettingsService.setSettings({ goLiveSettings: updatedSettings });
                        }
                        yield Promise.resolve();
                    }));
                }
                catch (e) {
                    if (((_b = this.state.info.error) === null || _b === void 0 ? void 0 : _b.type) === 'KICK_STREAM_KEY_MISSING')
                        return;
                    const error = this.handleTypedStreamError(e, 'DUAL_OUTPUT_SETUP_FAILED', 'Failed to setup dual output');
                    this.setError(error);
                    return;
                }
                const horizontalStream = this.views.horizontalStream;
                const verticalStream = this.views.verticalStream;
                const allPlatforms = this.views.enabledPlatforms;
                const allDestinations = this.views.customDestinations
                    .filter(dest => dest.enabled)
                    .map(dest => dest.url);
                if (Utils.isDevMode()) {
                    console.log('Dual Output Setup\n', 'Platforms:', JSON.stringify(allPlatforms), '\n', 'Destinations:', JSON.stringify(allDestinations), '\n', 'Horizontal:', JSON.stringify(horizontalStream), '\n', 'Vertical', JSON.stringify(verticalStream));
                }
                this.usageStatisticsService.recordAnalyticsEvent('DualOutput', {
                    type: 'StreamingDualOutput',
                    platforms: JSON.stringify(allPlatforms),
                    destinations: JSON.stringify(allDestinations),
                    horizontal: JSON.stringify(horizontalStream),
                    vertical: JSON.stringify(verticalStream),
                });
            }
            this.restreamService.actions.forceStreamShiftGoLive(false);
            if (this.views.shouldSetupRestream) {
                const checkName = this.views.isMultiplatformMode ? 'setupMultistream' : 'setupDualOutput';
                const errorType = this.views.isMultiplatformMode
                    ? 'RESTREAM_DISABLED'
                    : 'DUAL_OUTPUT_RESTREAM_DISABLED';
                const failureType = this.views.isMultiplatformMode
                    ? 'RESTREAM_SETUP_FAILED'
                    : 'DUAL_OUTPUT_SETUP_FAILED';
                if (Utils.isDevMode()) {
                    console.log('Restream Setup\n', 'Displays:', this.views.displaysToRestream, '\n', 'Horizontal:', this.views.horizontalStream, '\n', 'Vertical', this.views.verticalStream);
                }
                let ready = false;
                try {
                    yield this.runCheck(checkName, () => __awaiter(this, void 0, void 0, function* () { return (ready = yield this.restreamService.checkStatus()); }));
                }
                catch (e) {
                    console.error('Error fetching restreaming service', e);
                }
                if (!ready) {
                    console.error('Restream service is not available');
                    this.setError(errorType);
                    return;
                }
                try {
                    yield this.runCheck(checkName, () => __awaiter(this, void 0, void 0, function* () {
                        yield this.restreamService.setEnabled(true);
                        yield this.restreamService.beforeGoLive();
                    }));
                }
                catch (e) {
                    if (((_c = this.state.info.error) === null || _c === void 0 ? void 0 : _c.type) === 'KICK_STREAM_KEY_MISSING')
                        return;
                    const error = this.handleTypedStreamError(e, failureType, 'Failed to setup restream');
                    this.setError(error);
                    return;
                }
            }
            if (((_d = this.state.info.error) === null || _d === void 0 ? void 0 : _d.type) === 'KICK_STREAM_KEY_MISSING')
                return;
            const optimizer = this.videoEncodingOptimizationService;
            if (optimizer.state.useOptimizedProfile && settings.optimizedProfile) {
                if (unattendedMode && optimizer.canApplyProfileFromCache()) {
                    optimizer.applyProfileFromCache();
                }
                else {
                    optimizer.applyProfile(settings.optimizedProfile);
                }
                yield this.runCheck('applyOptimizedSettings');
            }
            try {
                yield this.runCheck('startVideoTransmission', () => this.finishStartStreaming());
            }
            catch (e) {
                return;
            }
            if (((_e = settings.platforms.youtube) === null || _e === void 0 ? void 0 : _e.enabled) && !settings.platforms.youtube.enableAutoStart) {
                this.SET_WARNING('YT_AUTO_START_IS_DISABLED');
            }
            if (this.state.streamingStatus === EStreamingState.Live) {
                this.UPDATE_STREAM_INFO({ lifecycle: 'live' });
                this.createGameAssociation(this.views.game);
                this.recordAfterStreamStartAnalytics(settings);
            }
        });
    }
    setPlatformSettings(platform, settings, unattendedMode) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = getPlatformService(platform);
            const display = this.views.getPlatformDisplayType(platform);
            try {
                const isStreamShiftStream = this.restreamService.views.hasStreamShiftTargets;
                if (isStreamShiftStream) {
                    const streamShiftSettings = this.restreamService.getTargetLiveData(platform);
                    if (streamShiftSettings) {
                        settings.streamShiftSettings = streamShiftSettings;
                    }
                }
                const settingsForPlatform = !this.views.isDualOutputMode &&
                    platform === 'twitch' &&
                    unattendedMode &&
                    !isStreamShiftStream
                    ? undefined
                    : settings;
                yield this.runCheck(platform, () => service.beforeGoLive(settingsForPlatform, display));
            }
            catch (e) {
                console.error('Error setting platform settings', e);
                this.handleSetupPlatformError(e, platform);
                if (e instanceof StreamError &&
                    e.type === 'TIKTOK_USER_BANNED' &&
                    this.views.enabledPlatforms.length === 1) {
                    throwStreamError('TIKTOK_USER_BANNED', Object.assign(Object.assign({}, e), { platform: 'tiktok' }));
                }
            }
        });
    }
    handleSetupPlatformError(e, platform) {
        console.error(`Error running beforeGoLive for platform ${platform}\n`, e);
        if (e instanceof StreamError) {
            e.type =
                e.type === 'PLATFORM_REQUEST_FAILED'
                    ? 'SETTINGS_UPDATE_FAILED'
                    : e.type || 'UNKNOWN_ERROR';
            this.setError(e, platform);
        }
        else {
            this.setError('SETTINGS_UPDATE_FAILED', platform);
        }
        console.error('Error setting up platform', platform, e);
        return;
    }
    recordAfterStreamStartAnalytics(settings) {
        var _a, _b, _c, _d;
        if (settings.customDestinations.filter(dest => dest.enabled).length) {
            this.usageStatisticsService.recordFeatureUsage('CustomStreamDestination');
            this.usageStatisticsService.recordAnalyticsEvent('StreamCustomDestinations', {
                type: 'stream',
                destinations: this.views.enabledCustomDestinationHosts,
            });
        }
        if ((_a = settings.platforms.facebook) === null || _a === void 0 ? void 0 : _a.enabled) {
            const fbSettings = settings.platforms.facebook;
            this.usageStatisticsService.recordFeatureUsage('StreamToFacebook');
            if (fbSettings.game) {
                this.usageStatisticsService.recordFeatureUsage('StreamToFacebookGaming');
            }
            if (fbSettings.liveVideoId) {
                this.usageStatisticsService.recordFeatureUsage('StreamToFacebookScheduledVideo');
            }
            if (fbSettings.destinationType === 'me') {
                this.usageStatisticsService.recordFeatureUsage('StreamToFacebookTimeline');
            }
            else if (fbSettings.destinationType === 'group') {
                this.usageStatisticsService.recordFeatureUsage('StreamToFacebookGroup');
            }
            else {
                this.usageStatisticsService.recordFeatureUsage('StreamToFacebookPage');
            }
        }
        if ((_b = settings.platforms.tiktok) === null || _b === void 0 ? void 0 : _b.enabled) {
            this.usageStatisticsService.recordFeatureUsage('StreamToTikTok');
            this.usageStatisticsService.recordAnalyticsEvent('StreamToTikTokSettings', {
                type: 'stream',
                connectedPlatforms: this.views.linkedPlatforms,
                enabledPlatforms: this.views.enabledPlatforms,
                enabledDestinations: this.views.enabledCustomDestinationHosts,
                dualOutputMode: this.views.isDualOutputMode,
            });
        }
        if ((_c = settings.platforms.instagram) === null || _c === void 0 ? void 0 : _c.enabled) {
            this.usageStatisticsService.recordFeatureUsage('StreamToInstagram');
        }
        if (((_d = settings.platforms.youtube) === null || _d === void 0 ? void 0 : _d.enabled) && settings.platforms.youtube.display === 'both') {
            this.usageStatisticsService.recordFeatureUsage('StreamToYouTubeBothOutputs');
        }
        if (settings.streamShift) {
            this.usageStatisticsService.recordFeatureUsage('StreamShift');
            this.usageStatisticsService.recordAnalyticsEvent('StreamShift', {
                stream: 'started',
            });
        }
    }
    updateStreamSettings(settings) {
        return __awaiter(this, void 0, void 0, function* () {
            const lifecycle = this.state.info.lifecycle;
            this.SET_GO_LIVE_SETTINGS(settings);
            this.UPDATE_STREAM_INFO({ lifecycle: 'runChecklist' });
            const platforms = this.views.getEnabledPlatforms(settings.platforms);
            platforms.forEach(platform => {
                this.UPDATE_STREAM_INFO({
                    checklist: Object.assign(Object.assign({}, this.state.info.checklist), { [platform]: 'not-started' }),
                });
            });
            for (const platform of platforms) {
                const service = getPlatformService(platform);
                const newSettings = getDefined(settings.platforms[platform]);
                try {
                    yield this.runCheck(platform, () => service.putChannelInfo(newSettings));
                }
                catch (e) {
                    return this.handleUpdatePlatformError(e, platform);
                }
            }
            this.streamSettingsService.setSettings({ goLiveSettings: settings });
            this.UPDATE_STREAM_INFO({ lifecycle });
            return true;
        });
    }
    handleUpdatePlatformError(e, platform) {
        const message = `Error running putChannelInfo for platform ${platform}`;
        if (e instanceof StreamError) {
            const type = e.type === 'PLATFORM_REQUEST_FAILED'
                ? 'SETTINGS_UPDATE_FAILED'
                : e.type || 'UNKNOWN_ERROR';
            const error = this.handleTypedStreamError(e, type, message);
            this.setError(error, platform);
        }
        else {
            const error = this.handleTypedStreamError(e, 'SETTINGS_UPDATE_FAILED', message);
            this.setError(error, platform);
        }
        return false;
    }
    handleTypedStreamError(e, type, message) {
        var _a, _b, _c, _d;
        const messages = [message];
        const details = [];
        const defaultMessage = (_b = (_a = this.state.info.error) === null || _a === void 0 ? void 0 : _a.message) !== null && _b !== void 0 ? _b : $t('One of destinations might have incomplete permissions. Reconnect the destinations in settings and try again.');
        if (e && typeof e === 'object' && type.split('_').includes('RESTREAM')) {
            details.push(defaultMessage);
            Object.entries(e).forEach(([key, value]) => {
                const name = capitalize(key.replace(/([A-Z])/g, ' $1'));
                if (['streamKey', 'serverUrl'].includes(key)) {
                    messages.push($t('Missing server url or stream key'));
                }
                else {
                    messages.push(`${name}: ${value}`);
                }
            });
            const status = (_d = (_c = this.state.info.error) === null || _c === void 0 ? void 0 : _c.status) !== null && _d !== void 0 ? _d : 400;
            return createStreamError(type, { status, statusText: messages.join('. ') }, details.join('\n'));
        }
        return e instanceof StreamError ? Object.assign(Object.assign({}, e), { type }) : type;
    }
    scheduleStream(settings, time) {
        return __awaiter(this, void 0, void 0, function* () {
            const destinations = settings.platforms;
            const platforms = Object.keys(destinations).filter(dest => { var _a; return ((_a = destinations[dest]) === null || _a === void 0 ? void 0 : _a.enabled) && this.views.supports('stream-schedule', [dest]); });
            for (const platform of platforms) {
                const service = getPlatformService(platform);
                assertIsDefined(service.scheduleStream);
                yield service.scheduleStream(time, getDefined(destinations[platform]));
            }
        });
    }
    runCheck(checkName, cb) {
        return __awaiter(this, void 0, void 0, function* () {
            this.SET_CHECKLIST_ITEM(checkName, 'pending');
            try {
                if (cb)
                    yield cb();
                this.SET_CHECKLIST_ITEM(checkName, 'done');
            }
            catch (e) {
                this.SET_CHECKLIST_ITEM(checkName, 'failed');
                throw e;
            }
        });
    }
    UPDATE_STREAM_INFO(infoPatch) {
        this.state.info = Object.assign(Object.assign({}, this.state.info), infoPatch);
    }
    setError(errorTypeOrError, platform) {
        const target = platform
            ? this.views.getPlatformDisplayName(platform)
            : $t('Custom Destination');
        const streamError = errorTypeOrError instanceof StreamError
            ? errorTypeOrError
            : createStreamError(errorTypeOrError);
        if (platform) {
            streamError.platform = platform;
        }
        const messages = formatStreamErrorMessage(streamError, target);
        this.streamErrorUserMessage = messages.user;
        this.streamErrorReportMessage = messages.report;
        streamError.message = messages.user;
        this.SET_ERROR(streamError);
        const error = this.state.info.error;
        assertIsDefined(error);
        console.error(`Streaming ${error}`);
        this.streamErrorCreated.next(this.streamErrorReportMessage);
    }
    resetInfo() {
        this.RESET_STREAM_INFO();
    }
    resetError() {
        this.RESET_ERROR();
        if (this.state.info.checklist.startVideoTransmission === 'done') {
            this.UPDATE_STREAM_INFO({ lifecycle: 'live' });
        }
    }
    SET_ERROR(error) {
        this.state.info.error = error;
    }
    RESET_ERROR() {
        this.state.info.error = null;
    }
    SET_CHECKLIST_ITEM(itemName, state) {
        Vue.set(this.state.info, 'checklist', Object.assign(Object.assign({}, this.state.info.checklist), { [itemName]: state }));
    }
    RESET_STREAM_INFO() {
        this.state.info = cloneDeep(StreamingService.initialState.info);
    }
    getModel() {
        return this.state;
    }
    get isStreaming() {
        return this.state.streamingStatus !== EStreamingState.Offline;
    }
    get isRecording() {
        return this.state.recordingStatus !== ERecordingState.Offline;
    }
    get isReplayBufferActive() {
        return this.state.replayBufferStatus !== EReplayBufferState.Offline;
    }
    get isIdle() {
        return !this.isStreaming && !this.isRecording;
    }
    setSelectiveRecording(enabled) {
        if (this.state.streamingStatus !== EStreamingState.Offline)
            return;
        if (enabled)
            this.usageStatisticsService.recordFeatureUsage('SelectiveRecording');
        this.SET_SELECTIVE_RECORDING(enabled);
        Global.multipleRendering = enabled;
    }
    setDualOutputMode(enabled) {
        if (this.state.streamingStatus !== EStreamingState.Offline)
            return;
        if (enabled) {
            this.dualOutputService.actions.setDualOutputModeIfPossible(true, true);
            this.usageStatisticsService.recordFeatureUsage('DualOutput');
        }
        this.SET_DUAL_OUTPUT_MODE(enabled);
    }
    startStreaming() {
        this.toggleStreaming();
    }
    stopStreaming() {
        this.toggleStreaming();
    }
    finishStartStreaming() {
        return __awaiter(this, void 0, void 0, function* () {
            const startStreamingPromise = new Promise((resolve, reject) => {
                this.resolveStartStreaming = resolve;
                this.rejectStartStreaming = reject;
            });
            const shouldConfirm = this.streamSettingsService.settings.warnBeforeStartingStream;
            if (shouldConfirm) {
                const goLive = yield remote.dialog.showMessageBox(Utils.getMainWindow(), {
                    title: $t('Go Live'),
                    type: 'warning',
                    message: $t('Are you sure you want to start streaming?'),
                    buttons: [$t('Cancel'), $t('Go Live')],
                });
                if (!goLive.response) {
                    return Promise.reject();
                }
            }
            this.powerSaveId = remote.powerSaveBlocker.start('prevent-display-sleep');
            if (this.views.isDualOutputMode) {
                const horizontalContext = this.videoSettingsService.contexts.horizontal;
                const verticalContext = this.videoSettingsService.contexts.vertical;
                NodeObs.OBS_service_setVideoInfo(horizontalContext, 'horizontal');
                NodeObs.OBS_service_setVideoInfo(verticalContext, 'vertical');
                const signalChanged = this.signalInfoChanged.subscribe((signalInfo) => {
                    if (signalInfo.service === 'default') {
                        if (signalInfo.code !== 0) {
                            NodeObs.OBS_service_stopStreaming(true, 'horizontal');
                            NodeObs.OBS_service_stopStreaming(true, 'vertical');
                        }
                        if (signalInfo.signal === EOBSOutputSignal.Start) {
                            NodeObs.OBS_service_startStreaming('vertical');
                            signalChanged.unsubscribe();
                        }
                    }
                });
                NodeObs.OBS_service_startStreaming('horizontal');
                yield new Promise(resolve => setTimeout(resolve, 1000));
            }
            else {
                const horizontalContext = this.videoSettingsService.contexts.horizontal;
                NodeObs.OBS_service_setVideoInfo(horizontalContext, 'horizontal');
                NodeObs.OBS_service_startStreaming();
            }
            const recordWhenStreaming = this.streamSettingsService.settings.recordWhenStreaming;
            if (recordWhenStreaming && this.state.recordingStatus === ERecordingState.Offline) {
                this.toggleRecording();
            }
            const replayWhenStreaming = this.streamSettingsService.settings.replayBufferWhileStreaming;
            const isReplayBufferEnabled = this.outputSettingsService.getSettings().replayBuffer.enabled;
            if (replayWhenStreaming &&
                isReplayBufferEnabled &&
                this.state.replayBufferStatus === EReplayBufferState.Offline) {
                this.startReplayBuffer();
            }
            startStreamingPromise
                .then(() => {
                if (this.views.settings.streamShift) {
                    this.restreamService.setStreamShiftStatus('inactive');
                    const isPrimaryPlatformEnabled = this.views.enabledPlatforms.some(p => { var _a; return p === ((_a = this.userService.state.auth) === null || _a === void 0 ? void 0 : _a.primaryPlatform); });
                    if (!isPrimaryPlatformEnabled) {
                        this.userService.setPrimaryPlatform(this.views.enabledPlatforms[0]);
                    }
                }
                try {
                    this.views.enabledPlatforms.forEach(platform => {
                        getPlatformService(platform).afterGoLive();
                    });
                }
                catch (e) {
                    console.error('Error running afterGoLive for platform', e);
                }
            })
                .catch(() => {
                console.warn('startStreamingPromise was rejected');
            });
            return startStreamingPromise;
        });
    }
    toggleStreaming(options_1) {
        return __awaiter(this, arguments, void 0, function* (options, force = false) {
            if (this.views.isDualOutputMode && !this.views.getCanStreamDualOutput() && this.isIdle) {
                this.notificationsService.actions.push({
                    message: $t('Set up Go Live Settings for Dual Output Mode in the Go Live window.'),
                    type: ENotificationType.WARNING,
                    lifeTime: 2000,
                });
                this.showGoLiveWindow();
                return;
            }
            if (this.state.streamingStatus === EStreamingState.Offline) {
                if (this.recordingModeService.views.isRecordingModeEnabled)
                    return;
                if (force) {
                    yield this.finishStartStreaming();
                    return Promise.resolve();
                }
                try {
                    yield this.goLive();
                    return Promise.resolve();
                }
                catch (e) {
                    return Promise.reject(e);
                }
            }
            if (this.state.streamingStatus === EStreamingState.Starting ||
                this.state.streamingStatus === EStreamingState.Live ||
                this.state.streamingStatus === EStreamingState.Reconnecting) {
                const shouldConfirm = this.streamSettingsService.settings.warnBeforeStoppingStream;
                if (shouldConfirm) {
                    const endStream = yield remote.dialog.showMessageBox(Utils.getMainWindow(), {
                        title: $t('End Stream'),
                        type: 'warning',
                        message: $t('Are you sure you want to stop streaming?'),
                        buttons: [$t('Cancel'), $t('End Stream')],
                    });
                    if (!endStream.response)
                        return;
                }
                if (this.powerSaveId) {
                    remote.powerSaveBlocker.stop(this.powerSaveId);
                }
                if (this.views.isDualOutputMode) {
                    const signalChanged = this.signalInfoChanged.subscribe((signalInfo) => {
                        if (signalInfo.service === 'default' &&
                            signalInfo.signal === EOBSOutputSignal.Deactivate) {
                            NodeObs.OBS_service_stopStreaming(false, 'vertical');
                            signalChanged.unsubscribe();
                        }
                    });
                    NodeObs.OBS_service_stopStreaming(false, 'horizontal');
                    yield new Promise(resolve => setTimeout(resolve, 1000));
                }
                else {
                    NodeObs.OBS_service_stopStreaming(false);
                }
                const keepRecording = this.streamSettingsService.settings.keepRecordingWhenStreamStops;
                if (!keepRecording && this.state.recordingStatus === ERecordingState.Recording) {
                    this.toggleRecording();
                }
                const keepReplaying = this.streamSettingsService.settings.keepReplayBufferStreamStops;
                if (!keepReplaying && this.state.replayBufferStatus === EReplayBufferState.Running) {
                    this.stopReplayBuffer();
                }
                this.windowsService.closeChildWindow();
                this.views.enabledPlatforms.forEach(platform => {
                    const service = getPlatformService(platform);
                    if (service.afterStopStream)
                        service.afterStopStream();
                });
                if (this.views.isStreamShiftMode) {
                    this.restreamService.resetStreamShift();
                }
                this.UPDATE_STREAM_INFO({ lifecycle: 'empty' });
                return Promise.resolve();
            }
            if (this.state.streamingStatus === EStreamingState.Ending) {
                if (this.views.isDualOutputMode) {
                    NodeObs.OBS_service_stopStreaming(true, 'horizontal');
                    NodeObs.OBS_service_stopStreaming(true, 'vertical');
                }
                else {
                    NodeObs.OBS_service_stopStreaming(true);
                }
                if (this.views.isStreamShiftMode) {
                    this.restreamService.resetStreamShift();
                }
                return Promise.resolve();
            }
        });
    }
    startRecording() {
        this.toggleRecording();
    }
    stopRecording() {
        this.toggleRecording();
    }
    toggleRecording() {
        if (this.state.recordingStatus === ERecordingState.Recording) {
            NodeObs.OBS_service_stopRecording();
            return;
        }
        if (this.state.recordingStatus === ERecordingState.Offline) {
            NodeObs.OBS_service_startRecording();
            return;
        }
    }
    splitFile() {
        if (this.state.recordingStatus === ERecordingState.Recording) {
            NodeObs.OBS_service_splitFile();
        }
    }
    startReplayBuffer() {
        if (this.state.replayBufferStatus !== EReplayBufferState.Offline)
            return;
        this.usageStatisticsService.recordFeatureUsage('ReplayBuffer');
        NodeObs.OBS_service_startReplayBuffer();
    }
    stopReplayBuffer() {
        if (this.state.replayBufferStatus === EReplayBufferState.Running) {
            NodeObs.OBS_service_stopReplayBuffer(false);
        }
        else if (this.state.replayBufferStatus === EReplayBufferState.Stopping) {
            NodeObs.OBS_service_stopReplayBuffer(true);
        }
    }
    saveReplay() {
        if (this.state.replayBufferStatus === EReplayBufferState.Running) {
            this.SET_REPLAY_BUFFER_STATUS(EReplayBufferState.Saving);
            this.replayBufferStatusChange.next(EReplayBufferState.Saving);
            NodeObs.OBS_service_processReplayBufferHotkey();
        }
    }
    showGoLiveWindow(prepopulateOptions) {
        const height = 750;
        const width = 900;
        this.windowsService.showWindow({
            componentName: 'GoLiveWindow',
            title: $t('Go Live'),
            size: {
                height,
                width,
            },
            queryParams: prepopulateOptions,
        });
    }
    showEditStream() {
        const height = 750;
        const width = 900;
        this.windowsService.showWindow({
            componentName: 'EditStreamWindow',
            title: $t('Update Stream Info'),
            size: {
                height,
                width,
            },
        });
    }
    get delayEnabled() {
        return this.streamSettingsService.settings.delayEnable;
    }
    get delaySeconds() {
        return this.streamSettingsService.settings.delaySec;
    }
    get delaySecondsRemaining() {
        if (!this.delayEnabled)
            return 0;
        if (this.state.streamingStatus === EStreamingState.Starting ||
            this.state.streamingStatus === EStreamingState.Ending) {
            const elapsedTime = moment().unix() - this.streamingStateChangeTime.unix();
            return Math.max(this.delaySeconds - elapsedTime, 0);
        }
        return 0;
    }
    get formattedDurationInCurrentStreamingState() {
        var _a, _b;
        const formattedTime = this.formattedDurationSince(this.streamingStateChangeTime);
        if (formattedTime === '07:50:00' && ((_b = (_a = this.userService) === null || _a === void 0 ? void 0 : _a.platform) === null || _b === void 0 ? void 0 : _b.type) === 'facebook') {
            const msg = $t('You are 10 minutes away from the 8 hour stream limit');
            const existingTimeupNotif = this.notificationsService.views
                .getUnread()
                .filter((notice) => notice.message === msg);
            if (existingTimeupNotif.length !== 0)
                return formattedTime;
            this.notificationsService.push({
                type: ENotificationType.INFO,
                lifeTime: 600000,
                showTime: true,
                message: msg,
            });
        }
        return formattedTime;
    }
    get formattedDurationInCurrentRecordingState() {
        return this.formattedDurationSince(moment(this.state.recordingStatusTime));
    }
    get streamingStateChangeTime() {
        return moment(this.state.streamingStatusTime);
    }
    sendReconnectingNotification() {
        const msg = $t('Stream has disconnected, attempting to reconnect.');
        const existingReconnectNotif = this.notificationsService.views
            .getUnread()
            .filter((notice) => notice.message === msg);
        if (existingReconnectNotif.length !== 0)
            return;
        this.notificationsService.push({
            type: ENotificationType.WARNING,
            subType: ENotificationSubType.DISCONNECTED,
            lifeTime: -1,
            showTime: true,
            message: msg,
        });
    }
    clearReconnectingNotification() {
        const notice = this.notificationsService.views
            .getAll()
            .find((notice) => notice.message === $t('Stream has disconnected, attempting to reconnect.'));
        if (!notice)
            return;
        this.notificationsService.markAsRead(notice.id);
    }
    formattedDurationSince(timestamp) {
        const duration = moment.duration(moment().diff(timestamp));
        const seconds = padStart(duration.seconds().toString(), 2, '0');
        const minutes = padStart(duration.minutes().toString(), 2, '0');
        const dayHours = duration.days() * 24;
        const hours = padStart((dayHours + duration.hours()).toString(), 2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }
    handleOBSOutputSignal(info) {
        var _a;
        console.debug('OBS Output signal: ', info);
        const shouldResolve = !this.views.isDualOutputMode || (this.views.isDualOutputMode && info.service === 'vertical');
        const time = new Date().toISOString();
        if (info.type === EOBSOutputType.Streaming) {
            if (info.signal === EOBSOutputSignal.Start && shouldResolve) {
                this.SET_STREAMING_STATUS(EStreamingState.Live, time);
                this.resolveStartStreaming();
                this.streamingStatusChange.next(EStreamingState.Live);
                let streamEncoderInfo = {};
                let game = '';
                try {
                    streamEncoderInfo = this.outputSettingsService.getSettings();
                    game = this.views.game;
                }
                catch (e) {
                    console.error('Error fetching stream encoder info: ', e);
                }
                const eventMetadata = Object.assign(Object.assign({}, streamEncoderInfo), { game });
                if (this.videoEncodingOptimizationService.state.useOptimizedProfile) {
                    eventMetadata.useOptimizedProfile = true;
                }
                const streamSettings = this.streamSettingsService.settings;
                eventMetadata.streamType = streamSettings.streamType;
                eventMetadata.platform = streamSettings.platform;
                eventMetadata.server = streamSettings.server;
                eventMetadata.outputMode = this.views.isDualOutputMode ? 'dual' : 'single';
                eventMetadata.platforms = this.views.protectedModeEnabled
                    ? [
                        ...this.views.enabledPlatforms,
                        ...this.views.customDestinations.filter(d => d.enabled).map(_ => 'custom_rtmp'),
                    ]
                    : ['custom_rtmp'];
                if (eventMetadata.platforms.includes('youtube')) {
                    eventMetadata.streamId = this.youtubeService.state.streamId;
                    eventMetadata.broadcastId = (_a = this.youtubeService.state.settings) === null || _a === void 0 ? void 0 : _a.broadcastId;
                }
                this.usageStatisticsService.recordEvent('stream_start', eventMetadata);
                this.usageStatisticsService.recordAnalyticsEvent('StreamingStatus', {
                    code: info.code,
                    status: EStreamingState.Live,
                    service: streamSettings.service,
                });
                this.usageStatisticsService.recordFeatureUsage('Streaming');
            }
            else if (info.signal === EOBSOutputSignal.Starting && shouldResolve) {
                this.SET_STREAMING_STATUS(EStreamingState.Starting, time);
                this.streamingStatusChange.next(EStreamingState.Starting);
            }
            else if (info.signal === EOBSOutputSignal.Stop) {
                this.SET_STREAMING_STATUS(EStreamingState.Offline, time);
                if (this.views.isDualOutputMode && info.code !== 0) {
                    NodeObs.OBS_service_stopStreaming(true, 'horizontal');
                    NodeObs.OBS_service_stopStreaming(true, 'vertical');
                }
                this.RESET_STREAM_INFO();
                this.rejectStartStreaming();
                this.streamingStatusChange.next(EStreamingState.Offline);
                this.usageStatisticsService.recordAnalyticsEvent('StreamingStatus', {
                    code: info.code,
                    status: EStreamingState.Offline,
                });
            }
            else if (info.signal === EOBSOutputSignal.Stopping) {
                this.sendStreamEndEvent();
                this.SET_STREAMING_STATUS(EStreamingState.Ending, time);
                this.streamingStatusChange.next(EStreamingState.Ending);
            }
            else if (info.signal === EOBSOutputSignal.Reconnect) {
                this.SET_STREAMING_STATUS(EStreamingState.Reconnecting);
                this.streamingStatusChange.next(EStreamingState.Reconnecting);
                this.sendReconnectingNotification();
            }
            else if (info.signal === EOBSOutputSignal.ReconnectSuccess) {
                this.SET_STREAMING_STATUS(EStreamingState.Live);
                this.streamingStatusChange.next(EStreamingState.Live);
                this.clearReconnectingNotification();
            }
        }
        else if (info.type === EOBSOutputType.Recording) {
            const nextState = {
                [EOBSOutputSignal.Start]: ERecordingState.Recording,
                [EOBSOutputSignal.Starting]: ERecordingState.Starting,
                [EOBSOutputSignal.Stop]: ERecordingState.Offline,
                [EOBSOutputSignal.Stopping]: ERecordingState.Stopping,
                [EOBSOutputSignal.Wrote]: ERecordingState.Wrote,
            }[info.signal];
            if (!nextState)
                return;
            if (info.signal === EOBSOutputSignal.Start) {
                this.usageStatisticsService.recordFeatureUsage('Recording');
                this.usageStatisticsService.recordAnalyticsEvent('RecordingStatus', {
                    status: nextState,
                    code: info.code,
                });
            }
            if (info.signal === EOBSOutputSignal.Wrote) {
                this.usageStatisticsService.recordAnalyticsEvent('RecordingStatus', {
                    status: nextState,
                    code: info.code,
                });
                const filename = NodeObs.OBS_service_getLastRecording();
                const parsedFilename = byOS({
                    [OS.Mac]: filename,
                    [OS.Windows]: filename.replace(/\//, '\\'),
                });
                this.recordingModeService.actions.addRecordingEntry(parsedFilename);
                this.markersService.actions.exportCsv(parsedFilename);
                this.latestRecordingPath.next(filename);
                return;
            }
            this.SET_RECORDING_STATUS(nextState, time);
            this.recordingStatusChange.next(nextState);
        }
        else if (info.type === EOBSOutputType.ReplayBuffer) {
            const nextState = {
                [EOBSOutputSignal.Start]: EReplayBufferState.Running,
                [EOBSOutputSignal.Stopping]: EReplayBufferState.Stopping,
                [EOBSOutputSignal.Stop]: EReplayBufferState.Offline,
                [EOBSOutputSignal.Wrote]: EReplayBufferState.Running,
                [EOBSOutputSignal.WriteError]: EReplayBufferState.Running,
            }[info.signal];
            if (nextState) {
                this.SET_REPLAY_BUFFER_STATUS(nextState, time);
                this.replayBufferStatusChange.next(nextState);
            }
            if (info.signal === EOBSOutputSignal.Wrote) {
                this.usageStatisticsService.recordAnalyticsEvent('ReplayBufferStatus', {
                    status: 'wrote',
                    code: info.code,
                });
                this.replayBufferFileWrite.next(NodeObs.OBS_service_getLastReplay());
            }
        }
        this.handleOBSOutputError(info);
    }
    handleOBSOutputError(info) {
        if (!info.code)
            return;
        if (info.code === 0)
            return;
        console.debug('OBS Output Error signal: ', info);
        if (this.outputErrorOpen) {
            console.warn('Not showing error message because existing window is open.', info);
            const messages = formatUnknownErrorMessage(info, this.streamErrorUserMessage, this.streamErrorReportMessage);
            this.streamErrorCreated.next(messages.report);
            return;
        }
        let errorText = this.streamErrorUserMessage;
        let details = '';
        let linkToDriverInfo = false;
        let showNativeErrorMessage = false;
        let diagReportMessage = this.streamErrorUserMessage;
        if (info.code === -1) {
            errorText = $t('Invalid Path or Connection URL.  Please check your settings to confirm that they are valid.');
            diagReportMessage = diagReportMessage.concat(errorText);
        }
        else if (info.code === -2) {
            errorText = $t('Failed to connect to the streaming server.  Please check your internet connection.');
            diagReportMessage = diagReportMessage.concat(errorText);
        }
        else if (info.code === -5) {
            errorText = $t('Disconnected from the streaming server.  Please check your internet connection.');
            diagReportMessage = diagReportMessage.concat(errorText);
        }
        else if (info.code === -3) {
            errorText = $t('Could not access the specified channel or stream key. Please log out and back in to refresh your credentials. If the problem persists, there may be a problem connecting to the server.');
            diagReportMessage = diagReportMessage.concat(errorText);
        }
        else if (info.code === -7) {
            errorText = $t('There is not sufficient disk space to continue recording.');
            diagReportMessage = diagReportMessage.concat(errorText);
        }
        else if (info.code === -6) {
            errorText =
                $t('The output format is either unsupported or does not support more than one audio track.  ') + $t('Please check your settings and try again.');
            diagReportMessage = diagReportMessage.concat(errorText);
        }
        else if (info.code === -65) {
            linkToDriverInfo = true;
            errorText = $t('An error occurred with the output. This is usually caused by out of date video drivers. Please ensure your Nvidia or AMD drivers are up to date and try again.');
            diagReportMessage = diagReportMessage.concat(errorText);
        }
        else {
            if (!this.userService.isLoggedIn) {
                const messages = formatStreamErrorMessage('LOGGED_OUT_ERROR');
                errorText = messages.user;
                diagReportMessage = messages.report;
                if (messages.details)
                    details = messages.details;
                showNativeErrorMessage = details !== '';
            }
            else {
                if (!info.error ||
                    (info.error && typeof info.error !== 'string') ||
                    (info.error && info.error === '')) {
                    info.error =
                        this.streamErrorUserMessage !== ''
                            ? this.streamErrorUserMessage
                            : $t('An unknown %{type} error occurred.', {
                                type: outputType(info.type),
                            });
                }
                const messages = formatUnknownErrorMessage(info, this.streamErrorUserMessage, this.streamErrorReportMessage);
                errorText = messages.user;
                diagReportMessage = messages.report;
                if (messages.details)
                    details = messages.details;
                showNativeErrorMessage = details !== '';
            }
        }
        if (this.views.isDualOutputMode) {
            const platforms = info.service === 'vertical'
                ? this.views.verticalStream.map(p => platformLabels(p))
                : this.views.horizontalStream.map(p => platformLabels(p));
            const stream = info.service === 'vertical'
                ? $t('Please confirm %{platforms} in the Vertical stream.', {
                    platforms,
                })
                : $t('Please confirm %{platforms} in the Horizontal stream.', {
                    platforms,
                });
            errorText = [errorText, stream].join('\n\n');
        }
        const buttons = [$t('OK')];
        const title = {
            [EOBSOutputType.Streaming]: $t('Streaming Error'),
            [EOBSOutputType.Recording]: $t('Recording Error'),
            [EOBSOutputType.ReplayBuffer]: $t('Replay Buffer Error'),
            [EOBSOutputType.VirtualCam]: $t('Virtual Cam Error'),
        }[info.type];
        if (linkToDriverInfo)
            buttons.push($t('Learn More'));
        if (showNativeErrorMessage) {
            buttons.push($t('More'));
        }
        this.outputErrorOpen = true;
        const errorType = 'error';
        remote.dialog
            .showMessageBox(Utils.getMainWindow(), {
            buttons,
            title,
            type: errorType,
            message: errorText,
        })
            .then(({ response }) => {
            if (linkToDriverInfo && response === 1) {
                this.outputErrorOpen = false;
                remote.shell.openExternal('https://howto.streamlabs.com/streamlabs-obs-19/nvidia-graphics-driver-clean-install-tutorial-7000');
            }
            else {
                let expectedResponse = 1;
                if (linkToDriverInfo) {
                    expectedResponse = 2;
                }
                if (showNativeErrorMessage && response === expectedResponse) {
                    const buttons = [$t('OK')];
                    remote.dialog
                        .showMessageBox({
                        buttons,
                        title,
                        type: errorType,
                        message: details,
                    })
                        .then(({ response }) => {
                        this.outputErrorOpen = false;
                        this.streamErrorUserMessage = '';
                        this.streamErrorReportMessage = '';
                    })
                        .catch(() => {
                        this.outputErrorOpen = false;
                    });
                }
                else {
                    this.outputErrorOpen = false;
                }
            }
        })
            .catch(() => {
            this.outputErrorOpen = false;
        });
        this.windowsService.actions.closeChildWindow();
        if (info.type === EOBSOutputType.Streaming || !this.userService.isLoggedIn) {
            this.streamErrorCreated.next(diagReportMessage);
        }
    }
    sendStreamEndEvent() {
        var _a;
        const data = {};
        data.viewerCounts = {};
        data.duration = Math.round(moment().diff(moment(this.state.streamingStatusTime)) / 1000);
        data.game = this.views.game;
        data.outputMode = this.views.isDualOutputMode ? 'dual' : 'single';
        if (this.views.protectedModeEnabled) {
            data.platforms = this.views.enabledPlatforms;
            this.views.customDestinations.forEach(() => {
                data.platforms.push('custom_rtmp');
            });
            this.views.enabledPlatforms.forEach(platform => {
                const service = getPlatformService(platform);
                if (service.hasCapability('viewerCount')) {
                    data.viewerCounts[platform] = {
                        average: service.averageViewers,
                        peak: service.peakViewers,
                    };
                }
            });
        }
        else {
            data.platforms = ['custom_rtmp'];
        }
        if (data.platforms.includes('youtube')) {
            data.streamId = this.youtubeService.state.streamId;
            data.broadcastId = (_a = this.youtubeService.state.settings) === null || _a === void 0 ? void 0 : _a.broadcastId;
        }
        this.recordGoals(data.duration);
        this.usageStatisticsService.recordEvent('stream_end', data);
    }
    recordGoals(duration) {
        if (!this.userService.isLoggedIn)
            return;
        const hoursStreamed = Math.floor(duration / 60 / 60);
        this.growService.incrementGoal('stream_hours_per_month', hoursStreamed);
        this.growService.incrementGoal('stream_times_per_week', 1);
        if (this.restreamService.settings.enabled) {
            this.growService.incrementGoal('multistream_per_week', 1);
        }
    }
    createGameAssociation(game) {
        const url = `https://${this.hostsService.overlays}/api/overlay-games-association`;
        const headers = authorizedHeaders(this.userService.apiToken);
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        const body = `game=${encodeURIComponent(game)}`;
        const request = new Request(url, { headers, body, method: 'POST' });
        return fetch(request);
    }
    SET_STREAMING_STATUS(status, time) {
        this.state.streamingStatus = status;
        if (time)
            this.state.streamingStatusTime = time;
    }
    SET_RECORDING_STATUS(status, time) {
        this.state.recordingStatus = status;
        this.state.recordingStatusTime = time;
    }
    SET_REPLAY_BUFFER_STATUS(status, time) {
        this.state.replayBufferStatus = status;
        if (time)
            this.state.replayBufferStatusTime = time;
    }
    SET_SELECTIVE_RECORDING(enabled) {
        this.state.selectiveRecording = enabled;
    }
    SET_DUAL_OUTPUT_MODE(enabled) {
        this.state.dualOutputMode = enabled;
    }
    SET_WARNING(warningType) {
        this.state.info.warning = warningType;
    }
    SET_GO_LIVE_SETTINGS(settings) {
        this.state.info.settings = settings;
    }
}
StreamingService.initialState = {
    streamingStatus: EStreamingState.Offline,
    streamingStatusTime: new Date().toISOString(),
    recordingStatus: ERecordingState.Offline,
    recordingStatusTime: new Date().toISOString(),
    replayBufferStatus: EReplayBufferState.Offline,
    replayBufferStatusTime: new Date().toISOString(),
    selectiveRecording: false,
    dualOutputMode: false,
    info: {
        settings: null,
        lifecycle: 'empty',
        error: null,
        warning: '',
        checklist: {
            applyOptimizedSettings: 'not-started',
            twitch: 'not-started',
            youtube: 'not-started',
            facebook: 'not-started',
            tiktok: 'not-started',
            trovo: 'not-started',
            kick: 'not-started',
            twitter: 'not-started',
            instagram: 'not-started',
            setupMultistream: 'not-started',
            setupDualOutput: 'not-started',
            startVideoTransmission: 'not-started',
        },
    },
};
__decorate([
    Inject()
], StreamingService.prototype, "streamSettingsService", void 0);
__decorate([
    Inject()
], StreamingService.prototype, "outputSettingsService", void 0);
__decorate([
    Inject()
], StreamingService.prototype, "windowsService", void 0);
__decorate([
    Inject()
], StreamingService.prototype, "usageStatisticsService", void 0);
__decorate([
    Inject()
], StreamingService.prototype, "notificationsService", void 0);
__decorate([
    Inject()
], StreamingService.prototype, "userService", void 0);
__decorate([
    Inject()
], StreamingService.prototype, "videoEncodingOptimizationService", void 0);
__decorate([
    Inject()
], StreamingService.prototype, "restreamService", void 0);
__decorate([
    Inject()
], StreamingService.prototype, "hostsService", void 0);
__decorate([
    Inject()
], StreamingService.prototype, "growService", void 0);
__decorate([
    Inject()
], StreamingService.prototype, "recordingModeService", void 0);
__decorate([
    Inject()
], StreamingService.prototype, "videoSettingsService", void 0);
__decorate([
    Inject()
], StreamingService.prototype, "markersService", void 0);
__decorate([
    Inject()
], StreamingService.prototype, "dualOutputService", void 0);
__decorate([
    Inject()
], StreamingService.prototype, "youtubeService", void 0);
__decorate([
    Inject()
], StreamingService.prototype, "settingsService", void 0);
__decorate([
    Inject()
], StreamingService.prototype, "signalsService", void 0);
__decorate([
    mutation()
], StreamingService.prototype, "UPDATE_STREAM_INFO", null);
__decorate([
    mutation()
], StreamingService.prototype, "SET_ERROR", null);
__decorate([
    mutation()
], StreamingService.prototype, "RESET_ERROR", null);
__decorate([
    mutation()
], StreamingService.prototype, "SET_CHECKLIST_ITEM", null);
__decorate([
    mutation()
], StreamingService.prototype, "RESET_STREAM_INFO", null);
__decorate([
    mutation()
], StreamingService.prototype, "SET_STREAMING_STATUS", null);
__decorate([
    mutation()
], StreamingService.prototype, "SET_RECORDING_STATUS", null);
__decorate([
    mutation()
], StreamingService.prototype, "SET_REPLAY_BUFFER_STATUS", null);
__decorate([
    mutation()
], StreamingService.prototype, "SET_SELECTIVE_RECORDING", null);
__decorate([
    mutation()
], StreamingService.prototype, "SET_DUAL_OUTPUT_MODE", null);
__decorate([
    mutation()
], StreamingService.prototype, "SET_WARNING", null);
__decorate([
    mutation()
], StreamingService.prototype, "SET_GO_LIVE_SETTINGS", null);
//# sourceMappingURL=streaming.js.map