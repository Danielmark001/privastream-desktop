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
import { Service } from 'services/core/service';
import { ENotificationType } from 'services/notifications';
import { Inject } from 'services/core/injector';
import { InitAfter } from './core';
import { jfetch } from 'util/requests';
import * as remote from '@electron/remote';
const S3_BUCKET = 'streamlabs-obs';
const S3_KEY = 'outage-notification.json';
const POLLING_INTERVAL = 5 * 60 * 1000;
let OutageNotificationsService = class OutageNotificationsService extends Service {
    constructor() {
        super(...arguments);
        this.currentMessageId = null;
        this.currentNotificationId = null;
    }
    init() {
        this.userService.userLogin.subscribe(() => this.checkForNotification());
        setInterval(() => this.checkForNotification(), POLLING_INTERVAL);
    }
    pushNotification(message, url) {
        let action;
        action = this.jsonrpcService.createRequest(Service.getResourceId(this.notificationsService), 'showNotifications');
        if (url) {
            action = this.jsonrpcService.createRequest(Service.getResourceId(this), 'openBrowserWindow', url);
        }
        return this.notificationsService.push({
            action,
            message,
            type: ENotificationType.WARNING,
            lifeTime: -1,
        });
    }
    openBrowserWindow(url) {
        remote.shell.openExternal(url);
    }
    checkForNotification() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.userService.isLoggedIn)
                return;
            const msg = yield this.fetchMessageJson();
            if (!this.userService.isLoggedIn)
                return;
            if (!msg ||
                msg.disabled ||
                (msg.platforms && !msg.platforms.includes(this.userService.platform.type))) {
                this.clearNotification();
                return;
            }
            if (msg.id === 'slobs-out-of-date-0.12')
                return;
            if (this.currentMessageId === msg.id)
                return;
            const notification = this.pushNotification(msg.message, msg.url);
            this.currentMessageId = msg.id;
            this.currentNotificationId = notification.id;
        });
    }
    clearNotification() {
        if (this.currentMessageId)
            this.currentMessageId = null;
        if (this.currentNotificationId) {
            this.notificationsService.markAsRead(this.currentNotificationId);
            this.currentNotificationId = null;
        }
    }
    fetchMessageJson() {
        return __awaiter(this, void 0, void 0, function* () {
            const req = new Request(this.messageUrl);
            const headers = new Headers();
            headers.append('Pragma', 'no-cache');
            headers.append('Cache-Control', 'no-cache');
            try {
                return yield jfetch(req, { headers });
            }
            catch (e) {
                return;
            }
        });
    }
    get messageUrl() {
        return `https://s3-us-west-2.amazonaws.com/${S3_BUCKET}/${S3_KEY}`;
    }
};
__decorate([
    Inject()
], OutageNotificationsService.prototype, "notificationsService", void 0);
__decorate([
    Inject()
], OutageNotificationsService.prototype, "jsonrpcService", void 0);
__decorate([
    Inject()
], OutageNotificationsService.prototype, "userService", void 0);
OutageNotificationsService = __decorate([
    InitAfter('UserService')
], OutageNotificationsService);
export { OutageNotificationsService };
//# sourceMappingURL=outage-notifications.js.map