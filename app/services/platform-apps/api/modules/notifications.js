var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module, apiMethod, apiEvent, EApiPermissions } from './module';
import { Inject } from 'services/core/injector';
import { Subject } from 'rxjs';
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
export class NotificationsModule extends Module {
    constructor() {
        super();
        this.moduleName = 'Notifications';
        this.permissions = [EApiPermissions.Notifications];
        this.notificationRead = new Subject();
        this.notificationsService.notificationRead.subscribe(ids => {
            this.notificationRead.next(ids);
        });
    }
    push(ctx, notification) {
        return this.notificationsService.push(notification);
    }
    markAsRead(ctx, id) {
        return this.notificationsService.markAsRead(id);
    }
}
__decorate([
    Inject()
], NotificationsModule.prototype, "notificationsService", void 0);
__decorate([
    apiEvent()
], NotificationsModule.prototype, "notificationRead", void 0);
__decorate([
    apiMethod()
], NotificationsModule.prototype, "push", null);
__decorate([
    apiMethod()
], NotificationsModule.prototype, "markAsRead", null);
//# sourceMappingURL=notifications.js.map