var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import React, { useEffect, useMemo, useRef } from 'react';
import { debounce } from 'lodash-decorators';
import { ipcRenderer } from 'electron';
import difference from 'lodash/difference';
import { compileShader, createProgram } from 'util/webgl/utils';
import vShaderSrc from 'util/webgl/shaders/volmeter.vert';
import fShaderSrc from 'util/webgl/shaders/volmeter.frag';
import { Services } from 'components-react/service-provider';
import { assertIsDefined, getDefined } from 'util/properties-type-guards';
import { useController } from 'components-react/hooks/zustand';
const CHANNEL_HEIGHT = 3;
const SPACE_BETWEEN_CHANNELS = 2;
const PADDING_TOP = 39;
const PADDING_BOTTOM = 57;
const PEAK_WIDTH = 4;
const PEAK_HOLD_CYCLES = 100;
const WARNING_LEVEL = -20;
const DANGER_LEVEL = -9;
const GREEN = [128, 245, 210];
const LIGHT_MODE_GREEN = [18, 128, 121];
const YELLOW = [255, 205, 71];
const RED = [252, 62, 63];
export default function GLVolmetersWithContext() {
    const controller = useMemo(() => new GLVolmetersController(), []);
    return (<GLVolmetersCtx.Provider value={controller}>
      <GLVolmeters />
    </GLVolmetersCtx.Provider>);
}
function GLVolmeters() {
    const canvasRef = useRef(null);
    const controller = useController(GLVolmetersCtx);
    useEffect(() => {
        assertIsDefined(canvasRef.current);
        controller.setupNewCanvas(canvasRef.current);
        return () => controller.beforeDestroy();
    }, []);
    return (<div style={{ position: 'absolute', height: '100%', width: '100%' }}>
      <canvas ref={canvasRef} style={{
            display: 'block',
            position: 'absolute',
            top: 0,
            right: 0,
            left: 0,
            paddingLeft: '16px',
            paddingRight: '16px',
            height: '100%',
        }}/>
    </div>);
}
const GLVolmetersCtx = React.createContext(null);
class GLVolmetersController {
    constructor() {
        this.customizationService = Services.CustomizationService;
        this.audioService = Services.AudioService;
        this.subscriptions = {};
        this.interpolationTime = 35;
        this.bgMultiplier = this.customizationService.isDarkTheme ? 0.2 : 0.5;
        this.$refs = {
            canvas: null,
        };
    }
    init() {
        this.subscribeVolmeters();
        this.bg = this.customizationService.sectionBackground;
        this.fpsLimit = 30;
    }
    get audioSources() {
        return this.audioService.views.sourcesForCurrentScene.filter(source => {
            return !source.mixerHidden && source.isControlledViaObs;
        });
    }
    subscribeVolmeters() {
        const audioSources = this.audioSources;
        const sourcesOrder = audioSources.map(source => source.sourceId);
        audioSources.forEach(source => {
            const sourceId = source.sourceId;
            if (this.subscriptions[sourceId])
                return;
            const listener = (e) => {
                const subscription = this.subscriptions[sourceId];
                if (!subscription)
                    return;
                subscription.channelsCount = e.data.peak.length;
                subscription.prevPeaks = subscription.interpolatedPeaks;
                subscription.currentPeaks = Array.from(e.data.peak);
                subscription.lastEventTime = performance.now();
            };
            const IDLE_PEAK = -60;
            const INITIAL_PEAKS = [IDLE_PEAK, IDLE_PEAK];
            this.subscriptions[sourceId] = {
                sourceId,
                channelsCount: 2,
                currentPeaks: INITIAL_PEAKS,
                prevPeaks: [],
                interpolatedPeaks: [],
                lastEventTime: 0,
                peakHolds: [],
                peakHoldCounters: [],
            };
            this.audioService.actions.return.subscribeVolmeter(sourceId).then(id => {
                ipcRenderer.once(`port-${id}`, e => {
                    if (!this.subscriptions[sourceId])
                        return;
                    this.subscriptions[sourceId].channelId = id;
                    e.ports[0].onmessage = listener;
                });
                ipcRenderer.send('request-message-channel-out', id);
            });
        });
        const currentSourcesIds = sourcesOrder;
        const subscribedSourcesIds = Object.keys(this.subscriptions);
        const sourcesToUnsubscribe = difference(subscribedSourcesIds, currentSourcesIds);
        sourcesToUnsubscribe.forEach(sourceId => this.unsubscribeVolmeter(sourceId));
        this.sourcesOrder = sourcesOrder;
    }
    unsubscribeVolmeter(sourceId) {
        if (this.subscriptions[sourceId].channelId) {
            this.audioService.actions.unsubscribeVolmeter(sourceId, this.subscriptions[sourceId].channelId);
        }
        delete this.subscriptions[sourceId];
    }
    beforeDestroy() {
        if (this.gl) {
            window['activeWebglContexts'] -= 1;
        }
        clearInterval(this.canvasWidthInterval);
        Object.keys(this.subscriptions).forEach(sourceId => this.unsubscribeVolmeter(sourceId));
        cancelAnimationFrame(this.requestedFrameId);
    }
    setupNewCanvas($canvasEl) {
        this.$refs.canvas = $canvasEl;
        if (this.gl && this.program) {
            this.gl.deleteProgram(this.program);
        }
        this.gl = null;
        this.program = null;
        this.positionLocation = null;
        this.resolutionLocation = null;
        this.translationLocation = null;
        this.scaleLocation = null;
        this.volumeLocation = null;
        this.peakHoldLocation = null;
        this.bgMultiplierLocation = null;
        this.canvasWidth = 0;
        this.canvasHeight = 0;
        this.setCanvasSize();
        this.canvasWidthInterval = window.setInterval(() => this.setCanvasSize(), 500);
        this.requestedFrameId = requestAnimationFrame(t => this.onRequestAnimationFrameHandler(t));
        this.gl = getDefined(this.$refs.canvas.getContext('webgl', { alpha: false }));
        this.initWebglRendering();
    }
    onRequestAnimationFrameHandler(now) {
        const isDestroyed = !this.$refs.canvas;
        if (isDestroyed)
            return;
        if (!this.firstFrameTime) {
            this.frameNumber = -1;
            this.firstFrameTime = now;
        }
        const timeElapsed = now - this.firstFrameTime;
        const timeBetweenFrames = 1000 / this.fpsLimit;
        const currentFrameNumber = Math.ceil(timeElapsed / timeBetweenFrames);
        if (currentFrameNumber !== this.frameNumber) {
            this.frameNumber = currentFrameNumber;
            this.drawVolmeters();
        }
        this.requestedFrameId = requestAnimationFrame(t => this.onRequestAnimationFrameHandler(t));
    }
    initWebglRendering() {
        const vShader = getDefined(compileShader(this.gl, vShaderSrc, this.gl.VERTEX_SHADER));
        const fShader = getDefined(compileShader(this.gl, fShaderSrc, this.gl.FRAGMENT_SHADER));
        this.program = getDefined(createProgram(this.gl, vShader, fShader));
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        const positions = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
        this.positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.resolutionLocation = getDefined(this.gl.getUniformLocation(this.program, 'u_resolution'));
        this.translationLocation = getDefined(this.gl.getUniformLocation(this.program, 'u_translation'));
        this.scaleLocation = getDefined(this.gl.getUniformLocation(this.program, 'u_scale'));
        this.volumeLocation = getDefined(this.gl.getUniformLocation(this.program, 'u_volume'));
        this.peakHoldLocation = getDefined(this.gl.getUniformLocation(this.program, 'u_peakHold'));
        this.bgMultiplierLocation = getDefined(this.gl.getUniformLocation(this.program, 'u_bgMultiplier'));
        this.gl.useProgram(this.program);
        const warningLocation = getDefined(this.gl.getUniformLocation(this.program, 'u_warning'));
        this.gl.uniform1f(warningLocation, this.dbToUnitScalar(WARNING_LEVEL));
        const dangerLocation = getDefined(this.gl.getUniformLocation(this.program, 'u_danger'));
        this.gl.uniform1f(dangerLocation, this.dbToUnitScalar(DANGER_LEVEL));
        const green = this.customizationService.isDarkTheme ? GREEN : LIGHT_MODE_GREEN;
        this.setColorUniform('u_green', green);
        this.setColorUniform('u_yellow', YELLOW);
        this.setColorUniform('u_red', RED);
    }
    setColorUniform(uniform, color) {
        const location = this.gl.getUniformLocation(this.program, uniform);
        this.gl.uniform3fv(location, color.map(c => c / 255));
    }
    setCanvasSize() {
        var _a;
        const $parent = getDefined((_a = this.$refs.canvas) === null || _a === void 0 ? void 0 : _a.parentElement);
        const width = Math.floor($parent.offsetWidth);
        const height = Math.floor($parent.offsetHeight);
        if (width !== this.canvasWidth) {
            this.canvasWidth = width;
            this.$refs.canvas.width = width;
            this.$refs.canvas.style.width = `${width}px`;
        }
        if (height !== this.canvasHeight) {
            this.canvasHeight = height;
            this.$refs.canvas.height = this.canvasHeight;
            this.$refs.canvas.style.height = `${this.canvasHeight}px`;
        }
        this.bg = this.customizationService.sectionBackground;
        this.bgMultiplier = this.customizationService.isDarkTheme ? 0.2 : 0.5;
    }
    drawVolmeters() {
        const bg = this.bg;
        this.gl.clearColor(bg.r / 255, bg.g / 255, bg.b / 255, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        if (this.canvasWidth < 0 || this.canvasHeight < 0 || !this.sourcesOrder) {
            return;
        }
        this.gl.viewport(0, 0, this.canvasWidth, this.canvasHeight);
        this.gl.enableVertexAttribArray(this.positionLocation);
        this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.uniform2f(this.resolutionLocation, 1, this.canvasHeight);
        this.gl.uniform1f(this.bgMultiplierLocation, this.bgMultiplier);
        let offsetTop = 0;
        this.sourcesOrder.forEach((sourceId, ind) => {
            offsetTop += PADDING_TOP;
            const volmeter = this.subscriptions[sourceId];
            this.drawVolmeterWebgl(volmeter, offsetTop);
            offsetTop += PADDING_BOTTOM;
        });
    }
    drawVolmeterWebgl(volmeter, offsetTop) {
        volmeter.currentPeaks.forEach((peak, channel) => {
            this.drawVolmeterChannelWebgl(volmeter, channel, offsetTop);
        });
    }
    drawVolmeterChannelWebgl(volmeter, channel, offsetTop) {
        const peak = volmeter.currentPeaks[channel];
        this.updatePeakHold(volmeter, peak, channel);
        this.gl.uniform2f(this.scaleLocation, 1, CHANNEL_HEIGHT);
        this.gl.uniform2f(this.translationLocation, 0, channel * (CHANNEL_HEIGHT + SPACE_BETWEEN_CHANNELS) + offsetTop);
        const prevPeak = volmeter.prevPeaks[channel] ? volmeter.prevPeaks[channel] : peak;
        const timeDelta = performance.now() - volmeter.lastEventTime;
        let alpha = timeDelta / this.interpolationTime;
        if (alpha > 1)
            alpha = 1;
        const interpolatedPeak = this.lerp(prevPeak, peak, alpha);
        volmeter.interpolatedPeaks[channel] = interpolatedPeak;
        this.gl.uniform1f(this.volumeLocation, this.dbToUnitScalar(interpolatedPeak));
        this.gl.uniform2f(this.peakHoldLocation, this.dbToUnitScalar(volmeter.peakHolds[channel]), PEAK_WIDTH / this.canvasWidth);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }
    dbToUnitScalar(db) {
        return Math.max((db + 60) * (1 / 60), 0);
    }
    updatePeakHold(volmeter, peak, channel) {
        if (!volmeter.peakHoldCounters[channel] || peak > volmeter.peakHolds[channel]) {
            volmeter.peakHolds[channel] = peak;
            volmeter.peakHoldCounters[channel] = PEAK_HOLD_CYCLES;
            return;
        }
        volmeter.peakHoldCounters[channel] -= 1;
    }
    lerp(val1, val2, alpha) {
        return val1 + (val2 - val1) * alpha;
    }
}
__decorate([
    debounce(500)
], GLVolmetersController.prototype, "subscribeVolmeters", null);
//# sourceMappingURL=GLVolmeters.jsx.map