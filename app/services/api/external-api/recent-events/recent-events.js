var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Inject } from 'services/core/injector';
import { Fallback, Singleton } from 'services/api/external-api';
var ESafeModeStatus;
(function (ESafeModeStatus) {
    ESafeModeStatus["Disabled"] = "disabled";
    ESafeModeStatus["Enabled"] = "enabled";
})(ESafeModeStatus || (ESafeModeStatus = {}));
let RecentEventsService = class RecentEventsService {
    get safeModeStatusChanged() {
        return this.recentEventsService.safeModeStatusChanged;
    }
    getModel() {
        const state = this.recentEventsService.state;
        return {
            isSafeModeEnabled: state.safeMode.enabled,
        };
    }
    enableSafeMode() {
        this.recentEventsService.activateSafeMode();
    }
    disableSafeMode() {
        this.recentEventsService.disableSafeMode();
    }
};
__decorate([
    Fallback(),
    Inject()
], RecentEventsService.prototype, "recentEventsService", void 0);
RecentEventsService = __decorate([
    Singleton()
], RecentEventsService);
export { RecentEventsService };
//# sourceMappingURL=recent-events.js.map