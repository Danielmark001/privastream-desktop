var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Service } from 'services/core/service';
import { ipcRenderer } from 'electron';
import { Inject } from '../core';
import Utils from '../utils';
export class MetricsService extends Service {
    constructor() {
        super(...arguments);
        this.metrics = {
            appStartTime: 0,
            mainWindowShowTime: 0,
            sceneCollectionLoadingTime: 0,
        };
    }
    init() {
        if (!Utils.isDevMode())
            return;
        const appStarTime = ipcRenderer.sendSync('getAppStartTime');
        this.recordMetric('appStartTime', appStarTime);
    }
    getMetrics() {
        return this.metrics;
    }
    recordMetric(metricName, time = Date.now()) {
        this.metrics[metricName] = time;
    }
}
__decorate([
    Inject()
], MetricsService.prototype, "performanceService", void 0);
//# sourceMappingURL=metrics.js.map