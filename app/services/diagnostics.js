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
import { InitAfter, Inject, mutation, PersistentStatefulService } from 'services/core';
import { EEncoderFamily } from './settings';
import * as cp from 'child_process';
import prettyBytes from 'pretty-bytes';
import Utils from './utils';
import os from 'os';
import { EDeviceType } from './hardware';
import { EStreamingState } from './streaming';
import Vue from 'vue';
import { jfetch } from 'util/requests';
import { getOS, OS } from 'util/operating-systems';
import * as remote from '@electron/remote';
import fs from 'fs';
import path from 'path';
import { platformList } from './platforms';
import { getWmiClass } from 'util/wmi';
class Accumulator {
    constructor() {
        this.average = 0;
        this.nSamples = 0;
        this.lastValue = null;
    }
    sample(val) {
        this.lastValue = val;
        this.average = (this.average * this.nSamples + val) / (this.nSamples + 1);
        this.nSamples++;
    }
}
const STREAM_HISTORY_LENGTH = 5;
const STATS_FLUSH_INTERVAL = 60 * 1000;
class Section {
    constructor(title, data) {
        this.str = '';
        this.wl('-'.repeat(title.length + 4));
        this.wl(`| ${title} |`);
        this.wl('-'.repeat(title.length + 4));
        this.wl();
        if (typeof data === 'object') {
            this.printObj(data);
        }
        else {
            this.wl(data);
        }
        this.wl();
    }
    printObj(data, indent = 0, itemInd) {
        if (Array.isArray(data)) {
            data.forEach((item, i) => {
                if (typeof item === 'object' && item != null) {
                    this.printObj(item, indent, i + 1);
                }
                else {
                    this.wl(`${' '.repeat(indent)}${i + 1}. ${item !== null && item !== void 0 ? item : ''}`);
                }
            });
            return;
        }
        Object.keys(data).forEach((key, i) => {
            let prefix = ' '.repeat(indent);
            if (itemInd != null) {
                if (i === 0) {
                    prefix += `${itemInd}. `;
                }
                else {
                    prefix += '   ';
                }
            }
            const value = data[key];
            if (typeof value === 'object' && value != null) {
                this.wl(`${prefix}${key}:`);
                this.printObj(value, indent + (itemInd != null ? 5 : 2));
            }
            else {
                this.wl(`${prefix}${key}: ${value !== null && value !== void 0 ? value : ''}`);
            }
        });
    }
    wl(line = '') {
        this.str += `${line}\n`;
    }
    toString() {
        return this.str;
    }
}
let DiagnosticsService = class DiagnosticsService extends PersistentStatefulService {
    constructor() {
        super(...arguments);
        this.accumulators = {};
        this.streaming = false;
    }
    get cacheDir() {
        return this.appService.appDataDirectory;
    }
    get hasRecentlyStreamed() {
        return this.state.streams.length > 0;
    }
    get isFrequentUser() {
        const numStreams = this.state.streams.reduce((num, stream) => {
            const streamDate = new Date(stream.endTime);
            const today = new Date(Date.now());
            const numDaysSinceStream = Math.floor((today.getTime() - streamDate.getTime()) / (1000 * 3600 * 24));
            if (numDaysSinceStream >= 30) {
                num = num + 1;
                return num;
            }
        }, 0);
        return numStreams > 4;
    }
    init() {
        super.init();
        this.streamingService.streamingStatusChange.subscribe(state => {
            if (state === EStreamingState.Live) {
                if (this.streaming)
                    return;
                this.streaming = true;
                const { platforms, destinations, type, enhancedBroadcasting } = this.formatStreamInfo();
                this.ADD_STREAM({
                    startTime: Date.now(),
                    platforms,
                    destinations,
                    type,
                    enhancedBroadcasting,
                });
                this.accumulators.skipped = new Accumulator();
                this.accumulators.lagged = new Accumulator();
                this.accumulators.dropped = new Accumulator();
                this.accumulators.fps = new Accumulator();
                this.accumulators.cpu = new Accumulator();
            }
            if (state === EStreamingState.Offline) {
                this.saveAccumulators();
                this.UPDATE_STREAM({ endTime: Date.now() });
                this.streaming = false;
                this.accumulators = {};
            }
        });
        this.performanceService.statisticsUpdated.subscribe(stats => {
            if (!this.streaming)
                return;
            this.accumulators.skipped.sample(stats.percentageSkippedFrames);
            this.accumulators.lagged.sample(stats.percentageLaggedFrames);
            this.accumulators.dropped.sample(stats.percentageDroppedFrames);
            this.accumulators.cpu.sample(stats.CPU);
            this.accumulators.fps.sample(stats.frameRate);
        });
        this.streamingService.streamErrorCreated.subscribe((error) => {
            const { platforms, destinations, type } = this.formatStreamInfo();
            this.UPDATE_STREAM({ error, platforms, destinations, type });
        });
        setInterval(() => {
            this.saveAccumulators();
        }, STATS_FLUSH_INTERVAL);
    }
    saveAccumulators() {
        if (!this.streaming)
            return;
        this.UPDATE_STREAM({
            pctSkipped: this.accumulators.skipped.lastValue,
            pctLagged: this.accumulators.lagged.lastValue,
            pctDropped: this.accumulators.dropped.lastValue,
            avgFps: this.accumulators.fps.average,
            avgCpu: this.accumulators.cpu.average,
        });
    }
    generateReport() {
        return __awaiter(this, void 0, void 0, function* () {
            this.problems = [];
            const top = yield this.generateTopSection();
            const user = this.generateUserSection();
            const system = this.generateSystemSection();
            const config = this.generateConfigurationSection();
            const video = this.generateVideoSection();
            const output = this.generateOutputSection();
            const audio = this.generateAudioSection();
            const devices = this.generateDevicesSection();
            const scenes = this.generateScenesSection();
            const transitions = this.generateTransitionsSection();
            const streams = this.generateStreamsSection();
            const network = this.generateNetworkSection();
            const crashes = this.generateCrashesSection();
            const dualOutput = this.generateDualOutputSection();
            const vision = this.generateVisionSection();
            const problems = this.generateProblemsSection();
            const report = [
                top,
                problems,
                user,
                system,
                config,
                streams,
                crashes,
                video,
                output,
                network,
                audio,
                devices,
                dualOutput,
                scenes,
                transitions,
                vision,
            ];
            return report.join('');
        });
    }
    uploadReport() {
        return __awaiter(this, void 0, void 0, function* () {
            const formData = new FormData();
            formData.append('content', yield this.generateReport());
            return jfetch('https://streamlabs.com/api/v6/desktop/reports', {
                method: 'POST',
                body: formData,
            });
        });
    }
    logProblem(problem) {
        this.problems.push(problem);
    }
    formatTargets(arr) {
        if (!arr.length)
            return 'None';
        return JSON.stringify(arr).slice(1, -1);
    }
    validatePlatforms(platforms) {
        const platformNames = platforms.replace(/"/g, '').split(',');
        if (!platformNames.length) {
            return 'None';
        }
        const names = platformNames.map(platform => {
            if (/^\d+$/.test(platform)) {
                const index = parseInt(platform, 10);
                return platformList[index];
            }
            return platform;
        });
        return JSON.stringify(names).slice(1, -1);
    }
    formatSimpleOutputInfo() {
        const settings = this.outputSettingsService.getSettings();
        const values = this.settingsService.views.values.Output;
        return {
            Mode: settings.mode,
            Streaming: {
                'Video Bitrate': settings.streaming.bitrate,
                Encoder: settings.streaming.encoder === EEncoderFamily.jim_nvenc
                    ? 'NVENC (New)'
                    : settings.streaming.encoder,
                'Audio Bitrate': values.ABitrate,
                'Enable Advanced Encoder Settings': values.UseAdvanced,
                'Advanced Encoder Settings': {
                    'Enforce Streaming Service Bitrate Limits': values.EnforceBitrate,
                    'Encoder Preset': settings.streaming.preset,
                    'Custom Encoder Settings': values.x264Settings,
                },
            },
            Recording: {
                'Recording Path': values.RecFilePath,
                'Generate File Name without Space': values.FileNameWithoutSpace,
                'Recording Quality': values.RecQuality,
                'Recording Format': values.RecFormat,
                'Audio Encoder': values.RecAEncoder,
                'Custom Muxer Settings': values.MuxerCustom,
            },
            ReplayBuffer: {
                'Enable Replay Buffer': values.RecRB,
                'Maximum Replay Time (Seconds)': values.RecRBTime,
            },
        };
    }
    formatAdvancedOutputInfo() {
        const settings = this.outputSettingsService.getSettings();
        const values = this.settingsService.views.values.Output;
        return {
            Mode: settings.mode,
            Streaming: {
                'Audio Track': this.settingsService.views.streamTrack + 1,
                Encoder: settings.streaming.encoder === EEncoderFamily.jim_nvenc
                    ? 'NVENC (New)'
                    : settings.streaming.encoder,
                'Enforce Streaming Service Encoder Settings': values.ApplyServiceSettings,
                'Rescale Output': settings.streaming.rescaleOutput,
                'Rate Control': settings.streaming.rateControl,
                Bitrate: settings.streaming.bitrate,
                'Use Custom Buffer Size': values.use_bufsize,
                'Buffer Size': values.buffer_size,
                'Keyframe Interval': values.keyint_sec,
                'CPU Usage Preset': values.preset,
                Profile: values.profile,
                Tune: values.tune,
                'x264 Options': values.x264opts,
                Other: {
                    'Use Custom Resolution': settings.streaming.hasCustomResolution,
                    'Output Resolution': settings.streaming.outputResolution,
                    'Encoder Preset': settings.streaming.preset,
                    'Encoder Options': settings.streaming.encoderOptions,
                    'VOD Track': this.settingsService.views.vodTrack + 1,
                    'VOD Track Enabled': !!this.settingsService.views.vodTrackEnabled,
                },
            },
            Recording: {
                Type: values.RecType,
                'Recording Path': values.RecFilePath,
                'Generate File Name without Space': values.FileNameWithoutSpace,
                'Recording Format': values.RecFormat,
                'Audio Track': values.RecTracks,
                'Video Encoder': values.RecEncoder,
                'Audio Encoder': values.RecAEncoder,
                'Rescale Output': values.RecRescale,
                'Custom Muxer Settings': values.MuxerCustom,
                'Automatic File Splitting': values.RecSplitFile,
                'File Splitting Settings': {
                    'Split By': values.RecSplitFileType,
                    'Split Time in Minutes': values.RecSplitFileTime,
                    'Reset Timestamps at the Beginning of Each Split File': values.RecSplitFileResetTimestamps,
                },
                Other: {
                    'Using Stream Encoder': settings.recording.isSameAsStream,
                    Encoder: settings.recording.encoder === EEncoderFamily.jim_nvenc
                        ? 'NVENC (New)'
                        : settings.recording.encoder,
                    'Rate Control': settings.recording.rateControl,
                    Bitrate: settings.recording.bitrate,
                    'Output Resolution': settings.recording.outputResolution,
                    'Audio Tracks': this.settingsService.views.recordingTracks.map(t => t + 1).join(', '),
                },
            },
            Audio: {
                'Track 1 - Audio Bitrate': values.Track1Bitrate,
                'Track 1 - Audio Name': values.Track1Name,
                'Track 2 - Audio Bitrate': values.Track2Bitrate,
                'Track 2 - Audio Name': values.Track2Name,
                'Track 3 - Audio Bitrate': values.Track3Bitrate,
                'Track 3 - Audio Name': values.Track3Name,
                'Track 4 - Audio Bitrate': values.Track4Bitrate,
                'Track 4 - Audio Name': values.Track4Name,
                'Track 5 - Audio Bitrate': values.Track5Bitrate,
                'Track 5 - Audio Name': values.Track5Name,
                'Track 6 - Audio Bitrate': values.Track6Bitrate,
                'Track 6 - Audio Name': values.Track6Name,
            },
            ReplayBuffer: {
                'Enable Replay Buffer': values.RecRB,
                'Maximum Replay Time (Seconds)': values.RecRBTime,
            },
            'Use Optimizaed Encoder Settings': this.videoEncodingOptimizationService.state
                .useOptimizedProfile,
        };
    }
    formatStreamInfo() {
        var _a;
        const targets = this.dualOutputService.views.getEnabledTargets();
        const platformList = targets.platforms.horizontal.concat(targets.platforms.vertical);
        const destinationList = targets.destinations.horizontal.concat(targets.destinations.vertical);
        const platforms = this.formatTargets(platformList);
        const destinations = this.formatTargets(destinationList);
        const enhancedBroadcasting = this.outputSettingsService.getIsEnhancedBroadcasting();
        const info = {
            platforms,
            destinations,
            type: 'Single Output',
            enhancedBroadcasting,
        };
        if (this.dualOutputService.views.dualOutputMode) {
            return Object.assign(Object.assign({}, info), { type: 'Dual Output' });
        }
        if (this.streamSettingsService.state.goLiveSettings &&
            ((_a = this.streamSettingsService.state.goLiveSettings) === null || _a === void 0 ? void 0 : _a.streamShift)) {
            return Object.assign(Object.assign({}, info), { type: 'Stream Shift' });
        }
        if (platformList.length + destinationList.length > 1) {
            return Object.assign(Object.assign({}, info), { type: 'Multistream' });
        }
        return info;
    }
    generateTopSection() {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheId = yield this.cacheUploaderService.uploadCache();
            return new Section('Streamlabs Desktop Diagnostic Report', {
                Version: Utils.env.SLOBS_VERSION,
                Bundle: SLOBS_BUNDLE_ID,
                Date: new Date().toString(),
                Cache: cacheId,
            });
        });
    }
    generateUserSection() {
        const title = 'User';
        if (this.userService.views.isLoggedIn) {
            return new Section(title, {
                'User Id': this.userService.state.userId,
                'Logged-In Platform': {
                    Username: this.userService.views.platform.username,
                    Platform: this.userService.views.platform.type,
                },
                'Connected Platforms': Object.keys(this.userService.views.platforms).map(p => {
                    return {
                        Username: this.userService.views.platforms[p].username,
                        Platform: p,
                    };
                }),
            });
        }
        else {
            return new Section(title, 'User is not logged in');
        }
    }
    generateConfigurationSection() {
        return new Section('Configuration', {
            'Recording Mode': this.recordingModeService.state.enabled,
        });
    }
    generateVideoSection() {
        var _a;
        const isDualOutputMode = this.dualOutputService.views.dualOutputMode;
        const displays = isDualOutputMode ? ['horizontal', 'vertical'] : ['horizontal'];
        let settings = { horizontal: {}, vertical: {} };
        displays.forEach((display) => {
            const setting = this.videoSettingsService.formatVideoSettings(display, true);
            const maxHeight = display === 'horizontal' ? 1080 : 1280;
            const minHeight = 720;
            if (!setting)
                return;
            const outputRes = this.videoSettingsService.outputResolutions[display];
            const outputAspect = outputRes.outputWidth / outputRes.outputHeight;
            if (outputAspect < 16 / 9.1 || outputAspect > 16 / 8.9) {
                this.logProblem(`Output resolution is not 16:9 aspect ratio: ${setting.outputRes}`);
            }
            const fpsObj = { Type: setting.fpsType.toString() };
            if (fpsObj.Type === 'Common') {
                fpsObj['Value'] = setting.fpsCom;
            }
            else if (fpsObj.Type === 'Integer') {
                fpsObj['Value'] = setting.fpsInt;
            }
            else if (fpsObj.Type === 'Fractional') {
                fpsObj['Numerator'] = setting.fpsNum;
                fpsObj['Denominator'] = setting.fpsDen;
            }
            const baseRes = this.videoSettingsService.baseResolutions[display];
            const baseAspect = baseRes.baseWidth / baseRes.baseHeight;
            if (baseAspect < 16 / 9.1 || baseAspect > 16 / 8.9) {
                this.logProblem(`Base resolution is not 16:9 aspect ratio: ${setting.baseRes}`);
            }
            if (baseAspect !== outputAspect) {
                this.logProblem('Base resolution and Output resolution have different aspect ratio');
            }
            if (outputRes.outputHeight > baseRes.baseHeight) {
                this.logProblem('Output resolution is higher than Base resolution (upscaling)');
            }
            if (outputRes.outputHeight < minHeight) {
                this.logProblem(`Low Output resolution: ${setting.outputRes}`);
            }
            if (outputRes.outputHeight > maxHeight) {
                this.logProblem(`High Output resolution: ${setting.outputRes}`);
            }
            if (baseRes.baseHeight < minHeight) {
                this.logProblem(`Low Base resolution: ${setting.baseRes}`);
            }
            settings = Object.assign(Object.assign({}, settings), { [display]: {
                    'Base Resolution': setting.baseRes,
                    'Output Resolution': setting.outputRes,
                    'Downscale Filter': setting.scaleType,
                    'Frame Rate': fpsObj,
                } });
        });
        return new Section('Video', {
            'Single Output': settings.horizontal,
            'Dual Output Horizontal': settings.horizontal,
            'Dual Output Vertical': (_a = settings.vertical) !== null && _a !== void 0 ? _a : 'None',
        });
    }
    generateOutputSection() {
        const settings = this.outputSettingsService.getSettings();
        if (settings.streaming.bitrate < 2500) {
            this.logProblem(`Low streaming bitrate: ${settings.streaming.bitrate}`);
        }
        if (settings.recording.bitrate < 2500) {
            this.logProblem(`Low recording bitrate: ${settings.recording.bitrate}`);
        }
        const outputInfo = settings.mode === 'Simple' ? this.formatSimpleOutputInfo() : this.formatAdvancedOutputInfo();
        return new Section('Output', outputInfo);
    }
    generateSystemSection() {
        const cpus = os.cpus();
        let gpuSection;
        let isAdmin = 'N/A';
        if (getOS() === OS.Windows) {
            const gpuInfo = getWmiClass('Win32_VideoController', ['Name', 'DriverVersion', 'DriverDate']);
            gpuSection = {};
            [].concat(gpuInfo).forEach((gpu, index) => {
                gpuSection[`GPU ${index + 1}`] = {
                    Name: gpu.Name,
                    'Driver Version': gpu.DriverVersion,
                    'Driver Date': gpu.DriverDate,
                };
            });
            isAdmin = this.isRunningAsAdmin();
            if (!isAdmin)
                this.logProblem('Not running as admin');
        }
        return new Section('System', {
            'Operating System': `${os.platform()} ${os.release()}`,
            Architecture: process.arch,
            CPU: {
                Model: cpus[0].model,
                Cores: cpus.length,
            },
            Memory: {
                Total: prettyBytes(os.totalmem()),
                Free: prettyBytes(os.freemem()),
            },
            Graphics: gpuSection !== null && gpuSection !== void 0 ? gpuSection : 'This information is not available on macOS reports',
            'Running as Admin': isAdmin,
            Monitors: remote.screen.getAllDisplays().map(display => {
                return {
                    Resolution: `${display.size.width}x${display.size.height}`,
                    Scaling: display.scaleFactor,
                    Refresh: display.displayFrequency,
                    Internal: display.internal,
                    Rotation: display.rotation,
                };
            }),
        });
    }
    generateNetworkSection() {
        const settings = this.settingsService.views.values;
        return new Section('Network', {
            'Bind to IP': settings.Advanced.BindIP,
            'Bind to IP Options': this.settingsService
                .findSetting(this.settingsService.state.Advanced.formData, 'Network', 'BindIP')
                .options.map((opt) => opt.description),
            'Dynamic Bitrate': settings.Advanced.DynamicBitrate,
            'New Networking Code': settings.Advanced.NewSocketLoopEnable,
            'Low Latency Mode': settings.Advanced.LowLatencyEnable,
        });
    }
    generateCrashesSection() {
        const MAX_CRASHES_COUNT = 5;
        const parseDate = (rawDate, rawTime) => {
            const year = +rawDate.substring(0, 4);
            const month = +rawDate.substring(4, 6) - 1;
            const day = +rawDate.substring(6, 8);
            const hour = +rawTime.substring(0, 2);
            const minute = +rawTime.substring(2, 4);
            return new Date(year, month, day, hour, minute);
        };
        const sectionItems = [];
        const parseCrashLog = (fileName) => {
            const fullPath = path.join(this.cacheDir, fileName);
            if (!fs.existsSync(fullPath)) {
                return;
            }
            const fileContents = fs.readFileSync(fullPath, 'utf8');
            const crashEntries = [];
            const lines = fileContents.split('\n');
            for (let i = lines.length - 1; i >= 0; --i) {
                const line = lines[i];
                if (line.match(/crashed_module_info/)) {
                    const [, infoBlock] = line.split(': ');
                    let [, module] = infoBlock.split(' ');
                    module = module.trim();
                    const pathStartIndex = infoBlock.indexOf('(');
                    const pathEndIndex = infoBlock.indexOf(')');
                    let path = null;
                    if (pathStartIndex !== -1 && pathEndIndex !== -1) {
                        path = infoBlock.substring(pathStartIndex + 1, pathEndIndex);
                    }
                    Object.assign(crashEntries[crashEntries.length - 1], { module, path });
                }
                else if (line.match(/process died/)) {
                    const [, , date, time] = line.split(':');
                    crashEntries.push({ timestamp: parseDate(date, time) });
                }
                if (crashEntries.length >= MAX_CRASHES_COUNT) {
                    break;
                }
            }
            for (const entry of crashEntries) {
                const data = { Time: entry.timestamp.toString() };
                if (entry.module) {
                    data['Module'] =
                        entry.module +
                            ' (' +
                            (entry.path && entry.path.length !== 0 ? entry.path : 'unknown path') +
                            ')';
                }
                else {
                    data['Module'] = '(no data)';
                }
                sectionItems.push(data);
                if (sectionItems.length >= MAX_CRASHES_COUNT) {
                    break;
                }
            }
        };
        parseCrashLog('crash-handler.log');
        if (sectionItems.length < MAX_CRASHES_COUNT) {
            parseCrashLog('crash-handler.log.old');
        }
        return new Section('Crashes', sectionItems);
    }
    generateAudioSection() {
        const settings = this.settingsService.views.values;
        const devices = this.hardwareService.devices;
        function audioDeviceObj(deviceId) {
            if (deviceId == null)
                return {};
            const deviceObj = devices.find(device => deviceId === device.id);
            return {
                Id: deviceId,
                Name: deviceObj ? deviceObj.description : '<DEVICE NOT FOUND>',
            };
        }
        const globalSources = {};
        [1, 2, 3, 4, 5].forEach(channel => {
            const source = this.sourcesService.views.getSourceByChannel(channel);
            const name = ['', 'Desktop Audio', 'Desktop Audio 2', 'Mic/Aux', 'Mic/Aux 2', 'Mix/Aux 3'][channel];
            if (source) {
                globalSources[name] = Object.assign(Object.assign({}, audioDeviceObj(settings.Audio[name])), this.generateSourceData(source));
            }
            else {
                globalSources[name] = 'Disabled';
            }
        });
        return new Section('Audio', {
            'Sample Rate': settings.Audio.SampleRate,
            Channels: settings.Audio.ChannelSetup,
            'Global Sources': globalSources,
            'Monitoring Device': settings.Advanced.MonitoringDeviceName,
        });
    }
    generateDevicesSection() {
        const devices = this.hardwareService.devices;
        const dshowDevices = this.hardwareService.dshowDevices;
        function mapDevice(d) {
            return {
                Name: d.description,
                Id: d.id,
            };
        }
        return new Section('Available Devices', {
            Audio: {
                Output: devices.filter(d => d.type === EDeviceType.audioOutput).map(mapDevice),
                Input: devices.filter(d => d.type === EDeviceType.audioInput).map(mapDevice),
            },
            'Video Capture': dshowDevices.map(mapDevice),
        });
    }
    generateTransitionsSection() {
        return new Section('Transitions', {
            Transitions: this.transitionsService.state.transitions.map(transition => {
                return {
                    ID: transition.id,
                    Name: transition.name,
                    'Is Default': transition.id === this.transitionsService.state.defaultTransitionId,
                    Type: transition.type,
                    Duration: transition.duration,
                    Settings: this.transitionsService.getSettings(transition.id),
                };
            }),
            Connections: this.transitionsService.state.connections.map(connection => {
                return {
                    'From Scene ID': connection.fromSceneId,
                    'To Scene ID': connection.toSceneId,
                    'Transition ID': connection.transitionId,
                };
            }),
        });
    }
    generateScenesSection() {
        const sceneData = {};
        this.scenesService.views.scenes.map(s => {
            sceneData[s.name] = s.getItems().map(si => {
                return this.generateSourceData(si.getSource(), si);
            });
        });
        return new Section('Scenes', {
            'Active Scene': this.scenesService.views.activeScene.name,
            Scenes: sceneData,
        });
    }
    generateSourceData(source, sceneItem) {
        var _a;
        const widgetLookup = [
            'AlertBox',
            'DonationGoal',
            'FollowerGoal',
            'SubscriberGoal',
            'BitGoal',
            'DonationTicker',
            'ChatBox',
            'EventList',
            'TipJar',
            'ViewerCount',
            'StreamBoss',
            'Credits',
            'SpinWheel',
            'SponsorBanner',
            'MediaShare',
            'SubGoal',
            'StarsGoal',
            'SupporterGoal',
            'CharityGoal',
            'Poll',
            'EmoteWall',
            'ChatHighlight',
            'CustomWidget',
        ];
        const propertiesManagerType = source.getPropertiesManagerType();
        const propertiesManagerSettings = source.getPropertiesManagerSettings();
        let sourceData = {
            Name: source.name,
            Type: source.type,
        };
        if (propertiesManagerType === 'widget') {
            sourceData['Widget Type'] = widgetLookup[propertiesManagerSettings.widgetType];
        }
        else if (propertiesManagerType === 'streamlabels') {
            sourceData['Streamlabel Type'] = propertiesManagerSettings.statname;
        }
        if (source.type === 'dshow_input') {
            const deviceId = source.getObsInput().settings['video_device_id'];
            const device = this.hardwareService.dshowDevices.find(d => d.id === deviceId);
            if (device == null) {
                this.logProblem(`Source ${source.name} references device ${deviceId} which could not be found on the system.`);
            }
            sourceData['Selected Device Id'] = deviceId;
            sourceData['Selected Device Name'] = (_a = device === null || device === void 0 ? void 0 : device.description) !== null && _a !== void 0 ? _a : '<DEVICE NOT FOUND>';
        }
        if (source.audio) {
            sourceData = Object.assign(Object.assign({}, sourceData), this.generateAudioSourceData(source.sourceId));
        }
        if (sceneItem) {
            sourceData['Visible'] = sceneItem.visible;
        }
        sourceData['Filters'] = this.sourceFiltersService.views
            .filtersBySourceId(source.sourceId)
            .map(f => {
            return {
                Name: f.name,
                Type: f.type,
                Enabled: f.visible,
            };
        });
        return sourceData;
    }
    generateAudioSourceData(sourceId) {
        const sourceData = {};
        const audioSource = this.audioService.views.getSource(sourceId);
        if (this.settingsService.state.Output.type === 1) {
            const tracks = Utils.numberToBinnaryArray(audioSource.audioMixers, 6).reverse();
            const enabledTracks = tracks.reduce((arr, val, idx) => {
                if (val) {
                    return [...arr, idx + 1];
                }
                return arr;
            }, []);
            sourceData['Enabled Audio Tracks'] = enabledTracks.join(', ');
        }
        sourceData['Muted'] = audioSource.muted;
        sourceData['Volume'] = audioSource.fader.deflection * 100;
        sourceData['Monitoring'] = ['Monitor Off', 'Monitor Only (mute output)', 'Monitor and Output'][audioSource.monitoringType];
        sourceData['Sync Offset'] = audioSource.syncOffset;
        return sourceData;
    }
    generateStreamsSection() {
        return new Section('Streams', this.state.streams.map(s => {
            var _a, _b, _c, _d, _e, _f, _g;
            const platforms = this.validatePlatforms(s === null || s === void 0 ? void 0 : s.platforms);
            if ((s === null || s === void 0 ? void 0 : s.type) === 'Single Output' &&
                platforms.includes('tiktok') &&
                (s === null || s === void 0 ? void 0 : s.error) &&
                (s === null || s === void 0 ? void 0 : s.error.split(' ').at(-1)) === '422') {
                this.logProblem('TikTok user might be blocked from streaming. Refer them to TikTok producer page or support to confirm live access status');
            }
            return {
                'Start Time': new Date(s.startTime).toString(),
                'End Time': s.endTime ? new Date(s.endTime).toString() : 'Stream did not end cleanly',
                'Skipped Frames': `${(_a = s.pctSkipped) === null || _a === void 0 ? void 0 : _a.toFixed(2)}%`,
                'Lagged Frames': `${(_b = s.pctLagged) === null || _b === void 0 ? void 0 : _b.toFixed(2)}%`,
                'Dropped Frames': `${(_c = s.pctDropped) === null || _c === void 0 ? void 0 : _c.toFixed(2)}%`,
                'Average CPU': `${(_d = s.avgCpu) === null || _d === void 0 ? void 0 : _d.toFixed(2)}%`,
                'Average FPS': (_e = s.avgFps) === null || _e === void 0 ? void 0 : _e.toFixed(2),
                'Stream Error': (_f = s === null || s === void 0 ? void 0 : s.error) !== null && _f !== void 0 ? _f : 'None',
                Platforms: platforms,
                Destinations: s === null || s === void 0 ? void 0 : s.destinations,
                'Stream Type': s === null || s === void 0 ? void 0 : s.type,
                'Enhanced Broadcasting': (_g = s === null || s === void 0 ? void 0 : s.enhancedBroadcasting) !== null && _g !== void 0 ? _g : 'N/A',
            };
        }));
    }
    generateDualOutputSection() {
        var _a, _b;
        const { platforms, destinations } = this.dualOutputService.views.getEnabledTargets('name');
        const restreamHorizontal = platforms.horizontal.length + destinations.horizontal.length > 1 ? 'Yes' : 'No';
        const restreamVertical = platforms.vertical.length + destinations.vertical.length > 1 ? 'Yes' : 'No';
        const numHorizontal = (_a = this.dualOutputService.views.horizontalNodeIds) === null || _a === void 0 ? void 0 : _a.length;
        const numVertical = (_b = this.dualOutputService.views.verticalNodeIds) === null || _b === void 0 ? void 0 : _b.length;
        if (numHorizontal !== numVertical) {
            this.logProblem('Active collection has a different number of horizontal and vertical sources.');
        }
        return new Section('Dual Output', {
            'Dual Output Active': this.dualOutputService.views.dualOutputMode,
            'Dual Output Scene Collection Active': this.dualOutputService.views.hasNodeMap(),
            Sources: {
                'Number Horizontal Sources': numHorizontal,
                'Number Vertical Sources': numVertical,
            },
            Targets: {
                'Horizontal Platforms': this.formatTargets(platforms.horizontal),
                'Vertical Platforms': this.formatTargets(platforms.vertical),
                'Horizontal Custom Destinations': this.formatTargets(destinations.horizontal),
                'Vertical Custom Destinations': this.formatTargets(destinations.vertical),
                'Platforms Using Extra Outputs': this.dualOutputService.views.platformsDualStreaming,
            },
            'Horizontal Uses Multistream': restreamHorizontal,
            'Vertical Uses Multistream': restreamVertical,
        });
    }
    generateVisionSection() {
        return new Section('Vision', {
            'Installed Version': this.visionService.state.installedVersion,
            'Is Running': this.visionService.state.isRunning,
            PID: this.visionService.state.pid,
            Port: this.visionService.state.port,
            'Update Failed': this.visionService.state.hasFailedToUpdate,
            'Available Processes': this.visionService.state.availableProcesses,
            'Selected Process': this.visionService.state.selectedProcessId,
            'Available Games': this.visionService.state.availableGames,
            'Selected Game': this.visionService.state.selectedGame,
        });
    }
    generateProblemsSection() {
        return new Section('Potential Issues', this.problems.length ? this.problems : 'No issues detected');
    }
    isRunningAsAdmin() {
        try {
            cp.execSync('net session > nul 2>&1');
            return true;
        }
        catch (e) {
            return false;
        }
    }
    ADD_STREAM(stream) {
        this.state.streams.unshift(stream);
        if (this.state.streams.length > STREAM_HISTORY_LENGTH)
            this.state.streams.pop();
    }
    UPDATE_STREAM(stream) {
        Vue.set(this.state.streams, 0, Object.assign(Object.assign({}, this.state.streams[0]), stream));
    }
};
DiagnosticsService.defaultState = {
    streams: [],
};
__decorate([
    Inject()
], DiagnosticsService.prototype, "settingsService", void 0);
__decorate([
    Inject()
], DiagnosticsService.prototype, "outputSettingsService", void 0);
__decorate([
    Inject()
], DiagnosticsService.prototype, "hardwareService", void 0);
__decorate([
    Inject()
], DiagnosticsService.prototype, "scenesService", void 0);
__decorate([
    Inject()
], DiagnosticsService.prototype, "userService", void 0);
__decorate([
    Inject()
], DiagnosticsService.prototype, "sourceFiltersService", void 0);
__decorate([
    Inject()
], DiagnosticsService.prototype, "streamingService", void 0);
__decorate([
    Inject()
], DiagnosticsService.prototype, "performanceService", void 0);
__decorate([
    Inject()
], DiagnosticsService.prototype, "cacheUploaderService", void 0);
__decorate([
    Inject()
], DiagnosticsService.prototype, "audioService", void 0);
__decorate([
    Inject()
], DiagnosticsService.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], DiagnosticsService.prototype, "videoEncodingOptimizationService", void 0);
__decorate([
    Inject()
], DiagnosticsService.prototype, "transitionsService", void 0);
__decorate([
    Inject()
], DiagnosticsService.prototype, "recordingModeService", void 0);
__decorate([
    Inject()
], DiagnosticsService.prototype, "appService", void 0);
__decorate([
    Inject()
], DiagnosticsService.prototype, "dualOutputService", void 0);
__decorate([
    Inject()
], DiagnosticsService.prototype, "streamSettingsService", void 0);
__decorate([
    Inject()
], DiagnosticsService.prototype, "videoSettingsService", void 0);
__decorate([
    Inject()
], DiagnosticsService.prototype, "visionService", void 0);
__decorate([
    mutation({ sync: false })
], DiagnosticsService.prototype, "ADD_STREAM", null);
__decorate([
    mutation({ sync: false })
], DiagnosticsService.prototype, "UPDATE_STREAM", null);
DiagnosticsService = __decorate([
    InitAfter('StreamingService')
], DiagnosticsService);
export { DiagnosticsService };
//# sourceMappingURL=diagnostics.js.map