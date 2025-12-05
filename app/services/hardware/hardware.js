var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { mutation, StatefulService } from '../core/stateful-service';
import * as obs from '../../../obs-api';
import { Inject } from 'services/core';
export var EDeviceType;
(function (EDeviceType) {
    EDeviceType["audioInput"] = "audioInput";
    EDeviceType["audioOutput"] = "audioOutput";
    EDeviceType["videoInput"] = "videoInput";
})(EDeviceType || (EDeviceType = {}));
export class HardwareService extends StatefulService {
    init() {
        this.refreshDevices();
        this.usageStatisticsService.recordAnalyticsEvent('Hardware', {
            webcams: this.state.dshowDevices.map(d => d.description),
            microphones: this.state.devices
                .filter(d => d.type === 'audioInput' && d.id !== 'default')
                .map(d => d.description),
        });
    }
    get devices() {
        return this.state.devices;
    }
    get dshowDevices() {
        return this.state.dshowDevices;
    }
    refreshDevices(audioOnly = false) {
        this.SET_DEVICES(this.fetchDevices(audioOnly));
    }
    fetchDevices(audioOnly) {
        const devices = [];
        let dshowDevices = [];
        obs.NodeObs.OBS_settings_getInputAudioDevices().forEach(device => {
            if (device.description === 'NVIDIA Broadcast') {
                this.usageStatisticsService.recordFeatureUsage('NvidiaVirtualMic');
            }
            devices.push({
                id: device.id,
                description: device.description,
                type: EDeviceType.audioInput,
            });
        });
        obs.NodeObs.OBS_settings_getOutputAudioDevices().forEach(device => {
            devices.push({
                id: device.id,
                description: device.description,
                type: EDeviceType.audioOutput,
            });
        });
        if (audioOnly) {
            dshowDevices = this.state.dshowDevices;
        }
        else {
            obs.NodeObs.OBS_settings_getVideoDevices().forEach(device => {
                if (device.description === 'NVIDIA Broadcast') {
                    this.usageStatisticsService.recordFeatureUsage('NvidiaVirtualCam');
                }
                dshowDevices.push({
                    id: device.id,
                    description: device.description,
                    type: EDeviceType.videoInput,
                });
            });
        }
        return { devices, dshowDevices };
    }
    SET_DEVICES(devices) {
        this.state.devices = devices.devices;
        this.state.dshowDevices = devices.dshowDevices;
    }
}
HardwareService.initialState = {
    devices: [],
    dshowDevices: [],
};
__decorate([
    Inject()
], HardwareService.prototype, "usageStatisticsService", void 0);
__decorate([
    mutation()
], HardwareService.prototype, "SET_DEVICES", null);
//# sourceMappingURL=hardware.js.map