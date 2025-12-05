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
import { EPlatformCallResult, } from '.';
import { Inject } from 'services/core/injector';
import { authorizedHeaders, jfetch } from 'util/requests';
import { platformAuthorizedRequest } from './utils';
import { InheritMutations, mutation } from 'services/core';
import { StreamError, throwStreamError } from 'services/streaming/stream-error';
import { BasePlatformService } from './base-platform';
import Utils from '../utils';
import { ENotificationType } from '../notifications';
import { $t } from '../i18n';
const UNLISTED_GAME_CATEGORY = { id: '0', name: 'Unlisted', box_art_url: '' };
let TwitchService = class TwitchService extends BasePlatformService {
    constructor() {
        super(...arguments);
        this.apiBase = 'https://api.twitch.tv';
        this.platform = 'twitch';
        this.displayName = 'Twitch';
        this.gameImageSize = { width: 30, height: 40 };
        this.capabilities = new Set([
            'title',
            'chat',
            'scope-validation',
            'tags',
            'game',
            'user-info',
            'streamlabels',
            'themes',
            'viewerCount',
        ]);
        this.liveDockFeatures = new Set(['chat-offline', 'refresh-chat']);
        this.authWindowOptions = {
            width: 600,
            height: 800,
        };
        this.clientId = Utils.shouldUseBeta()
            ? '3eoucd9qwxqh7pu3l0e3rttomgrov2'
            : '8bmp6j83z5w4mepq0dn0q1a7g186azi';
    }
    init() {
        this.userService.userLogin.subscribe(_ => {
            var _a;
            if (((_a = this.userService.platform) === null || _a === void 0 ? void 0 : _a.type) === 'twitch') {
                this.prepopulateInfo();
                this.validatePollsScope();
                this.validateTagsScope();
                this.validateChatWriteScope();
            }
        });
    }
    get authUrl() {
        const host = this.hostsService.streamlabs;
        const scopes = [
            'channel_read',
            'channel_editor',
            'user:edit:broadcast',
            'channel:manage:broadcast',
            'user:write:chat',
        ];
        const query = `_=${Date.now()}&skip_splash=true&external=electron&twitch&force_verify&` +
            `scope=${scopes.join(',')}&origin=slobs`;
        return `https://${host}/slobs/login?${query}`;
    }
    get userAuth() {
        var _a, _b, _c, _d, _e, _f;
        return {
            token: (_c = (_b = (_a = this.userService.state.auth) === null || _a === void 0 ? void 0 : _a.platforms) === null || _b === void 0 ? void 0 : _b.twitch) === null || _c === void 0 ? void 0 : _c.token,
            id: (_f = (_e = (_d = this.userService.state.auth) === null || _d === void 0 ? void 0 : _d.platforms) === null || _e === void 0 ? void 0 : _e.twitch) === null || _f === void 0 ? void 0 : _f.id,
        };
    }
    get oauthToken() {
        return this.userAuth.token;
    }
    get twitchId() {
        return this.userAuth.id;
    }
    get username() {
        var _a, _b, _c;
        return ((_c = (_b = (_a = this.userService.state.auth) === null || _a === void 0 ? void 0 : _a.platforms) === null || _b === void 0 ? void 0 : _b.twitch) === null || _c === void 0 ? void 0 : _c.username) || '';
    }
    get tags() {
        return this.state.settings.tags;
    }
    beforeGoLive(goLiveSettings, context) {
        return __awaiter(this, void 0, void 0, function* () {
            if (goLiveSettings &&
                goLiveSettings.streamShift &&
                this.streamingService.views.shouldSwitchStreams) {
                yield this.setupStreamShiftStream(goLiveSettings);
                return;
            }
            if (this.streamSettingsService.protectedModeEnabled &&
                this.streamSettingsService.isSafeToModifyStreamKey()) {
                let key = yield this.fetchStreamKey();
                if (Utils.isTestMode()) {
                    key = key.split('?')[0] + `?bandwidthtest=true&rnd=${Math.random()}`;
                }
                this.SET_STREAM_KEY(key);
                if (!this.streamingService.views.isMultiplatformMode) {
                    this.streamSettingsService.setSettings({
                        key,
                        platform: 'twitch',
                        streamType: 'rtmp_common',
                        server: 'auto',
                    }, context);
                }
            }
            if (goLiveSettings) {
                const channelInfo = goLiveSettings === null || goLiveSettings === void 0 ? void 0 : goLiveSettings.platforms.twitch;
                if (channelInfo)
                    yield this.putChannelInfo(channelInfo);
            }
            this.setPlatformContext('twitch');
        });
    }
    validatePlatform() {
        return __awaiter(this, void 0, void 0, function* () {
            const twitchTwoFactorCheck = this.fetchStreamKey()
                .then(key => {
                return EPlatformCallResult.Success;
            })
                .catch(e => {
                if (e && e.status) {
                    if (e.status === 403) {
                        return EPlatformCallResult.TwitchTwoFactor;
                    }
                }
                console.error('Error fetching Twitch stream key', e);
                return EPlatformCallResult.Error;
            });
            const results = yield Promise.all([twitchTwoFactorCheck]);
            const failedResults = results.filter(result => result !== EPlatformCallResult.Success);
            if (failedResults.length)
                return failedResults[0];
            return EPlatformCallResult.Success;
        });
    }
    fetchNewToken() {
        const host = this.hostsService.streamlabs;
        const url = `https://${host}/api/v5/slobs/twitch/refresh`;
        const headers = authorizedHeaders(this.userService.apiToken);
        const request = new Request(url, { headers });
        return jfetch(request).then(response => this.userService.updatePlatformToken('twitch', response.access_token));
    }
    requestTwitch(reqInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                return yield platformAuthorizedRequest('twitch', reqInfo);
            }
            catch (e) {
                const details = e.result
                    ? `${e.result.status} ${e.result.error} ${e.result.message}`
                    : 'Connection failed';
                let errorType;
                switch ((_a = e.result) === null || _a === void 0 ? void 0 : _a.message) {
                    case 'missing required oauth scope':
                        errorType = 'TWITCH_MISSED_OAUTH_SCOPE';
                        break;
                    case 'Status contains banned words.':
                        errorType = 'TWITCH_BANNED_WORDS';
                        break;
                    default:
                        errorType = 'PLATFORM_REQUEST_FAILED';
                }
                throwStreamError(errorType, Object.assign(Object.assign({}, e), { platform: 'twitch' }), details);
            }
        });
    }
    fetchStreamKey() {
        return this.requestTwitch(`${this.apiBase}/helix/streams/key?broadcaster_id=${this.twitchId}`).then(json => json.data[0].stream_key);
    }
    prepopulateInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const [channelInfo] = yield Promise.all([
                this.requestTwitch(`${this.apiBase}/helix/channels?broadcaster_id=${this.twitchId}`).then(json => {
                    return {
                        title: json.data[0].title,
                        game: json.data[0].game_name,
                        is_branded_content: json.data[0].is_branded_content,
                        content_classification_labels: json.data[0].content_classification_labels,
                    };
                }),
                this.requestTwitch(`${this.apiBase}/helix/content_classification_labels`).then(json => this.twitchContentClassificationService.setLabels(json)),
            ]);
            const tags = this.twitchTagsService.views.hasTags
                ? this.twitchTagsService.views.tags
                : [];
            this.SET_STREAM_SETTINGS({
                tags,
                title: channelInfo.title,
                game: channelInfo.game,
                isBrandedContent: channelInfo.is_branded_content,
                isEnhancedBroadcasting: this.settingsService.isEnhancedBroadcasting(),
                contentClassificationLabels: channelInfo.content_classification_labels,
            });
            this.SET_PREPOPULATED(true);
        });
    }
    fetchUserInfo() {
        return platformAuthorizedRequest('twitch', `${this.apiBase}/helix/users?id=${this.twitchId}`).then(json => (json[0] && json[0].login ? { username: json[0].login } : {}));
    }
    fetchViewerCount() {
        return platformAuthorizedRequest('twitch', `${this.apiBase}/helix/streams?user_id=${this.twitchId}`).then(json => { var _a, _b; return (_b = (_a = json.data[0]) === null || _a === void 0 ? void 0 : _a.viewer_count) !== null && _b !== void 0 ? _b : 0; });
    }
    setupStreamShiftStream(goLiveSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const settings = goLiveSettings === null || goLiveSettings === void 0 ? void 0 : goLiveSettings.streamShiftSettings;
            if (settings && !settings.is_live) {
                console.error('Stream Shift Error: Twitch is not live');
                this.postError('Stream Shift Error: Twitch is not live');
                return;
            }
            const [channelInfo] = yield Promise.all([
                this.requestTwitch(`${this.apiBase}/helix/channels?broadcaster_id=${this.twitchId}`).then(json => {
                    var _a;
                    return {
                        title: (_a = settings === null || settings === void 0 ? void 0 : settings.stream_title) !== null && _a !== void 0 ? _a : json.data[0].title,
                        game: json.data[0].game_name,
                        is_branded_content: json.data[0].is_branded_content,
                        content_classification_labels: json.data[0].content_classification_labels,
                    };
                }),
                this.requestTwitch(`${this.apiBase}/helix/content_classification_labels`).then(json => this.twitchContentClassificationService.setLabels(json)),
            ]);
            const title = (_a = settings === null || settings === void 0 ? void 0 : settings.stream_title) !== null && _a !== void 0 ? _a : channelInfo.title;
            const game = (_b = settings === null || settings === void 0 ? void 0 : settings.game_name) !== null && _b !== void 0 ? _b : channelInfo.game;
            const tags = this.twitchTagsService.views.hasTags
                ? this.twitchTagsService.views.tags
                : [];
            this.SET_STREAM_SETTINGS({
                tags,
                title,
                game,
                isBrandedContent: channelInfo.is_branded_content,
                isEnhancedBroadcasting: this.settingsService.isEnhancedBroadcasting(),
                contentClassificationLabels: channelInfo.content_classification_labels,
            });
            this.setPlatformContext('twitch');
        });
    }
    fetchFollowers() {
        return this.requestTwitch({
            url: `${this.apiBase}/helix/users/follows?to_id=${this.twitchId}`,
        }).then(json => json.total);
    }
    putChannelInfo(_a) {
        return __awaiter(this, arguments, void 0, function* ({ title, game, tags = [], contentClassificationLabels = [], isBrandedContent = false, }) {
            var _b, _c;
            let gameId = '';
            const isUnlisted = game === UNLISTED_GAME_CATEGORY.name;
            if (isUnlisted)
                gameId = '0';
            if (game && !isUnlisted) {
                gameId = yield this.requestTwitch(`${this.apiBase}/helix/games?name=${encodeURIComponent(game)}`).then(json => json.data[0].id);
            }
            this.twitchTagsService.actions.setTags(tags);
            const hasPermission = yield this.hasScope('channel:manage:broadcast');
            const scopedTags = hasPermission ? tags : undefined;
            const labels = this.twitchContentClassificationService.options.map(option => ({
                id: option.value,
                is_enabled: contentClassificationLabels.includes(option.value),
            }));
            const updateInfo = (tags) => __awaiter(this, void 0, void 0, function* () {
                return this.requestTwitch({
                    url: `${this.apiBase}/helix/channels?broadcaster_id=${this.twitchId}`,
                    method: 'PATCH',
                    body: JSON.stringify({
                        tags,
                        title,
                        game_id: gameId,
                        is_branded_content: isBrandedContent,
                        content_classification_labels: labels,
                    }),
                });
            });
            try {
                yield updateInfo(scopedTags);
            }
            catch (e) {
                if (e instanceof StreamError && ((_b = e.details) === null || _b === void 0 ? void 0 : _b.includes('One or more tags were not applied'))) {
                    const offendingTagsStr = (_c = e.details.match(/moderation check: \[(.+)]$/)) === null || _c === void 0 ? void 0 : _c[1];
                    if (!offendingTagsStr) {
                        throw e;
                    }
                    const offendingTags = offendingTagsStr.split(', ').map(str => str.toLowerCase());
                    const newTags = tags.filter(tag => !offendingTags.includes(tag.toLowerCase()));
                    yield updateInfo(newTags);
                    this.twitchTagsService.actions.setTags(newTags);
                    this.SET_STREAM_SETTINGS({ title, game, tags: newTags });
                    this.notificationsService.push({
                        message: $t('While updating your Twitch channel info, some tags were removed due to moderation rules: %{tags}', { tags: offendingTags.join(', ') }),
                        playSound: false,
                        type: ENotificationType.WARNING,
                    });
                    return;
                }
                throw e;
            }
            this.SET_STREAM_SETTINGS({ title, game, tags });
        });
    }
    searchGames(searchString) {
        return __awaiter(this, void 0, void 0, function* () {
            const gamesResponse = yield platformAuthorizedRequest('twitch', `${this.apiBase}/helix/search/categories?query=${searchString}`);
            const data = gamesResponse.data || [];
            const shouldIncludeUnlisted = searchString.toLowerCase() === 'unlisted'.substring(0, searchString.length);
            if (shouldIncludeUnlisted) {
                data.push(UNLISTED_GAME_CATEGORY);
            }
            return data.map(g => ({ id: g.id, name: g.name, image: g.box_art_url }));
        });
    }
    fetchGame(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (name === UNLISTED_GAME_CATEGORY.name)
                return UNLISTED_GAME_CATEGORY;
            const gamesResponse = yield platformAuthorizedRequest('twitch', `${this.apiBase}/helix/games?name=${encodeURIComponent(name)}`);
            return gamesResponse.data.map(g => {
                const imageTemplate = g.box_art_url;
                const imageSize = this.gameImageSize;
                const image = imageTemplate
                    .replace('{width}', imageSize.width.toString())
                    .replace('{height}', imageSize.height.toString());
                return { id: g.id, name: g.name, image };
            })[0];
        });
    }
    get chatUrl() {
        const mode = this.customizationService.isDarkTheme ? 'night' : 'day';
        const nightMode = mode === 'day' ? 'popout' : 'darkpopout';
        return `https://twitch.tv/popout/${this.username}/chat?${nightMode}`;
    }
    get streamPageUrl() {
        return `https://twitch.tv/${this.username}`;
    }
    validateTagsScope() {
        return __awaiter(this, void 0, void 0, function* () {
            const hasTagsScope = yield this.hasScope('channel:manage:broadcast');
            this.SET_HAS_TAGS_PERMISSION(hasTagsScope);
        });
    }
    validatePollsScope() {
        return __awaiter(this, void 0, void 0, function* () {
            const hasPollsPermission = yield this.hasScope('channel:manage:polls');
            this.SET_HAS_POLLS_PERMISSION(hasPollsPermission);
        });
    }
    validateChatWriteScope() {
        return __awaiter(this, void 0, void 0, function* () {
            const hasChatWritePermission = yield this.hasScope('user:write:chat');
            this.SET_HAS_CHAT_WRITE_PERMISSION(hasChatWritePermission);
        });
    }
    sendChatMessage(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            this.requestTwitch({
                url: `${this.apiBase}/helix/chat/messages`,
                method: 'POST',
                body: JSON.stringify({
                    broadcaster_id: this.twitchId,
                    sender_id: this.twitchId,
                    message: msg,
                }),
            });
        });
    }
    hasScope(scope) {
        return platformAuthorizedRequest('twitch', 'https://id.twitch.tv/oauth2/validate').then((response) => response.scopes.includes(scope));
    }
    getHeaders(req, authorized = false) {
        const isNewApi = req.url.indexOf('https://api.twitch.tv/helix/') === 0;
        return Object.assign({ 'Client-Id': this.clientId, Accept: 'application/vnd.twitchtv.v5+json', 'Content-Type': 'application/json' }, (authorized
            ? { Authorization: `${isNewApi ? 'Bearer' : 'OAuth'} ${this.oauthToken}` }
            : {}));
    }
    get liveDockEnabled() {
        return true;
    }
    SET_HAS_POLLS_PERMISSION(hasPollsPermission) {
        this.state.hasPollsPermission = hasPollsPermission;
    }
    SET_HAS_TAGS_PERMISSION(hasUpdateTagsPermission) {
        this.state.hasUpdateTagsPermission = hasUpdateTagsPermission;
    }
    SET_HAS_CHAT_WRITE_PERMISSION(hasChatWritePermission) {
        this.state.hasChatWritePermission = hasChatWritePermission;
    }
};
TwitchService.initialState = Object.assign(Object.assign({}, BasePlatformService.initialState), { hasUpdateTagsPermission: false, hasPollsPermission: false, hasChatWritePermission: false, settings: {
        title: '',
        game: '',
        video: undefined,
        mode: undefined,
        tags: [],
        contentClassificationLabels: [],
        isBrandedContent: false,
        isEnhancedBroadcasting: false,
    } });
__decorate([
    Inject()
], TwitchService.prototype, "hostsService", void 0);
__decorate([
    Inject()
], TwitchService.prototype, "userService", void 0);
__decorate([
    Inject()
], TwitchService.prototype, "customizationService", void 0);
__decorate([
    Inject()
], TwitchService.prototype, "twitchTagsService", void 0);
__decorate([
    Inject()
], TwitchService.prototype, "twitchContentClassificationService", void 0);
__decorate([
    Inject()
], TwitchService.prototype, "notificationsService", void 0);
__decorate([
    Inject()
], TwitchService.prototype, "settingsService", void 0);
__decorate([
    mutation()
], TwitchService.prototype, "SET_HAS_POLLS_PERMISSION", null);
__decorate([
    mutation()
], TwitchService.prototype, "SET_HAS_TAGS_PERMISSION", null);
__decorate([
    mutation()
], TwitchService.prototype, "SET_HAS_CHAT_WRITE_PERMISSION", null);
TwitchService = __decorate([
    InheritMutations()
], TwitchService);
export { TwitchService };
//# sourceMappingURL=twitch.js.map