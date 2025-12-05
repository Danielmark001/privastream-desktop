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
import { mutation, InheritMutations } from '../core/stateful-service';
import { EPlatformCallResult, } from '.';
import { Inject } from 'services/core/injector';
import { authorizedHeaders, jfetch } from 'util/requests';
import { platformAuthorizedRequest } from './utils';
import { $t } from 'services/i18n';
import { StreamError, throwStreamError } from 'services/streaming/stream-error';
import { BasePlatformService } from './base-platform';
import { assertIsDefined, getDefined } from 'util/properties-type-guards';
import Utils from '../utils';
import { YoutubeUploader } from './youtube/uploader';
import { lazyModule } from 'util/lazy-module';
import * as remote from '@electron/remote';
import pick from 'lodash/pick';
import cloneDeep from 'lodash/cloneDeep';
import { ENotificationType } from 'services/notifications';
const VERTICAL_STREAM_TITLE_SUFFIX = ' (Portrait)';
const makeVerticalTitle = (orig) => `${orig}${VERTICAL_STREAM_TITLE_SUFFIX}`;
let YoutubeService = class YoutubeService extends BasePlatformService {
    constructor() {
        super(...arguments);
        this.capabilities = new Set([
            'title',
            'description',
            'chat',
            'stream-schedule',
            'streamlabels',
            'themes',
            'viewerCount',
            'dualStream',
        ]);
        this.liveDockFeatures = new Set([
            'view-stream',
            'dashboard',
            'refresh-chat-streaming',
            'chat-streaming',
        ]);
        this.platform = 'youtube';
        this.displayName = 'YouTube';
        this.updatableSettings = [
            'title',
            'description',
            'enableAutoStop',
            'privacyStatus',
            'enableDvr',
        ];
        this.authWindowOptions = {
            width: 1000,
            height: 600,
        };
        this.apiBase = 'https://www.googleapis.com/youtube/v3';
    }
    init() {
        this.syncSettingsWithLocalStorage();
        this.streamingService.streamErrorCreated.subscribe(e => {
            if (this.state.verticalStreamKey || this.state.verticalBroadcast.id) {
                this.afterStopStream();
            }
        });
    }
    get authUrl() {
        const host = this.hostsService.streamlabs;
        return (`https://${host}/slobs/login?_=${Date.now()}` +
            '&skip_splash=true&external=electron&youtube&force_verify&origin=slobs');
    }
    get oauthToken() {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.userService.state.auth) === null || _a === void 0 ? void 0 : _a.platforms) === null || _b === void 0 ? void 0 : _b.youtube) === null || _c === void 0 ? void 0 : _c.token;
    }
    requestYoutube(reqInfo_1) {
        return __awaiter(this, arguments, void 0, function* (reqInfo, repeatRequestIfRateLimitExceed = true) {
            var _a, _b;
            try {
                return yield platformAuthorizedRequest('youtube', reqInfo);
            }
            catch (e) {
                console.error('Failed Youtube API request', e);
                const error = e;
                if ((e === null || e === void 0 ? void 0 : e.result) && ((_a = e.result) === null || _a === void 0 ? void 0 : _a.error)) {
                    console.log('Youtube API Error: ', JSON.stringify(e.result.error, null, 2));
                }
                let details = $t('Connection Failed');
                if (error === null || error === void 0 ? void 0 : error.message) {
                    details = error.message;
                }
                if ((_b = error === null || error === void 0 ? void 0 : error.url) !== null && _b !== void 0 ? _b : error === null || error === void 0 ? void 0 : error.url.split('/').includes('token')) {
                    error.statusText = `${$t('Authentication Error')}: ${details}`;
                }
                const isLiveStreamingDisabled = (error === null || error === void 0 ? void 0 : error.errors) &&
                    (error === null || error === void 0 ? void 0 : error.errors.length) &&
                    (error === null || error === void 0 ? void 0 : error.errors[0].reason) === 'liveStreamingNotEnabled';
                if (isLiveStreamingDisabled && repeatRequestIfRateLimitExceed) {
                    yield Utils.sleep(3000);
                    return yield this.requestYoutube(reqInfo, false);
                }
                let errorType = 'PLATFORM_REQUEST_FAILED';
                if (isLiveStreamingDisabled) {
                    errorType = 'YOUTUBE_STREAMING_DISABLED';
                }
                else if ((error === null || error === void 0 ? void 0 : error.status) === 423) {
                    errorType = 'YOUTUBE_TOKEN_EXPIRED';
                }
                throw throwStreamError(errorType, Object.assign(Object.assign({}, error), { platform: 'youtube' }), details);
            }
        });
    }
    SET_ENABLED_STATUS(enabled) {
        this.state.liveStreamingEnabled = enabled;
    }
    setupStreamShiftStream(goLiveSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            const settings = goLiveSettings === null || goLiveSettings === void 0 ? void 0 : goLiveSettings.streamShiftSettings;
            console.log('YouTube Stream Shift settings ', settings);
            if (settings && settings.broadcast_id !== null && !settings.is_live) {
                console.error('Stream Shift Error: YouTube is not live');
                this.postError('Stream Shift Error: YouTube is not live');
                return;
            }
            try {
                const liveBroadcasts = yield this.fetchBroadcastsByStatus('active');
                let broadcast = liveBroadcasts === null || liveBroadcasts === void 0 ? void 0 : liveBroadcasts[liveBroadcasts.length - 1];
                console.log('YouTube fetched ', liveBroadcasts === null || liveBroadcasts === void 0 ? void 0 : liveBroadcasts.length, ' active broadcasts');
                console.log('YouTube fetched active broadcast', broadcast);
                if (!broadcast) {
                    console.debug('No active YouTube broadcasts found');
                    this.postError($t('Auto-start is disabled for your broadcast. You should manually publish your stream from Youtube Studio'));
                    const upcomingBroadcasts = yield this.fetchBroadcastsByStatus('upcoming');
                    console.log('YouTube fetched ', upcomingBroadcasts === null || upcomingBroadcasts === void 0 ? void 0 : upcomingBroadcasts.length, ' upcoming broadcasts');
                    console.log('YouTube fetched upcoming broadcast', broadcast);
                    broadcast = upcomingBroadcasts === null || upcomingBroadcasts === void 0 ? void 0 : upcomingBroadcasts[upcomingBroadcasts.length - 1];
                }
                if (!broadcast) {
                    console.debug('No upcoming YouTube broadcasts found');
                    const ytSettings = getDefined(goLiveSettings.platforms.youtube);
                    broadcast = yield this.createBroadcast({
                        title: (_a = settings === null || settings === void 0 ? void 0 : settings.stream_title) !== null && _a !== void 0 ? _a : ytSettings.title,
                        description: (_b = ytSettings === null || ytSettings === void 0 ? void 0 : ytSettings.description) !== null && _b !== void 0 ? _b : '',
                    });
                    console.log('YouTube created broadcast', broadcast);
                }
                if (broadcast.contentDetails.boundStreamId) {
                    const liveStream = yield this.fetchLiveStream(broadcast.contentDetails.boundStreamId);
                    console.debug('Bound stream for YouTube broadcast: ', !!liveStream);
                    console.log('YouTube found stream', liveStream, ' bound to broadcast', broadcast.id);
                    const streamKey = liveStream.cdn.ingestionInfo.streamName;
                    this.SET_STREAM_KEY(streamKey);
                }
                else {
                    console.error('No stream to bind to YouTube broadcast, creating a new stream');
                    const liveStream = yield this.createLiveStream(broadcast.snippet.title);
                    yield this.bindStreamToBroadcast(broadcast.id, liveStream.id);
                    console.log('YouTube created stream', liveStream, ' and bound it to broadcast', broadcast.id);
                    const streamKey = liveStream.cdn.ingestionInfo.streamName;
                    this.SET_STREAM_KEY(streamKey);
                }
                const video = yield this.fetchVideo(broadcast.id);
                this.SET_STREAM_ID(broadcast.contentDetails.boundStreamId);
                console.log('YouTube fetched video', video, ' for broadcast', broadcast.id);
                const title = (_c = settings === null || settings === void 0 ? void 0 : settings.stream_title) !== null && _c !== void 0 ? _c : broadcast.snippet.title;
                this.UPDATE_STREAM_SETTINGS({
                    title,
                    broadcastId: broadcast.id,
                    description: broadcast.snippet.description,
                    categoryId: (_d = video === null || video === void 0 ? void 0 : video.snippet) === null || _d === void 0 ? void 0 : _d.categoryId,
                    enableAutoStart: broadcast.contentDetails.enableAutoStart,
                    enableAutoStop: broadcast.contentDetails.enableAutoStop,
                    enableDvr: broadcast.contentDetails.enableDvr,
                    projection: broadcast.contentDetails.projection,
                    latencyPreference: broadcast.contentDetails.latencyPreference,
                    privacyStatus: broadcast.status.privacyStatus,
                    selfDeclaredMadeForKids: broadcast.status.selfDeclaredMadeForKids,
                    thumbnail: ((_f = (_e = broadcast.snippet.thumbnails) === null || _e === void 0 ? void 0 : _e.high) === null || _f === void 0 ? void 0 : _f.url) || 'default',
                });
            }
            catch (e) {
                console.error('Error fetching broadcasts', e);
                if (settings) {
                    this.UPDATE_STREAM_SETTINGS({
                        title: settings.stream_title,
                        broadcastId: settings.broadcast_id,
                    });
                }
                return;
            }
            this.setPlatformContext('youtube');
        });
    }
    setupDualStream(goLiveSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            const ytSettings = getDefined(goLiveSettings.platforms.youtube);
            const title = makeVerticalTitle(ytSettings.title);
            const verticalBroadcast = yield this.createBroadcast(Object.assign(Object.assign({}, ytSettings), { title }));
            const verticalStream = yield this.createLiveStream(verticalBroadcast.snippet.title);
            const verticalBoundBroadcast = yield this.bindStreamToBroadcast(verticalBroadcast.id, verticalStream.id);
            yield this.updateCategory(verticalBroadcast.id, ytSettings.categoryId);
            const verticalStreamKey = verticalStream.cdn.ingestionInfo.streamName;
            this.SET_VERTICAL_STREAM_KEY(verticalStreamKey);
            this.SET_VERTICAL_BROADCAST(verticalBoundBroadcast);
            const destinations = cloneDeep(this.streamingService.views.customDestinations);
            const verticalDestination = {
                name: title,
                streamKey: verticalStreamKey,
                url: 'rtmp://a.rtmp.youtube.com/live2',
                enabled: true,
                display: 'vertical',
                mode: 'portrait',
                dualStream: true,
            };
            const customDestinations = [...destinations, verticalDestination];
            this.streamSettingsService.setGoLiveSettings({
                customDestinations,
            });
            if (this.streamingService.views.isMultiplatformMode) {
                this.streamSettingsService.setSettings({
                    streamType: 'rtmp_custom',
                    key: verticalDestination.streamKey,
                    server: verticalDestination.url,
                }, verticalDestination.display);
            }
            else {
                this.streamSettingsService.setSettings({
                    streamType: 'rtmp_custom',
                }, verticalDestination.display);
                this.streamSettingsService.setSettings({
                    key: verticalDestination.streamKey,
                    server: verticalDestination.url,
                }, verticalDestination.display);
            }
            this.setPlatformContext('youtube');
        });
    }
    beforeGoLive(goLiveSettings, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const ytSettings = getDefined(goLiveSettings.platforms.youtube);
            if (goLiveSettings.streamShift && this.streamingService.views.shouldSwitchStreams) {
                yield this.setupStreamShiftStream(goLiveSettings);
                return;
            }
            const streamToScheduledBroadcast = !!ytSettings.broadcastId;
            let broadcast;
            if (!streamToScheduledBroadcast) {
                broadcast = yield this.createBroadcast(ytSettings);
            }
            else {
                assertIsDefined(ytSettings.broadcastId);
                yield this.updateBroadcast(ytSettings.broadcastId, ytSettings);
                broadcast = yield this.fetchBroadcast(ytSettings.broadcastId);
                this.usageStatisticsService.actions.recordAnalyticsEvent('ScheduleStream', {
                    type: 'StreamToSchedule',
                    platform: 'youtube',
                    streamId: broadcast.id,
                });
            }
            let stream;
            if (!broadcast.contentDetails.boundStreamId) {
                stream = yield this.createLiveStream(broadcast.snippet.title);
                const b = yield this.bindStreamToBroadcast(broadcast.id, stream.id);
            }
            else {
                stream = yield this.fetchLiveStream(broadcast.contentDetails.boundStreamId);
            }
            yield this.updateCategory(broadcast.id, ytSettings.categoryId);
            const streamKey = stream.cdn.ingestionInfo.streamName;
            if (!this.streamingService.views.isMultiplatformMode) {
                this.streamSettingsService.setSettings({
                    platform: 'youtube',
                    key: streamKey,
                    streamType: 'rtmp_custom',
                    server: 'rtmp://a.rtmp.youtube.com/live2',
                }, context);
            }
            if (this.streamingService.views.isDualOutputMode && ytSettings.display === 'both') {
                yield new Promise(resolve => {
                    setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                        yield this.setupDualStream(goLiveSettings);
                        resolve();
                    }), 1000);
                });
            }
            if (ytSettings.thumbnail && ytSettings.thumbnail !== 'default') {
                const { thumbnail } = ytSettings, settings = __rest(ytSettings, ["thumbnail"]);
                this.UPDATE_STREAM_SETTINGS(Object.assign(Object.assign({}, settings), { broadcastId: broadcast.id }));
            }
            else {
                this.UPDATE_STREAM_SETTINGS(Object.assign(Object.assign({}, ytSettings), { broadcastId: broadcast.id }));
            }
            this.SET_STREAM_ID(stream.id);
            this.SET_STREAM_KEY(streamKey);
            this.setPlatformContext('youtube');
        });
    }
    afterStopStream() {
        return __awaiter(this, void 0, void 0, function* () {
            const destinations = this.streamingService.views.customDestinations.filter(dest => dest.streamKey !== this.state.verticalStreamKey);
            this.SET_VERTICAL_BROADCAST({});
            this.SET_VERTICAL_STREAM_KEY('');
            this.streamSettingsService.setGoLiveSettings({ customDestinations: destinations });
        });
    }
    validatePlatform() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const endpoint = 'liveStreams?part=id,snippet&mine=true';
                const url = `${this.apiBase}/${endpoint}`;
                yield platformAuthorizedRequest('youtube', url);
                this.SET_ENABLED_STATUS(true);
                return EPlatformCallResult.Success;
            }
            catch (e) {
                const error = e;
                if ((error === null || error === void 0 ? void 0 : error.errors) && (error === null || error === void 0 ? void 0 : error.status)) {
                    if (error.status === 423) {
                        console.error('Error 423: YouTube token expired, need to refresh', error);
                        this.SET_ENABLED_STATUS(false);
                        return EPlatformCallResult.TokenExpired;
                    }
                    if (error.status && error.status !== 403) {
                        console.error('Error checking if YT is enabled for live streaming', error);
                        return EPlatformCallResult.Error;
                    }
                    if ((error === null || error === void 0 ? void 0 : error.errors.length) && (error === null || error === void 0 ? void 0 : error.errors[0].reason) === 'liveStreamingNotEnabled') {
                        this.SET_ENABLED_STATUS(false);
                    }
                    return EPlatformCallResult.YoutubeStreamingDisabled;
                }
                if (error.status !== 403) {
                    console.error('Got 403 checking if YT is enabled for live streaming', error);
                    return EPlatformCallResult.Error;
                }
                const json = error.result;
                if (json.error &&
                    json.error.errors &&
                    json.error.errors[0].reason === 'liveStreamingNotEnabled') {
                    this.SET_ENABLED_STATUS(false);
                }
                return EPlatformCallResult.YoutubeStreamingDisabled;
            }
        });
    }
    getHeaders(req, authorized = false) {
        return Object.assign({ 'Content-Type': 'application/json' }, (authorized ? { Authorization: `Bearer ${this.oauthToken}` } : {}));
    }
    fetchDefaultDescription() {
        return this.userService
            .getDonationSettings()
            .then(json => json.settings.autopublish ? `Support the stream: ${json.donation_url} \n` : '');
    }
    fetchViewerCount() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.state.settings.broadcastId)
                return 0;
            const endpoint = 'videos?part=snippet,liveStreamingDetails';
            const url = `${this.apiBase}/${endpoint}&id=${this.state.settings.broadcastId}`;
            return this.requestYoutube(url).then(json => (json.items[0] && parseInt(json.items[0].liveStreamingDetails.concurrentViewers, 10)) || 0);
        });
    }
    fetchCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            const locale = this.i18nService.state.locale;
            const region = locale.split('-')[1];
            const endpoint = `${this.apiBase}/videoCategories?part=snippet&regionCode=${region}&locale=${locale}`;
            const collection = yield this.requestYoutube(endpoint);
            return collection.items.filter(category => category.snippet.assignable);
        });
    }
    updateCategory(broadcastId, categoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            const video = yield this.fetchVideo(broadcastId);
            const endpoint = 'videos?part=snippet';
            const snippet = pick(video.snippet, [
                'title',
                'description',
                'tags',
                'defaultAudioLanguage',
                'scheduledStartTime',
            ]);
            if (snippet.defaultAudioLanguage === 'zxx')
                delete snippet.defaultAudioLanguage;
            yield this.requestYoutube({
                body: JSON.stringify({
                    id: broadcastId,
                    snippet: Object.assign(Object.assign({}, snippet), { categoryId }),
                }),
                method: 'PUT',
                url: `${this.apiBase}/${endpoint}`,
            });
        });
    }
    fetchVideo(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = `videos?id=${id}&part=snippet`;
            const videoCollection = yield this.requestYoutube(`${this.apiBase}/${endpoint}`);
            return videoCollection.items[0];
        });
    }
    prepopulateInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const status = yield this.validatePlatform();
            if (status === EPlatformCallResult.TokenExpired) {
                yield this.fetchNewToken();
                yield this.validatePlatform();
            }
            if (!this.state.liveStreamingEnabled) {
                throw throwStreamError('YOUTUBE_STREAMING_DISABLED', { platform: 'youtube' });
            }
            const settings = this.state.settings;
            this.UPDATE_STREAM_SETTINGS({
                description: settings.description || (yield this.fetchDefaultDescription()),
            });
            if (!this.state.categories.length)
                this.SET_CATEGORIES(yield this.fetchCategories());
            this.SET_PREPOPULATED(true);
        });
    }
    scheduleStream(scheduledStartTime, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let broadcast;
            if (!options.broadcastId) {
                broadcast = yield this.createBroadcast(Object.assign(Object.assign({}, options), { scheduledStartTime }));
            }
            else {
                broadcast = yield this.updateBroadcast(options.broadcastId, Object.assign(Object.assign({}, options), { scheduledStartTime }));
            }
            return broadcast;
        });
    }
    fetchNewToken() {
        return __awaiter(this, void 0, void 0, function* () {
            const host = this.hostsService.streamlabs;
            const url = `https://${host}/api/v5/slobs/youtube/token`;
            const headers = authorizedHeaders(this.userService.apiToken);
            const request = new Request(url, { headers });
            return jfetch(request).then(response => this.userService.updatePlatformToken('youtube', response.access_token));
        });
    }
    putChannelInfo(options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const broadcastId = this.state.settings.broadcastId;
            assertIsDefined(broadcastId);
            if (this.state.settings.categoryId !== options.categoryId) {
                assertIsDefined(options.categoryId);
                yield this.updateCategory(broadcastId, options.categoryId);
            }
            yield this.updateBroadcast(broadcastId, options, true);
            if ((_a = this.state.verticalBroadcast) === null || _a === void 0 ? void 0 : _a.id) {
                const isMidStreamMode = this.streamingService.views.isMidStreamMode;
                yield this.updateBroadcast(this.state.verticalBroadcast.id, options, isMidStreamMode, true);
            }
            this.UPDATE_STREAM_SETTINGS(Object.assign(Object.assign({}, options), { broadcastId }));
        });
    }
    createBroadcast(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const fields = ['snippet', 'contentDetails', 'status'];
            const endpoint = `liveBroadcasts?part=${fields.join(',')}`;
            const scheduledStartTime = params.scheduledStartTime
                ? new Date(params.scheduledStartTime)
                : new Date();
            const data = {
                snippet: {
                    title: params.title,
                    scheduledStartTime: scheduledStartTime.toISOString(),
                    description: params.description,
                },
                contentDetails: {
                    enableAutoStart: params.enableAutoStart,
                    enableAutoStop: params.enableAutoStop,
                    enableDvr: params.enableDvr,
                    projection: params.projection,
                    latencyPreference: params.latencyPreference,
                },
                status: {
                    privacyStatus: params.privacyStatus,
                    selfDeclaredMadeForKids: params.selfDeclaredMadeForKids,
                },
            };
            const broadcast = yield this.requestYoutube({
                body: JSON.stringify(data),
                method: 'POST',
                url: `${this.apiBase}/${endpoint}`,
            });
            if (params.thumbnail && params.thumbnail !== 'default') {
                try {
                    yield this.uploadThumbnail(params.thumbnail, broadcast.id);
                    this.UPDATE_STREAM_SETTINGS({ thumbnail: params.thumbnail });
                }
                catch (e) {
                    console.debug('Error uploading thumbnail:', e);
                    let message = $t('Please upload thumbnail manually on YouTube.');
                    if (e instanceof StreamError) {
                        message = [$t('Please upload thumbnail manually on YouTube.'), e.details].join(' ');
                    }
                    this.notificationsService.actions.push({
                        message,
                        type: ENotificationType.WARNING,
                    });
                }
            }
            return broadcast;
        });
    }
    updateBroadcast(id_1, params_1) {
        return __awaiter(this, arguments, void 0, function* (id, params, isMidStreamMode = false, isVertical = false) {
            let broadcast = yield this.fetchBroadcast(id);
            const title = params.title && isVertical ? makeVerticalTitle(params.title) : params.title;
            const scheduledStartTime = params.scheduledStartTime
                ? new Date(params.scheduledStartTime)
                : new Date();
            const snippet = {
                title,
                description: params.description,
                scheduledStartTime: scheduledStartTime.toISOString(),
            };
            const contentDetails = {
                enableAutoStart: isMidStreamMode
                    ? broadcast.contentDetails.enableAutoStart
                    : params.enableAutoStart,
                enableAutoStop: params.enableAutoStop,
                enableDvr: params.enableDvr,
                enableEmbed: broadcast.contentDetails.enableEmbed,
                projection: isMidStreamMode ? broadcast.contentDetails.projection : params.projection,
                latencyPreference: isMidStreamMode
                    ? broadcast.contentDetails.latencyPreference
                    : params.latencyPreference,
                recordFromStart: broadcast.contentDetails.recordFromStart,
                enableContentEncryption: broadcast.contentDetails.enableContentEncryption,
                startWithSlate: broadcast.contentDetails.startWithSlate,
                monitorStream: {
                    enableMonitorStream: broadcast.contentDetails.monitorStream.enableMonitorStream,
                    broadcastStreamDelayMs: broadcast.contentDetails.monitorStream.broadcastStreamDelayMs,
                },
            };
            const status = Object.assign(Object.assign({}, broadcast.status), { selfDeclaredMadeForKids: params.selfDeclaredMadeForKids, privacyStatus: params.privacyStatus });
            const fields = ['snippet', 'status', 'contentDetails'];
            const endpoint = `liveBroadcasts?part=${fields.join(',')}&id=${id}`;
            const body = { id, snippet, contentDetails, status };
            broadcast = yield this.requestYoutube({
                body: JSON.stringify(body),
                method: 'PUT',
                url: `${this.apiBase}/${endpoint}`,
            });
            if (!isMidStreamMode) {
                yield this.updateCategory(broadcast.id, params.categoryId);
            }
            if (params.thumbnail)
                yield this.uploadThumbnail(params.thumbnail, broadcast.id);
            return broadcast;
        });
    }
    removeBroadcast(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = `liveBroadcasts?&id=${id}`;
            yield this.requestYoutube({
                method: 'DELETE',
                url: `${this.apiBase}/${endpoint}`,
            });
        });
    }
    bindStreamToBroadcast(broadcastId, streamId) {
        const fields = ['snippet', 'contentDetails', 'status'];
        const endpoint = `/liveBroadcasts/bind?part=${fields.join(',')}`;
        return this.requestYoutube({
            method: 'POST',
            url: `${this.apiBase}${endpoint}&id=${broadcastId}&streamId=${streamId}`,
        });
    }
    createLiveStream(title) {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = 'liveStreams?part=cdn,snippet,contentDetails';
            return platformAuthorizedRequest('youtube', {
                url: `${this.apiBase}/${endpoint}`,
                method: 'POST',
                body: JSON.stringify({
                    snippet: { title },
                    cdn: {
                        frameRate: 'variable',
                        ingestionType: 'rtmp',
                        resolution: 'variable',
                    },
                    contentDetails: { isReusable: false },
                }),
            });
        });
    }
    get liveDockEnabled() {
        return this.streamSettingsService.settings.protectedModeEnabled;
    }
    fetchEligibleBroadcasts() {
        return __awaiter(this, arguments, void 0, function* (apply24hFilter = true) {
            const fields = ['snippet', 'contentDetails', 'status'];
            const query = `part=${fields.join(',')}&maxResults=50`;
            let [activeBroadcasts, upcomingBroadcasts] = yield Promise.all([
                (yield platformAuthorizedRequest('youtube', `${this.apiBase}/liveBroadcasts?${query}&broadcastStatus=active`)).items,
                (yield platformAuthorizedRequest('youtube', `${this.apiBase}/liveBroadcasts?${query}&broadcastStatus=upcoming`)).items,
            ]);
            activeBroadcasts = activeBroadcasts.filter(broadcast => !broadcast.contentDetails.enableAutoStop);
            if (apply24hFilter) {
                upcomingBroadcasts = upcomingBroadcasts.filter(broadcast => {
                    const timeRange = 1000 * 60 * 60 * 24;
                    const maxDate = Date.now() + timeRange;
                    const minDate = Date.now() - timeRange;
                    const broadcastDate = new Date(broadcast.snippet.scheduledStartTime).valueOf();
                    return broadcastDate > minDate && broadcastDate < maxDate;
                });
            }
            return [...activeBroadcasts, ...upcomingBroadcasts];
        });
    }
    fetchBroadcasts() {
        return __awaiter(this, void 0, void 0, function* () {
            const fields = ['snippet', 'contentDetails', 'status'];
            const query = `part=${fields.join(',')}&broadcastType=all&mine=true&maxResults=100`;
            const broadcasts = (yield platformAuthorizedRequest('youtube', `${this.apiBase}/liveBroadcasts?${query}`)).items;
            return broadcasts;
        });
    }
    fetchBroadcastsByStatus(status) {
        return __awaiter(this, void 0, void 0, function* () {
            const fields = ['snippet', 'contentDetails', 'status'];
            const query = `part=${fields.join(',')}`;
            const broadcasts = (yield platformAuthorizedRequest('youtube', `${this.apiBase}/liveBroadcasts?${query}&broadcastStatus=${status}&maxResults=100`)).items;
            return broadcasts;
        });
    }
    fetchLiveStream(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${this.apiBase}/liveStreams?part=cdn,snippet,contentDetails&id=${id}`;
            return (yield platformAuthorizedRequest('youtube', url))
                .items[0];
        });
    }
    fetchBroadcast(id_1) {
        return __awaiter(this, arguments, void 0, function* (id, fields = ['snippet', 'contentDetails', 'status']) {
            const filter = `&id=${id}`;
            const query = `part=${fields.join(',')}${filter}&maxResults=1`;
            return (yield platformAuthorizedRequest('youtube', `${this.apiBase}/liveBroadcasts?${query}`)).items[0];
        });
    }
    get chatUrl() {
        const broadcastId = this.state.settings.broadcastId;
        if (!broadcastId)
            return '';
        const mode = this.customizationService.isDarkTheme ? 'night' : 'day';
        const youtubeDomain = mode === 'day' ? 'https://youtube.com' : 'https://gaming.youtube.com';
        return `${youtubeDomain}/live_chat?v=${broadcastId}&is_popout=1`;
    }
    fetchStartStreamOptionsForBroadcast(broadcastId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [broadcast, video] = yield Promise.all([
                this.fetchBroadcast(broadcastId),
                this.fetchVideo(broadcastId),
            ]);
            const { title, description } = broadcast.snippet;
            const { privacyStatus, selfDeclaredMadeForKids } = broadcast.status;
            const { enableDvr, projection, latencyPreference } = broadcast.contentDetails;
            return {
                broadcastId: broadcast.id,
                title,
                description,
                privacyStatus,
                selfDeclaredMadeForKids,
                enableDvr,
                projection,
                latencyPreference,
                categoryId: video.snippet.categoryId,
                thumbnail: broadcast.snippet.thumbnails.default.url,
            };
        });
    }
    openYoutubeEnable() {
        remote.shell.openExternal('https://youtube.com/live_dashboard_splash');
    }
    openDashboard() {
        remote.shell.openExternal(this.dashboardUrl);
    }
    get dashboardUrl() {
        return `https://studio.youtube.com/video/${this.state.settings.broadcastId}/livestreaming`;
    }
    get streamPageUrl() {
        const nightMode = this.customizationService.isDarkTheme ? 'night' : 'day';
        const youtubeDomain = nightMode === 'day' ? 'https://youtube.com' : 'https://gaming.youtube.com';
        return `${youtubeDomain}/watch?v=${this.state.settings.broadcastId}`;
    }
    uploadThumbnail(base64url, videoId) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = base64url !== 'default' ? base64url : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            if (base64url.startsWith('http')) {
                return;
            }
            const body = yield fetch(url).then(res => res.blob());
            try {
                yield jfetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`, { method: 'POST', body, headers: { Authorization: `Bearer ${this.oauthToken}` } });
            }
            catch (e) {
                console.error('Failed to upload thumbnail', e);
                const errorType = 'YOUTUBE_THUMBNAIL_UPLOAD_FAILED';
                const error = e;
                let details = 'Failed to upload thumbnail.';
                const code = (error === null || error === void 0 ? void 0 : error.code) || (error === null || error === void 0 ? void 0 : error.status);
                if (code) {
                    const hasReason = (error === null || error === void 0 ? void 0 : error.errors) && (error === null || error === void 0 ? void 0 : error.errors.length) && (error === null || error === void 0 ? void 0 : error.errors[0].reason);
                    switch (code) {
                        case 400:
                            if (hasReason && error.errors[0].reason === 'invalidImage') {
                                details = $t('Thumbnail image content is invalid.');
                            }
                            else if (hasReason && error.errors[0].reason === 'mediaBodyRequired') {
                                details = $t('Thumbnail file does not include image content.');
                            }
                            break;
                        case 403:
                            details = $t('Permission missing to upload thumbnails.');
                            break;
                        case 413:
                            details = $t('YouTube thumbnail image is too large. Maximum size is 2MB.');
                            break;
                        case 404:
                            details = $t('Video does not exist. Thumbnail upload failed.');
                            break;
                        case 429:
                            details = $t('Exceeded thumbnail upload quota. Please try again later.');
                            break;
                        default:
                            details = (error === null || error === void 0 ? void 0 : error.message) || details;
                    }
                }
                throw throwStreamError(errorType, Object.assign(Object.assign({}, error), { platform: 'youtube' }), details);
            }
        });
    }
    stopBroadcast(broadcastId) {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = `liveBroadcasts/transition?id=${broadcastId}&broadcastStatus=complete`;
            return platformAuthorizedRequest('youtube', {
                url: `${this.apiBase}/${endpoint}`,
                method: 'POST',
            });
        });
    }
    fetchFollowers() {
        return platformAuthorizedRequest('youtube', `${this.apiBase}/channels?part=statistics&mine=true`)
            .then(json => Number(json.items[0].statistics.subscriberCount))
            .catch(() => 0);
    }
    SET_STREAM_ID(streamId) {
        this.state.streamId = streamId;
    }
    SET_VERTICAL_STREAM_KEY(verticalStreamKey) {
        this.state.verticalStreamKey = verticalStreamKey;
    }
    SET_VERTICAL_BROADCAST(broadcast) {
        this.state.verticalBroadcast = broadcast;
    }
    SET_CATEGORIES(categories) {
        this.state.categories = categories;
    }
};
YoutubeService.initialState = Object.assign(Object.assign({}, BasePlatformService.initialState), { liveStreamingEnabled: true, streamId: '', verticalStreamKey: '', verticalBroadcast: {}, broadcastStatus: '', categories: [], settings: {
        broadcastId: '',
        title: '',
        description: '',
        categoryId: '20',
        enableAutoStart: true,
        enableAutoStop: true,
        enableDvr: true,
        projection: 'rectangular',
        latencyPreference: 'normal',
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false,
        thumbnail: '',
        video: undefined,
        mode: undefined,
        display: 'horizontal',
    } });
__decorate([
    Inject()
], YoutubeService.prototype, "customizationService", void 0);
__decorate([
    Inject()
], YoutubeService.prototype, "usageStatisticsService", void 0);
__decorate([
    Inject()
], YoutubeService.prototype, "i18nService", void 0);
__decorate([
    lazyModule(YoutubeUploader)
], YoutubeService.prototype, "uploader", void 0);
__decorate([
    mutation()
], YoutubeService.prototype, "SET_ENABLED_STATUS", null);
__decorate([
    mutation()
], YoutubeService.prototype, "SET_STREAM_ID", null);
__decorate([
    mutation()
], YoutubeService.prototype, "SET_VERTICAL_STREAM_KEY", null);
__decorate([
    mutation()
], YoutubeService.prototype, "SET_VERTICAL_BROADCAST", null);
__decorate([
    mutation()
], YoutubeService.prototype, "SET_CATEGORIES", null);
YoutubeService = __decorate([
    InheritMutations()
], YoutubeService);
export { YoutubeService };
//# sourceMappingURL=youtube.js.map