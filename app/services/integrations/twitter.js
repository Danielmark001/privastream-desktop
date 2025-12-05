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
import URI from 'urijs';
import { PersistentStatefulService } from 'services/core/persistent-stateful-service';
import { Inject } from 'services/core/injector';
import { authorizedHeaders, jfetch } from 'util/requests';
import { mutation, ViewHandler } from 'services/core/stateful-service';
import { UserService } from 'services/user';
import uuid from 'uuid/v4';
import * as remote from '@electron/remote';
export class TwitterService extends PersistentStatefulService {
    constructor() {
        super(...arguments);
        this.authWindowOpen = false;
    }
    init() {
        super.init();
        this.userService.userLogout.subscribe(() => this.RESET_TWITTER_STATUS());
    }
    get views() {
        return new TwitterView(this.state);
    }
    SET_TWITTER_STATUS(status) {
        this.state.linked = status.linked;
        this.state.prime = status.prime;
        this.state.creatorSiteUrl = status.cs_url;
        this.state.screenName = status.screen_name;
    }
    SET_TWEET_PREFERENCE(preference) {
        this.state.tweetWhenGoingLive = preference;
    }
    SET_STREAMLABS_URL(value) {
        this.state.creatorSiteOnboardingComplete = value;
    }
    RESET_TWITTER_STATUS() {
        this.state.linked = false;
        this.state.prime = false;
        this.state.creatorSiteOnboardingComplete = false;
        this.state.creatorSiteUrl = '';
        this.state.screenName = '';
        this.state.tweetWhenGoingLive = false;
    }
    setTweetPreference(preference) {
        this.SET_TWEET_PREFERENCE(preference);
    }
    linkTwitterUrl() {
        const token = this.userService.apiToken;
        const locale = this.i18nService.state.locale;
        return `https://${this.hostsService.streamlabs}/slobs/twitter/link?oauth_token=${token}&l=${locale}`;
    }
    getTwitterStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.fetchTwitterStatus();
            if (response)
                this.SET_TWITTER_STATUS(response);
        });
    }
    unlinkTwitter() {
        return __awaiter(this, void 0, void 0, function* () {
            this.RESET_TWITTER_STATUS();
            const host = this.hostsService.streamlabs;
            const url = `https://${host}/api/v5/slobs/twitter/unlink`;
            const headers = authorizedHeaders(this.userService.apiToken);
            const request = new Request(url, { headers });
            return jfetch(request).catch(() => {
                console.warn('Error unlinking Twitter');
            });
        });
    }
    setStreamlabsUrl(value) {
        this.SET_STREAMLABS_URL(value);
    }
    fetchTwitterStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            const host = this.hostsService.streamlabs;
            const url = `https://${host}/api/v5/slobs/twitter/status`;
            const headers = authorizedHeaders(this.userService.apiToken);
            const request = new Request(url, { headers });
            return jfetch(request).catch(() => {
                console.warn('Error fetching Twitter status');
            });
        });
    }
    openLinkTwitterDialog() {
        if (this.authWindowOpen)
            return;
        this.authWindowOpen = true;
        const partition = `persist:${uuid()}`;
        const twitterWindow = new remote.BrowserWindow({
            width: 600,
            height: 800,
            alwaysOnTop: false,
            show: false,
            webPreferences: {
                partition,
                nodeIntegration: false,
                sandbox: true,
            },
        });
        twitterWindow.once('ready-to-show', () => {
            twitterWindow.show();
        });
        twitterWindow.once('close', () => {
            this.authWindowOpen = false;
        });
        twitterWindow.webContents.on('did-navigate', (e, url) => __awaiter(this, void 0, void 0, function* () {
            const parsed = this.parseTwitterResultFromUrl(url);
            if (parsed) {
                twitterWindow.close();
                this.getTwitterStatus();
            }
        }));
        twitterWindow.setMenu(null);
        twitterWindow.loadURL(this.linkTwitterUrl());
    }
    parseTwitterResultFromUrl(url) {
        const query = URI.parseQuery(URI.parse(url).query);
        if (query.twitter) {
            return { success: !!query.success };
        }
        return false;
    }
}
TwitterService.defaultState = {
    linked: false,
    prime: false,
    creatorSiteOnboardingComplete: false,
    creatorSiteUrl: '',
    screenName: '',
    tweetWhenGoingLive: false,
};
__decorate([
    Inject()
], TwitterService.prototype, "hostsService", void 0);
__decorate([
    Inject()
], TwitterService.prototype, "userService", void 0);
__decorate([
    Inject()
], TwitterService.prototype, "i18nService", void 0);
__decorate([
    mutation()
], TwitterService.prototype, "SET_TWITTER_STATUS", null);
__decorate([
    mutation()
], TwitterService.prototype, "SET_TWEET_PREFERENCE", null);
__decorate([
    mutation()
], TwitterService.prototype, "SET_STREAMLABS_URL", null);
__decorate([
    mutation()
], TwitterService.prototype, "RESET_TWITTER_STATUS", null);
export class TwitterView extends ViewHandler {
    get userView() {
        return this.getServiceViews(UserService);
    }
    get url() {
        let url = `${this.state.creatorSiteUrl}/home`;
        if (!this.state.creatorSiteOnboardingComplete) {
            if (this.userView.platform.type === 'twitch') {
                url = `https://twitch.tv/${this.userView.platform.username}`;
            }
            if (this.userView.platform.type === 'trovo') {
                url = `https://trovo.live/${this.userView.platform.username}`;
            }
        }
        return url;
    }
}
//# sourceMappingURL=twitter.js.map