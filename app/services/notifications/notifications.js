var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Inject } from '../core/injector';
import { mutation, ViewHandler } from '../core/stateful-service';
import { PersistentStatefulService } from 'services/core/persistent-stateful-service';
import { Subject } from 'rxjs';
import { ENotificationType, ENotificationSubType, } from './notifications-api';
import { $t } from 'services/i18n';
class NotificationsViews extends ViewHandler {
    get lastNotification() {
        return this.state.notifications ? this.state.notifications[0] : null;
    }
    getNotification(id) {
        return this.state.notifications.find(notify => notify.id === id);
    }
    getAll(type) {
        if (!type)
            return this.state.notifications;
        return this.state.notifications.filter(notify => {
            return notify.type === type;
        });
    }
    getUnread(type) {
        return this.getAll(type).filter(notify => notify.unread);
    }
    getRead(type) {
        return this.getAll(type).filter(notify => !notify.unread);
    }
    getSettings() {
        return this.state.settings;
    }
    get settings() {
        return this.state.settings;
    }
    get metadata() {
        return {
            enabled: {
                type: 'checkbox',
                label: $t('Enable notifications'),
                children: {
                    playSound: {
                        type: 'checkbox',
                        label: $t('Enable sound'),
                        displayed: this.state.settings.enabled,
                    },
                },
            },
        };
    }
}
export class NotificationsService extends PersistentStatefulService {
    constructor() {
        super(...arguments);
        this.notificationPushed = new Subject();
        this.notificationRead = new Subject();
        this.nextId = 1;
    }
    init() {
        super.init();
    }
    get views() {
        return new NotificationsViews(this.state);
    }
    static filter(state) {
        return Object.assign(Object.assign({}, state), { notifications: [] });
    }
    push(notifyInfo) {
        if (notifyInfo.singleton) {
            const existingNotif = this.views.getAll().find(notif => notif.message === notifyInfo.message);
            if (existingNotif)
                return;
        }
        const notify = Object.assign({ id: this.nextId++, unread: true, date: Date.now(), type: ENotificationType.INFO, playSound: true, lifeTime: 8000, showTime: false, subType: ENotificationSubType.DEFAULT }, notifyInfo);
        this.PUSH(notify);
        this.notificationPushed.next(notify);
        return notify;
    }
    applyAction(notificationId) {
        const notify = this.views.getNotification(notificationId);
        if (!notify || !notify.action)
            return;
        this.internalApiService.executeServiceRequest(notify.action);
    }
    markAsRead(id) {
        const notify = this.views.getNotification(id);
        if (!notify)
            return;
        this.MARK_AS_READ(id);
        this.notificationRead.next([id]);
    }
    markAllAsRead() {
        const unreadNotifies = this.views.getUnread();
        if (!unreadNotifies.length)
            return;
        this.MARK_ALL_AS_READ();
        this.notificationRead.next(unreadNotifies.map(notify => notify.id));
    }
    setSettings(patch) {
        this.SET_SETTINGS(patch);
    }
    restoreDefaultSettings() {
        this.setSettings(NotificationsService.defaultState.settings);
    }
    showNotifications() {
        this.windowsService.showWindow({
            componentName: 'NotificationsAndNews',
            title: $t('Notifications & News'),
            size: {
                width: 600,
                height: 600,
            },
        });
    }
    SET_SETTINGS(patch) {
        this.state.settings = Object.assign(Object.assign({}, this.state.settings), patch);
    }
    PUSH(notify) {
        this.state.notifications.unshift(notify);
    }
    CLEAR() {
        this.state.notifications = [];
    }
    MARK_ALL_AS_READ() {
        this.state.notifications.forEach(notify => (notify.unread = false));
    }
    MARK_AS_READ(id) {
        this.state.notifications.find(notify => notify.id === id).unread = false;
    }
}
NotificationsService.defaultState = {
    notifications: [],
    settings: {
        enabled: true,
        playSound: false,
    },
};
__decorate([
    Inject()
], NotificationsService.prototype, "windowsService", void 0);
__decorate([
    Inject()
], NotificationsService.prototype, "internalApiService", void 0);
__decorate([
    mutation()
], NotificationsService.prototype, "SET_SETTINGS", null);
__decorate([
    mutation()
], NotificationsService.prototype, "PUSH", null);
__decorate([
    mutation()
], NotificationsService.prototype, "CLEAR", null);
__decorate([
    mutation()
], NotificationsService.prototype, "MARK_ALL_AS_READ", null);
__decorate([
    mutation()
], NotificationsService.prototype, "MARK_AS_READ", null);
//# sourceMappingURL=notifications.js.map