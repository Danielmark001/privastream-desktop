var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Inject } from 'services/core/injector';
import { ipcRenderer } from 'electron';
const CHANNEL_HEIGHT = 3;
const PADDING_HEIGHT = 2;
const PEAK_WIDTH = 4;
const PEAK_HOLD_CYCLES = 100;
const WARNING_LEVEL = -20;
const DANGER_LEVEL = -9;
const GREEN = [49, 195, 162];
const YELLOW = [255, 205, 71];
const RED = [252, 62, 63];
const FPS_LIMIT = 40;
export class Volmeter2d {
    constructor(audioSource, canvas, spacer, onRenderingInit, volmetersEnabled = true) {
        this.audioSource = audioSource;
        this.canvas = canvas;
        this.spacer = spacer;
        this.onRenderingInit = onRenderingInit;
        this.volmetersEnabled = volmetersEnabled;
        this.canvasId = 1;
        this.renderingInitialized = false;
        this.interpolationTime = 35;
        this.subscribeVolmeter();
        this.peakHoldCounters = [];
        this.peakHolds = [];
        this.setupNewCanvas();
    }
    destroy() {
        clearInterval(this.canvasWidthInterval);
        this.unsubscribeVolmeter();
        if (this.styleBlockersSubscription)
            this.styleBlockersSubscription.unsubscribe();
    }
    setupNewCanvas() {
        this.ctx = null;
        this.canvasWidth = null;
        this.channelCount = null;
        this.canvasHeight = null;
        this.renderingInitialized = false;
        this.setChannelCount(2);
        this.setCanvasWidth();
        this.canvasWidthInterval = window.setInterval(() => this.setCanvasWidth(), 500);
        if (this.volmetersEnabled) {
            requestAnimationFrame(t => this.onRequestAnimationFrameHandler(t));
        }
        this.styleBlockersSubscription = this.windowsService.styleBlockersUpdated.subscribe(blockers => {
            if (blockers.windowId === 'main' && !blockers.hideStyleBlockers) {
                this.setCanvasWidth();
            }
        });
    }
    onRequestAnimationFrameHandler(now) {
        if (!this.frameNumber) {
            this.frameNumber = -1;
            this.firstFrameTime = now;
        }
        const timeElapsed = now - this.firstFrameTime;
        const timeBetweenFrames = 1000 / FPS_LIMIT;
        const currentFrameNumber = Math.ceil(timeElapsed / timeBetweenFrames);
        if (currentFrameNumber !== this.frameNumber) {
            this.frameNumber = currentFrameNumber;
            if (this.renderingInitialized && this.currentPeaks && this.currentPeaks.length) {
                this.drawVolmeterC2d(this.currentPeaks);
            }
        }
        requestAnimationFrame(t => this.onRequestAnimationFrameHandler(t));
    }
    initRenderingContext() {
        if (this.renderingInitialized)
            return;
        if (!this.volmetersEnabled)
            return;
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.renderingInitialized = true;
        if (this.onRenderingInit)
            this.onRenderingInit();
    }
    setChannelCount(channels) {
        if (channels !== this.channelCount) {
            this.channelCount = channels;
            this.canvasHeight = Math.max(channels * (CHANNEL_HEIGHT + PADDING_HEIGHT) - PADDING_HEIGHT, 0);
            if (!this.canvas)
                return;
            this.canvas.height = this.canvasHeight;
            this.canvas.style.height = `${this.canvasHeight}px`;
            if (this.spacer)
                this.spacer.style.height = `${this.canvasHeight}px`;
        }
    }
    setCanvasWidth() {
        const width = Math.floor(this.canvas.offsetWidth);
        if (width !== this.canvasWidth) {
            this.canvasWidth = width;
            this.canvas.width = width;
            this.canvas.style.width = `${width}px`;
        }
        this.bg = this.customizationService.themeBackground;
    }
    getBgMultiplier() {
        return this.customizationService.isDarkTheme ? 0.2 : 0.5;
    }
    drawVolmeterC2d(peaks) {
        if (this.canvasWidth < 0 || this.canvasHeight < 0)
            return;
        const bg = this.customizationService.sectionBackground;
        this.ctx.fillStyle = this.rgbToCss([bg.r, bg.g, bg.b]);
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        peaks.forEach((peak, channel) => {
            this.drawVolmeterChannelC2d(peak, channel);
        });
    }
    drawVolmeterChannelC2d(peak, channel) {
        this.updatePeakHold(peak, channel);
        const heightOffset = channel * (CHANNEL_HEIGHT + PADDING_HEIGHT);
        const warningPx = this.dbToPx(WARNING_LEVEL);
        const dangerPx = this.dbToPx(DANGER_LEVEL);
        const bgMultiplier = this.getBgMultiplier();
        this.ctx.fillStyle = this.rgbToCss(GREEN, bgMultiplier);
        this.ctx.fillRect(0, heightOffset, warningPx, CHANNEL_HEIGHT);
        this.ctx.fillStyle = this.rgbToCss(YELLOW, bgMultiplier);
        this.ctx.fillRect(warningPx, heightOffset, dangerPx - warningPx, CHANNEL_HEIGHT);
        this.ctx.fillStyle = this.rgbToCss(RED, bgMultiplier);
        this.ctx.fillRect(dangerPx, heightOffset, this.canvasWidth - dangerPx, CHANNEL_HEIGHT);
        const peakPx = this.dbToPx(peak);
        const greenLevel = Math.min(peakPx, warningPx);
        this.ctx.fillStyle = this.rgbToCss(GREEN);
        this.ctx.fillRect(0, heightOffset, greenLevel, CHANNEL_HEIGHT);
        if (peak > WARNING_LEVEL) {
            const yellowLevel = Math.min(peakPx, dangerPx);
            this.ctx.fillStyle = this.rgbToCss(YELLOW);
            this.ctx.fillRect(warningPx, heightOffset, yellowLevel - warningPx, CHANNEL_HEIGHT);
        }
        if (peak > DANGER_LEVEL) {
            this.ctx.fillStyle = this.rgbToCss(RED);
            this.ctx.fillRect(dangerPx, heightOffset, peakPx - dangerPx, CHANNEL_HEIGHT);
        }
        this.ctx.fillStyle = this.rgbToCss(GREEN);
        if (this.peakHolds[channel] > WARNING_LEVEL)
            this.ctx.fillStyle = this.rgbToCss(YELLOW);
        if (this.peakHolds[channel] > DANGER_LEVEL)
            this.ctx.fillStyle = this.rgbToCss(RED);
        this.ctx.fillRect(this.dbToPx(this.peakHolds[channel]), heightOffset, PEAK_WIDTH, CHANNEL_HEIGHT);
    }
    dbToPx(db) {
        return Math.round((db + 60) * (this.canvasWidth / 60));
    }
    rgbToCss(rgb, multiplier = 1) {
        return `rgb(${rgb.map(v => Math.round(v * multiplier)).join(',')})`;
    }
    updatePeakHold(peak, channel) {
        if (!this.peakHoldCounters[channel] || peak > this.peakHolds[channel]) {
            this.peakHolds[channel] = peak;
            this.peakHoldCounters[channel] = PEAK_HOLD_CYCLES;
            return;
        }
        this.peakHoldCounters[channel] -= 1;
    }
    subscribeVolmeter() {
        this.listener = (e) => {
            if (this.canvas) {
                if (!e.data.peak.length && !this.renderingInitialized)
                    return;
                this.initRenderingContext();
                this.setChannelCount(e.data.peak.length);
                this.prevPeaks = this.interpolatedPeaks;
                this.currentPeaks = Array.from(e.data.peak);
                this.lastEventTime = performance.now();
            }
        };
        this.audioService.subscribeVolmeter(this.audioSource.sourceId).then(id => {
            ipcRenderer.once(`port-${id}`, e => {
                this.channelId = id;
                e.ports[0].onmessage = this.listener;
            });
            ipcRenderer.send('request-message-channel-out', id);
        });
    }
    unsubscribeVolmeter() {
        this.audioService.actions.unsubscribeVolmeter(this.audioSource.sourceId, this.channelId);
    }
}
__decorate([
    Inject()
], Volmeter2d.prototype, "customizationService", void 0);
__decorate([
    Inject()
], Volmeter2d.prototype, "audioService", void 0);
__decorate([
    Inject()
], Volmeter2d.prototype, "windowsService", void 0);
//# sourceMappingURL=volmeter-2d.js.map