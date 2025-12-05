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
import { InitAfter } from 'services/core/index';
import { Inject, Service } from 'services';
import { authorizedHeaders, jfetch } from '../util/requests';
import path from 'path';
import fs from 'fs';
import { $t } from 'services/i18n';
import { ENotificationType, ENotificationSubType, } from 'services/notifications';
import { RealmObject } from './realm';
class AnnouncementInfo extends RealmObject {
}
AnnouncementInfo.schema = {
    name: 'AnnouncementInfo',
    embedded: true,
    properties: {
        id: 'int',
        header: 'string',
        subHeader: 'string',
        linkTitle: 'string',
        thumbnail: 'string',
        link: 'string',
        linkTarget: 'string',
        type: { type: 'int', default: 0 },
        params: { type: 'dictionary', objectType: 'string' },
        closeOnLink: { type: 'bool', default: false },
    },
};
AnnouncementInfo.register();
class AnnouncementsServiceEphemeralState extends RealmObject {
}
AnnouncementsServiceEphemeralState.schema = {
    name: 'AnnouncementsServiceEphemeralState',
    properties: {
        news: {
            type: 'list',
            objectType: 'AnnouncementInfo',
            default: [],
        },
        productUpdates: {
            type: 'list',
            objectType: 'AnnouncementInfo',
            default: [],
        },
        banner: 'AnnouncementInfo',
    },
};
AnnouncementsServiceEphemeralState.register();
class AnnouncementsServicePersistedState extends RealmObject {
    onCreated() {
        const data = localStorage.getItem('PersistentStatefulService-AnnouncementsService');
        if (data) {
            const parsed = JSON.parse(data);
            this.db.write(() => {
                Object.assign(this, parsed);
            });
        }
    }
}
AnnouncementsServicePersistedState.schema = {
    name: 'AnnouncementsServicePersistedState',
    properties: {
        lastReadId: { type: 'int', default: 145 },
        lastReadProductUpdate: { type: 'int', default: 0 },
    },
};
AnnouncementsServicePersistedState.register({ persist: true });
let AnnouncementsService = class AnnouncementsService extends Service {
    constructor() {
        super(...arguments);
        this.state = AnnouncementsServicePersistedState.inject();
        this.currentAnnouncements = AnnouncementsServiceEphemeralState.inject();
    }
    init() {
        super.init();
        this.userService.userLogin.subscribe(() => {
            this.fetchLatestNews();
            this.getBanner();
        });
        this.appService.loadingChanged.subscribe(() => {
            if (this.appService.state.loading || !this.userService.isLoggedIn)
                return;
            this.getProductUpdates();
        });
    }
    get newsExist() {
        return this.currentAnnouncements.news.length > 0;
    }
    getNews() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.newsExist)
                return;
            this.setNews(yield this.fetchNews());
        });
    }
    getBanner() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setBanner(yield this.fetchBanner());
        });
    }
    getProductUpdates() {
        return __awaiter(this, void 0, void 0, function* () {
            const resp = yield this.fetchProductUpdates();
            if (!resp || !resp.lastUpdatedAt || resp.lastUpdatedAt <= this.state.lastReadProductUpdate) {
                return;
            }
            this.setLastReadProductUpdate(resp.lastUpdatedAt);
            this.setProductUpdates(resp.updates);
            this.openProductUpdates();
        });
    }
    seenNews() {
        if (!this.newsExist)
            return;
        this.setLatestRead(this.currentAnnouncements.news[0].id);
    }
    get installDateProxyFilePath() {
        return path.join(this.appService.appDataDirectory, 'app.log');
    }
    fileExists(path) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => {
                fs.exists(path, exists => {
                    resolve(exists);
                });
            });
        });
    }
    getInstallDateTimestamp() {
        return __awaiter(this, void 0, void 0, function* () {
            const exists = yield this.fileExists(this.installDateProxyFilePath);
            if (!exists) {
                return Promise.resolve(Date.now());
            }
            return new Promise(resolve => {
                fs.stat(this.installDateProxyFilePath, (err, stats) => {
                    if (err) {
                        resolve(Date.now());
                    }
                    resolve(stats.birthtimeMs);
                });
            });
        });
    }
    recentlyInstalled() {
        return __awaiter(this, void 0, void 0, function* () {
            const installationTimestamp = yield this.getInstallDateTimestamp();
            return Date.now() - installationTimestamp < 1000 * 60 * 60 * 24 * 7;
        });
    }
    fetchLatestNews() {
        return __awaiter(this, void 0, void 0, function* () {
            const recentlyInstalled = yield this.recentlyInstalled();
            if (recentlyInstalled || !this.customizationService.state.enableAnnouncements) {
                return;
            }
            const req = this.formRequest(`api/v5/slobs/announcements/status?clientId=${this.userService.getLocalUserId()}&lastAnnouncementId=${this.state.lastReadId}`);
            const resp = yield jfetch(req);
            if (resp.newUnreadAnnouncements) {
                this.notificationsService.push({
                    message: resp.newUnreadAnnouncement.header,
                    type: ENotificationType.SUCCESS,
                    subType: ENotificationSubType.NEWS,
                    playSound: false,
                    lifeTime: -1,
                    action: this.jsonrpcService.createRequest(Service.getResourceId(this), 'openNewsWindow'),
                });
            }
        });
    }
    fetchNews() {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = `api/v5/slobs/announcements/get?clientId=${this.userService.getLocalUserId()}&locale=${this.i18nService.state.locale}`;
            const req = this.formRequest(endpoint);
            try {
                const newState = yield jfetch(req);
                console.log(newState);
                newState.forEach(item => {
                    const queryString = item.link.split('?')[1];
                    if (item.linkTarget === 'slobs' && queryString) {
                        item.link = item.link.split('?')[0];
                        item.params = {};
                        queryString.split(',').forEach((query) => {
                            const [key, value] = query.split('=');
                            item.params[key] = value;
                        });
                    }
                });
                return newState[0].id ? newState : this.currentAnnouncements.news;
            }
            catch (e) {
                return this.currentAnnouncements.news;
            }
        });
    }
    fetchBanner() {
        return __awaiter(this, void 0, void 0, function* () {
            const recentlyInstalled = yield this.recentlyInstalled();
            if (recentlyInstalled || !this.customizationService.state.enableAnnouncements) {
                return null;
            }
            const endpoint = `api/v5/slobs/announcement/get?clientId=${this.userService.getLocalUserId()}&locale=${this.i18nService.state.locale}`;
            const req = this.formRequest(endpoint);
            try {
                const newState = yield jfetch(req);
                return newState.id ? newState : null;
            }
            catch (e) {
                return null;
            }
        });
    }
    fetchProductUpdates() {
        return __awaiter(this, void 0, void 0, function* () {
            const recentlyInstalled = yield this.recentlyInstalled();
            if (recentlyInstalled || !this.customizationService.state.enableAnnouncements) {
                return null;
            }
            const endpoint = `api/v5/slobs/product-updates/get?clientId=${this.userService.getLocalUserId()}&locale=${this.i18nService.state.locale}`;
            const req = this.formRequest(endpoint);
            try {
                const resp = yield jfetch(req);
                return resp;
            }
            catch (e) {
                return { lastUpdatedAt: null };
            }
        });
    }
    closeNews(newsId) {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = 'api/v5/slobs/announcement/close';
            const req = this.formRequest(endpoint, {
                method: 'POST',
                headers: new Headers({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    clientId: this.userService.getLocalUserId(),
                    announcementId: newsId,
                    clickType: 'action',
                }),
            });
            return jfetch(req);
        });
    }
    closeBanner(clickType) {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = 'api/v5/slobs/announcement/close';
            const req = this.formRequest(endpoint, {
                method: 'POST',
                headers: new Headers({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    clientId: this.userService.getLocalUserId(),
                    announcementId: this.currentAnnouncements.banner.id,
                    clickType,
                }),
            });
            try {
                yield jfetch(req);
            }
            finally {
                this.setBanner(null);
            }
        });
    }
    formRequest(endpoint, options = {}) {
        const host = this.hostsService.streamlabs;
        const headers = authorizedHeaders(this.userService.apiToken, options.headers);
        const url = `https://${host}/${endpoint}`;
        return new Request(url, Object.assign(Object.assign({}, options), { headers }));
    }
    openNewsWindow() {
        this.windowsService.showWindow({
            componentName: 'NotificationsAndNews',
            title: $t('Notifications & News'),
            size: {
                width: 500,
                height: 600,
            },
        });
    }
    openProductUpdates() {
        this.windowsService.showWindow({
            componentName: 'MarketingModal',
            title: $t("What's New"),
            size: {
                width: 650,
                height: 700,
            },
        });
    }
    setNews(news) {
        this.currentAnnouncements.db.write(() => {
            this.currentAnnouncements.news = news;
        });
    }
    clearNews() {
        this.currentAnnouncements.db.write(() => {
            this.currentAnnouncements.news = [];
            this.currentAnnouncements.banner = null;
        });
    }
    setProductUpdates(updates) {
        this.currentAnnouncements.db.write(() => {
            this.currentAnnouncements.productUpdates = updates;
        });
    }
    setBanner(banner) {
        this.currentAnnouncements.db.write(() => {
            this.currentAnnouncements.banner = banner;
        });
    }
    setLastReadProductUpdate(timestamp) {
        this.state.db.write(() => {
            this.state.lastReadProductUpdate = timestamp;
        });
    }
    setLatestRead(id) {
        this.state.db.write(() => {
            this.state.lastReadId = id;
        });
    }
};
__decorate([
    Inject()
], AnnouncementsService.prototype, "hostsService", void 0);
__decorate([
    Inject()
], AnnouncementsService.prototype, "userService", void 0);
__decorate([
    Inject()
], AnnouncementsService.prototype, "appService", void 0);
__decorate([
    Inject()
], AnnouncementsService.prototype, "i18nService", void 0);
__decorate([
    Inject()
], AnnouncementsService.prototype, "customizationService", void 0);
__decorate([
    Inject()
], AnnouncementsService.prototype, "notificationsService", void 0);
__decorate([
    Inject()
], AnnouncementsService.prototype, "jsonrpcService", void 0);
__decorate([
    Inject()
], AnnouncementsService.prototype, "windowsService", void 0);
AnnouncementsService = __decorate([
    InitAfter('UserService')
], AnnouncementsService);
export { AnnouncementsService };
//# sourceMappingURL=announcements.js.map