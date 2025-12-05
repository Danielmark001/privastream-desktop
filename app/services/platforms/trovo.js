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
import { InheritMutations, mutation } from '../core';
import { BasePlatformService } from './base-platform';
import { authorizedHeaders, jfetch } from '../../util/requests';
import { throwStreamError } from '../streaming/stream-error';
import { platformAuthorizedRequest } from './utils';
import { getDefined } from '../../util/properties-type-guards';
import Utils from '../utils';
let TrovoService = class TrovoService extends BasePlatformService {
    constructor() {
        super(...arguments);
        this.capabilities = new Set([
            'title',
            'chat',
            'themes',
            'streamlabels',
            'viewerCount',
        ]);
        this.liveDockFeatures = new Set([
            'chat-offline',
            'refresh-chat',
            'view-stream',
        ]);
        this.apiBase = 'https://open-api.trovo.live/openplatform';
        this.rtmpServer = 'rtmp://livepush.trovo.live/live/';
        this.platform = 'trovo';
        this.displayName = 'Trovo';
        this.gameImageSize = { width: 30, height: 40 };
        this.authWindowOptions = {
            width: 600,
            height: 800,
        };
    }
    get authUrl() {
        const host = this.hostsService.streamlabs;
        const query = `_=${Date.now()}&skip_splash=true&external=electron&trovo&force_verify&origin=slobs`;
        return `https://${host}/slobs/login?${query}`;
    }
    get username() {
        var _a, _b, _c;
        return ((_c = (_b = (_a = this.userService.state.auth) === null || _a === void 0 ? void 0 : _a.platforms) === null || _b === void 0 ? void 0 : _b.trovo) === null || _c === void 0 ? void 0 : _c.username) || '';
    }
    beforeGoLive(goLiveSettings, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const trSettings = getDefined(goLiveSettings.platforms.trovo);
            if (goLiveSettings.streamShift && this.streamingService.views.shouldSwitchStreams) {
                yield this.setupStreamShiftStream(goLiveSettings);
                return;
            }
            const key = this.state.streamKey;
            if (!this.streamingService.views.isMultiplatformMode) {
                this.streamSettingsService.setSettings({
                    streamType: 'rtmp_custom',
                    key,
                    server: this.rtmpServer,
                }, context);
            }
            yield this.putChannelInfo(trSettings);
            this.setPlatformContext('trovo');
        });
    }
    fetchNewToken() {
        const host = this.hostsService.streamlabs;
        const url = `https://${host}/api/v5/slobs/trovo/refresh`;
        const headers = authorizedHeaders(this.userService.apiToken);
        const request = new Request(url, { headers });
        return jfetch(request).then(response => this.userService.updatePlatformToken('trovo', response.access_token));
    }
    requestTrovo(reqInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield platformAuthorizedRequest('trovo', reqInfo);
            }
            catch (e) {
                let details = e.message;
                if (!details)
                    details = 'connection failed';
                throwStreamError('PLATFORM_REQUEST_FAILED', Object.assign(Object.assign({}, e), { platform: 'trovo' }), details);
            }
        });
    }
    prepopulateInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const channelInfo = yield this.fetchChannelInfo();
            const userInfo = yield this.requestTrovo(`${this.apiBase}/getuserinfo`);
            const gameInfo = yield this.fetchGame(channelInfo.category_name);
            this.SET_STREAM_SETTINGS({ title: channelInfo.live_title, game: channelInfo.category_id });
            this.SET_USER_INFO(userInfo);
            this.SET_STREAM_KEY(channelInfo.stream_key.replace('live/', ''));
            this.SET_CHANNEL_INFO({
                gameId: channelInfo.category_id,
                gameName: channelInfo.category_name,
                gameImage: gameInfo.image || '',
            });
            yield Utils.sleep(50);
            this.SET_PREPOPULATED(true);
        });
    }
    putChannelInfo(settings) {
        return __awaiter(this, void 0, void 0, function* () {
            const channel_id = this.state.userInfo.channelId;
            this.UPDATE_STREAM_SETTINGS(settings);
            yield this.requestTrovo({
                url: `${this.apiBase}/channels/update`,
                method: 'POST',
                body: JSON.stringify({
                    channel_id,
                    live_title: settings.title,
                    category_id: settings.game,
                }),
            });
        });
    }
    fetchChannelInfo() {
        return this.requestTrovo(`${this.apiBase}/channel`);
    }
    setupStreamShiftStream(goLiveSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            const settings = goLiveSettings === null || goLiveSettings === void 0 ? void 0 : goLiveSettings.streamShiftSettings;
            if (settings && !settings.is_live) {
                console.error('Stream Shift Error: Trovo is not live');
                this.postError('Stream Shift Error: Trovo is not live');
                return;
            }
            const channelInfo = yield this.fetchChannelInfo();
            const title = (_a = settings === null || settings === void 0 ? void 0 : settings.stream_title) !== null && _a !== void 0 ? _a : channelInfo.live_title;
            const gameName = (_b = settings === null || settings === void 0 ? void 0 : settings.game_name) !== null && _b !== void 0 ? _b : channelInfo.category_name;
            const gameId = (_c = settings === null || settings === void 0 ? void 0 : settings.game_id) !== null && _c !== void 0 ? _c : channelInfo.category_id;
            const gameInfo = yield this.fetchGame(gameName);
            this.SET_CHANNEL_INFO({
                gameId,
                gameName,
                gameImage: gameInfo.image || '',
            });
            this.SET_STREAM_KEY(channelInfo.stream_key.replace('live/', ''));
            if (settings) {
                this.SET_STREAM_SETTINGS({
                    title,
                    game: channelInfo.category_id,
                });
                this.SET_USER_INFO({
                    userId: (_d = settings.platform_id) !== null && _d !== void 0 ? _d : '',
                    channelId: (_e = settings.platform_id) !== null && _e !== void 0 ? _e : channelInfo.stream_key.split('_')[0],
                });
            }
            else {
                const userInfo = yield this.requestTrovo(`${this.apiBase}/getuserinfo`);
                this.SET_STREAM_SETTINGS({
                    title,
                    game: channelInfo.category_id,
                });
                this.SET_USER_INFO(userInfo);
            }
            this.setPlatformContext('trovo');
        });
    }
    searchGames(searchString) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.requestTrovo({
                url: `${this.apiBase}/searchcategory`,
                method: 'POST',
                body: JSON.stringify({ query: searchString }),
            });
            return response.category_info.map(g => ({
                id: g.id,
                name: g.name,
                image: g.icon_url,
            }));
        });
    }
    fetchGame(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.searchGames(name))[0];
        });
    }
    getHeaders() {
        var _a;
        const token = (_a = this.userService.state.auth.platforms.trovo) === null || _a === void 0 ? void 0 : _a.token;
        return Object.assign({ Accept: 'application/json', 'Content-Type': 'application/json', 'Client-ID': '4f78d282c0f72dc3143da8278f697fc4' }, (token ? { Authorization: `OAuth ${token}` } : {}));
    }
    get liveDockEnabled() {
        return true;
    }
    fetchViewerCount() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.fetchChannelInfo()).current_viewers;
        });
    }
    fetchFollowers() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.fetchChannelInfo()).followers;
        });
    }
    get streamPageUrl() {
        return `https://trovo.live/${this.username}`;
    }
    get chatUrl() {
        return `https://trovo.live/chat/${this.username}`;
    }
    SET_USER_INFO(userInfo) {
        this.state.userInfo = userInfo;
    }
    SET_CHANNEL_INFO(info) {
        this.state.channelInfo = info;
    }
};
TrovoService.initialState = Object.assign(Object.assign({}, BasePlatformService.initialState), { settings: { title: '', game: '', mode: undefined }, userInfo: { userId: '', channelId: '' }, channelInfo: { gameId: '', gameName: '', gameImage: '' } });
__decorate([
    mutation()
], TrovoService.prototype, "SET_USER_INFO", null);
__decorate([
    mutation()
], TrovoService.prototype, "SET_CHANNEL_INFO", null);
TrovoService = __decorate([
    InheritMutations()
], TrovoService);
export { TrovoService };
//# sourceMappingURL=trovo.js.map