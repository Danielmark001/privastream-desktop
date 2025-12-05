var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { PropertiesManager } from './properties-manager';
import { Inject } from 'services/core/injector';
export class SmartBrowserSourceManager extends PropertiesManager {
    init() {
        this.socketSub = this.websocketService.socketEvent.subscribe(e => {
            if (['visionEvent', 'userStateUpdated'].includes(e.type)) {
                this.obsSource.sendMessage({ message: JSON.stringify(e) });
            }
        });
        this.visionService.ensureRunning();
    }
    destroy() {
        var _a;
        (_a = this.socketSub) === null || _a === void 0 ? void 0 : _a.unsubscribe();
    }
}
__decorate([
    Inject()
], SmartBrowserSourceManager.prototype, "websocketService", void 0);
__decorate([
    Inject()
], SmartBrowserSourceManager.prototype, "visionService", void 0);
//# sourceMappingURL=smart-browser-source-manager.js.map