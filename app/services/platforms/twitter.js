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
import { authorizedHeaders, jfetch } from '../../util/requests';
import { throwStreamError } from '../streaming/stream-error';
import { platformAuthorizedRequest } from './utils';
import Utils from '../utils';
import { ENotificationType } from '../notifications';
import * as remote from '@electron/remote';
import { $t } from 'services/i18n';
export var ETwitterChatType;
(function (ETwitterChatType) {
    ETwitterChatType[ETwitterChatType["Off"] = 1] = "Off";
    ETwitterChatType[ETwitterChatType["Everyone"] = 2] = "Everyone";
    ETwitterChatType[ETwitterChatType["VerifiedOnly"] = 3] = "VerifiedOnly";
    ETwitterChatType[ETwitterChatType["FollowedOnly"] = 4] = "FollowedOnly";
    ETwitterChatType[ETwitterChatType["SubscribersOnly"] = 5] = "SubscribersOnly";
})(ETwitterChatType || (ETwitterChatType = {}));
let TwitterPlatformService = class TwitterPlatformService extends BasePlatformService {
    constructor() {
        super(...arguments);
        this.capabilities = new Set(['title', 'viewerCount']);
        this.liveDockFeatures = new Set([
            'refresh-chat-streaming',
            'chat-streaming',
        ]);
        this.apiBase = 'https://api.x.com/2';
        this.domain = 'https://x.com';
        this.platform = 'twitter';
        this.displayName = 'X (Twitter)';
        this.gameImageSize = { width: 30, height: 40 };
        this.authWindowOptions = {
            width: 600,
            height: 800,
        };
    }
    get authUrl() {
        const host = this.hostsService.streamlabs;
        const query = `_=${Date.now()}&skip_splash=true&external=electron&twitter&force_verify&origin=slobs`;
        return `https://${host}/slobs/login?${query}`;
    }
    get username() {
        var _a, _b, _c;
        return ((_c = (_b = (_a = this.userService.state.auth) === null || _a === void 0 ? void 0 : _a.platforms) === null || _b === void 0 ? void 0 : _b.twitter) === null || _c === void 0 ? void 0 : _c.username) || '';
    }
    setupStreamShiftStream(goLiveSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const settings = goLiveSettings === null || goLiveSettings === void 0 ? void 0 : goLiveSettings.streamShiftSettings;
            if (settings && !settings.is_live) {
                console.error('Stream Shift Error: X is not live');
                this.postError('Stream Shift Error: X is not live');
                return;
            }
            if (settings) {
                this.UPDATE_STREAM_SETTINGS({
                    title: settings === null || settings === void 0 ? void 0 : settings.stream_title,
                });
                this.SET_BROADCAST_ID((_a = settings === null || settings === void 0 ? void 0 : settings.broadcast_id) !== null && _a !== void 0 ? _a : '');
            }
            this.setPlatformContext('twitter');
        });
    }
    beforeGoLive(goLiveSettings, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (Utils.isTestMode()) {
                this.SET_BROADCAST_ID('twitterBroadcast1');
                this.setPlatformContext('twitter');
                return;
            }
            if (goLiveSettings.streamShift && this.streamingService.views.shouldSwitchStreams) {
                yield this.setupStreamShiftStream(goLiveSettings);
                return;
            }
            try {
                const streamInfo = yield this.startStream((_a = goLiveSettings.platforms.twitter) !== null && _a !== void 0 ? _a : this.state.settings);
                this.SET_STREAM_KEY(streamInfo.key);
                this.SET_BROADCAST_ID(streamInfo.id);
                this.SET_INGEST(streamInfo.rtmp);
                if (!this.streamingService.views.isMultiplatformMode) {
                    this.streamSettingsService.setSettings({
                        streamType: 'rtmp_custom',
                        key: streamInfo.key,
                        server: streamInfo.rtmp,
                    }, context);
                }
                this.setPlatformContext('twitter');
            }
            catch (e) {
                if (((_b = e === null || e === void 0 ? void 0 : e.result) === null || _b === void 0 ? void 0 : _b.message) === 'You need X premium account to go live.') {
                    this.notificationsService.push({
                        type: ENotificationType.WARNING,
                        message: $t('You need X premium account to go live on X. Click to learn more'),
                        action: this.jsonrpcService.createRequest(Service.getResourceId(this), 'openStreamIneligibleHelp'),
                    });
                    throwStreamError('X_PREMIUM_ACCOUNT_REQUIRED', Object.assign(Object.assign({}, e), { platform: 'twitter' }));
                }
                throw e;
            }
        });
    }
    afterStopStream() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.state.broadcastId && !this.streamingService.views.isSwitchingStream) {
                console.log('Ending X stream', this.state.broadcastId);
                yield this.endStream(this.state.broadcastId);
            }
        });
    }
    fetchNewToken() {
        const host = this.hostsService.streamlabs;
        const url = `https://${host}/api/v5/slobs/twitter/refresh`;
        const headers = authorizedHeaders(this.userService.apiToken);
        const request = new Request(url, { headers });
        return jfetch(request).then(response => this.userService.updatePlatformToken('twitter', response.access_token));
    }
    requestTwitter(reqInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield platformAuthorizedRequest('twitter', reqInfo);
            }
            catch (e) {
                let details = e.message;
                if (!details)
                    details = 'connection failed';
                throwStreamError('PLATFORM_REQUEST_FAILED', Object.assign(Object.assign({}, e), { platform: 'twitter' }), details);
            }
        });
    }
    startStream(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const host = this.hostsService.streamlabs;
            const url = `https://${host}/api/v5/slobs/twitter/stream/start`;
            const headers = authorizedHeaders(this.userService.apiToken);
            const body = new FormData();
            body.append('title', opts.title);
            body.append('chat_option', opts.chatType.toString());
            const request = new Request(url, { headers, method: 'POST', body });
            return jfetch(request);
        });
    }
    endStream(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const host = this.hostsService.streamlabs;
            const url = `https://${host}/api/v5/slobs/twitter/stream/${id}/end`;
            const headers = authorizedHeaders(this.userService.apiToken);
            const request = new Request(url, { headers, method: 'POST' });
            return jfetch(request);
        });
    }
    fetchViewerCount() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.state.broadcastId)
                return 0;
            const host = this.hostsService.streamlabs;
            const url = `https://${host}/api/v5/slobs/twitter/stream/${this.state.broadcastId}/info`;
            const headers = authorizedHeaders(this.userService.apiToken);
            const request = new Request(url, { headers });
            const result = yield jfetch(request);
            return parseInt(result.viewers, 10);
        });
    }
    prepopulateInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            this.SET_PREPOPULATED(true);
        });
    }
    putChannelInfo(settings) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    getHeaders() {
        return {};
    }
    get liveDockEnabled() {
        return true;
    }
    get streamPageUrl() {
        return '';
    }
    get chatUrl() {
        var _a, _b, _c;
        const username = (_c = (_b = (_a = this.userService.state.auth) === null || _a === void 0 ? void 0 : _a.platforms) === null || _b === void 0 ? void 0 : _b.twitter) === null || _c === void 0 ? void 0 : _c.username;
        if (!username)
            return '';
        return `${this.domain}/${username}/chat`;
    }
    SET_BROADCAST_ID(id) {
        this.state.broadcastId = id;
    }
    SET_INGEST(ingest) {
        this.state.ingest = ingest;
    }
    openStreamIneligibleHelp() {
        const url = `${this.domain}/Live/status/1812291533162590577`;
        return remote.shell.openExternal(url);
    }
};
TwitterPlatformService.initialState = Object.assign(Object.assign({}, BasePlatformService.initialState), { settings: { title: '', chatType: ETwitterChatType.Everyone }, broadcastId: '', ingest: '' });
__decorate([
    Inject()
], TwitterPlatformService.prototype, "jsonrpcService", void 0);
__decorate([
    mutation()
], TwitterPlatformService.prototype, "SET_BROADCAST_ID", null);
__decorate([
    mutation()
], TwitterPlatformService.prototype, "SET_INGEST", null);
TwitterPlatformService = __decorate([
    InheritMutations()
], TwitterPlatformService);
export { TwitterPlatformService };
//# sourceMappingURL=twitter.js.map