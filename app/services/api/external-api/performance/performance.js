var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Singleton, Fallback } from 'services/api/external-api';
import { Inject } from 'services/core/injector';
let PerformanceService = class PerformanceService {
    getModel() {
        return {
            CPU: this.performanceService.state.CPU,
            bandwidth: this.performanceService.state.streamingBandwidth,
            frameRate: this.performanceService.state.frameRate,
            numberDroppedFrames: this.performanceService.state.numberDroppedFrames,
            percentageDroppedFrames: this.performanceService.state.percentageDroppedFrames,
        };
    }
};
__decorate([
    Fallback(),
    Inject()
], PerformanceService.prototype, "performanceService", void 0);
PerformanceService = __decorate([
    Singleton()
], PerformanceService);
export { PerformanceService };
//# sourceMappingURL=performance.js.map