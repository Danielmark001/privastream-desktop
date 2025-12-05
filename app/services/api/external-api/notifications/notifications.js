var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Inject } from 'services/core/injector';
import { Fallback, Singleton } from 'services/api/external-api';
var ENotificationType;
(function (ENotificationType) {
    ENotificationType["INFO"] = "INFO";
    ENotificationType["WARNING"] = "WARNING";
    ENotificationType["SUCCESS"] = "SUCCESS";
})(ENotificationType || (ENotificationType = {}));
var ENotificationSubType;
(function (ENotificationSubType) {
    ENotificationSubType["DEFAULT"] = "DEFAULT";
    ENotificationSubType["DISCONNECTED"] = "DISCONNECTED";
    ENotificationSubType["DROPPED"] = "DROPPED";
    ENotificationSubType["LAGGED"] = "LAGGED";
    ENotificationSubType["SKIPPED"] = "SKIPPED";
    ENotificationSubType["NEWS"] = "NEWS";
    ENotificationSubType["CPU"] = "CPU";
})(ENotificationSubType || (ENotificationSubType = {}));
let NotificationsService = class NotificationsService {
    push(notifyInfo) {
        return this.notificationsService.push(notifyInfo);
    }
    getNotification(id) {
        return this.notificationsService.views.getNotification(id);
    }
    applyAction(notificationId) {
        return this.notificationsService.applyAction(notificationId);
    }
    getAll(type) {
        return this.notificationsService.views.getAll(type);
    }
    getUnread(type) {
        return this.notificationsService.views.getUnread(type);
    }
    getRead(type) {
        return this.notificationsService.views.getRead(type);
    }
    markAsRead(id) {
        return this.notificationsService.markAsRead(id);
    }
    markAllAsRead() {
        return this.notificationsService.markAllAsRead();
    }
    getSettings() {
        return this.notificationsService.views.getSettings();
    }
    setSettings(patch) {
        return this.notificationsService.setSettings(patch);
    }
    restoreDefaultSettings() {
        return this.notificationsService.restoreDefaultSettings();
    }
    showNotifications() {
        return this.notificationsService.showNotifications();
    }
};
__decorate([
    Fallback(),
    Inject()
], NotificationsService.prototype, "notificationsService", void 0);
NotificationsService = __decorate([
    Singleton()
], NotificationsService);
export { NotificationsService };
//# sourceMappingURL=notifications.js.map