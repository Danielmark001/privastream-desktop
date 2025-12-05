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
import { InheritMutations, Inject, mutation } from '../core';
import { BasePlatformService } from './base-platform';
import { authorizedHeaders, jfetch } from '../../util/requests';
import { throwStreamError } from '../streaming/stream-error';
import { platformAuthorizedRequest } from './utils';
import { I18nService } from 'services/i18n';
import { getDefined } from 'util/properties-type-guards';
let KickService = class KickService extends BasePlatformService {
    constructor() {
        super(...arguments);
        this.apiBase = '';
        this.domain = 'https://kick.com';
        this.platform = 'kick';
        this.displayName = 'Kick';
        this.capabilities = new Set(['title', 'chat', 'game', 'viewerCount']);
        this.liveDockFeatures = new Set([
            'view-stream',
            'refresh-chat',
            'chat-streaming',
        ]);
        this.authWindowOptions = {
            width: 600,
            height: 800,
        };
    }
    get oauthToken() {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.userService.views.state.auth) === null || _a === void 0 ? void 0 : _a.platforms) === null || _b === void 0 ? void 0 : _b.kick) === null || _c === void 0 ? void 0 : _c.token;
    }
    setupStreamShiftStream(goLiveSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            const settings = goLiveSettings.streamShiftSettings;
            if (settings && !settings.is_live) {
                console.error('Stream Shift Error: Kick is not live');
                this.postError('Stream Shift Error: Kick is not live');
                return;
            }
            const response = yield this.fetchStreamInfo();
            const info = response;
            const title = (_a = settings === null || settings === void 0 ? void 0 : settings.stream_title) !== null && _a !== void 0 ? _a : (_b = info.channel) === null || _b === void 0 ? void 0 : _b.title;
            const game = (_c = settings === null || settings === void 0 ? void 0 : settings.game_id) !== null && _c !== void 0 ? _c : (_d = info.channel) === null || _d === void 0 ? void 0 : _d.category.id.toString();
            const gameName = (_e = settings === null || settings === void 0 ? void 0 : settings.game_name) !== null && _e !== void 0 ? _e : (_f = info.channel) === null || _f === void 0 ? void 0 : _f.category.name;
            if (info.channel) {
                this.UPDATE_STREAM_SETTINGS({
                    title,
                    game,
                });
                this.SET_GAME_NAME(gameName);
            }
            else {
                this.UPDATE_STREAM_SETTINGS({
                    title,
                });
            }
            if (settings === null || settings === void 0 ? void 0 : settings.chat_url) {
                this.SET_CHAT_URL(settings.chat_url);
            }
            this.setPlatformContext('kick');
        });
    }
    beforeGoLive(goLiveSettings, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const kickSettings = getDefined(goLiveSettings.platforms.kick);
            if (goLiveSettings.streamShift && this.streamingService.views.shouldSwitchStreams) {
                yield this.setupStreamShiftStream(goLiveSettings);
                return;
            }
            const streamInfo = yield this.startStream((_a = goLiveSettings.platforms.kick) !== null && _a !== void 0 ? _a : this.state.settings);
            this.SET_INGEST(streamInfo.rtmp);
            this.SET_STREAM_KEY(streamInfo.key);
            this.SET_CHAT_URL(streamInfo.chat_url);
            this.SET_PLATFORM_ID(streamInfo.platform_id);
            if (!this.streamingService.views.isMultiplatformMode) {
                this.streamSettingsService.setSettings({
                    streamType: 'rtmp_custom',
                    key: streamInfo.key,
                    server: streamInfo.rtmp,
                }, context);
            }
            this.SET_STREAM_SETTINGS(kickSettings);
            this.setPlatformContext('kick');
        });
    }
    afterStopStream() {
        return __awaiter(this, void 0, void 0, function* () {
            this.SET_INGEST('');
            this.SET_STREAM_KEY('');
        });
    }
    fetchNewToken() {
        return __awaiter(this, void 0, void 0, function* () {
            const host = this.hostsService.streamlabs;
            const url = `https://${host}/api/v5/slobs/kick/refresh`;
            const headers = authorizedHeaders(this.userService.apiToken);
            const request = new Request(url, { headers });
            return jfetch(request)
                .then(response => {
                return this.userService.updatePlatformToken('kick', response.access_token);
            })
                .catch(e => {
                console.error('Error fetching new token.');
                return Promise.reject(e);
            });
        });
    }
    requestKick(reqInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                return yield platformAuthorizedRequest('kick', reqInfo);
            }
            catch (e) {
                const code = (_b = (_a = e.result) === null || _a === void 0 ? void 0 : _a.error) === null || _b === void 0 ? void 0 : _b.code;
                const details = ((_c = e.result) === null || _c === void 0 ? void 0 : _c.error)
                    ? `${e.result.error.type} ${e.result.error.message}`
                    : 'Connection failed';
                console.error('Error fetching Kick API: ', details, code);
                return Promise.reject(e);
            }
        });
    }
    startStream(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const host = this.hostsService.streamlabs;
            const url = `https://${host}/api/v5/slobs/kick/stream/start`;
            const headers = authorizedHeaders(this.userService.apiToken);
            const body = new FormData();
            body.append('title', opts.title);
            const game = opts.game === '' ? '15' : opts.game;
            body.append('category', game);
            const request = new Request(url, { headers, method: 'POST', body });
            return jfetch(request)
                .then(resp => {
                if (!resp.key) {
                    throwStreamError('KICK_STREAM_KEY_MISSING', {
                        status: 418,
                        statusText: 'Kick stream key not generated',
                        platform: 'kick',
                    }, 'Kick failed to start stream due to missing stream key');
                }
                if (!resp.rtmp) {
                    throwStreamError('KICK_START_STREAM_FAILED', {
                        status: 418,
                        statusText: 'Kick server url not generated',
                        platform: 'kick',
                    }, 'Kick stream failed to start due to missing server url');
                }
                if (resp.channel_name) {
                    this.SET_CHANNEL_NAME(resp.channel_name);
                }
                this.SET_STREAM_SETTINGS(opts);
                return resp;
            })
                .catch((e) => {
                console.error('Error starting Kick stream: ', e);
                const defaultError = {
                    status: 403,
                    statusText: 'Unable to start Kick stream.',
                    platform: 'kick',
                };
                if (!e)
                    throwStreamError('PLATFORM_REQUEST_FAILED', defaultError);
                if (typeof e === 'object' && e.hasOwnProperty('type')) {
                    const error = e;
                    throwStreamError(error.type, error, error.message);
                }
                if (typeof e === 'object' && e.hasOwnProperty('result')) {
                    const error = Object.assign(Object.assign({}, e), { platform: 'kick' });
                    if (error.result && error.result.data.code === 401) {
                        const message = error.statusText !== '' ? error.statusText : error.result.data.message;
                        throwStreamError('KICK_SCOPE_OUTDATED', {
                            status: error.status,
                            statusText: message,
                        }, error.result.data.message);
                    }
                    throwStreamError('KICK_START_STREAM_FAILED', Object.assign(Object.assign({}, error), { status: error.status, statusText: error.result.data.message }), defaultError.statusText);
                }
                throwStreamError('PLATFORM_REQUEST_FAILED', e);
            });
        });
    }
    endStream(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const host = this.hostsService.streamlabs;
            const url = `https://${host}/api/v5/slobs/kick/stream/${id}/end`;
            const headers = authorizedHeaders(this.userService.apiToken);
            const request = new Request(url, { headers, method: 'POST' });
            return jfetch(request);
        });
    }
    fetchStreamInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const host = this.hostsService.streamlabs;
            const url = `https://${host}/api/v5/slobs/kick/info`;
            const headers = authorizedHeaders(this.userService.apiToken);
            const request = new Request(url, { headers });
            return jfetch(request)
                .then((res) => __awaiter(this, void 0, void 0, function* () {
                return res;
            }))
                .catch(e => {
                console.warn('Error fetching Kick info: ', e);
                if (e.result && e.result.data.code === 401) {
                    const message = e.statusText !== '' ? e.statusText : e.result.data.message;
                    throwStreamError('KICK_SCOPE_OUTDATED', {
                        status: e.status,
                        statusText: message,
                        platform: 'kick',
                    }, e.result.data.message);
                }
            });
        });
    }
    searchGames(searchString) {
        return __awaiter(this, void 0, void 0, function* () {
            const host = this.hostsService.streamlabs;
            const url = `https://${host}/api/v5/slobs/kick/info?category=${searchString}`;
            const headers = authorizedHeaders(this.userService.apiToken);
            const request = new Request(url, { headers });
            return jfetch(request)
                .then((res) => __awaiter(this, void 0, void 0, function* () {
                const data = res;
                if (data.categories && data.categories.length > 0) {
                    const games = yield Promise.all(data.categories.map((g) => ({
                        id: g.id.toString(),
                        name: g.name,
                        image: g.thumbnail,
                    })));
                    return games;
                }
                else {
                    console.error('Failed to fetch Kick categories info.');
                    return [];
                }
            }))
                .catch((e) => {
                console.error('Error fetching Kick info: ', e);
                return [];
            });
        });
    }
    fetchGame(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.searchGames(name))[0];
        });
    }
    prepopulateInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.fetchStreamInfo();
            const info = response;
            if (info.channel) {
                this.UPDATE_STREAM_SETTINGS({
                    title: info.channel.title,
                    game: info.channel.category.id.toString(),
                });
                this.SET_GAME_NAME(info.channel.category.name);
            }
            this.SET_PREPOPULATED(true);
        });
    }
    putChannelInfo(settings) {
        return __awaiter(this, void 0, void 0, function* () {
            const host = this.hostsService.streamlabs;
            const url = `https://${host}/api/v5/slobs/kick/info`;
            const headers = authorizedHeaders(this.userService.apiToken);
            headers.append('Content-Type', 'application/x-www-form-urlencoded');
            const params = new URLSearchParams();
            params.append('title', settings.title);
            params.append('category', settings.game);
            const request = new Request(url, { headers, method: 'PUT', body: params.toString() });
            return jfetch(request)
                .then((res) => __awaiter(this, void 0, void 0, function* () {
                if (res.success) {
                    const info = yield this.fetchStreamInfo();
                    this.SET_STREAM_SETTINGS(settings);
                    this.SET_GAME_NAME(info.channel.category.name);
                }
                else {
                    throwStreamError('PLATFORM_REQUEST_FAILED', {
                        status: 400,
                        statusText: 'Failed to update Kick channel info',
                        platform: 'kick',
                    });
                }
            }))
                .catch((e) => {
                console.warn('Error updating Kick channel info', e);
            });
        });
    }
    fetchViewerCount() {
        return __awaiter(this, void 0, void 0, function* () {
            const resp = yield this.fetchStreamInfo();
            if (resp && resp.stream) {
                return resp.stream.viewer_count;
            }
            else {
                return 0;
            }
        });
    }
    getHeaders(req, useToken) {
        return {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.oauthToken}`,
        };
    }
    get authUrl() {
        const host = this.hostsService.streamlabs;
        const query = `_=${Date.now()}&skip_splash=true&external=electron&kick&force_verify&origin=slobs`;
        return `https://${host}/slobs/login?${query}`;
    }
    get mergeUrl() {
        const host = this.hostsService.streamlabs;
        return `https://${host}/dashboard#/settings/account-settings/platforms`;
    }
    get liveDockEnabled() {
        return true;
    }
    get chatUrl() {
        return this.state.chatUrl !== ''
            ? this.state.chatUrl
            : `${this.apiBase}/popout/${this.state.channelName}/chat`;
    }
    get dashboardUrl() {
        return `https://dashboard.${this.domain.split('//')[1]}/stream`;
    }
    get streamPageUrl() {
        return `${this.domain}/${this.state.channelName}`;
    }
    get locale() {
        return I18nService.instance.state.locale;
    }
    SET_INGEST(ingest) {
        this.state.ingest = ingest;
    }
    SET_CHAT_URL(chatUrl) {
        this.state.chatUrl = chatUrl;
    }
    SET_PLATFORM_ID(platformId) {
        this.state.platformId = platformId;
    }
    SET_CHANNEL_NAME(channelName) {
        this.state.channelName = channelName;
    }
    SET_GAME_NAME(gameName) {
        this.state.gameName = gameName;
    }
};
KickService.initialState = Object.assign(Object.assign({}, BasePlatformService.initialState), { settings: {
        title: '',
        mode: 'landscape',
        game: '',
    }, ingest: '', chatUrl: '', channelName: '', gameName: '' });
__decorate([
    Inject()
], KickService.prototype, "windowsService", void 0);
__decorate([
    Inject()
], KickService.prototype, "diagnosticsService", void 0);
__decorate([
    mutation()
], KickService.prototype, "SET_INGEST", null);
__decorate([
    mutation()
], KickService.prototype, "SET_CHAT_URL", null);
__decorate([
    mutation()
], KickService.prototype, "SET_PLATFORM_ID", null);
__decorate([
    mutation()
], KickService.prototype, "SET_CHANNEL_NAME", null);
__decorate([
    mutation()
], KickService.prototype, "SET_GAME_NAME", null);
KickService = __decorate([
    InheritMutations()
], KickService);
export { KickService };
//# sourceMappingURL=kick.js.map