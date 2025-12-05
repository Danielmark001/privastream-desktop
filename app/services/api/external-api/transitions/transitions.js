var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Inject } from 'services/core/injector';
import { Fallback, Singleton } from 'services/api/external-api';
let TransitionsService = class TransitionsService {
    get studioModeChanged() {
        return this.transitionsService.studioModeChanged;
    }
    getModel() {
        return {
            studioMode: this.transitionsService.state.studioMode,
        };
    }
    enableStudioMode() {
        this.transitionsService.enableStudioMode();
    }
    disableStudioMode() {
        this.transitionsService.disableStudioMode();
    }
    executeStudioModeTransition() {
        this.transitionsService.executeStudioModeTransition();
    }
};
__decorate([
    Fallback(),
    Inject()
], TransitionsService.prototype, "transitionsService", void 0);
TransitionsService = __decorate([
    Singleton()
], TransitionsService);
export { TransitionsService };
//# sourceMappingURL=transitions.js.map