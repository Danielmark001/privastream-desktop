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
import { PersistentStatefulService } from 'services/core/persistent-stateful-service';
import { authorizedHeaders, jfetch } from 'util/requests';
import { mutation } from 'services/core/stateful-service';
import { Service, Inject, ViewHandler } from 'services/core';
import electron from 'electron';
import { getPlatformService, EPlatformCallResult, } from 'services/platforms';
import * as Sentry from '@sentry/browser';
import { RunInLoadingMode } from 'services/app/app-decorators';
import { Subject } from 'rxjs';
import Utils from 'services/utils';
import { $t, I18nService } from 'services/i18n';
import uuid from 'uuid/v4';
import { SettingsService } from 'services/settings';
import * as obs from '../../../obs-api';
import { StreamSettingsService } from 'services/settings/streaming';
import { lazyModule } from 'util/lazy-module';
import { AuthModule } from './auth-module';
import fs from 'fs';
import path from 'path';
import { ENotificationType } from 'services/notifications';
import * as remote from '@electron/remote';
import { debounce } from 'lodash-decorators';
export var EAuthProcessState;
(function (EAuthProcessState) {
    EAuthProcessState["Idle"] = "idle";
    EAuthProcessState["Loading"] = "loading";
    EAuthProcessState["InProgress"] = "progress";
})(EAuthProcessState || (EAuthProcessState = {}));
export function setSentryContext(ctx) {
    Sentry.configureScope(scope => {
        scope.setUser({ username: ctx.username });
        scope.setExtra('platform', ctx.platform);
    });
    if (Utils.isWorkerWindow()) {
        obs.NodeObs.SetUsername(ctx.username);
        remote.crashReporter.addExtraParameter('sentry[user][username]', ctx.username);
        remote.crashReporter.addExtraParameter('platform', ctx.platform);
    }
    electron.crashReporter.addExtraParameter('sentry[user][username]', ctx.username);
    electron.crashReporter.addExtraParameter('platform', ctx.platform);
}
class UserViews extends ViewHandler {
    get settingsServiceViews() {
        return this.getServiceViews(SettingsService);
    }
    get streamSettingsServiceViews() {
        return this.getServiceViews(StreamSettingsService);
    }
    get isLoggedIn() {
        return !!(this.state.auth && this.state.auth.widgetToken && this.state.loginValidated);
    }
    get isPartialSLAuth() {
        return this.state.auth && this.state.auth.slid && !this.state.auth.primaryPlatform;
    }
    get isPrime() {
        if (!this.isLoggedIn)
            return false;
        return this.state.isPrime;
    }
    get username() {
        if (this.isLoggedIn) {
            return this.platform.username;
        }
    }
    get platform() {
        if (this.isLoggedIn) {
            return this.state.auth.platforms[this.state.auth.primaryPlatform];
        }
    }
    get platforms() {
        if (this.isLoggedIn) {
            return this.state.auth.platforms;
        }
    }
    get linkedPlatforms() {
        if (this.state.auth && this.state.auth.platforms) {
            return Object.keys(this.state.auth.platforms);
        }
        return [];
    }
    get isTwitchAuthed() {
        return this.isLoggedIn && this.platform.type === 'twitch';
    }
    get isTwitchAuthedAndActive() {
        return this.streamSettingsServiceViews.state.protectedModeEnabled
            ? this.isTwitchAuthed
            : this.settingsServiceViews.streamPlatform === 'Twitch';
    }
    get isFacebookAuthed() {
        return this.isLoggedIn && this.platform.type === 'facebook';
    }
    get isYoutubeAuthed() {
        return this.isLoggedIn && this.platform.type === 'youtube';
    }
    get hasSLID() {
        return !!this.auth.slid;
    }
    get auth() {
        return this.state.auth;
    }
    appStoreUrl(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let url = `https://${this.hostsService.streamlabs}/library/app-store`;
            if (params === null || params === void 0 ? void 0 : params.appId) {
                url = `${url}/app/${params === null || params === void 0 ? void 0 : params.appId}`;
            }
            if (params === null || params === void 0 ? void 0 : params.type) {
                url = `${url}/${params === null || params === void 0 ? void 0 : params.type}`;
            }
            const magicUrl = yield this.magicLinkService.actions.return.getMagicSessionUrl(url);
            return magicUrl;
        });
    }
    setPrimaryPlatform(platform) {
        this.userService.setPrimaryPlatform(platform);
    }
}
__decorate([
    Inject()
], UserViews.prototype, "hostsService", void 0);
__decorate([
    Inject()
], UserViews.prototype, "magicLinkService", void 0);
__decorate([
    Inject()
], UserViews.prototype, "customizationService", void 0);
__decorate([
    Inject()
], UserViews.prototype, "userService", void 0);
export class UserService extends PersistentStatefulService {
    constructor() {
        super(...arguments);
        this.userLogin = new Subject();
        this.userLogout = new Subject();
        this.scopeAdded = new Subject();
        this.userLoginFinished = new Subject();
        this.socketConnection = null;
        this.refreshedLinkedAccounts = new Subject();
        this.sentryContext = new Subject();
    }
    setPrimaryPlatform(platform) {
        this.SET_PRIMARY_PLATFORM(platform);
    }
    LOGIN(auth) {
        Vue.set(this.state, 'auth', auth);
        Vue.set(this.state.auth, 'platform', auth.platforms[auth.primaryPlatform]);
    }
    UPDATE_PLATFORM(auth) {
        Vue.set(this.state.auth.platforms, auth.type, auth);
    }
    UNLINK_PLATFORM(platform) {
        Vue.delete(this.state.auth.platforms, platform);
    }
    LOGOUT() {
        Vue.delete(this.state, 'auth');
        this.state.isPrime = false;
        Vue.delete(this.state, 'userId');
        this.state.loginValidated = false;
    }
    SET_PRIME(isPrime) {
        this.state.isPrime = isPrime;
    }
    SET_EXPIRES(expires) {
        this.state.expires = expires;
    }
    SET_USER(userId, createdAt) {
        this.state.userId = userId;
        this.state.createdAt = new Date(createdAt).valueOf();
    }
    SET_PLATFORM_TOKEN(platform, token) {
        this.state.auth.platforms[platform].token = token;
    }
    SET_CHANNEL_ID(platform, id) {
        this.state.auth.platforms[platform].channelId = id;
    }
    SET_USERNAME(platform, name) {
        this.state.auth.platforms[platform].channelId = name;
    }
    VALIDATE_LOGIN(validated) {
        Vue.set(this.state, 'loginValidated', validated);
    }
    SET_AUTH_STATE(state) {
        Vue.set(this.state, 'authProcessState', state);
    }
    SET_IS_RELOG(isrelog) {
        Vue.set(this.state, 'isRelog', isrelog);
    }
    SET_PRIMARY_PLATFORM(primary) {
        Vue.set(this.state.auth, 'primaryPlatform', primary);
    }
    SET_SLID(slid) {
        Vue.set(this.state.auth, 'slid', slid);
    }
    UNLINK_SLID() {
        Vue.delete(this.state.auth, 'slid');
    }
    SET_WIDGET_TOKEN(token) {
        if (this.state.auth) {
            this.state.auth.widgetToken = token;
        }
    }
    MIGRATE_AUTH() {
        if (!this.state.auth)
            return;
        if (this.state.auth.platform && !this.state.auth.platforms) {
            Vue.set(this.state.auth, 'platforms', {
                [this.state.auth.platform.type]: this.state.auth.platform,
            });
            Vue.set(this.state.auth, 'primaryPlatform', this.state.auth.platform.type);
        }
    }
    init() {
        const _super = Object.create(null, {
            init: { get: () => super.init }
        });
        return __awaiter(this, void 0, void 0, function* () {
            _super.init.call(this);
            this.MIGRATE_AUTH();
            this.VALIDATE_LOGIN(false);
            this.SET_AUTH_STATE(EAuthProcessState.Idle);
            if (this.views.isPartialSLAuth) {
                this.LOGOUT();
            }
            this.websocketService.socketEvent.subscribe((event) => __awaiter(this, void 0, void 0, function* () {
                if (event.type === 'slid.force_logout') {
                    yield this.clearForceLoginStatus();
                    yield this.reauthenticate(false, {
                        message: $t("You've merged a Streamlabs ID to your account, please log back in to ensure you have the right credentials."),
                    });
                }
                if (['account_merged', 'account_unlinked'].includes(event.type)) {
                    if (!this.isLoggedIn)
                        return;
                    yield this.updateLinkedPlatforms();
                    const message = event.type === 'account_merged'
                        ? $t('Successfully merged account')
                        : $t('Successfully unlinked account');
                    if (event.type === 'account_merged' &&
                        this.navigationService.state.currentPage === 'PlatformMerge') {
                        this.navigationService.navigate('Studio');
                    }
                    yield this.showStreamSettingsIfNeeded();
                    this.windowsService.actions.setWindowOnTop('all');
                    this.refreshedLinkedAccounts.next({ success: true, message });
                }
                if (event.type === 'account_merge_error') {
                    yield this.showStreamSettingsIfNeeded();
                    this.windowsService.actions.setWindowOnTop('all');
                    this.refreshedLinkedAccounts.next({ success: false, message: $t('Account merge error') });
                }
                if (event.type === 'streamlabs_prime_subscribe') {
                    this.windowsService.actions.setWindowOnTop('all');
                    this.usageStatisticsService.ultraSubscription.next(true);
                }
                if (event.type === 'account_permissions_required') {
                    const platform = event.message[0].platform.split('_')[0];
                    yield this.startChatAuth(platform);
                }
                if (event.type === 'streamSwitchRequest') {
                    this.streamingService.streamShiftEvent.next(event);
                }
                if (event.type === 'switchActionComplete') {
                    this.streamingService.streamShiftEvent.next(event);
                }
            }));
        });
    }
    showStreamSettingsIfNeeded() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.windowsService.state.child && !this.windowsService.state.child.isShown) {
                this.settingsService.showSettings('Stream');
                yield Utils.sleep(500);
            }
        });
    }
    get views() {
        return new UserViews(this.state);
    }
    testingFakeAuth(auth_1) {
        return __awaiter(this, arguments, void 0, function* (auth, isOnboardingTest = false, isNewUser = false) {
            if (!Utils.isTestMode())
                return;
            const service = getPlatformService(auth.primaryPlatform);
            this.streamSettingsService.resetStreamSettings();
            yield this.login(service, auth);
            if (isNewUser) {
                this.sceneCollectionsService.newUserFirstLogin = true;
            }
            if (!isOnboardingTest)
                this.onboardingService.finish();
        });
    }
    addDummyAccount(dummyAcct, settings) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Utils.isTestMode())
                return;
            this.UPDATE_PLATFORM(dummyAcct);
            if (settings === null || settings === void 0 ? void 0 : settings.tikTokLiveScope) {
                this.tiktokService.setLiveScope(settings === null || settings === void 0 ? void 0 : settings.tikTokLiveScope);
            }
            if ((settings === null || settings === void 0 ? void 0 : settings.serverUrl) && (settings === null || settings === void 0 ? void 0 : settings.streamKey)) {
                const service = getPlatformService(dummyAcct.type);
                service.putChannelInfo(Object.assign(Object.assign({}, service.state.settings), { serverUrl: settings.serverUrl, streamKey: settings.streamKey }));
            }
            return EPlatformCallResult.Success;
        });
    }
    autoLogin() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.state.auth)
                return;
            if (!this.state.auth.hasRelogged) {
                yield remote.session.defaultSession.clearCache();
                yield remote.session.defaultSession.clearStorageData({
                    storages: ['cookies', 'cachestorage', 'filesystem'],
                });
                this.streamSettingsService.resetStreamSettings();
                this.LOGOUT();
                this.SET_IS_RELOG(true);
                this.showLogin();
            }
            else {
                const allPlatforms = this.streamingService.views.allPlatforms;
                if (!allPlatforms.includes(this.state.auth.primaryPlatform))
                    return;
                const service = getPlatformService(this.state.auth.primaryPlatform);
                return this.login(service, this.state.auth, true);
            }
        });
    }
    subscribeToSocketConnection() {
        this.socketConnection = this.websocketService.socketEvent.subscribe(ev => this.onSocketEvent(ev));
        return Promise.resolve();
    }
    unsubscribeFromSocketConnection() {
        if (this.socketConnection)
            this.socketConnection.unsubscribe();
        return Promise.resolve();
    }
    validateLogin() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.state.auth)
                return;
            const host = this.hostsService.streamlabs;
            const headers = authorizedHeaders(this.apiToken);
            const url = `https://${host}/api/v5/slobs/validate`;
            const request = new Request(url, { headers });
            const valid = yield fetch(request).then(res => {
                return res.text();
            });
            if (valid.match(/false/)) {
                return false;
            }
            return true;
        });
    }
    refreshUserInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isLoggedIn)
                return;
            try {
                const service = getPlatformService(this.platform.type);
                const userInfo = yield service.fetchUserInfo();
                if (userInfo.username) {
                    this.SET_USERNAME(this.platform.type, userInfo.username);
                }
            }
            catch (e) {
                console.error('Error fetching user info', e);
            }
        });
    }
    writeUserIdFile(userId) {
        var _a;
        const filePath = path.join(this.appService.appDataDirectory, 'userId');
        fs.writeFile(filePath, (_a = userId === null || userId === void 0 ? void 0 : userId.toString()) !== null && _a !== void 0 ? _a : '', err => {
            if (err) {
                console.error('Error writing user id file', err);
            }
        });
    }
    updateLinkedPlatforms() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const linkedPlatforms = yield this.fetchLinkedPlatforms();
            if (!linkedPlatforms)
                return;
            if (linkedPlatforms.user_id) {
                this.writeUserIdFile(linkedPlatforms.user_id);
                this.SET_USER(linkedPlatforms.user_id, linkedPlatforms.created_at);
            }
            if (linkedPlatforms.widget_token &&
                linkedPlatforms.widget_token !== ((_a = this.state.auth) === null || _a === void 0 ? void 0 : _a.widgetToken)) {
                this.SET_WIDGET_TOKEN(linkedPlatforms.widget_token);
            }
            if (linkedPlatforms.facebook_account) {
                this.UPDATE_PLATFORM({
                    type: 'facebook',
                    username: linkedPlatforms.facebook_account.platform_name,
                    id: linkedPlatforms.facebook_account.platform_id,
                    token: linkedPlatforms.facebook_account.access_token,
                });
            }
            else if (this.state.auth.primaryPlatform !== 'facebook') {
                this.UNLINK_PLATFORM('facebook');
            }
            if (linkedPlatforms.twitch_account) {
                this.UPDATE_PLATFORM({
                    type: 'twitch',
                    username: linkedPlatforms.twitch_account.platform_name,
                    id: linkedPlatforms.twitch_account.platform_id,
                    token: linkedPlatforms.twitch_account.access_token,
                });
                const validationError = linkedPlatforms.twitch_account.validation_error;
                if (validationError) {
                    const message = validationError === 'missing_scope'
                        ? $t('Streamlabs requires additional permissions from your Twitch account. Please log in with Twitch to continue.')
                        : $t('Your Twitch access token has expired. Please log in with Twitch to continue.');
                    this.usageStatisticsService.recordAnalyticsEvent('TwitchCredentialsAlert', validationError);
                    this.reauthenticate(true, {
                        type: 'warning',
                        title: 'Twitch Error',
                        buttons: [$t('Refresh Login')],
                        message,
                    });
                }
            }
            else if (this.state.auth.primaryPlatform !== 'twitch') {
                this.UNLINK_PLATFORM('twitch');
            }
            if (linkedPlatforms.youtube_account) {
                this.UPDATE_PLATFORM({
                    type: 'youtube',
                    username: linkedPlatforms.youtube_account.platform_name,
                    id: linkedPlatforms.youtube_account.platform_id,
                    token: linkedPlatforms.youtube_account.access_token,
                });
            }
            else if (this.state.auth.primaryPlatform !== 'youtube') {
                this.UNLINK_PLATFORM('youtube');
            }
            if (linkedPlatforms.tiktok_account) {
                this.UPDATE_PLATFORM({
                    type: 'tiktok',
                    username: linkedPlatforms.tiktok_account.platform_name,
                    id: linkedPlatforms.tiktok_account.platform_id,
                    token: linkedPlatforms.tiktok_account.access_token,
                });
            }
            else if (this.state.auth.primaryPlatform !== 'tiktok') {
                this.UNLINK_PLATFORM('tiktok');
            }
            if (linkedPlatforms.trovo_account) {
                this.UPDATE_PLATFORM({
                    type: 'trovo',
                    username: linkedPlatforms.trovo_account.platform_name,
                    id: linkedPlatforms.trovo_account.platform_id,
                    token: linkedPlatforms.trovo_account.access_token,
                });
            }
            else if (this.state.auth.primaryPlatform !== 'trovo') {
                this.UNLINK_PLATFORM('trovo');
            }
            if (linkedPlatforms.kick_account) {
                this.UPDATE_PLATFORM({
                    type: 'kick',
                    username: linkedPlatforms.kick_account.platform_name,
                    id: linkedPlatforms.kick_account.platform_id,
                    token: linkedPlatforms.kick_account.access_token,
                });
            }
            else if (this.state.auth.primaryPlatform !== 'kick') {
                this.UNLINK_PLATFORM('kick');
            }
            if (linkedPlatforms.streamlabs_account) {
                this.SET_SLID({
                    id: linkedPlatforms.streamlabs_account.platform_id,
                    username: linkedPlatforms.streamlabs_account.platform_name,
                });
            }
            else {
                this.UNLINK_SLID();
            }
            if (linkedPlatforms.twitter_account) {
                this.UPDATE_PLATFORM({
                    type: 'twitter',
                    username: linkedPlatforms.twitter_account.platform_name,
                    id: linkedPlatforms.twitter_account.platform_id,
                    token: linkedPlatforms.twitter_account.access_token,
                });
            }
            else if (this.state.auth.primaryPlatform !== 'twitter') {
                this.UNLINK_PLATFORM('twitter');
            }
            if (linkedPlatforms.force_login_required)
                return true;
        });
    }
    fetchLinkedPlatforms() {
        if (!this.state.auth || !this.state.auth.apiToken)
            return;
        const host = this.hostsService.streamlabs;
        const headers = authorizedHeaders(this.apiToken);
        const url = `https://${host}/api/v5/restream/user/info`;
        const request = new Request(url, { headers });
        return jfetch(request).catch(() => {
            console.warn('Error fetching linked platforms');
        });
    }
    get isPrime() {
        return this.state.isPrime;
    }
    setPrimeStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            const host = this.hostsService.streamlabs;
            const url = `https://${host}/api/v5/slobs/prime`;
            const headers = authorizedHeaders(this.apiToken);
            const request = new Request(url, { headers });
            return jfetch(request)
                .then(response => this.validatePrimeStatus(response))
                .catch((e) => null);
        });
    }
    validatePrimeStatus(response) {
        this.SET_PRIME(response.is_prime);
        if (response.cc_expires_in_days != null)
            this.sendExpiresSoonNotification();
        if (!response.expires_soon) {
            this.SET_EXPIRES(null);
            return;
        }
        else if (!this.state.expires) {
            this.SET_EXPIRES(response.expires_at);
        }
    }
    sendExpiresSoonNotification() {
        this.notificationsService.push({
            type: ENotificationType.WARNING,
            lifeTime: -1,
            action: this.jsonrpcService.createRequest(Service.getResourceId(this), 'openCreditCardLink'),
            message: $t('Your credit card expires soon. Click here to retain your Ultra benefits'),
        });
    }
    openCreditCardLink() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const link = yield this.magicLinkService.getDashboardMagicLink('expiring_cc');
                electron.shell.openExternal(link);
            }
            catch (e) { }
        });
    }
    flushUserSession() {
        if (this.isLoggedIn && this.state.auth.partition) {
            const session = remote.session.fromPartition(this.state.auth.partition);
            session.flushStorageData();
            return session.cookies.flushStore();
        }
        return Promise.resolve();
    }
    get isLoggedIn() {
        return !!(this.state.auth && this.state.auth.widgetToken && this.state.loginValidated);
    }
    getLocalUserId() {
        const localStorageKey = 'SlobsLocalUserId';
        let userId = localStorage.getItem(localStorageKey);
        if (!userId) {
            userId = uuid();
            localStorage.setItem(localStorageKey, userId);
        }
        return userId;
    }
    get isAlphaGroup() {
        const localId = this.getLocalUserId();
        return Number(localId.search(/\d/)) % 2 === 0;
    }
    get apiToken() {
        if (this.state.auth)
            return this.state.auth.apiToken;
    }
    get widgetToken() {
        if (this.isLoggedIn) {
            return this.state.auth.widgetToken;
        }
    }
    get platform() {
        if (this.isLoggedIn) {
            return this.state.auth.platforms[this.state.auth.primaryPlatform];
        }
    }
    get platformType() {
        if (this.isLoggedIn) {
            return this.state.auth.primaryPlatform;
        }
    }
    get username() {
        if (this.isLoggedIn) {
            return this.platform.username;
        }
    }
    get platformId() {
        if (this.isLoggedIn) {
            return this.platform.id;
        }
    }
    get channelId() {
        if (this.isLoggedIn) {
            return this.platform.channelId;
        }
    }
    showPrimeWindow() {
        this.windowsService.showWindow({
            componentName: 'WelcomeToPrime',
            title: '',
            size: { width: 1000, height: 770 },
        });
    }
    onSocketEvent(e) {
        if (e.type !== 'streamlabs_prime_subscribe')
            return;
        this.SET_PRIME(true);
        if (this.navigationService.state.currentPage === 'Onboarding')
            return;
        const theme = this.customizationService.isDarkTheme ? 'prime-dark' : 'prime-light';
        this.customizationService.setTheme(theme);
        this.showPrimeWindow();
    }
    recentEventsUrl() {
        if (!this.isLoggedIn)
            return '';
        const host = this.hostsService.streamlabs;
        const token = this.widgetToken;
        const nightMode = this.customizationService.isDarkTheme ? 'night' : 'day';
        const isMediaShare = this.windowsService.state.RecentEvents &&
            this.windowsService.state.RecentEvents.queryParams.isMediaShare
            ? '&view=media-share'
            : '';
        return `https://${host}/dashboard/recent-events?token=${token}&mode=${nightMode}&electron${isMediaShare}`;
    }
    dashboardUrl(subPage, hidenav = false) {
        const token = this.apiToken;
        const nightMode = this.customizationService.isDarkTheme ? 'night' : 'day';
        const hideNav = hidenav ? 'true' : 'false';
        const i18nService = I18nService.instance;
        const locale = i18nService.state.locale;
        return `https://${this.hostsService.streamlabs}/slobs/dashboard?oauth_token=${token}&mode=${nightMode}&r=${subPage}&l=${locale}&hidenav=${hideNav}`;
    }
    alertboxLibraryUrl(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const uiTheme = this.customizationService.isDarkTheme ? 'night' : 'day';
            let url = `https://${this.hostsService.streamlabs}/alert-box-themes?mode=${uiTheme}&slobs`;
            if (id)
                url += `&id=${id}`;
            return yield this.magicLinkService.actions.return.getMagicSessionUrl(url);
        });
    }
    overlaysUrl(type, id, install) {
        return __awaiter(this, void 0, void 0, function* () {
            const uiTheme = this.customizationService.isDarkTheme ? 'night' : 'day';
            let url = `https://${this.hostsService.streamlabs}/library`;
            if (type && !id) {
                url += `/${type}`;
            }
            url += `?mode=${uiTheme}&slobs`;
            if (type && id) {
                url += `#/?type=${type}&id=${id}`;
            }
            if (install) {
                url += `&install=${install}`;
            }
            return yield this.magicLinkService.actions.return.getMagicSessionUrl(url);
        });
    }
    getDonationSettings() {
        const host = this.hostsService.streamlabs;
        const url = `https://${host}/api/v5/slobs/donation/settings`;
        const headers = authorizedHeaders(this.apiToken);
        const request = new Request(url, { headers });
        return jfetch(request);
    }
    showLogin() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isLoggedIn)
                yield this.logOut();
            this.onboardingService.start({ isLogin: true });
        });
    }
    clearForceLoginStatus() {
        if (!this.state.auth || !this.state.auth.apiToken)
            return;
        const host = this.hostsService.streamlabs;
        const headers = authorizedHeaders(this.apiToken);
        const url = `https://${host}/api/v5/slobs/clear-force-login-status`;
        const request = new Request(url, { headers, method: 'POST' });
        return jfetch(request);
    }
    reauthenticate(onStartup, msgConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            this.SET_IS_RELOG(true);
            if (onStartup) {
                this.LOGOUT();
            }
            else {
                yield this.logOut();
            }
            yield remote.dialog.showMessageBox(Object.assign({ title: 'Streamlabs Desktop', message: $t('Your login has expired. Please reauthenticate to continue using Streamlabs Desktop.') }, msgConfig));
            this.showLogin();
        });
    }
    login(service_1, auth_1) {
        return __awaiter(this, arguments, void 0, function* (service, auth, isOnStartup = false) {
            if (!auth)
                auth = this.state.auth;
            this.LOGIN(auth);
            this.VALIDATE_LOGIN(true);
            this.setSentryContext();
            this.userLogin.next(auth);
            const forceRelogin = yield this.updateLinkedPlatforms();
            if (forceRelogin) {
                try {
                    yield this.clearForceLoginStatus();
                    if (isOnStartup) {
                        yield this.reauthenticate(true);
                        return;
                    }
                }
                catch (e) {
                    console.error('Error forcing relog');
                }
            }
            const [validatePlatformResult] = yield Promise.all([
                service.validatePlatform(),
                this.refreshUserInfo(),
                this.sceneCollectionsService.setupNewUser(),
                this.setPrimeStatus(),
            ]);
            this.subscribeToSocketConnection();
            if (validatePlatformResult === EPlatformCallResult.TwitchTwoFactor) {
                this.logOut();
                return validatePlatformResult;
            }
            if (validatePlatformResult === EPlatformCallResult.TwitchScopeMissing) {
                if (!this.views.auth.slid) {
                    this.reauthenticate(true, {
                        type: 'warning',
                        title: 'Twitch Error',
                        message: $t($t('Streamlabs requires additional permissions from your Twitch account. Please log in with Twitch to continue.')),
                        buttons: [$t('Refresh Login')],
                    });
                }
                return validatePlatformResult;
            }
            this.userLoginFinished.next();
        });
    }
    logOut() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sceneCollectionsService.save();
            yield this.sceneCollectionsService.safeSync();
            this.navigationService.navigate('Studio');
            const session = this.state.auth.partition
                ? remote.session.fromPartition(this.state.auth.partition)
                : remote.session.defaultSession;
            session.clearStorageData({ storages: ['cookies'] });
            this.settingsService.setSettingValue('Stream', 'key', '');
            this.writeUserIdFile();
            this.unsubscribeFromSocketConnection();
            this.LOGOUT();
            this.userLogout.next();
        });
    }
    reLogin() {
        return __awaiter(this, void 0, void 0, function* () {
            const platform = this.state.auth.primaryPlatform;
            yield this.logOut();
            yield this.startAuth(platform, 'internal');
        });
    }
    startSLAuth() {
        return __awaiter(this, arguments, void 0, function* ({ signup = false, merge = false } = {}) {
            const query = `_=${Date.now()}&skip_splash=true&external=electron&slid&force_verify&origin=slobs${merge ? '&intent=merge' : ''}`;
            const url = `https://${this.hostsService.streamlabs}/slobs/${signup ? 'signup' : 'login'}?${query}`;
            this.SET_AUTH_STATE(EAuthProcessState.Loading);
            const auth = yield this.authModule.startPkceAuth(url, () => {
                this.SET_AUTH_STATE(EAuthProcessState.Idle);
            });
            if (!auth)
                return EPlatformCallResult.Error;
            this.LOGOUT();
            this.LOGIN(auth);
            yield this.setPrimeStatus();
            yield this.updateLinkedPlatforms();
            return EPlatformCallResult.Success;
        });
    }
    finishSLAuth(primaryPlatform) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.views.isPartialSLAuth) {
                console.error('Called finishSLAuth but SL Auth is not in progress');
                return;
            }
            if (!primaryPlatform) {
                this.LOGOUT();
                return;
            }
            if (!this.state.auth.platforms[primaryPlatform]) {
                console.error('Tried to finish SL Auth with platform that does not exist!');
                this.LOGOUT();
                return;
            }
            this.SET_PRIMARY_PLATFORM(primaryPlatform);
            const service = getPlatformService(primaryPlatform);
            this.SET_AUTH_STATE(EAuthProcessState.Loading);
            this.streamSettingsService.resetStreamSettings();
            const result = yield this.login(service);
            this.SET_AUTH_STATE(EAuthProcessState.Idle);
            return result;
        });
    }
    startSLMerge() {
        return __awaiter(this, void 0, void 0, function* () {
            const authUrl = `https://${this.hostsService.streamlabs}/slobs/merge/${this.apiToken}/streamlabs_account`;
            if (!this.isLoggedIn) {
                throw new Error('Account merging can only be performed while logged in');
            }
            yield this.sceneCollectionsService.save();
            yield this.sceneCollectionsService.safeSync();
            this.SET_AUTH_STATE(EAuthProcessState.Loading);
            const onWindowShow = () => this.SET_AUTH_STATE(EAuthProcessState.Idle);
            try {
                const auth = yield this.authModule.startPkceAuth(authUrl, onWindowShow, () => { }, true);
                this.SET_AUTH_STATE(EAuthProcessState.Loading);
                this.SET_IS_RELOG(false);
                this.SET_SLID(auth.slid);
                this.SET_AUTH_STATE(EAuthProcessState.Idle);
                return EPlatformCallResult.Success;
            }
            catch (e) {
                console.error('Merge Account Error: ', e);
                return EPlatformCallResult.Error;
            }
        });
    }
    startChatAuth() {
        return __awaiter(this, arguments, void 0, function* (platform = 'twitch') {
            yield this.startAuth(platform, 'external', false, true)
                .then(res => {
                this.windowsService.actions.setWindowOnTop('main');
                if (res === EPlatformCallResult.Error) {
                    alert($t('Error granting chat permissions.'));
                    return;
                }
                this.scopeAdded.next();
            })
                .catch(e => {
                this.windowsService.actions.setWindowOnTop('main');
                alert($t('Error granting chat permissions.'));
            });
        });
    }
    startAuth(platform_1, mode_1) {
        return __awaiter(this, arguments, void 0, function* (platform, mode, merge = false, scope = false) {
            const service = getPlatformService(platform);
            const authUrl = merge ? service.mergeUrl : service.authUrl;
            if (merge && !this.isLoggedIn && !this.views.isPartialSLAuth) {
                throw new Error('Account merging can only be performed while logged in');
            }
            if (platform === 'instagram') {
                const auth = {
                    widgetToken: '',
                    apiToken: '',
                    primaryPlatform: 'instagram',
                    platforms: {
                        instagram: {
                            type: 'instagram',
                            username: 'linked',
                            token: '',
                            id: 'instagram',
                        },
                    },
                    hasRelogged: true,
                };
                this.UPDATE_PLATFORM(auth.platforms[auth.primaryPlatform]);
                return EPlatformCallResult.Success;
            }
            this.SET_AUTH_STATE(EAuthProcessState.Loading);
            const onWindowShow = () => this.SET_AUTH_STATE(mode === 'internal' ? EAuthProcessState.InProgress : EAuthProcessState.Idle);
            const onWindowClose = () => this.SET_AUTH_STATE(EAuthProcessState.Idle);
            const auth = yield this.authModule.startPkceAuth(authUrl, onWindowShow, onWindowClose, merge, mode === 'external', service.authWindowOptions);
            this.SET_AUTH_STATE(EAuthProcessState.Loading);
            this.SET_IS_RELOG(false);
            let result;
            if (!merge && !scope) {
                this.streamSettingsService.resetStreamSettings();
                result = yield this.login(service, auth);
            }
            else {
                if (auth) {
                    this.UPDATE_PLATFORM(auth.platforms[auth.primaryPlatform]);
                    result = EPlatformCallResult.Success;
                }
                else {
                    result = EPlatformCallResult.Error;
                }
            }
            this.SET_AUTH_STATE(EAuthProcessState.Idle);
            return result;
        });
    }
    updatePlatformToken(platform, token) {
        this.SET_PLATFORM_TOKEN(platform, token);
    }
    updatePlatformChannelId(platform, id) {
        this.SET_CHANNEL_ID(platform, id);
    }
    setSentryContext() {
        if (!this.isLoggedIn)
            return;
        setSentryContext(this.getSentryContext());
        this.sentryContext.next(this.getSentryContext());
    }
    getSentryContext() {
        if (!this.isLoggedIn)
            return null;
        return {
            username: this.username,
            platform: this.platform.type,
        };
    }
    withLifecycle(_a) {
        return __awaiter(this, arguments, void 0, function* ({ init, destroy, context }) {
            const doInit = init.bind(context);
            const doDestroy = destroy.bind(context);
            const userLoginSubscription = this.userLogin.subscribe(() => doInit());
            const userLogoutSubscription = this.userLogout.subscribe(() => doDestroy());
            if (this.isLoggedIn) {
                yield doInit();
            }
            return {
                destroy: () => __awaiter(this, void 0, void 0, function* () {
                    userLoginSubscription.unsubscribe();
                    userLogoutSubscription.unsubscribe();
                    yield doDestroy();
                }),
            };
        });
    }
}
__decorate([
    Inject()
], UserService.prototype, "hostsService", void 0);
__decorate([
    Inject()
], UserService.prototype, "customizationService", void 0);
__decorate([
    Inject()
], UserService.prototype, "sceneCollectionsService", void 0);
__decorate([
    Inject()
], UserService.prototype, "windowsService", void 0);
__decorate([
    Inject()
], UserService.prototype, "onboardingService", void 0);
__decorate([
    Inject()
], UserService.prototype, "navigationService", void 0);
__decorate([
    Inject()
], UserService.prototype, "settingsService", void 0);
__decorate([
    Inject()
], UserService.prototype, "streamSettingsService", void 0);
__decorate([
    Inject()
], UserService.prototype, "streamingService", void 0);
__decorate([
    Inject()
], UserService.prototype, "websocketService", void 0);
__decorate([
    Inject()
], UserService.prototype, "magicLinkService", void 0);
__decorate([
    Inject()
], UserService.prototype, "appService", void 0);
__decorate([
    Inject()
], UserService.prototype, "notificationsService", void 0);
__decorate([
    Inject()
], UserService.prototype, "jsonrpcService", void 0);
__decorate([
    Inject()
], UserService.prototype, "usageStatisticsService", void 0);
__decorate([
    Inject('TikTokService')
], UserService.prototype, "tiktokService", void 0);
__decorate([
    mutation()
], UserService.prototype, "LOGIN", null);
__decorate([
    mutation()
], UserService.prototype, "UPDATE_PLATFORM", null);
__decorate([
    mutation()
], UserService.prototype, "UNLINK_PLATFORM", null);
__decorate([
    mutation()
], UserService.prototype, "LOGOUT", null);
__decorate([
    mutation()
], UserService.prototype, "SET_PRIME", null);
__decorate([
    mutation()
], UserService.prototype, "SET_EXPIRES", null);
__decorate([
    mutation()
], UserService.prototype, "SET_USER", null);
__decorate([
    mutation()
], UserService.prototype, "SET_PLATFORM_TOKEN", null);
__decorate([
    mutation()
], UserService.prototype, "SET_CHANNEL_ID", null);
__decorate([
    mutation()
], UserService.prototype, "SET_USERNAME", null);
__decorate([
    mutation()
], UserService.prototype, "VALIDATE_LOGIN", null);
__decorate([
    mutation()
], UserService.prototype, "SET_AUTH_STATE", null);
__decorate([
    mutation()
], UserService.prototype, "SET_IS_RELOG", null);
__decorate([
    mutation()
], UserService.prototype, "SET_PRIMARY_PLATFORM", null);
__decorate([
    mutation()
], UserService.prototype, "SET_SLID", null);
__decorate([
    mutation()
], UserService.prototype, "UNLINK_SLID", null);
__decorate([
    mutation()
], UserService.prototype, "SET_WIDGET_TOKEN", null);
__decorate([
    mutation()
], UserService.prototype, "MIGRATE_AUTH", null);
__decorate([
    lazyModule(AuthModule)
], UserService.prototype, "authModule", void 0);
__decorate([
    RunInLoadingMode()
], UserService.prototype, "login", null);
__decorate([
    RunInLoadingMode()
], UserService.prototype, "logOut", null);
__decorate([
    debounce(200)
], UserService.prototype, "startChatAuth", null);
//# sourceMappingURL=index.js.map