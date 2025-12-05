var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { PersistentStatefulService } from 'services/core/persistent-stateful-service';
import { EDeviceType } from './hardware';
import { Inject } from 'services/core/injector';
import { E_AUDIO_CHANNELS } from 'services/audio';
import { mutation } from 'services/core';
import { byOS, OS } from 'util/operating-systems';
export class DefaultHardwareService extends PersistentStatefulService {
    init() {
        super.init();
    }
    createTemporarySources() {
        this.audioDevices.forEach(device => {
            this.sourcesService.createSource(device.id, byOS({ [OS.Windows]: 'wasapi_input_capture', [OS.Mac]: 'coreaudio_input_capture' }), { device_id: device.id }, {
                isTemporary: true,
                sourceId: device.id,
            });
        });
        this.videoDevices.forEach(device => {
            const existingSource = this.existingVideoDeviceSources.find(source => source.deviceId === device.id);
            if (existingSource)
                return;
            if (!device.id)
                return;
            this.sourcesService.createSource(device.id, byOS({ [OS.Windows]: 'dshow_input', [OS.Mac]: 'av_capture_input' }), byOS({ [OS.Windows]: { video_device_id: device.id }, [OS.Mac]: { device: device.id } }), {
                isTemporary: true,
                sourceId: device.id,
            });
        });
        if (this.videoDevices[0])
            this.SET_DEVICE('video', this.videoDevices[0].id);
    }
    get existingVideoDeviceSources() {
        const deviceProperty = byOS({ [OS.Windows]: 'video_device_id', [OS.Mac]: 'device' });
        return this.sourcesService.views.sources
            .filter(source => source.type === byOS({ [OS.Windows]: 'dshow_input', [OS.Mac]: 'av_capture_input' }) &&
            this.videoDevices.find(device => device.id === source.getSettings()[deviceProperty]))
            .map(source => ({
            source,
            deviceId: source.getSettings()[deviceProperty],
        }));
    }
    findVideoSource(deviceId) {
        const deviceProperty = byOS({ [OS.Windows]: 'video_device_id', [OS.Mac]: 'device' });
        let found = this.sourcesService.views.sources.find(source => source.type === byOS({ [OS.Windows]: 'dshow_input', [OS.Mac]: 'av_capture_input' }) &&
            source.getSettings()[deviceProperty] === deviceId);
        if (!found) {
            found = this.sourcesService.views.temporarySources.find(source => source.type === byOS({ [OS.Windows]: 'dshow_input', [OS.Mac]: 'av_capture_input' }) &&
                source.getSettings()[deviceProperty] === deviceId);
        }
        return found;
    }
    clearTemporarySources() {
        this.audioDevices.forEach(device => {
            if (!this.sourcesService.views.getSource(device.id))
                return;
            this.sourcesService.removeSource(device.id);
        });
        this.videoDevices.forEach(device => {
            const deviceProperty = byOS({ [OS.Windows]: 'video_device_id', [OS.Mac]: 'device' });
            if (this.sourcesService.views.temporarySources.find(s => s.getSettings()[deviceProperty] === device.id)) {
                this.sourcesService.removeSource(device.id);
            }
        });
    }
    setPresetFilter(filter) {
        this.SET_PRESET_FILTER(filter);
    }
    get videoDevices() {
        return this.hardwareService.dshowDevices.filter(device => EDeviceType.videoInput === device.type);
    }
    get audioDevices() {
        return this.audioService.devices.filter(device => device.type === EDeviceType.audioInput);
    }
    get selectedAudioSource() {
        if (!this.state.defaultAudioDevice)
            return;
        return this.audioService.views.getSource(this.state.defaultAudioDevice);
    }
    get selectedVideoSource() {
        if (!this.state.defaultVideoDevice)
            return;
        const existingSource = this.existingVideoDeviceSources.find(source => source.deviceId === this.state.defaultVideoDevice);
        if (existingSource)
            return existingSource.source;
        return this.sourcesService.views.getSource(this.state.defaultVideoDevice);
    }
    setSceneCollectionAudio(id) {
        const collectionManifest = this.sceneCollectionsService.collections.find(collection => collection.auto);
        const audioSource = this.sourcesService.views.sources.find(source => source.channel === E_AUDIO_CHANNELS.INPUT_1);
        if (audioSource &&
            collectionManifest &&
            this.sceneCollectionsService.activeCollection.id === collectionManifest.id) {
            audioSource.updateSettings({ device_id: id });
        }
    }
    setDefault(type, id) {
        this.SET_DEVICE(type, id);
        if (type === 'audio') {
            this.setSceneCollectionAudio(id);
        }
    }
    toggleMuteNotifications() {
        this.SET_ENABLE_MUTE_NOTIFICATIONS(!this.state.enableMuteNotifications);
    }
    SET_DEVICE(type, id) {
        if (type === 'video') {
            this.state.defaultVideoDevice = id;
        }
        else {
            this.state.defaultAudioDevice = id;
        }
    }
    SET_PRESET_FILTER(filter) {
        this.state.presetFilter = filter;
    }
    SET_ENABLE_MUTE_NOTIFICATIONS(val) {
        this.state.enableMuteNotifications = val;
    }
}
DefaultHardwareService.defaultState = {
    defaultVideoDevice: null,
    defaultAudioDevice: 'default',
    presetFilter: '',
    enableMuteNotifications: true,
};
__decorate([
    Inject()
], DefaultHardwareService.prototype, "hardwareService", void 0);
__decorate([
    Inject()
], DefaultHardwareService.prototype, "audioService", void 0);
__decorate([
    Inject()
], DefaultHardwareService.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], DefaultHardwareService.prototype, "sceneCollectionsService", void 0);
__decorate([
    mutation()
], DefaultHardwareService.prototype, "SET_DEVICE", null);
__decorate([
    mutation()
], DefaultHardwareService.prototype, "SET_PRESET_FILTER", null);
__decorate([
    mutation()
], DefaultHardwareService.prototype, "SET_ENABLE_MUTE_NOTIFICATIONS", null);
//# sourceMappingURL=default-hardware.js.map