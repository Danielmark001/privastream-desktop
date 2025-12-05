var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Service } from 'services/core/service';
import { Inject } from 'services/core/injector';
export var EObsSimpleEncoder;
(function (EObsSimpleEncoder) {
    EObsSimpleEncoder["x264"] = "x264";
    EObsSimpleEncoder["x264_lowcpu"] = "x264_lowcpu";
    EObsSimpleEncoder["nvenc"] = "nvenc";
    EObsSimpleEncoder["amd"] = "amd";
    EObsSimpleEncoder["qsv"] = "qsv";
    EObsSimpleEncoder["jim_nvenc"] = "jim_nvenc";
})(EObsSimpleEncoder || (EObsSimpleEncoder = {}));
var EObsAdvancedEncoder;
(function (EObsAdvancedEncoder) {
    EObsAdvancedEncoder["ffmpeg_nvenc"] = "ffmpeg_nvenc";
    EObsAdvancedEncoder["obs_x264"] = "obs_x264";
    EObsAdvancedEncoder["amd_amf_h264"] = "amd_amf_h264";
    EObsAdvancedEncoder["obs_qsv11"] = "obs_qsv11";
    EObsAdvancedEncoder["jim_nvenc"] = "jim_nvenc";
})(EObsAdvancedEncoder || (EObsAdvancedEncoder = {}));
export var EEncoderFamily;
(function (EEncoderFamily) {
    EEncoderFamily["x264"] = "x264";
    EEncoderFamily["qsv"] = "qsv";
    EEncoderFamily["nvenc"] = "nvenc";
    EEncoderFamily["jim_nvenc"] = "jim_nvenc";
    EEncoderFamily["amd"] = "amd";
})(EEncoderFamily || (EEncoderFamily = {}));
var EFileFormat;
(function (EFileFormat) {
    EFileFormat["flv"] = "flv";
    EFileFormat["mp4"] = "mp4";
    EFileFormat["mov"] = "mov";
    EFileFormat["mkv"] = "mkv";
    EFileFormat["ts"] = "ts";
    EFileFormat["m3u8"] = "m3u8";
    EFileFormat["mpegts"] = "mpegts";
    EFileFormat["hls"] = "hls";
})(EFileFormat || (EFileFormat = {}));
export const QUALITY_ORDER = [
    'ultrafast',
    'superfast',
    'veryfast',
    'faster',
    'fast',
    'medium',
    'slow',
    'slower',
    'hp',
    'fast',
    'bd',
    'llhp',
    'default',
    'll',
    'llhq',
    'hq',
    'medium',
    'slow',
    'losslesshp',
    'lossless',
    'speed',
    'balanced',
    'quality',
];
const simpleEncoderToAnvancedEncoderMap = {
    [EObsSimpleEncoder.x264]: EObsAdvancedEncoder.obs_x264,
    [EObsSimpleEncoder.x264_lowcpu]: EObsAdvancedEncoder.obs_x264,
    [EObsSimpleEncoder.qsv]: EObsAdvancedEncoder.obs_qsv11,
    [EObsSimpleEncoder.nvenc]: EObsAdvancedEncoder.ffmpeg_nvenc,
    [EObsSimpleEncoder.jim_nvenc]: EObsAdvancedEncoder.jim_nvenc,
    [EObsSimpleEncoder.amd]: EObsAdvancedEncoder.amd_amf_h264,
};
export const encoderFieldsMap = {
    [EEncoderFamily.x264]: { preset: 'preset', encoderOptions: 'x264opts' },
    [EEncoderFamily.nvenc]: { preset: 'preset' },
    [EEncoderFamily.jim_nvenc]: { preset: 'preset' },
    [EEncoderFamily.qsv]: { preset: 'target_usage' },
    [EEncoderFamily.amd]: { preset: 'QualityPreset' },
};
export function simpleEncoderToAdvancedEncoder(encoder) {
    return simpleEncoderToAnvancedEncoderMap[encoder];
}
export function obsEncoderToEncoderFamily(obsEncoder) {
    switch (obsEncoder) {
        case EObsAdvancedEncoder.obs_x264:
        case EObsSimpleEncoder.x264:
        case EObsSimpleEncoder.x264_lowcpu:
            return EEncoderFamily.x264;
        case EObsSimpleEncoder.qsv:
        case EObsAdvancedEncoder.obs_qsv11:
            return EEncoderFamily.qsv;
        case EObsSimpleEncoder.nvenc:
        case EObsAdvancedEncoder.ffmpeg_nvenc:
            return EEncoderFamily.nvenc;
        case EObsAdvancedEncoder.jim_nvenc:
            return EEncoderFamily.jim_nvenc;
        case EObsSimpleEncoder.amd:
        case EObsAdvancedEncoder.amd_amf_h264:
            return EEncoderFamily.amd;
    }
}
export class OutputSettingsService extends Service {
    getSettings() {
        const output = this.settingsService.state.Output.formData;
        const video = this.settingsService.state.Video.formData;
        const mode = this.settingsService.findSettingValue(output, 'Untitled', 'Mode');
        const inputResolution = this.settingsService.findSettingValue(video, 'Untitled', 'Base');
        const streaming = this.getStreamingEncoderSettings(output, video);
        const recording = this.getRecordingEncoderSettings(output, video, mode, streaming);
        const replayBuffer = {
            enabled: this.settingsService.findSettingValue(output, 'Replay Buffer', 'RecRB'),
            time: this.settingsService.findSettingValue(output, 'Replay Buffer', 'RecRBTime'),
        };
        const framerate = {
            type: this.settingsService.findSettingValue(video, 'Untitled', 'FPSType'),
            common: this.settingsService.findSettingValue(video, 'Untitled', 'FPSCommon'),
            integer: this.settingsService.findSettingValue(video, 'Untitled', 'FPSInt'),
            fracNum: this.settingsService.findSettingValue(video, 'Untitled', 'FPSNum'),
            fracDen: this.settingsService.findSettingValue(video, 'Untitled', 'FPSDen'),
        };
        return {
            mode,
            inputResolution,
            framerate,
            streaming,
            recording,
            replayBuffer,
        };
    }
    getStreamingSettings() {
        const output = this.settingsService.state.Output.formData;
        const mode = this.settingsService.findSettingValue(output, 'Untitled', 'Mode');
        const convertedEncoderName = this.convertEncoderToNewAPI(this.getSettings().streaming.encoder);
        const videoEncoder = convertedEncoderName === EObsSimpleEncoder.x264_lowcpu
            ? EObsAdvancedEncoder.obs_x264
            : convertedEncoderName;
        const enforceBitrateKey = mode === 'Advanced' ? 'ApplyServiceSettings' : 'EnforceBitrate';
        const enforceServiceBitrate = this.settingsService.findSettingValue(output, 'Streaming', enforceBitrateKey);
        const enableTwitchVOD = this.settingsService.findSettingValue(output, 'Streaming', 'VodTrackEnabled');
        const useAdvanced = this.settingsService.findSettingValue(output, 'Streaming', 'UseAdvanced');
        const customEncSettings = this.settingsService.findSettingValue(output, 'Streaming', 'x264Settings');
        const rescaling = this.settingsService.findSettingValue(output, 'Recording', 'RecRescale');
        if (mode === 'Advanced') {
            const twitchTrack = 3;
            return {
                videoEncoder,
                enforceServiceBitrate,
                enableTwitchVOD,
                twitchTrack,
                rescaling,
            };
        }
        else {
            return {
                videoEncoder,
                enforceServiceBitrate,
                enableTwitchVOD,
                useAdvanced,
                customEncSettings,
            };
        }
    }
    getRecordingSettings() {
        const output = this.settingsService.state.Output.formData;
        const advanced = this.settingsService.state.Advanced.formData;
        const mode = this.settingsService.findSettingValue(output, 'Untitled', 'Mode');
        const pathKey = mode === 'Advanced' ? 'RecFilePath' : 'FilePath';
        const path = this.settingsService.findSettingValue(output, 'Recording', pathKey);
        const format = this.settingsService.findValidListValue(output, 'Recording', 'RecFormat');
        const oldQualityName = this.settingsService.findSettingValue(output, 'Recording', 'RecQuality');
        let quality = 2;
        switch (oldQualityName) {
            case 'Small':
                quality = 1;
                break;
            case 'HQ':
                quality = 2;
                break;
            case 'Lossless':
                quality = 3;
                break;
            case 'Stream':
                quality = 0;
                break;
        }
        const convertedEncoderName = this.convertEncoderToNewAPI(this.getSettings().recording.encoder);
        const videoEncoder = convertedEncoderName === EObsSimpleEncoder.x264_lowcpu
            ? EObsAdvancedEncoder.obs_x264
            : convertedEncoderName;
        const lowCPU = convertedEncoderName === EObsSimpleEncoder.x264_lowcpu;
        const overwrite = this.settingsService.findSettingValue(advanced, 'Recording', 'OverwriteIfExists');
        const noSpace = this.settingsService.findSettingValue(output, 'Recording', 'FileNameWithoutSpace');
        const prefix = this.settingsService.findSettingValue(output, 'Recording', 'RecRBPrefix');
        const suffix = this.settingsService.findSettingValue(output, 'Recording', 'RecRBSuffix');
        const duration = this.settingsService.findSettingValue(output, 'Stream Delay', 'DelaySec');
        if (mode === 'Advanced') {
            const mixer = this.settingsService.findSettingValue(output, 'Recording', 'RecTracks');
            const rescaling = this.settingsService.findSettingValue(output, 'Recording', 'RecRescale');
            const useStreamEncoders = this.settingsService.findSettingValue(output, 'Recording', 'RecEncoder') === 'none';
            return {
                path,
                format,
                overwrite,
                noSpace,
                mixer,
                rescaling,
                useStreamEncoders,
                videoEncoder,
                prefix,
                suffix,
                duration,
            };
        }
        else {
            return {
                path,
                format,
                quality,
                videoEncoder,
                lowCPU,
                overwrite,
                noSpace,
                prefix,
                suffix,
                duration,
            };
        }
    }
    getReplayBufferSettings() {
        const output = this.settingsService.state.Output.formData;
        const advanced = this.settingsService.state.Advanced.formData;
        const mode = this.settingsService.findSettingValue(output, 'Untitled', 'Mode');
        const pathKey = mode === 'Advanced' ? 'RecFilePath' : 'FilePath';
        const path = this.settingsService.findSettingValue(output, 'Recording', pathKey);
        const format = this.settingsService.findValidListValue(output, 'Recording', 'RecFormat');
        const oldQualityName = this.settingsService.findSettingValue(output, 'Recording', 'RecQuality');
        let quality = 2;
        switch (oldQualityName) {
            case 'Small':
                quality = 1;
                break;
            case 'HQ':
                quality = 2;
                break;
            case 'Lossless':
                quality = 3;
                break;
            case 'Stream':
                quality = 0;
                break;
        }
        const overwrite = this.settingsService.findSettingValue(advanced, 'Recording', 'OverwriteIfExists');
        const noSpace = this.settingsService.findSettingValue(output, 'Recording', 'FileNameWithoutSpace');
        const prefix = this.settingsService.findSettingValue(advanced, 'Replay Buffer', 'RecRBPrefix');
        const suffix = this.settingsService.findSettingValue(advanced, 'Replay Buffer', 'RecRBSuffix');
        const duration = this.settingsService.findSettingValue(output, 'Replay Buffer', 'RecRBTime');
        const useStreamEncoders = this.settingsService.findSettingValue(output, 'Recording', 'RecEncoder') === 'none';
        if (mode === 'Advanced') {
            const mixer = this.settingsService.findSettingValue(output, 'Recording', 'RecTracks');
            return {
                path,
                format,
                overwrite,
                noSpace,
                mixer,
                useStreamEncoders,
                prefix,
                suffix,
                duration,
            };
        }
        else {
            return {
                path,
                format,
                overwrite,
                noSpace,
                prefix,
                suffix,
                duration,
                useStreamEncoders,
            };
        }
    }
    getSimpleRecordingSettings() {
        const output = this.settingsService.state.Output.formData;
        const advanced = this.settingsService.state.Advanced.formData;
        const path = this.settingsService.findSettingValue(output, 'Recording', 'FilePath');
        const format = this.settingsService.findValidListValue(output, 'Recording', 'RecFormat');
        const oldQualityName = this.settingsService.findSettingValue(output, 'Recording', 'RecQuality');
        let quality = 2;
        switch (oldQualityName) {
            case 'Small':
                quality = 1;
                break;
            case 'HQ':
                quality = 2;
                break;
            case 'Lossless':
                quality = 3;
                break;
            case 'Stream':
                quality = 0;
                break;
        }
        const convertedEncoderName = this.convertEncoderToNewAPI(this.getSettings().recording.encoder);
        const encoder = convertedEncoderName === EObsSimpleEncoder.x264_lowcpu
            ? EObsAdvancedEncoder.obs_x264
            : convertedEncoderName;
        const lowCPU = convertedEncoderName === EObsSimpleEncoder.x264_lowcpu;
        const overwrite = this.settingsService.findSettingValue(advanced, 'Recording', 'OverwriteIfExists');
        const noSpace = this.settingsService.findSettingValue(output, 'Recording', 'FileNameWithoutSpace');
        const prefix = this.settingsService.findSettingValue(output, 'Recording', 'RecRBPrefix');
        const suffix = this.settingsService.findSettingValue(output, 'Recording', 'RecRBSuffix');
        const duration = this.settingsService.findSettingValue(output, 'Stream Delay', 'DelaySec');
        return {
            path,
            format,
            quality,
            encoder,
            lowCPU,
            overwrite,
            noSpace,
            prefix,
            suffix,
            duration,
        };
    }
    getAdvancedRecordingSettings() {
        const output = this.settingsService.state.Output.formData;
        const advanced = this.settingsService.state.Advanced.formData;
        const path = this.settingsService.findSettingValue(output, 'Recording', 'RecFilePath');
        const rescaling = this.settingsService.findSettingValue(output, 'Recording', 'RecRescale');
        const mixer = this.settingsService.findSettingValue(output, 'Recording', 'RecTracks');
        const prefix = this.settingsService.findSettingValue(output, 'Recording', 'RecRBPrefix');
        const suffix = this.settingsService.findSettingValue(output, 'Recording', 'RecRBSuffix');
        const duration = this.settingsService.findSettingValue(output, 'Stream Delay', 'DelaySec');
        const useStreamEncoders = this.settingsService.findSettingValue(output, 'Recording', 'RecEncoder') === 'none';
        const convertedEncoderName = this.convertEncoderToNewAPI(this.getSettings().recording.encoder);
        const encoder = convertedEncoderName === EObsSimpleEncoder.x264_lowcpu
            ? EObsAdvancedEncoder.obs_x264
            : convertedEncoderName;
        const format = this.settingsService.findValidListValue(output, 'Recording', 'RecFormat');
        const overwrite = this.settingsService.findSettingValue(advanced, 'Recording', 'OverwriteIfExists');
        const noSpace = this.settingsService.findSettingValue(output, 'Recording', 'RecFileNameWithoutSpace');
        return {
            path,
            format,
            encoder,
            overwrite,
            noSpace,
            rescaling,
            mixer,
            prefix,
            suffix,
            duration,
            useStreamEncoders,
        };
    }
    getStreamingEncoderSettings(output, video) {
        const encoder = obsEncoderToEncoderFamily(this.settingsService.findSettingValue(output, 'Streaming', 'Encoder') ||
            this.settingsService.findSettingValue(output, 'Streaming', 'StreamEncoder'));
        let preset;
        if (encoder === 'amd') {
            preset = [
                this.settingsService.findValidListValue(output, 'Streaming', 'QualityPreset'),
                this.settingsService.findValidListValue(output, 'Streaming', 'AMDPreset'),
            ].find(item => item !== void 0);
        }
        else {
            preset = [
                this.settingsService.findValidListValue(output, 'Streaming', 'preset'),
                this.settingsService.findValidListValue(output, 'Streaming', 'Preset'),
                this.settingsService.findValidListValue(output, 'Streaming', 'NVENCPreset'),
                this.settingsService.findValidListValue(output, 'Streaming', 'QSVPreset'),
                this.settingsService.findValidListValue(output, 'Streaming', 'target_usage'),
            ].find(item => item !== void 0);
        }
        const bitrate = this.settingsService.findSettingValue(output, 'Streaming', 'bitrate') ||
            this.settingsService.findSettingValue(output, 'Streaming', 'VBitrate');
        const outputResolution = this.settingsService.findSettingValue(output, 'Streaming', 'RescaleRes') ||
            this.settingsService.findSettingValue(video, 'Untitled', 'Output');
        const encoderOptions = this.settingsService.findSettingValue(output, 'Streaming', 'x264Settings') ||
            this.settingsService.findSettingValue(output, 'Streaming', 'x264opts');
        const rescaleOutput = this.settingsService.findSettingValue(output, 'Streaming', 'Rescale');
        const resolutions = this.settingsService
            .findSetting(video, 'Untitled', 'Output')
            .options.map((option) => option.value);
        const hasCustomResolution = !resolutions.includes(outputResolution);
        const rateControl = this.settingsService.findSettingValue(output, 'Streaming', 'rate_control');
        return {
            encoder,
            preset,
            bitrate,
            outputResolution,
            encoderOptions,
            rescaleOutput,
            hasCustomResolution,
            rateControl,
        };
    }
    getRecordingEncoderSettings(output, video, mode, streamingSettings) {
        const path = mode === 'Simple'
            ? this.settingsService.findSettingValue(output, 'Recording', 'FilePath')
            : this.settingsService.findSettingValue(output, 'Recording', 'RecFilePath');
        const format = this.settingsService.findValidListValue(output, 'Recording', 'RecFormat');
        const recEncoder = this.settingsService.findSettingValue(output, 'Recording', 'RecEncoder');
        let encoder = obsEncoderToEncoderFamily(recEncoder);
        const outputResolution = this.settingsService.findSettingValue(output, 'Recording', 'RecRescaleRes') ||
            this.settingsService.findSettingValue(video, 'Untitled', 'Output');
        const quality = this.settingsService.findValidListValue(output, 'Recording', 'RecQuality');
        let bitrate;
        let rateControl = this.settingsService.findSettingValue(output, 'Recording', 'Recrate_control');
        let isSameAsStream = false;
        if (mode === 'Simple') {
            switch (quality) {
                case 'Small':
                    bitrate = 15000;
                    break;
                case 'HQ':
                    bitrate = 30000;
                    break;
                case 'Lossless':
                    bitrate = 80000;
                    break;
                case 'Stream':
                    isSameAsStream = true;
                    bitrate = streamingSettings.bitrate;
                    encoder = streamingSettings.encoder;
                    break;
            }
        }
        else {
            if (recEncoder === 'none') {
                isSameAsStream = true;
                bitrate = streamingSettings.bitrate;
                encoder = streamingSettings.encoder;
                rateControl = streamingSettings.rateControl;
            }
            else {
                bitrate = this.settingsService.findSettingValue(output, 'Recording', 'Recbitrate');
            }
        }
        return {
            path,
            format,
            encoder,
            outputResolution,
            bitrate,
            rateControl,
            isSameAsStream,
        };
    }
    setSettings(settingsPatch) {
        if (settingsPatch.mode) {
            this.settingsService.setSettingValue('Output', 'Mode', settingsPatch.mode);
        }
        const currentSettings = this.getSettings();
        if (settingsPatch.inputResolution) {
            const [width, height] = settingsPatch.inputResolution.split('x');
            this.videoSettingsService.setVideoSetting('baseWidth', Number(width));
            this.videoSettingsService.setVideoSetting('baseHeight', Number(height));
        }
        if (settingsPatch.streaming) {
            this.setStreamingEncoderSettings(currentSettings, settingsPatch.streaming);
        }
        if (settingsPatch.recording) {
            this.setRecordingEncoderSettings(currentSettings, settingsPatch.recording);
        }
        if (settingsPatch.replayBuffer)
            this.setReplayBufferSettings(settingsPatch.replayBuffer);
    }
    setReplayBufferSettings(replayBufferSettings) {
        if (replayBufferSettings.enabled != null) {
            this.settingsService.setSettingValue('Output', 'RecRB', replayBufferSettings.enabled);
        }
        if (replayBufferSettings.time != null) {
            this.settingsService.setSettingValue('Output', 'RecRBTime', replayBufferSettings.time);
        }
    }
    setStreamingEncoderSettings(currentSettings, settingsPatch) {
        if (settingsPatch.encoder) {
            if (currentSettings.mode === 'Advanced') {
                this.settingsService.setSettingValue('Output', 'Encoder', simpleEncoderToAdvancedEncoder(settingsPatch.encoder));
            }
            else {
                this.settingsService.setSettingValue('Output', 'StreamEncoder', simpleEncoderToAdvancedEncoder(settingsPatch.encoder));
            }
        }
        const encoder = settingsPatch.encoder || currentSettings.streaming.encoder;
        if (settingsPatch.outputResolution) {
            this.settingsService.setSettingValue('Video', 'Output', settingsPatch.outputResolution);
        }
        if (settingsPatch.preset) {
            this.settingsService.setSettingValue('Output', encoderFieldsMap[encoder].preset, settingsPatch.preset);
        }
        if (settingsPatch.encoderOptions !== void 0 && encoder === 'x264') {
            this.settingsService.setSettingValue('Output', encoderFieldsMap[encoder].encoderOptions, settingsPatch.encoderOptions);
        }
        if (settingsPatch.rescaleOutput !== void 0) {
            this.settingsService.setSettingValue('Output', 'Rescale', settingsPatch.rescaleOutput);
        }
        if (settingsPatch.bitrate !== void 0) {
            if (currentSettings.mode === 'Advanced') {
                this.settingsService.setSettingValue('Output', 'bitrate', settingsPatch.bitrate);
            }
            else {
                this.settingsService.setSettingValue('Output', 'VBitrate', settingsPatch.bitrate);
            }
        }
    }
    setRecordingEncoderSettings(currentSettings, settingsPatch) {
        const mode = currentSettings.mode;
        if (settingsPatch.format) {
            this.settingsService.setSettingValue('Output', 'RecFormat', settingsPatch.format);
        }
        if (settingsPatch.path) {
            this.settingsService.setSettingValue('Output', mode === 'Simple' ? 'FilePath' : 'RecFilePath', settingsPatch.path);
        }
        if (settingsPatch.encoder) {
            this.settingsService.setSettingValue('Output', 'RecEncoder', simpleEncoderToAdvancedEncoder(settingsPatch.encoder));
        }
        if (settingsPatch.bitrate) {
            this.settingsService.setSettingValue('Output', 'Recbitrate', settingsPatch.bitrate);
        }
    }
    convertEncoderToNewAPI(encoder) {
        switch (encoder) {
            case EObsSimpleEncoder.x264:
                return EObsAdvancedEncoder.obs_x264;
            case EObsSimpleEncoder.nvenc:
                return EObsAdvancedEncoder.ffmpeg_nvenc;
            case EObsSimpleEncoder.amd:
                return EObsAdvancedEncoder.amd_amf_h264;
            case EObsSimpleEncoder.qsv:
                return EObsAdvancedEncoder.obs_qsv11;
            case EObsSimpleEncoder.jim_nvenc:
                return EObsAdvancedEncoder.jim_nvenc;
            case EObsSimpleEncoder.x264_lowcpu:
                return EObsSimpleEncoder.x264_lowcpu;
        }
    }
    getIsEnhancedBroadcasting() {
        try {
            const enhancedBroadcasting = this.settingsService.isEnhancedBroadcasting();
            return enhancedBroadcasting ? 'Enabled' : 'Disabled';
        }
        catch (e) {
            console.error('Error getting enhanced broadcasting setting:', e);
            return 'Unknown';
        }
    }
}
__decorate([
    Inject()
], OutputSettingsService.prototype, "settingsService", void 0);
__decorate([
    Inject()
], OutputSettingsService.prototype, "audioService", void 0);
__decorate([
    Inject()
], OutputSettingsService.prototype, "videoSettingsService", void 0);
__decorate([
    Inject()
], OutputSettingsService.prototype, "highlighterService", void 0);
//# sourceMappingURL=output-settings.js.map