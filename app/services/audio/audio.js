var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var AudioService_1;
import Vue from 'vue';
import omit from 'lodash/omit';
import { Subject } from 'rxjs';
import { mutation, StatefulService, ServiceHelper, InitAfter, Inject } from 'services';
import { SourcesService } from 'services/sources';
import { ScenesService } from 'services/scenes';
import * as obs from '../../../obs-api';
import Utils from 'services/utils';
import { EDeviceType } from 'services/hardware';
import { $t } from 'services/i18n';
import { ipcRenderer } from 'electron';
import { ViewHandler } from 'services/core';
export var E_AUDIO_CHANNELS;
(function (E_AUDIO_CHANNELS) {
    E_AUDIO_CHANNELS[E_AUDIO_CHANNELS["OUTPUT_1"] = 1] = "OUTPUT_1";
    E_AUDIO_CHANNELS[E_AUDIO_CHANNELS["OUTPUT_2"] = 2] = "OUTPUT_2";
    E_AUDIO_CHANNELS[E_AUDIO_CHANNELS["INPUT_1"] = 3] = "INPUT_1";
    E_AUDIO_CHANNELS[E_AUDIO_CHANNELS["INPUT_2"] = 4] = "INPUT_2";
    E_AUDIO_CHANNELS[E_AUDIO_CHANNELS["INPUT_3"] = 5] = "INPUT_3";
})(E_AUDIO_CHANNELS || (E_AUDIO_CHANNELS = {}));
class AudioViews extends ViewHandler {
    get sourcesForCurrentScene() {
        return this.getSourcesForScene(this.getServiceViews(ScenesService).activeSceneId);
    }
    getSourcesForScene(sceneId) {
        const scene = this.getServiceViews(ScenesService).getScene(sceneId);
        const sceneSources = scene
            .getNestedSources({ excludeScenes: true })
            .filter(sceneItem => sceneItem.audio);
        const globalSources = this.getServiceViews(SourcesService)
            .getSources()
            .filter(source => source.channel !== void 0);
        return globalSources
            .concat(sceneSources)
            .map((sceneSource) => this.getSource(sceneSource.sourceId))
            .filter(item => item);
    }
    getSource(sourceId) {
        return this.state.audioSources[sourceId] ? new AudioSource(sourceId) : void 0;
    }
    getSources() {
        return Object.keys(this.state.audioSources).map(sourceId => this.getSource(sourceId));
    }
}
export var AudioNotificationType;
(function (AudioNotificationType) {
    AudioNotificationType[AudioNotificationType["YouAreMuted"] = 0] = "YouAreMuted";
    AudioNotificationType[AudioNotificationType["NoSignalFromAudioInput"] = 1] = "NoSignalFromAudioInput";
})(AudioNotificationType || (AudioNotificationType = {}));
let AudioService = AudioService_1 = class AudioService extends StatefulService {
    constructor() {
        super(...arguments);
        this.audioSourceUpdated = new Subject();
        this.audioNotificationUpdated = new Subject();
        this.sourceData = {};
        this.volmeterSubscriptions = {};
        this.volmeterMessageChannels = {};
        this.peakHistoryMap = new Map();
    }
    get views() {
        return new AudioViews(this.state);
    }
    init() {
        obs.NodeObs.RegisterVolmeterCallback((objs) => this.handleVolmeterCallback(objs));
        this.sourcesService.sourceAdded.subscribe(sourceModel => {
            const source = this.sourcesService.views.getSource(sourceModel.sourceId);
            if (!source.audio)
                return;
            this.createAudioSource(source);
        });
        this.sourcesService.sourceUpdated.subscribe(source => {
            const audioSource = this.views.getSource(source.sourceId);
            const obsSource = this.sourcesService.views.getSource(source.sourceId);
            const formData = obsSource
                .getPropertiesFormData()
                .find(data => data.name === 'reroute_audio');
            if (formData) {
                this.UPDATE_AUDIO_SOURCE(source.sourceId, {
                    isControlledViaObs: !!formData.value,
                });
            }
            if (!audioSource && source.audio) {
                this.createAudioSource(this.sourcesService.views.getSource(source.sourceId));
            }
            if (audioSource && !source.audio) {
                this.removeAudioSource(source.sourceId);
            }
        });
        this.sourcesService.sourceRemoved.subscribe(source => {
            if (source.audio)
                this.removeAudioSource(source.sourceId);
        });
    }
    static timeSpecToMs(timeSpec) {
        return timeSpec.sec * 1000 + Math.floor(timeSpec.nsec / 1000000);
    }
    static msToTimeSpec(ms) {
        return { sec: Math.trunc(ms / 1000), nsec: Math.trunc(ms % 1000) * 1000000 };
    }
    subscribeVolmeter(sourceId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const channels = (_a = this.volmeterMessageChannels[sourceId]) !== null && _a !== void 0 ? _a : [];
            const channelId = yield ipcRenderer.invoke('create-message-channel');
            ipcRenderer.once(`port-${channelId}`, e => {
                channels.push({
                    id: channelId,
                    port: e.ports[0],
                });
            });
            ipcRenderer.send('request-message-channel-in', channelId);
            this.volmeterMessageChannels[sourceId] = channels;
            return channelId;
        });
    }
    unsubscribeVolmeter(sourceId, channelId) {
        const channel = this.volmeterMessageChannels[sourceId].find(c => (c.id = channelId));
        if (!channel)
            return;
        this.volmeterMessageChannels[sourceId] = this.volmeterMessageChannels[sourceId].filter(c => c.id !== channelId);
        channel.port.close();
    }
    unhideAllSourcesForCurrentScene() {
        this.views.sourcesForCurrentScene.forEach(source => {
            source.setHidden(false);
        });
    }
    fetchFaderDetails(sourceId) {
        const source = this.sourcesService.views.getSource(sourceId);
        const obsFader = this.sourceData[source.sourceId].fader;
        const deflection = Math.round(obsFader.deflection * 100) / 100.0;
        return {
            deflection,
            db: obsFader.db || 0,
            mul: obsFader.mul,
        };
    }
    generateAudioSourceData(sourceId) {
        var _a, _b;
        const source = this.sourcesService.views.getSource(sourceId);
        const obsSource = source.getObsInput();
        const fader = this.fetchFaderDetails(sourceId);
        const isControlledViaObs = ((_a = obsSource.settings) === null || _a === void 0 ? void 0 : _a.reroute_audio) == null ? true : (_b = obsSource.settings) === null || _b === void 0 ? void 0 : _b.reroute_audio;
        return {
            fader,
            isControlledViaObs,
            sourceId: source.sourceId,
            audioMixers: obsSource.audioMixers,
            monitoringType: obsSource.monitoringType,
            forceMono: !!(obsSource.flags & 2),
            syncOffset: AudioService_1.timeSpecToMs(obsSource.syncOffset),
            muted: obsSource.muted,
            mixerHidden: false,
        };
    }
    get devices() {
        return this.hardwareService.devices.filter(device => [EDeviceType.audioOutput, EDeviceType.audioInput].includes(device.type));
    }
    showAdvancedSettings(sourceId) {
        this.windowsService.showWindow({
            componentName: 'AdvancedAudio',
            title: $t('Advanced Audio Settings'),
            size: {
                width: 915,
                height: 600,
            },
            queryParams: { sourceId },
        });
    }
    setSimpleTracks() {
        this.views
            .getSources()
            .forEach(audioSource => this.setSettings(audioSource.sourceId, { audioMixers: 1 }));
    }
    setSettings(sourceId, patch) {
        const obsInput = this.sourcesService.views.getSource(sourceId).getObsInput();
        const newPatch = omit(patch, 'fader');
        Object.keys(newPatch).forEach((name) => {
            const value = newPatch[name];
            if (value === void 0)
                return;
            if (name === 'syncOffset') {
                obsInput.syncOffset = AudioService_1.msToTimeSpec(value);
            }
            else if (name === 'forceMono') {
                if (this.views.getSource(sourceId).forceMono !== value) {
                    value
                        ? (obsInput.flags = obsInput.flags | 2)
                        : (obsInput.flags -= 2);
                }
            }
            else if (name === 'muted') {
                this.sourcesService.setMuted(sourceId, value);
            }
            else {
                obsInput[name] = value;
            }
        });
        this.UPDATE_AUDIO_SOURCE(sourceId, newPatch);
        this.audioSourceUpdated.next(this.state.audioSources[sourceId]);
    }
    setFader(sourceId, patch) {
        const obsFader = this.sourceData[sourceId].fader;
        if (patch.deflection != null)
            obsFader.deflection = patch.deflection;
        if (patch.mul != null)
            obsFader.mul = patch.mul;
        const fader = this.fetchFaderDetails(sourceId);
        this.UPDATE_AUDIO_SOURCE(sourceId, { fader });
        this.audioSourceUpdated.next(this.state.audioSources[sourceId]);
    }
    handleVolmeterCallback(objs) {
        const hasUnmutedAudioInput = objs.some(info => {
            if (!info.sourceName.startsWith('wasapi_input')) {
                return false;
            }
            const source = this.views.getSource(info.sourceName);
            return source && !source.muted;
        });
        let shouldNotifyYouAreMuted = false;
        let shouldNotifyNoSignal = false;
        objs.forEach(info => {
            const source = this.views.getSource(info.sourceName);
            if (!source) {
                return;
            }
            const volmeter = info;
            if (info.sourceName.startsWith('wasapi_input')) {
                if (!this.peakHistoryMap.has(info.sourceName)) {
                    this.peakHistoryMap.set(info.sourceName, []);
                }
                const peakHistory = this.peakHistoryMap.get(info.sourceName);
                peakHistory.push(volmeter.peak[0] - source.fader.db);
                const averagePeakValue = peakHistory.reduce((a, b) => a + b) / peakHistory.length;
                const hasEnoughData = peakHistory.length >= 50;
                if (hasEnoughData) {
                    peakHistory.shift();
                }
                if (source.muted) {
                    if (hasEnoughData && !hasUnmutedAudioInput && averagePeakValue >= -30) {
                        this.peakHistoryMap.set(info.sourceName, []);
                        shouldNotifyYouAreMuted = true;
                    }
                    volmeter.inputPeak.forEach((item, index) => (volmeter.inputPeak[index] = -65535));
                    volmeter.peak.forEach((item, index) => (volmeter.peak[index] = -65535));
                    volmeter.magnitude.forEach((item, index) => (volmeter.magnitude[index] = -65535));
                }
                else {
                    if (hasEnoughData && averagePeakValue <= -1000) {
                        this.peakHistoryMap.set(info.sourceName, []);
                        shouldNotifyNoSignal = true;
                    }
                }
            }
            this.sendVolmeterData(info.sourceName, volmeter);
        });
        if (shouldNotifyYouAreMuted) {
            this.audioNotificationUpdated.next(AudioNotificationType.YouAreMuted);
        }
        if (shouldNotifyNoSignal) {
            this.audioNotificationUpdated.next(AudioNotificationType.NoSignalFromAudioInput);
        }
    }
    createAudioSource(source) {
        this.sourceData[source.sourceId] = {};
        const obsVolmeter = obs.VolmeterFactory.create(1);
        obsVolmeter.attach(source.getObsInput());
        this.sourceData[source.sourceId].volmeter = obsVolmeter;
        const obsFader = obs.FaderFactory.create(1);
        obsFader.attach(source.getObsInput());
        this.sourceData[source.sourceId].fader = obsFader;
        this.ADD_AUDIO_SOURCE(this.generateAudioSourceData(source.sourceId));
    }
    sendVolmeterData(sourceId, data) {
        if (this.volmeterMessageChannels[sourceId]) {
            this.volmeterMessageChannels[sourceId].forEach(c => c.port.postMessage(data));
        }
    }
    removeAudioSource(sourceId) {
        this.sourceData[sourceId].fader.detach();
        this.sourceData[sourceId].fader.destroy();
        this.sourceData[sourceId].volmeter.detach();
        this.sourceData[sourceId].volmeter.destroy();
        delete this.sourceData[sourceId];
        this.REMOVE_AUDIO_SOURCE(sourceId);
    }
    ADD_AUDIO_SOURCE(source) {
        Vue.set(this.state.audioSources, source.sourceId, source);
    }
    UPDATE_AUDIO_SOURCE(sourceId, patch) {
        Object.assign(this.state.audioSources[sourceId], patch);
    }
    REMOVE_AUDIO_SOURCE(sourceId) {
        Vue.delete(this.state.audioSources, sourceId);
    }
};
AudioService.initialState = {
    audioSources: {},
};
__decorate([
    Inject()
], AudioService.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], AudioService.prototype, "windowsService", void 0);
__decorate([
    Inject()
], AudioService.prototype, "hardwareService", void 0);
__decorate([
    mutation()
], AudioService.prototype, "ADD_AUDIO_SOURCE", null);
__decorate([
    mutation()
], AudioService.prototype, "UPDATE_AUDIO_SOURCE", null);
__decorate([
    mutation()
], AudioService.prototype, "REMOVE_AUDIO_SOURCE", null);
AudioService = AudioService_1 = __decorate([
    InitAfter('SourcesService')
], AudioService);
export { AudioService };
let AudioSource = class AudioSource {
    constructor(sourceId) {
        this.audioSourceState = this.audioService.state.audioSources[sourceId];
        const sourceState = this.sourcesService.state.sources[sourceId] ||
            this.sourcesService.state.temporarySources[sourceId];
        Utils.applyProxy(this, this.audioSourceState);
        Utils.applyProxy(this, sourceState);
    }
    isDestroyed() {
        return !this.audioService.state.audioSources[this.sourceId];
    }
    getModel() {
        return Object.assign(Object.assign({}, this.source.state), this.audioSourceState);
    }
    get monitoringOptions() {
        return [
            { value: 0, label: $t('Monitor Off') },
            {
                value: 1,
                label: $t('Monitor Only (mute output)'),
            },
            { value: 2, label: $t('Monitor and Output') },
        ];
    }
    get source() {
        return this.sourcesService.views.getSource(this.sourceId);
    }
    setSettings(patch) {
        this.audioService.setSettings(this.sourceId, patch);
    }
    setDeflection(deflection) {
        this.audioService.setFader(this.sourceId, { deflection });
    }
    setMul(mul) {
        this.audioService.setFader(this.sourceId, { mul });
    }
    setHidden(hidden) {
        this.audioService.setSettings(this.sourceId, { mixerHidden: hidden });
    }
    setMuted(muted) {
        this.sourcesService.setMuted(this.sourceId, muted);
    }
    subscribeVolmeter(cb) {
        const stream = this.audioService.sourceData[this.sourceId].stream;
        return stream.subscribe(cb);
    }
};
__decorate([
    Inject()
], AudioSource.prototype, "audioService", void 0);
__decorate([
    Inject()
], AudioSource.prototype, "sourcesService", void 0);
AudioSource = __decorate([
    ServiceHelper('AudioService')
], AudioSource);
export { AudioSource };
//# sourceMappingURL=audio.js.map