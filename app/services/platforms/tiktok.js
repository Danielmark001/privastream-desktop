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
import { InheritMutations, Inject, mutation, Service } from '../core';
import { BasePlatformService } from './base-platform';
import { EPlatformCallResult, } from './index';
import { authorizedHeaders, jfetch } from '../../util/requests';
import { throwStreamError, StreamError, errorTypes, } from '../streaming/stream-error';
import { platformAuthorizedRequest } from './utils';
import { getOS } from 'util/operating-systems';
import { ETikTokErrorTypes, ETikTokLiveScopeReason, } from './tiktok/api';
import { $t, I18nService } from 'services/i18n';
import { getDefined } from 'util/properties-type-guards';
import * as remote from '@electron/remote';
import Utils from 'services/utils';
import { ENotificationType } from 'services/notifications';
import { EDismissable } from 'services/dismissables';
let TikTokService = class TikTokService extends BasePlatformService {
    constructor() {
        super(...arguments);
        this.apiBase = 'https://open.tiktokapis.com/v2';
        this.platform = 'tiktok';
        this.displayName = 'TikTok';
        this.capabilities = new Set(['title', 'game', 'viewerCount']);
        this.liveDockFeatures = new Set([
            'view-stream',
            'dashboard',
            'refresh-chat-restreaming',
            'chat-streaming',
        ]);
        this.authWindowOptions = {
            width: 600,
            height: 800,
        };
    }
    get authUrl() {
        const host = this.hostsService.streamlabs;
        const query = `_=${Date.now()}&skip_splash=true&external=electron&tiktok&force_verify&origin=slobs`;
        return `https://${host}/slobs/login?${query}`;
    }
    get oauthToken() {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.userService.views.state.auth) === null || _a === void 0 ? void 0 : _a.platforms) === null || _b === void 0 ? void 0 : _b.tiktok) === null || _c === void 0 ? void 0 : _c.token;
    }
    get username() {
        return this.state.username;
    }
    get liveStreamingEnabled() {
        var _a, _b;
        const scope = (_b = (_a = this.state.settings) === null || _a === void 0 ? void 0 : _a.liveScope) !== null && _b !== void 0 ? _b : 'relog';
        return ['approved', 'legacy'].includes(scope);
    }
    get missingLiveAccess() {
        var _a, _b;
        const scope = (_b = (_a = this.state.settings) === null || _a === void 0 ? void 0 : _a.liveScope) !== null && _b !== void 0 ? _b : 'never-applied';
        return ['legacy', 'never-applied'].includes(scope);
    }
    get approved() {
        return this.state.settings.liveScope === 'approved';
    }
    get neverApplied() {
        return this.state.settings.liveScope === 'never-applied';
    }
    get denied() {
        return this.state.settings.liveScope === 'denied';
    }
    get legacy() {
        return this.state.settings.liveScope === 'legacy';
    }
    get relog() {
        return this.state.settings.liveScope === 'relog';
    }
    get defaultGame() {
        return { id: 'tiktok-other', name: 'Other' };
    }
    getHasScope(type) {
        var _a;
        return ((_a = this.state.settings) === null || _a === void 0 ? void 0 : _a.liveScope) === type;
    }
    get scope() {
        var _a;
        return (_a = this.state.settings) === null || _a === void 0 ? void 0 : _a.liveScope;
    }
    get viewersCount() {
        return 0;
    }
    get audienceControls() {
        return this.state.audienceControlsInfo;
    }
    setupStreamShiftStream(goLiveSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const settings = goLiveSettings === null || goLiveSettings === void 0 ? void 0 : goLiveSettings.streamShiftSettings;
            if (settings && !settings.is_live) {
                console.error('Stream Shift Error: TikTok is not live');
                this.postError('Stream Shift Error: TikTok is not live');
                return;
            }
            if (settings) {
                this.SET_LIVE_SCOPE('approved');
                this.SET_USERNAME((_a = settings.channel_name) !== null && _a !== void 0 ? _a : '');
                this.UPDATE_STREAM_SETTINGS({
                    title: settings.stream_title,
                });
            }
            else {
                yield this.validatePlatform();
            }
            this.setPlatformContext('tiktok');
        });
    }
    beforeGoLive(goLiveSettings, context) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Utils.isTestMode() && this.getHasScope('approved')) {
                yield this.testBeforeGoLive(goLiveSettings);
                return;
            }
            const ttSettings = getDefined(goLiveSettings.platforms.tiktok);
            if (goLiveSettings.streamShift && this.streamingService.views.shouldSwitchStreams) {
                this.setupStreamShiftStream(goLiveSettings);
                return;
            }
            if (this.getHasScope('approved')) {
                const streamInfo = yield this.startStream(ttSettings);
                if (!(streamInfo === null || streamInfo === void 0 ? void 0 : streamInfo.id)) {
                    yield this.handleOpenLiveManager();
                    throwStreamError('TIKTOK_GENERATE_CREDENTIALS_FAILED', { status: 406, platform: 'tiktok' });
                }
                if (streamInfo === null || streamInfo === void 0 ? void 0 : streamInfo.chat_url) {
                    this.SET_CHAT_URL(streamInfo.chat_url);
                }
                ttSettings.serverUrl = streamInfo.rtmp;
                ttSettings.streamKey = streamInfo.key;
                this.SET_BROADCAST_ID(streamInfo.id);
            }
            if (!this.streamingService.views.isMultiplatformMode) {
                this.streamSettingsService.setSettings({
                    streamType: 'rtmp_custom',
                    key: ttSettings.streamKey,
                    server: ttSettings.serverUrl,
                }, context);
            }
            yield this.putChannelInfo(ttSettings);
            this.setPlatformContext('tiktok');
        });
    }
    afterGoLive() {
        const _super = Object.create(null, {
            afterGoLive: { get: () => super.afterGoLive }
        });
        return __awaiter(this, void 0, void 0, function* () {
            _super.afterGoLive.call(this);
            if (this.scope === 'approved') {
                yield this.handleOpenLiveManager();
            }
        });
    }
    afterStopStream() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.state.broadcastId && !this.streamingService.views.isSwitchingStream) {
                console.log('Ending TikTok stream', this.state.broadcastId);
                yield this.endStream(this.state.broadcastId);
                this.showReplaysNotification();
            }
            yield this.putChannelInfo(Object.assign(Object.assign({}, this.state.settings), { serverUrl: '', streamKey: '' }));
        });
    }
    fetchNewToken() {
        return __awaiter(this, void 0, void 0, function* () {
            const host = this.hostsService.streamlabs;
            const url = `https://${host}/api/v5/slobs/tiktok/refresh`;
            const headers = authorizedHeaders(this.userService.apiToken);
            const request = new Request(url, { headers });
            return jfetch(request)
                .then(response => {
                return this.userService.updatePlatformToken('tiktok', response.access_token);
            })
                .catch(e => {
                console.error('Error fetching new token.');
                return Promise.reject(e);
            });
        });
    }
    requestTikTok(reqInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                return yield platformAuthorizedRequest('tiktok', reqInfo);
            }
            catch (e) {
                const code = (_b = (_a = e.result) === null || _a === void 0 ? void 0 : _a.error) === null || _b === void 0 ? void 0 : _b.code;
                if ((e === null || e === void 0 ? void 0 : e.status) === 405 ||
                    (e === null || e === void 0 ? void 0 : e.status) === 401 ||
                    !code ||
                    code === ETikTokErrorTypes.ACCESS_TOKEN_INVALID) {
                    console.error('Token invalid or missing. Unable to process request.');
                    return yield this.fetchNewToken().then(() => {
                        if (typeof reqInfo !== 'string') {
                            const req = reqInfo;
                            const reqInfoBody = req.body;
                            const body = JSON.parse(reqInfoBody);
                            const updatedReqInfo = Object.assign(Object.assign({}, req), { body: Object.assign(Object.assign({}, body), { access_token: this.oauthToken }) });
                            return this.requestTikTok(updatedReqInfo);
                        }
                        else {
                            console.error('Failed platform request', reqInfo);
                            return Promise.reject(e);
                        }
                    });
                }
                const notApproved = [
                    ETikTokErrorTypes.SCOPE_NOT_AUTHORIZED,
                    ETikTokErrorTypes.SCOPE_PERMISSION_MISSED,
                    ETikTokErrorTypes.USER_HAS_NO_LIVE_AUTH,
                ].includes(code);
                const hasStream = code === ETikTokErrorTypes.TIKTOK_ALREADY_LIVE;
                const message = notApproved
                    ? 'The user is not enabled for live streaming'
                    : 'Connection error with TikTok';
                console.warn(this.getErrorMessage({
                    message,
                }));
                const details = ((_c = e.result) === null || _c === void 0 ? void 0 : _c.error)
                    ? `${e.result.error.type} ${e.result.error.message}`
                    : 'Connection failed';
                if (notApproved) {
                    this.SET_LIVE_SCOPE('relog');
                }
                else if (hasStream) {
                    throwStreamError('TIKTOK_STREAM_ACTIVE', Object.assign(Object.assign({}, e), { platform: 'tiktok' }), details);
                }
                return Promise.reject(e);
            }
        });
    }
    startStream(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const host = this.hostsService.streamlabs;
            const url = `https://${host}/api/v5/slobs/tiktok/stream/start`;
            const headers = authorizedHeaders(this.userService.apiToken);
            const body = new FormData();
            body.append('title', opts.title);
            body.append('device_platform', getOS());
            const game = opts.game === this.defaultGame.id ? '' : opts.game;
            body.append('category', game);
            if (opts === null || opts === void 0 ? void 0 : opts.audienceType) {
                body.append('audience_type', opts.audienceType);
            }
            const request = new Request(url, { headers, method: 'POST', body });
            return jfetch(request).catch((e) => {
                if (e instanceof StreamError) {
                    throwStreamError('TIKTOK_GENERATE_CREDENTIALS_FAILED', Object.assign(Object.assign({}, e), { platform: 'tiktok' }));
                }
                const error = this.handleStartStreamError(e === null || e === void 0 ? void 0 : e.status);
                throwStreamError(error.type, { status: error.status });
            });
        });
    }
    endStream(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const host = this.hostsService.streamlabs;
            const url = `https://${host}/api/v5/slobs/tiktok/stream/${id}/end`;
            const headers = authorizedHeaders(this.userService.apiToken);
            const request = new Request(url, { headers, method: 'POST' });
            return jfetch(request);
        });
    }
    fetchViewerCount() {
        return __awaiter(this, void 0, void 0, function* () {
            return 0;
        });
    }
    validatePlatform() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            if (!((_a = this.userService.views.auth) === null || _a === void 0 ? void 0 : _a.platforms['tiktok'])) {
                return EPlatformCallResult.TikTokStreamScopeMissing;
            }
            if (Utils.isTestMode()) {
                switch (this.state.settings.liveScope) {
                    case 'approved':
                        return EPlatformCallResult.Success;
                    case 'legacy':
                        return EPlatformCallResult.Success;
                    case 'relog':
                        return EPlatformCallResult.TikTokScopeOutdated;
                    case 'denied':
                        return EPlatformCallResult.TikTokStreamScopeMissing;
                    default:
                        return EPlatformCallResult.TikTokStreamScopeMissing;
                }
            }
            try {
                const response = yield this.fetchLiveAccessStatus();
                const status = response;
                const scope = this.convertScope(status.reason, (_b = status.application_status) === null || _b === void 0 ? void 0 : _b.status);
                this.SET_LIVE_SCOPE(scope);
                if (status === null || status === void 0 ? void 0 : status.audience_controls_info) {
                    this.setAudienceControls(status.audience_controls_info);
                }
                if (status === null || status === void 0 ? void 0 : status.application_status) {
                    const applicationStatus = (_c = status.application_status) === null || _c === void 0 ? void 0 : _c.status;
                    const timestamp = (_d = status.application_status) === null || _d === void 0 ? void 0 : _d.timestamp;
                    if (applicationStatus === 'rejected' && timestamp) {
                        this.SET_DENIED_DATE(timestamp);
                        return EPlatformCallResult.TikTokStreamScopeMissing;
                    }
                }
                if (status === null || status === void 0 ? void 0 : status.user) {
                    this.SET_USERNAME(status.user.username);
                    if (scope === 'relog') {
                        return EPlatformCallResult.TikTokScopeOutdated;
                    }
                }
                else if ((status === null || status === void 0 ? void 0 : status.info) &&
                    (!(status === null || status === void 0 ? void 0 : status.reason) || (status === null || status === void 0 ? void 0 : status.reason) === ETikTokLiveScopeReason.RELOG)) {
                    this.SET_LIVE_SCOPE('relog');
                    return EPlatformCallResult.TikTokScopeOutdated;
                }
                else {
                    return EPlatformCallResult.TikTokStreamScopeMissing;
                }
                if (status === null || status === void 0 ? void 0 : status.info.chatUrl) {
                    this.SET_CHAT_URL(status.info.chatUrl);
                }
                if (((_e = this.state.settings) === null || _e === void 0 ? void 0 : _e.serverUrl) || ((_f = this.state.settings) === null || _f === void 0 ? void 0 : _f.streamKey)) {
                    yield this.putChannelInfo(Object.assign(Object.assign({}, this.state.settings), { serverUrl: '', streamKey: '' }));
                }
                return this.liveStreamingEnabled
                    ? EPlatformCallResult.Success
                    : EPlatformCallResult.TikTokStreamScopeMissing;
            }
            catch (e) {
                console.warn(this.getErrorMessage(e));
                this.SET_LIVE_SCOPE('relog');
                return EPlatformCallResult.TikTokScopeOutdated;
            }
        });
    }
    fetchLiveAccessStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            const host = this.hostsService.streamlabs;
            const url = `https://${host}/api/v5/slobs/tiktok/info`;
            const headers = authorizedHeaders(this.userService.apiToken);
            const request = new Request(url, { headers });
            return jfetch(request)
                .then((res) => __awaiter(this, void 0, void 0, function* () {
                const scopeData = res;
                if (scopeData === null || scopeData === void 0 ? void 0 : scopeData.info) {
                    const info = yield Promise.all(scopeData === null || scopeData === void 0 ? void 0 : scopeData.info.map((category) => category));
                    return Object.assign(Object.assign({}, scopeData), { info });
                }
                return res;
            }))
                .catch(e => {
                console.warn('Error fetching TikTok Live Access status: ', e);
            });
        });
    }
    searchGames(searchString) {
        return __awaiter(this, void 0, void 0, function* () {
            const host = this.hostsService.streamlabs;
            const url = `https://${host}/api/v5/slobs/tiktok/info?category=${searchString}`;
            const headers = authorizedHeaders(this.userService.apiToken);
            const request = new Request(url, { headers });
            return jfetch(request)
                .then((res) => __awaiter(this, void 0, void 0, function* () {
                const games = yield Promise.all(res === null || res === void 0 ? void 0 : res.categories.map(g => ({ id: g.game_mask_id, name: g.full_name })));
                games.push(this.defaultGame);
                return games;
            }))
                .catch((e) => {
                console.error('Error fetching TikTok categories: ', e);
                return [];
            });
        });
    }
    prepopulateInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const status = yield this.validatePlatform();
            this.usageStatisticsService.recordAnalyticsEvent('TikTokLiveAccess', {
                status: this.scope,
            });
            console.debug('TikTok stream status: ', status);
            if (status === EPlatformCallResult.TikTokScopeOutdated) {
                throwStreamError('TIKTOK_SCOPE_OUTDATED', { status: 401, platform: 'tiktok' });
            }
            this.SET_PREPOPULATED(true);
        });
    }
    putChannelInfo(settings) {
        return __awaiter(this, void 0, void 0, function* () {
            this.SET_STREAM_SETTINGS(settings);
        });
    }
    getHeaders(req, useToken) {
        return {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.oauthToken}`,
        };
    }
    getErrorMessage(error) {
        switch (error) {
            case error === null || error === void 0 ? void 0 : error.message:
                return error === null || error === void 0 ? void 0 : error.message;
            case error === null || error === void 0 ? void 0 : error.error_description:
                return error === null || error === void 0 ? void 0 : error.error_description;
            case error === null || error === void 0 ? void 0 : error.http_status_code:
                return error === null || error === void 0 ? void 0 : error.http_status_code;
            default:
                return 'Error processing TikTok request.';
        }
    }
    showReplaysNotification() {
        this.notificationsService.actions.push({
            type: ENotificationType.SUCCESS,
            message: $t('Click to view TikTok Replay in your browser.'),
            action: this.jsonrpcService.createRequest(Service.getResourceId(this), 'openReplaysLink'),
        });
    }
    openReplaysLink() {
        remote.shell.openExternal(this.replaysUrl);
    }
    get liveDockEnabled() {
        return true;
    }
    get streamPageUrl() {
        return `https://www.tiktok.com/@${this.state.username}/live`;
    }
    get chatUrl() {
        return `${this.state.chatUrl}?lang=${this.locale}`;
    }
    get dashboardUrl() {
        return `https://livecenter.tiktok.com/live_monitor?lang=${this.locale}`;
    }
    get legacyDashboardUrl() {
        return `https://livecenter.tiktok.com/producer?lang=${this.locale}`;
    }
    get infoUrl() {
        return 'https://streamlabs.com/content-hub/post/how-to-go-live-on-tiktok';
    }
    get applicationUrl() {
        return `https://www.tiktok.com/falcon/live_g/live_access_pc_apply/intro/index.html?id=${this.id}&lang=${this.locale}`;
    }
    get mergeUrl() {
        return 'https://streamlabs.com/dashboard#/settings/account-settings/platforms';
    }
    get guidelinesUrl() {
        return 'https://www.tiktok.com/community-guidelines/en/community-principles';
    }
    get appealsUrl() {
        return 'https://www.tiktok.com/community-guidelines/en/enforcement#3';
    }
    get confirmationUrl() {
        return 'https://www.tiktok.com/falcon/live_g/live_access_pc_apply/result/index.html?id=GL6399433079641606942';
    }
    get replaysUrl() {
        return 'https://livecenter.tiktok.com/replay';
    }
    get locale() {
        return I18nService.instance.state.locale;
    }
    get id() {
        return 'GL6399433079641606942';
    }
    get promptApply() {
        var _a, _b, _c;
        if (!this.getHasScope('never-applied') ||
            !((_a = this.userService.state) === null || _a === void 0 ? void 0 : _a.createdAt) ||
            !this.userService.isLoggedIn) {
            return false;
        }
        const createdAt = new Date(this.userService.state.createdAt);
        const today = new Date(Date.now());
        const dateDiff = (today.getTime() - createdAt.getTime()) / (1000 * 3600 * 24);
        const isOldAccount = dateDiff >= 30;
        const hasRecentlyStreamed = this.diagnosticsService.hasRecentlyStreamed;
        if (isOldAccount && hasRecentlyStreamed)
            return true;
        const isTikTokLinked = !!((_c = (_b = this.userService.views.auth) === null || _b === void 0 ? void 0 : _b.platforms) === null || _c === void 0 ? void 0 : _c.tiktok);
        const isFrequentUser = this.diagnosticsService.isFrequentUser;
        if (isOldAccount && !isTikTokLinked && isFrequentUser)
            return true;
        return false;
    }
    get promptReapply() {
        if (!this.getHasScope('denied') || !this.state.dateDenied)
            return false;
        const today = new Date(Date.now());
        const deniedDate = new Date(this.state.dateDenied);
        const deniedDateDiff = (today.getTime() - deniedDate.getTime()) / (1000 * 3600 * 24);
        if (this.denied && deniedDateDiff >= 30)
            return true;
        return false;
    }
    handleApplyPrompt() {
        if (!this.promptApply && !this.promptReapply)
            return;
        const message = this.promptApply
            ? $t('You may be eligible for TikTok Live Access. Apply here.')
            : $t('Reapply for TikTok Live Permission. Reapply here.');
        this.notificationsService.actions.push({
            type: ENotificationType.SUCCESS,
            lifeTime: 10000,
            message,
            action: this.jsonrpcService.createRequest(Service.getResourceId(this), 'pushApplyNotification'),
        });
    }
    pushApplyNotification() {
        const dismissable = this.promptApply ? EDismissable.TikTokEligible : EDismissable.TikTokReapply;
        remote.shell.openExternal(this.applicationUrl);
        this.dismissablesService.actions.dismiss(dismissable);
        this.usageStatisticsService.recordAnalyticsEvent('TikTokApplyPrompt', {
            component: 'Notifications',
        });
    }
    convertScope(scope, applicationStatus) {
        if (applicationStatus === 'never_applied' && scope !== ETikTokLiveScopeReason.APPROVED_OBS) {
            return 'never-applied';
        }
        switch (scope) {
            case ETikTokLiveScopeReason.APPROVED: {
                return 'approved';
            }
            case ETikTokLiveScopeReason.NOT_APPROVED: {
                return 'denied';
            }
            case ETikTokLiveScopeReason.APPROVED_OBS: {
                return 'legacy';
            }
            case ETikTokLiveScopeReason.RELOG: {
                return 'relog';
            }
            default:
                return 'denied';
        }
    }
    handleOpenLiveManager(visible) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Utils.isTestMode())
                return true;
            if (visible) {
                yield remote.shell.openExternal(this.dashboardUrl);
                return;
            }
            const win = Utils.getMainWindow();
            win.setAlwaysOnTop(true);
            yield remote.shell.openExternal(this.dashboardUrl, { activate: false });
            setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                win.show();
                win.focus();
                win.setAlwaysOnTop(false);
                return Promise.resolve();
            }), 1000);
        });
    }
    handleStartStreamError(status) {
        const title = $t('TikTok Stream Error');
        const type = status === 422 ? 'TIKTOK_USER_BANNED' : 'TIKTOK_GENERATE_CREDENTIALS_FAILED';
        const message = errorTypes[type].message;
        const buttonText = $t('Open TikTok Live Manager');
        if (type !== 'TIKTOK_USER_BANNED') {
            this.SET_LIVE_SCOPE('relog');
            this.handleOpenLiveManager();
        }
        else {
            this.SET_LIVE_SCOPE('denied');
        }
        remote.dialog
            .showMessageBox(Utils.getMainWindow(), {
            title,
            type: 'error',
            message,
            buttons: [buttonText, $t('Close')],
        })
            .then(({ response }) => {
            if (response === 0) {
                remote.shell.openExternal(this.dashboardUrl);
            }
        });
        this.windowsService.actions.closeChildWindow();
        return { type, status };
    }
    testBeforeGoLive(goLiveSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            const ttSettings = getDefined(goLiveSettings.platforms.tiktok);
            yield this.putChannelInfo(ttSettings);
            this.setPlatformContext('tiktok');
        });
    }
    setLiveScope(scope) {
        this.SET_LIVE_SCOPE(scope);
    }
    setGameName(gameName) {
        this.SET_GAME_NAME(gameName);
    }
    setAudienceControls(audienceControlsInfo) {
        const types = audienceControlsInfo.types.map(type => ({
            value: type.key.toString(),
            label: type.label,
        }));
        const audienceType = audienceControlsInfo.info_type.toString();
        this.SET_AUDIENCE_CONTROLS(Object.assign(Object.assign({}, audienceControlsInfo), { audienceType,
            types }));
    }
    SET_LIVE_SCOPE(scope) {
        this.state.settings.liveScope = scope;
    }
    SET_BROADCAST_ID(id) {
        this.state.broadcastId = id;
    }
    SET_USERNAME(username) {
        this.state.username = username;
    }
    SET_GAME_NAME(gameName = '') {
        this.state.gameName = gameName;
    }
    SET_DENIED_DATE(date) {
        this.state.dateDenied = date !== null && date !== void 0 ? date : null;
    }
    SET_AUDIENCE_CONTROLS(audienceControlsInfo) {
        this.state.audienceControlsInfo = audienceControlsInfo;
    }
    SET_CHAT_URL(chatUrl) {
        this.state.chatUrl = chatUrl;
    }
};
TikTokService.initialState = Object.assign(Object.assign({}, BasePlatformService.initialState), { settings: {
        title: '',
        liveScope: 'denied',
        mode: 'portrait',
        serverUrl: '',
        streamKey: '',
        display: 'vertical',
        game: '',
    }, broadcastId: '', username: '', gameName: '', audienceControlsInfo: { disable: true, audienceType: '0', types: [] }, chatUrl: '' });
__decorate([
    Inject()
], TikTokService.prototype, "windowsService", void 0);
__decorate([
    Inject()
], TikTokService.prototype, "diagnosticsService", void 0);
__decorate([
    Inject()
], TikTokService.prototype, "usageStatisticsService", void 0);
__decorate([
    Inject()
], TikTokService.prototype, "jsonrpcService", void 0);
__decorate([
    Inject()
], TikTokService.prototype, "dismissablesService", void 0);
__decorate([
    mutation()
], TikTokService.prototype, "SET_LIVE_SCOPE", null);
__decorate([
    mutation()
], TikTokService.prototype, "SET_BROADCAST_ID", null);
__decorate([
    mutation()
], TikTokService.prototype, "SET_USERNAME", null);
__decorate([
    mutation()
], TikTokService.prototype, "SET_GAME_NAME", null);
__decorate([
    mutation()
], TikTokService.prototype, "SET_DENIED_DATE", null);
__decorate([
    mutation()
], TikTokService.prototype, "SET_AUDIENCE_CONTROLS", null);
__decorate([
    mutation()
], TikTokService.prototype, "SET_CHAT_URL", null);
TikTokService = __decorate([
    InheritMutations()
], TikTokService);
export { TikTokService };
//# sourceMappingURL=tiktok.js.map