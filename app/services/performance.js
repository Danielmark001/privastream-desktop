var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import Vue from 'vue';
import { Subject } from 'rxjs';
import electron from 'electron';
import * as obs from '../../obs-api';
import { Service, Inject, ViewHandler, StatefulService, mutation } from 'services';
import { throttle } from 'lodash-decorators';
import { ENotificationType, ENotificationSubType, } from 'services/notifications';
import { $t } from 'services/i18n';
import { EStreamingState } from 'services/streaming';
export var EStreamQuality;
(function (EStreamQuality) {
    EStreamQuality["GOOD"] = "GOOD";
    EStreamQuality["FAIR"] = "FAIR";
    EStreamQuality["POOR"] = "POOR";
})(EStreamQuality || (EStreamQuality = {}));
const STATS_UPDATE_INTERVAL = 2 * 1000;
const NOTIFICATION_THROTTLE_INTERVAL = 2 * 60 * 1000;
const SAMPLING_DURATION = 2 * 60 * 1000;
const NUMBER_OF_SAMPLES = Math.round(SAMPLING_DURATION / STATS_UPDATE_INTERVAL);
const CPU_NOTIFICATION_THROTTLE_INTERVAL = 10 * 60 * 1000;
class PerformanceServiceViews extends ViewHandler {
    get cpuPercent() {
        return this.state.CPU.toFixed(1);
    }
    get frameRate() {
        return this.state.frameRate.toFixed(2);
    }
    get droppedFrames() {
        return this.state.numberDroppedFrames;
    }
    get percentDropped() {
        return (this.state.percentageDroppedFrames || 0).toFixed(1);
    }
    get bandwidth() {
        return this.state.streamingBandwidth.toFixed(0);
    }
    get streamQuality() {
        if (this.state.percentageDroppedFrames > 50 ||
            this.state.percentageLaggedFrames > 50 ||
            this.state.percentageSkippedFrames > 50) {
            return EStreamQuality.POOR;
        }
        if (this.state.percentageDroppedFrames > 30 ||
            this.state.percentageLaggedFrames > 30 ||
            this.state.percentageSkippedFrames > 30) {
            return EStreamQuality.FAIR;
        }
        return EStreamQuality.GOOD;
    }
}
export class PerformanceService extends StatefulService {
    constructor() {
        super(...arguments);
        this.historicalDroppedFrames = [];
        this.historicalSkippedFrames = [];
        this.historicalLaggedFrames = [];
        this.historicalCPU = [];
        this.shutdown = false;
        this.statsRequestInProgress = false;
        this.streamStartSkippedFrames = 0;
        this.streamStartLaggedFrames = 0;
        this.streamStartRenderedFrames = 0;
        this.streamStartEncodedFrames = 0;
        this.statisticsUpdated = new Subject();
    }
    SET_PERFORMANCE_STATS(stats) {
        Object.keys(stats).forEach((stat) => {
            Vue.set(this.state, stat, stats[stat]);
        });
    }
    init() {
        this.streamingService.streamingStatusChange.subscribe((state) => {
            if (state === EStreamingState.Live)
                this.startStreamQualityMonitoring();
            if (state === EStreamingState.Ending)
                this.stopStreamQualityMonitoring();
        });
    }
    get views() {
        return new PerformanceServiceViews(this.state);
    }
    startMonitoringPerformance() {
        const statsInterval = () => {
            if (this.shutdown)
                return;
            if (!this.statsRequestInProgress) {
                this.statsRequestInProgress = true;
                electron.ipcRenderer.send('requestPerformanceStats');
            }
            setTimeout(statsInterval, STATS_UPDATE_INTERVAL);
        };
        statsInterval();
        electron.ipcRenderer.on('performanceStatsResponse', (e, am) => {
            const stats = obs.NodeObs.OBS_API_getPerformanceStatistics();
            stats.CPU += am
                .map(proc => {
                return proc.cpu.percentCPUUsage;
            })
                .reduce((sum, usage) => sum + usage);
            this.SET_PERFORMANCE_STATS(stats);
            this.monitorAndUpdateStats();
            this.statisticsUpdated.next(this.state);
            this.statsRequestInProgress = false;
        });
    }
    startStreamQualityMonitoring() {
        this.streamStartSkippedFrames = this.videoSettingsService.contexts.horizontal.skippedFrames;
        this.streamStartLaggedFrames = obs.Global.laggedFrames;
        this.streamStartRenderedFrames = obs.Global.totalFrames;
        this.streamStartEncodedFrames = this.videoSettingsService.contexts.horizontal.encodedFrames;
        this.streamStartTime = new Date();
        this.historicalCPU = [];
    }
    stopStreamQualityMonitoring() {
        const streamLagged = ((obs.Global.laggedFrames - this.streamStartLaggedFrames) /
            (obs.Global.totalFrames - this.streamStartRenderedFrames)) *
            100;
        const streamSkipped = ((this.videoSettingsService.contexts.horizontal.skippedFrames -
            this.streamStartSkippedFrames) /
            (this.videoSettingsService.contexts.horizontal.encodedFrames -
                this.streamStartEncodedFrames)) *
            100;
        const streamDropped = this.state.percentageDroppedFrames;
        const streamDuration = this.streamStartTime !== undefined
            ? new Date().getTime() - this.streamStartTime.getTime()
            : 0;
        const averageCPU = this.averageFactor(this.historicalCPU);
        const streamType = this.dualOutputService.views.dualOutputMode ? 'dual' : 'single';
        this.usageStatisticsService.recordAnalyticsEvent('StreamPerformance', {
            streamLagged,
            streamSkipped,
            streamDropped,
            streamDuration,
            averageCPU,
            streamType,
        });
    }
    monitorAndUpdateStats() {
        const currentStats = {
            framesLagged: obs.Global.laggedFrames,
            framesRendered: obs.Global.totalFrames,
            framesSkipped: this.videoSettingsService.contexts.horizontal.skippedFrames,
            framesEncoded: this.videoSettingsService.contexts.horizontal.encodedFrames,
        };
        const nextStats = this.nextStats(currentStats);
        this.addSample(this.historicalDroppedFrames, nextStats.droppedFramesFactor);
        this.addSample(this.historicalSkippedFrames, nextStats.skippedFactor);
        this.addSample(this.historicalLaggedFrames, nextStats.laggedFactor);
        if (this.dualOutputService.views.dualOutputMode &&
            this.streamingService.views.isMidStreamMode) {
            this.addSample(this.historicalCPU, nextStats.cpu);
        }
        this.sendNotifications(currentStats, nextStats);
        this.SET_PERFORMANCE_STATS({
            numberSkippedFrames: currentStats.framesSkipped,
            percentageSkippedFrames: nextStats.skippedFactor * 100,
            numberLaggedFrames: currentStats.framesLagged,
            percentageLaggedFrames: nextStats.laggedFactor * 100,
            numberEncodedFrames: currentStats.framesEncoded,
            numberRenderedFrames: currentStats.framesRendered,
        });
    }
    nextStats(currentStats) {
        const framesSkipped = currentStats.framesSkipped - this.state.numberSkippedFrames;
        const framesEncoded = currentStats.framesEncoded - this.state.numberEncodedFrames;
        const skippedFactor = framesEncoded === 0 ? 0 : framesSkipped / framesEncoded;
        const framesLagged = currentStats.framesLagged - this.state.numberLaggedFrames;
        const framesRendered = currentStats.framesRendered - this.state.numberRenderedFrames;
        const laggedFactor = framesRendered === 0 ? 0 : framesLagged / framesRendered;
        const droppedFramesFactor = this.state.percentageDroppedFrames / 100;
        const cpu = this.state.CPU;
        return {
            framesSkipped,
            framesEncoded,
            skippedFactor,
            framesLagged,
            framesRendered,
            laggedFactor,
            droppedFramesFactor,
            cpu,
        };
    }
    addSample(record, current) {
        if (record.length >= NUMBER_OF_SAMPLES) {
            record.shift();
        }
        record.push(current);
    }
    averageFactor(record) {
        return record.reduce((a, b) => a + b, 0) / NUMBER_OF_SAMPLES;
    }
    checkNotification(target, record) {
        return this.averageFactor(record) >= target;
    }
    sendNotifications(currentStats, nextStats) {
        const troubleshooterSettings = this.troubleshooterService.views.settings;
        if (troubleshooterSettings.skippedEnabled &&
            currentStats.framesEncoded !== 0 &&
            nextStats.framesEncoded !== 0 &&
            this.checkNotification(troubleshooterSettings.skippedThreshold, this.historicalSkippedFrames)) {
            this.pushSkippedFramesNotify(this.averageFactor(this.historicalSkippedFrames));
        }
        if (troubleshooterSettings.laggedEnabled &&
            currentStats.framesRendered !== 0 &&
            nextStats.framesRendered !== 0 &&
            this.checkNotification(troubleshooterSettings.laggedThreshold, this.historicalLaggedFrames)) {
            this.pushLaggedFramesNotify(this.averageFactor(this.historicalLaggedFrames));
        }
        if (troubleshooterSettings.droppedEnabled &&
            this.checkNotification(troubleshooterSettings.droppedThreshold, this.historicalDroppedFrames)) {
            this.pushDroppedFramesNotify(this.averageFactor(this.historicalDroppedFrames));
        }
        if (this.dualOutputService.views.dualOutputMode &&
            this.streamingService.views.isMidStreamMode &&
            troubleshooterSettings.dualOutputCpuEnabled &&
            this.state.CPU > troubleshooterSettings.dualOutputCpuThreshold * 100) {
            this.pushDualOutputHighCPUNotify(this.state.CPU);
        }
    }
    pushDualOutputHighCPUNotify(factor) {
        const code = 'HIGH_CPU_USAGE';
        const message = factor > 50
            ? $t('High CPU Usage: Detected')
            : $t('High CPU Usage: %{percentage}% used', {
                percentage: factor.toFixed(1),
            });
        this.notificationsService.push({
            code,
            type: ENotificationType.WARNING,
            data: factor,
            lifeTime: 2 * 60 * 1000,
            showTime: true,
            subType: ENotificationSubType.CPU,
            message,
            action: this.jsonrpcService.createRequest(Service.getResourceId(this.troubleshooterService), 'showTroubleshooter', code),
        });
    }
    pushLaggedFramesNotify(factor) {
        const code = 'FRAMES_LAGGED';
        this.notificationsService.push({
            code,
            type: ENotificationType.WARNING,
            data: factor,
            lifeTime: 2 * 60 * 1000,
            showTime: true,
            subType: ENotificationSubType.LAGGED,
            message: `Lagged frames detected: ${Math.round(factor * 100)}%  over last 2 minutes`,
            action: this.jsonrpcService.createRequest(Service.getResourceId(this.troubleshooterService), 'showTroubleshooter', code),
        });
    }
    pushDroppedFramesNotify(factor) {
        const code = 'FRAMES_DROPPED';
        this.notificationsService.push({
            code,
            type: ENotificationType.WARNING,
            data: factor,
            lifeTime: 2 * 60 * 1000,
            showTime: true,
            subType: ENotificationSubType.DROPPED,
            message: `Dropped frames detected: ${Math.round(factor * 100)}%  over last 2 minutes`,
            action: this.jsonrpcService.createRequest(Service.getResourceId(this.troubleshooterService), 'showTroubleshooter', code),
        });
    }
    pushSkippedFramesNotify(factor) {
        const code = 'FRAMES_SKIPPED';
        this.notificationsService.push({
            code,
            type: ENotificationType.WARNING,
            data: factor,
            lifeTime: 2 * 60 * 1000,
            showTime: true,
            subType: ENotificationSubType.SKIPPED,
            message: $t('Skipped frames detected:') + Math.round(factor * 100) + '% over last 2 minutes',
            action: this.jsonrpcService.createRequest(Service.getResourceId(this.troubleshooterService), 'showTroubleshooter', code),
        });
    }
    stop() {
        this.shutdown = true;
    }
}
PerformanceService.initialState = {
    CPU: 0,
    numberDroppedFrames: 0,
    percentageDroppedFrames: 0,
    numberSkippedFrames: 0,
    percentageSkippedFrames: 0,
    numberLaggedFrames: 0,
    percentageLaggedFrames: 0,
    numberEncodedFrames: 0,
    numberRenderedFrames: 0,
    streamingBandwidth: 0,
    frameRate: 0,
};
__decorate([
    Inject()
], PerformanceService.prototype, "notificationsService", void 0);
__decorate([
    Inject()
], PerformanceService.prototype, "jsonrpcService", void 0);
__decorate([
    Inject()
], PerformanceService.prototype, "troubleshooterService", void 0);
__decorate([
    Inject()
], PerformanceService.prototype, "streamingService", void 0);
__decorate([
    Inject()
], PerformanceService.prototype, "usageStatisticsService", void 0);
__decorate([
    Inject()
], PerformanceService.prototype, "videoSettingsService", void 0);
__decorate([
    Inject()
], PerformanceService.prototype, "dualOutputService", void 0);
__decorate([
    mutation()
], PerformanceService.prototype, "SET_PERFORMANCE_STATS", null);
__decorate([
    throttle(CPU_NOTIFICATION_THROTTLE_INTERVAL)
], PerformanceService.prototype, "pushDualOutputHighCPUNotify", null);
__decorate([
    throttle(NOTIFICATION_THROTTLE_INTERVAL)
], PerformanceService.prototype, "pushLaggedFramesNotify", null);
__decorate([
    throttle(NOTIFICATION_THROTTLE_INTERVAL)
], PerformanceService.prototype, "pushDroppedFramesNotify", null);
__decorate([
    throttle(NOTIFICATION_THROTTLE_INTERVAL)
], PerformanceService.prototype, "pushSkippedFramesNotify", null);
//# sourceMappingURL=performance.js.map