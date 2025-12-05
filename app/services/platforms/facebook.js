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
import moment from 'moment';
import flatten from 'lodash/flatten';
import * as remote from '@electron/remote';
import { mutation, InheritMutations, ViewHandler } from '../core/stateful-service';
import { Inject } from 'services/core/injector';
import { authorizedHeaders } from 'util/requests';
import { UserService } from 'services/user';
import { platformAuthorizedRequest, platformRequest } from './utils';
import { throwStreamError } from 'services/streaming/stream-error';
import { BasePlatformService } from './base-platform';
import { assertIsDefined, getDefined } from '../../util/properties-type-guards';
import { ENotificationType } from '../notifications';
import { $t } from '../i18n';
import { Service } from '../core';
const initialState = Object.assign(Object.assign({}, BasePlatformService.initialState), { facebookPages: [], facebookGroups: [], grantedPermissions: [], outageWarning: '', streamPageUrl: '', streamDashboardUrl: '', userAvatar: '', videoId: '', settings: {
        destinationType: 'page',
        pageId: '',
        groupId: '',
        liveVideoId: '',
        title: '',
        description: '',
        game: '',
        mode: undefined,
        event_params: {},
        privacy: { value: 'EVERYONE' },
    } });
const VIDEO_FIELDS = [
    'title',
    'description',
    'stream_url',
    'planned_start_time',
    'permalink_url',
    'video',
];
let FacebookService = class FacebookService extends BasePlatformService {
    constructor() {
        super(...arguments);
        this.platform = 'facebook';
        this.displayName = 'Facebook';
        this.capabilities = new Set([
            'title',
            'description',
            'chat',
            'game',
            'user-info',
            'stream-schedule',
            'account-merging',
            'streamlabels',
            'themes',
            'viewerCount',
        ]);
        this.liveDockFeatures = new Set([
            'chat-streaming',
            'refresh-chat',
            'dashboard',
            'view-stream',
        ]);
        this.authWindowOptions = { width: 800, height: 800 };
        this.apiBase = 'https://graph.facebook.com/v22.0';
    }
    openStreamIneligibleHelp() {
        const FACEBOOK_STREAM_INELIGIBLE_HELP = 'https://www.facebook.com/business/help/216491699144904';
        return remote.shell.openExternal(FACEBOOK_STREAM_INELIGIBLE_HELP);
    }
    get views() {
        return new FacebookView(this.state);
    }
    init() {
        this.syncSettingsWithLocalStorage();
    }
    SET_FACEBOOK_PAGES_AND_GROUPS(pages, groups) {
        this.state.facebookPages = pages;
        this.state.facebookGroups = groups;
    }
    SET_PERMISSIONS(permissions) {
        this.state.grantedPermissions = permissions;
    }
    SET_STREAM_PAGE_URL(url) {
        this.state.streamPageUrl = url;
    }
    SET_STREAM_DASHBOARD_URL(url) {
        this.state.streamDashboardUrl = url;
    }
    SET_AVATAR(avatar) {
        this.state.userAvatar = avatar;
    }
    SET_OUTAGE_WARN(msg) {
        this.state.outageWarning = msg;
    }
    SET_VIDEO_ID(id) {
        this.state.videoId = id;
    }
    get authUrl() {
        const host = this.hostsService.streamlabs;
        const query = `_=${Date.now()}&skip_splash=true&external=electron&facebook&force_verify&origin=slobs`;
        return `https://${host}/slobs/login?${query}`;
    }
    get mergeUrl() {
        const host = this.hostsService.streamlabs;
        const token = this.userService.apiToken;
        return `https://${host}/slobs/merge/${token}/facebook_account`;
    }
    get oauthToken() {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.userService.state.auth) === null || _a === void 0 ? void 0 : _a.platforms) === null || _b === void 0 ? void 0 : _b.facebook) === null || _c === void 0 ? void 0 : _c.token;
    }
    get streamPageUrl() {
        return this.state.streamPageUrl;
    }
    get dashboardUrl() {
        return this.state.streamDashboardUrl;
    }
    beforeGoLive(options, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const fbOptions = getDefined(options.platforms.facebook);
            if (options.streamShift && this.streamingService.views.shouldSwitchStreams) {
                yield this.setupStreamShiftStream(options);
                return;
            }
            let liveVideo;
            if (fbOptions.liveVideoId) {
                liveVideo = yield this.updateLiveVideo(fbOptions.liveVideoId, fbOptions, true);
                this.usageStatisticsService.actions.recordAnalyticsEvent('ScheduleStream', {
                    type: 'StreamToSchedule',
                    platform: 'facebook',
                    streamId: liveVideo.id,
                });
            }
            else {
                liveVideo = yield this.createLiveVideo(fbOptions);
            }
            const streamUrl = liveVideo.stream_url;
            const streamKey = streamUrl.slice(streamUrl.lastIndexOf('/') + 1);
            if (!this.streamingService.views.isMultiplatformMode) {
                this.streamSettingsService.setSettings({
                    key: streamKey,
                    platform: 'facebook',
                    streamType: 'rtmp_common',
                    server: 'rtmps://rtmp-api.facebook.com:443/rtmp/',
                }, context);
            }
            this.SET_STREAM_KEY(streamKey);
            this.SET_STREAM_PAGE_URL(`https://facebook.com/${liveVideo.permalink_url}`);
            this.SET_STREAM_DASHBOARD_URL(`https://facebook.com/live/producer/${liveVideo.video.id}`);
            this.UPDATE_STREAM_SETTINGS(Object.assign(Object.assign({}, fbOptions), { liveVideoId: liveVideo.id }));
            this.SET_VIDEO_ID(liveVideo.video.id);
            if (fbOptions.destinationType === 'page') {
                assertIsDefined(fbOptions.pageId);
                yield this.postPage(fbOptions.pageId);
            }
            this.setPlatformContext('facebook');
        });
    }
    putChannelInfo(info) {
        return __awaiter(this, void 0, void 0, function* () {
            const vidId = this.state.settings.liveVideoId;
            assertIsDefined(vidId);
            yield this.updateLiveVideo(vidId, info);
            this.UPDATE_STREAM_SETTINGS(Object.assign(Object.assign({}, info), { liveVideoId: vidId }));
        });
    }
    setupStreamShiftStream(goLiveSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g;
            const settings = goLiveSettings.streamShiftSettings;
            if (settings && !settings.is_live) {
                console.error('Stream Shift Error: Facebook is not live');
                this.postError('Stream Shift Error: Facebook is not live');
                return;
            }
            const [pages, groups] = (yield Promise.all([
                this.fetchPages(),
                this.fetchGroups(),
            ]));
            this.SET_FACEBOOK_PAGES_AND_GROUPS(pages, groups);
            if (pages.length) {
                const pageId = this.state.settings.pageId;
                const page = this.views.getPage(pageId);
                if (!page)
                    this.UPDATE_STREAM_SETTINGS({ pageId: this.state.facebookPages[0].id });
            }
            else {
                this.UPDATE_STREAM_SETTINGS({ pageId: '' });
            }
            if (groups.length) {
                const groupId = this.state.settings.groupId;
                const group = this.views.getGroup(groupId);
                if (!group)
                    this.UPDATE_STREAM_SETTINGS({ groupId: this.state.facebookGroups[0].id });
            }
            else {
                this.UPDATE_STREAM_SETTINGS({ groupId: '' });
            }
            if ((this.state.settings.destinationType === 'page' && !this.state.settings.pageId) ||
                (this.state.settings.destinationType === 'group' && !this.state.settings.groupId)) {
                this.UPDATE_STREAM_SETTINGS({ destinationType: 'me' });
            }
            console.log('FACEBOOK await this.fetchPicture("me")', yield this.fetchPicture('me'));
            if (!this.state.userAvatar) {
                this.SET_AVATAR(yield this.fetchPicture('me'));
            }
            this.SET_PREPOPULATED(true);
            const id = (_a = settings === null || settings === void 0 ? void 0 : settings.channel_name) !== null && _a !== void 0 ? _a : (_d = (_c = (_b = this.userService.state.auth) === null || _b === void 0 ? void 0 : _b.platforms) === null || _c === void 0 ? void 0 : _c.facebook) === null || _d === void 0 ? void 0 : _d.id;
            const liveVideoId = settings === null || settings === void 0 ? void 0 : settings.broadcast_id;
            const title = (_g = (_e = settings === null || settings === void 0 ? void 0 : settings.stream_title) !== null && _e !== void 0 ? _e : (_f = goLiveSettings.platforms.facebook) === null || _f === void 0 ? void 0 : _f.title) !== null && _g !== void 0 ? _g : '';
            if (!liveVideoId) {
                console.error('Error setting up stream shift for Facebook, no broadcast id found.');
                this.UPDATE_STREAM_SETTINGS({ title });
            }
            else {
                this.SET_STREAM_PAGE_URL(`https://facebook.com/${id}/videos/${liveVideoId}`);
                this.SET_STREAM_DASHBOARD_URL(`https://facebook.com/live/producer/v2/${liveVideoId}/dashboard`);
                this.UPDATE_STREAM_SETTINGS({
                    title,
                    liveVideoId,
                });
                this.SET_VIDEO_ID(liveVideoId);
            }
            if (this.state.settings.destinationType === 'page') {
                assertIsDefined(this.state.settings.pageId);
                yield this.postPage(this.state.settings.pageId);
            }
            this.setPlatformContext('facebook');
        });
    }
    updateLiveVideo(liveVideoId_1, options_1) {
        return __awaiter(this, arguments, void 0, function* (liveVideoId, options, switchToLive = false) {
            const { title, description, game, privacy, event_params } = options;
            const data = { title, description };
            if (Object.keys(event_params).length) {
                data.event_params = event_params;
            }
            if (event_params.start_time) {
                data.event_params.start_time = Math.round(new Date(event_params.start_time).getTime() / 1000);
            }
            if (switchToLive) {
                data.status = 'LIVE_NOW';
                data.event_params.status = 'LIVE_NOW';
            }
            const destinationId = this.views.getDestinationId(options);
            const token = this.views.getDestinationToken(options.destinationType, destinationId);
            if (privacy === null || privacy === void 0 ? void 0 : privacy.value)
                data.privacy = privacy;
            return yield this.requestFacebook({
                url: `${this.apiBase}/${liveVideoId}?fields=${VIDEO_FIELDS.join(',')}`,
                method: 'POST',
                body: JSON.stringify(data),
            }, token);
        });
    }
    removeLiveVideo(liveVideoId, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const token = this.views.getDestinationToken(options.destinationType, options.destinationId);
            return yield this.requestFacebook({
                url: `${this.apiBase}/${liveVideoId}`,
                method: 'DELETE',
            }, token);
        });
    }
    getHeaders(req, useToken) {
        const token = typeof useToken === 'string' ? useToken : useToken && this.oauthToken;
        return Object.assign({ 'Content-Type': 'application/json' }, (token ? { Authorization: `Bearer ${token}` } : {}));
    }
    fetchNewToken() {
        return Promise.resolve();
    }
    fetchPermissions() {
        return __awaiter(this, void 0, void 0, function* () {
            const permissionsResponse = yield this.requestFacebook(`${this.apiBase}/me/permissions`, this.oauthToken);
            return permissionsResponse.data;
        });
    }
    requestFacebook(reqInfo, token) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                return token
                    ? yield platformRequest('facebook', reqInfo, token)
                    : yield platformAuthorizedRequest('facebook', reqInfo);
            }
            catch (e) {
                const ACCOUNT_NOT_OLD_ENOUGH = 1363120;
                const NOT_ENOUGH_FOLLOWERS_FOR_PAGE = 1363144;
                const UNKNOWN_SUBCODE = 1969070;
                const notEligibleErrorCodes = [
                    ACCOUNT_NOT_OLD_ENOUGH,
                    NOT_ENOUGH_FOLLOWERS_FOR_PAGE,
                    UNKNOWN_SUBCODE,
                ];
                const error = (_a = e.result) === null || _a === void 0 ? void 0 : _a.error;
                if (error && notEligibleErrorCodes.includes(error.error_subcode)) {
                    this.notificationsService.push({
                        type: ENotificationType.WARNING,
                        message: $t('Your account is not eligible to stream on Facebook. Click to learn more'),
                        action: this.jsonrpcService.createRequest(Service.getResourceId(this), 'openStreamIneligibleHelp'),
                    });
                    throwStreamError('FACEBOOK_STREAMING_DISABLED', Object.assign(Object.assign({}, e), { platform: 'facebook' }));
                }
                const details = error ? `${error.type} ${error.message}` : 'Connection failed';
                throwStreamError('PLATFORM_REQUEST_FAILED', Object.assign(Object.assign({}, e), { platform: 'facebook' }), details);
            }
        });
    }
    fetchPicture(objectId) {
        return __awaiter(this, void 0, void 0, function* () {
            let url = '';
            try {
                yield fetch(`${this.apiBase}/${objectId}/picture`, {
                    method: 'GET',
                    headers: new Headers({
                        Authorization: 'Bearer ' + this.oauthToken,
                    }),
                })
                    .then(response => response.blob())
                    .then(blob => {
                    url = window.URL.createObjectURL(blob);
                });
            }
            catch (e) {
            }
            return url;
        });
    }
    createLiveVideo(options) {
        const { title, description, game, privacy } = options;
        const destinationId = this.views.getDestinationId(options);
        const token = this.views.getDestinationToken(options.destinationType, destinationId);
        const body = { title, description };
        if (privacy === null || privacy === void 0 ? void 0 : privacy.value)
            body.privacy = privacy;
        return this.requestFacebook({
            url: `${this.apiBase}/${destinationId}/live_videos?&fields=title,description,planned_start_time,permalink_url,stream_url,dash_preview_url,video`,
            method: 'POST',
            body: JSON.stringify(body),
        }, token);
    }
    prepopulateInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const permissions = yield this.fetchPermissions();
            const grantedPermissions = permissions
                .filter(p => ['publish_video', 'publish_to_groups'].includes(p.permission))
                .filter(p => p.status === 'granted')
                .map(p => p.permission);
            this.SET_PERMISSIONS(grantedPermissions);
            const [pages, groups] = (yield Promise.all([
                this.fetchPages(),
                this.fetchGroups(),
            ]));
            this.SET_FACEBOOK_PAGES_AND_GROUPS(pages, groups);
            if (pages.length) {
                const pageId = this.state.settings.pageId;
                const page = this.views.getPage(pageId);
                if (!page)
                    this.UPDATE_STREAM_SETTINGS({ pageId: this.state.facebookPages[0].id });
            }
            else {
                this.UPDATE_STREAM_SETTINGS({ pageId: '' });
            }
            if (groups.length) {
                const groupId = this.state.settings.groupId;
                const group = this.views.getGroup(groupId);
                if (!group)
                    this.UPDATE_STREAM_SETTINGS({ groupId: this.state.facebookGroups[0].id });
            }
            else {
                this.UPDATE_STREAM_SETTINGS({ groupId: '' });
            }
            if ((this.state.settings.destinationType === 'page' && !this.state.settings.pageId) ||
                (this.state.settings.destinationType === 'group' && !this.state.settings.groupId)) {
                this.UPDATE_STREAM_SETTINGS({ destinationType: 'me' });
            }
            if (!this.state.userAvatar) {
                this.SET_AVATAR(yield this.fetchPicture('me'));
            }
            this.SET_PREPOPULATED(true);
        });
    }
    scheduleStream(scheduledStartTime, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { title, description, game } = options;
            const destinationId = this.views.getDestinationId(options);
            const token = this.views.getDestinationToken(options.destinationType, destinationId);
            const url = `${this.apiBase}/${destinationId}/live_videos?fields=${VIDEO_FIELDS.join(',')}`;
            const data = {
                title,
                description,
                event_params: {
                    start_time: Math.round(new Date(scheduledStartTime).getTime() / 1000),
                    status: 'SCHEDULED_UNPUBLISHED',
                },
            };
            const body = JSON.stringify(data);
            return yield this.requestFacebook({ url, body, method: 'POST' }, token);
        });
    }
    fetchScheduledVideos(destinationType_1, destinationId_1) {
        return __awaiter(this, arguments, void 0, function* (destinationType, destinationId, onlyUpcoming = false) {
            const timeRange = 1000 * 60 * 60 * 24;
            const maxDate = Date.now() + timeRange;
            const minDate = Date.now() - timeRange;
            const token = this.views.getDestinationToken(destinationType, destinationId);
            let sourceParam = '';
            if (destinationType === 'page' || destinationType === 'me') {
                sourceParam = '&source=owner';
            }
            else {
                sourceParam = '&source=target';
            }
            try {
                let videos = (yield this.requestFacebook(`${this.apiBase}/${destinationId}/events`, token)).data;
                if (onlyUpcoming) {
                    videos = videos.filter(v => {
                        if (!v.start_time)
                            return true;
                        const videoDate = new Date(v.start_time).valueOf();
                        return videoDate >= minDate && videoDate <= maxDate;
                    });
                }
                return videos.map(v => ({
                    id: v.id,
                    title: v.name,
                    stream_url: '',
                    permalink_url: '',
                    event_params: {
                        start_time: moment(v.start_time).unix(),
                        status: 'SCHEDULED_UNPUBLISHED',
                    },
                    description: v.description,
                    status: 'SCHEDULED_UNPUBLISHED',
                    game: '',
                    video: { id: v.id },
                    broadcast_start_time: v.start_time,
                }));
            }
            catch (e) {
                return [];
            }
        });
    }
    fetchAllVideos() {
        return __awaiter(this, arguments, void 0, function* (onlyUpcoming = false) {
            const requests = [];
            this.state.facebookPages.forEach(page => {
                const destinationType = 'page';
                const destinationId = page.id;
                requests.push(this.fetchScheduledVideos(destinationType, destinationId, onlyUpcoming).then(videos => videos.map(video => (Object.assign(Object.assign({}, video), { destinationType, destinationId })))));
            });
            this.state.facebookGroups.forEach(group => {
                const destinationType = 'group';
                const destinationId = group.id;
                requests.push(this.fetchScheduledVideos(destinationType, destinationId, onlyUpcoming).then(videos => videos.map(video => (Object.assign(Object.assign({}, video), { destinationType, destinationId })))));
            });
            requests.push(this.fetchScheduledVideos('me', 'me', onlyUpcoming).then(videos => videos.map(video => (Object.assign(Object.assign({}, video), { destinationType: 'me', destinationId: 'me' })))));
            const videoCollections = yield Promise.all(requests);
            return flatten(videoCollections);
        });
    }
    fetchVideo(id, destinationType, destinationId) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${this.apiBase}/${id}?&fields=${VIDEO_FIELDS.join(',')}`;
            const token = this.views.getDestinationToken(destinationType, destinationId);
            const video = yield this.requestFacebook(url, token);
            return Object.assign(Object.assign({}, video), { destinationType, destinationId });
        });
    }
    fetchStartStreamOptionsForVideo(id, destinationType, destinationId) {
        return __awaiter(this, void 0, void 0, function* () {
            const video = yield this.fetchVideo(id, destinationType, destinationId);
            return {
                destinationType,
                liveVideoId: id,
                title: video.title,
                description: video.description,
                pageId: destinationId,
                groupId: destinationId,
                event_params: video.event_params,
            };
        });
    }
    fetchGroups() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return (yield this.requestFacebook(`${this.apiBase}/me/groups?admin_only=true&fields=administrator,id,name,icon,privacy&limit=100`)).data;
            }
            catch (e) {
                console.error('Error fetching Facebook groups', e);
                this.SET_OUTAGE_WARN('Streaming to Facebook groups is currently unavailable.  Please try again later.');
                return [];
            }
        });
    }
    fetchViewerCount() {
        const { liveVideoId } = this.state.settings;
        if (liveVideoId == null)
            return Promise.resolve(0);
        const url = `${this.apiBase}/${this.state.settings.liveVideoId}?fields=live_views`;
        const token = this.views.getDestinationToken();
        return this.requestFacebook(url, token)
            .then(json => json.live_views)
            .catch(() => 0);
    }
    fetchFollowers() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.state.isPrepopulated === false)
                yield this.prepopulateInfo();
            try {
                const resp = yield this.requestFacebook(`${this.apiBase}/${this.state.settings.pageId}?fields=followers_count`);
                return resp.followers_count;
            }
            catch (e) {
                return 0;
            }
        });
    }
    searchGames(searchString) {
        return __awaiter(this, void 0, void 0, function* () {
            if (searchString.length < 2)
                return [];
            const gamesResponse = yield this.requestFacebook(`${this.apiBase}/search?type=game&q=${searchString}`);
            return gamesResponse.data.slice(0, 15).map(g => ({ id: g.id, name: g.name }));
        });
    }
    get chatUrl() {
        if (!this.state.videoId)
            return '';
        const page = this.state.settings.destinationType === 'page' &&
            this.state.facebookPages.find(p => p.id === this.state.settings.pageId);
        if (page && page.category === 'Gaming video creator') {
            return `https://www.facebook.com/live/producer/dashboard/${this.state.videoId}/COMMENTS/`;
        }
        else if (page && this.state.settings.game) {
            return `https://www.facebook.com/gaming/streamer/chat?page=${page.id}`;
        }
        else {
            const token = this.views.getDestinationToken(this.state.settings.destinationType, this.state.settings.pageId);
            if (!token)
                return '';
            return `https://streamlabs.com/embed/chat?oauth_token=${this.userService.apiToken}&fbVideoId=${this.state.settings.liveVideoId}&fbToken=${token}`;
        }
    }
    get liveDockEnabled() {
        return true;
    }
    createFBPage() {
        remote.shell.openExternal('https://www.facebook.com/gaming/pages/create?ref=streamlabs');
        this.windowsService.actions.closeChildWindow();
    }
    fetchPages() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.requestFacebook(`${this.apiBase}/me/accounts?limit=100`, this.oauthToken)).data;
        });
    }
    postPage(pageId) {
        const host = this.hostsService.streamlabs;
        const url = `https://${host}/api/v5/slobs/user/facebook/pages`;
        const headers = authorizedHeaders(this.userService.apiToken);
        headers.append('Content-Type', 'application/json');
        const request = new Request(url, {
            headers,
            method: 'POST',
            body: JSON.stringify({ page_id: pageId, page_type: 'page' }),
        });
        try {
            fetch(request).then(() => this.userService.updatePlatformChannelId('facebook', pageId));
        }
        catch (_a) {
            console.error(new Error('Could not set Facebook page'));
        }
    }
};
FacebookService.initialState = initialState;
__decorate([
    Inject()
], FacebookService.prototype, "hostsService", void 0);
__decorate([
    Inject()
], FacebookService.prototype, "windowsService", void 0);
__decorate([
    Inject()
], FacebookService.prototype, "jsonrpcService", void 0);
__decorate([
    Inject()
], FacebookService.prototype, "usageStatisticsService", void 0);
__decorate([
    mutation()
], FacebookService.prototype, "SET_FACEBOOK_PAGES_AND_GROUPS", null);
__decorate([
    mutation()
], FacebookService.prototype, "SET_PERMISSIONS", null);
__decorate([
    mutation()
], FacebookService.prototype, "SET_STREAM_PAGE_URL", null);
__decorate([
    mutation()
], FacebookService.prototype, "SET_STREAM_DASHBOARD_URL", null);
__decorate([
    mutation()
], FacebookService.prototype, "SET_AVATAR", null);
__decorate([
    mutation()
], FacebookService.prototype, "SET_OUTAGE_WARN", null);
__decorate([
    mutation()
], FacebookService.prototype, "SET_VIDEO_ID", null);
FacebookService = __decorate([
    InheritMutations()
], FacebookService);
export { FacebookService };
export class FacebookView extends ViewHandler {
    get userView() {
        return this.getServiceViews(UserService);
    }
    get oauthToken() {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.userView.state.auth) === null || _a === void 0 ? void 0 : _a.platforms) === null || _b === void 0 ? void 0 : _b.facebook) === null || _c === void 0 ? void 0 : _c.token;
    }
    getPage(id) {
        return this.state.facebookPages.find(p => p.id === id) || null;
    }
    getGroup(id) {
        return this.state.facebookGroups.find(g => g.id === id) || null;
    }
    getDestinationId(options) {
        if (!options)
            options = this.state.settings;
        switch (options.destinationType) {
            case 'me':
                return 'me';
            case 'page':
                return options.pageId;
            case 'group':
                return options.groupId;
        }
        return '';
    }
    getDestinationToken(destinationType, destinationId) {
        var _a;
        destinationType = destinationType || this.state.settings.destinationType;
        destinationId = destinationId || this.getDestinationId(this.state.settings);
        switch (destinationType) {
            case 'me':
            case 'group':
                return this.oauthToken || '';
            case 'page':
                return destinationId ? ((_a = this.getPage(destinationId)) === null || _a === void 0 ? void 0 : _a.access_token) || '' : '';
        }
        return '';
    }
}
//# sourceMappingURL=facebook.js.map