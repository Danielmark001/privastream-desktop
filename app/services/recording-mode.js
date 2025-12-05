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
import Vue from 'vue';
import moment from 'moment';
import * as Sentry from '@sentry/browser';
import { Inject, mutation, PersistentStatefulService, ViewHandler, Service } from 'services/core';
import { $t } from './i18n';
import { ELayout, ELayoutElement } from './layout';
import { EObsSimpleEncoder } from './settings';
import { AnchorPoint, ScalableRectangle } from 'util/ScalableRectangle';
import { ENotificationType } from 'services/notifications';
import { RunInLoadingMode } from './app/app-decorators';
import { byOS, OS } from 'util/operating-systems';
import { getPlatformService } from 'services/platforms';
class RecordingModeViews extends ViewHandler {
    get isRecordingModeEnabled() {
        return this.state.enabled;
    }
    get sortedRecordings() {
        return Object.values(this.state.recordingHistory).sort((a, b) => moment(a.timestamp).isAfter(moment(b.timestamp)) ? -1 : 1);
    }
    formattedTimestamp(timestamp) {
        return moment(timestamp).fromNow();
    }
}
export class RecordingModeService extends PersistentStatefulService {
    constructor() {
        super(...arguments);
        this.cancelFunction = () => { };
    }
    static filter(state) {
        return Object.assign(Object.assign({}, state), { uploadInfo: {} });
    }
    init() {
        super.init();
        this.pruneRecordingEntries();
    }
    cancelUpload() {
        this.cancelFunction();
        this.SET_UPLOAD_INFO({});
    }
    get views() {
        return new RecordingModeViews(this.state);
    }
    setUpRecordingFirstTimeSetup() {
        this.setRecordingLayout();
        this.addRecordingCapture();
        this.setRecordingEncoder();
    }
    setRecordingMode(enabled) {
        this.SET_RECORDING_MODE(enabled);
    }
    setRecordingLayout() {
        this.layoutService.changeLayout(ELayout.Classic);
        this.layoutService.setSlots({
            [ELayoutElement.Display]: { slot: '1' },
            [ELayoutElement.Scenes]: { slot: '2' },
            [ELayoutElement.Sources]: { slot: '3' },
            [ELayoutElement.Mixer]: { slot: '4' },
        });
        this.layoutService.setBarResize('bar1', 0.3);
    }
    addRecordingCapture() {
        this.scenesService.views.activeScene.createAndAddSource($t('Screen Capture (Double-click to select)'), byOS({ [OS.Windows]: 'screen_capture', [OS.Mac]: 'window_capture' }));
    }
    addRecordingWebcam() {
        return __awaiter(this, void 0, void 0, function* () {
            this.defaultHardwareService.clearTemporarySources();
            yield new Promise(r => {
                setTimeout(r, 2000);
            });
            const item = this.scenesService.views.activeScene.createAndAddSource('Webcam', byOS({ [OS.Windows]: 'dshow_input', [OS.Mac]: 'av_capture_input' }));
            let sub = this.sourcesService.sourceUpdated.subscribe(s => {
                if (s.sourceId === item.source.sourceId && s.width && s.height) {
                    sub.unsubscribe();
                    sub = null;
                    const rect = new ScalableRectangle({ x: 0, y: 0, width: s.width, height: s.height });
                    rect.scaleX = (this.videoSettingsService.baseWidth / rect.width) * 0.25;
                    rect.scaleY = rect.scaleX;
                    rect.withAnchor(AnchorPoint.SouthWest, () => {
                        rect.x = 20;
                        rect.y = this.videoSettingsService.baseHeight - 20;
                    });
                    item.setTransform({
                        position: { x: rect.x, y: rect.y },
                        scale: { x: rect.scaleX, y: rect.scaleY },
                    });
                }
            });
            setTimeout(() => {
                if (sub)
                    sub.unsubscribe();
            }, 10 * 1000);
        });
    }
    addRecordingEntry(filename, display) {
        const timestamp = moment().format();
        this.ADD_RECORDING_ENTRY(timestamp, filename);
        let message = $t('A new Recording has been completed. Click for more info');
        if (display) {
            message =
                display === 'horizontal'
                    ? $t('horizontalRecordingMessage')
                    : $t('verticalRecordingMessage');
        }
        this.notificationsService.actions.push({
            type: ENotificationType.SUCCESS,
            message,
            action: this.jsonrpcService.createRequest(Service.getResourceId(this), 'showRecordingHistory'),
        });
    }
    removeRecordingEntry(timestamp) {
        this.REMOVE_RECORDING_ENTRY(timestamp);
    }
    pruneRecordingEntries() {
        if (Object.keys(this.state.recordingHistory).length < 30)
            return;
        const oneMonthAgo = moment().subtract(30, 'days');
        const prunedEntries = {};
        Object.keys(this.state.recordingHistory).forEach(timestamp => {
            if (moment(timestamp).isAfter(oneMonthAgo)) {
                prunedEntries[timestamp] = this.state.recordingHistory[timestamp];
            }
        });
        this.SET_RECORDING_ENTRIES(prunedEntries);
    }
    showRecordingHistory() {
        this.navigationService.navigate('RecordingHistory');
    }
    uploadToYoutube(filename) {
        return __awaiter(this, void 0, void 0, function* () {
            const yt = getPlatformService('youtube');
            this.SET_UPLOAD_INFO({ uploading: true });
            const { cancel, complete } = yt.uploader.uploadVideo(filename, { title: filename, description: '', privacyStatus: 'private' }, progress => {
                this.SET_UPLOAD_INFO({
                    uploadedBytes: progress.uploadedBytes,
                    totalBytes: progress.totalBytes,
                });
            });
            this.cancelFunction = cancel;
            let result = null;
            try {
                result = yield complete;
            }
            catch (e) {
                Sentry.withScope(scope => {
                    scope.setTag('feature', 'recording-history');
                    console.error('Got error uploading YT video', e);
                });
                this.usageStatisticsService.recordAnalyticsEvent('RecordingHistory', {
                    type: 'UploadYouTubeError',
                });
            }
            this.cancelFunction = () => { };
            this.CLEAR_UPLOAD_INFO();
            if (result) {
                this.usageStatisticsService.recordAnalyticsEvent('RecordingHistory', {
                    type: 'UploadYouTubeSuccess',
                    privacy: 'private',
                });
                return result.id;
            }
        });
    }
    uploadToStorage(filename, platform) {
        return __awaiter(this, void 0, void 0, function* () {
            this.SET_UPLOAD_INFO({ uploading: true });
            const { cancel, complete, size } = yield this.sharedStorageService.actions.return.uploadFile(filename, progress => {
                this.SET_UPLOAD_INFO({
                    uploadedBytes: progress.uploadedBytes,
                    totalBytes: progress.totalBytes,
                });
            }, (error) => {
                this.SET_UPLOAD_INFO({ error: error.toString() });
            }, platform);
            this.usageStatisticsService.recordAnalyticsEvent('RecordingHistory', {
                type: 'UploadStorageBegin',
                fileSize: size,
                platform,
            });
            this.cancelFunction = () => {
                this.usageStatisticsService.recordAnalyticsEvent('RecordingHistory', {
                    type: 'UploadStorageCancel',
                    fileSize: size,
                    platform,
                });
                cancel();
            };
            let result;
            try {
                result = yield complete;
            }
            catch (e) {
                Sentry.withScope(scope => {
                    scope.setTag('feature', 'recording-history');
                    console.error('Got error uploading Storage video', e);
                });
                this.usageStatisticsService.recordAnalyticsEvent('RecordingHistory', {
                    type: 'UploadStorageError',
                    fileSize: size,
                    platform,
                });
            }
            this.cancelFunction = () => { };
            this.CLEAR_UPLOAD_INFO();
            if (result) {
                this.usageStatisticsService.recordAnalyticsEvent('RecordingHistory', {
                    type: 'UploadStorageSuccess',
                    fileSize: size,
                    platform,
                });
                return result.id;
            }
        });
    }
    setRecordingEncoder() {
        const encoderPriority = [
            EObsSimpleEncoder.jim_nvenc,
            EObsSimpleEncoder.amd,
            EObsSimpleEncoder.nvenc,
            EObsSimpleEncoder.x264,
        ];
        this.settingsService.setSettingsPatch({ Output: { Mode: 'Simple' } });
        this.settingsService.setSettingsPatch({ Output: { RecQuality: 'Small' } });
        const availableEncoders = this.settingsService
            .findSetting(this.settingsService.state.Output.formData, 'Recording', 'RecEncoder')
            .options.map((opt) => opt.value);
        const bestEncoder = encoderPriority.find(e => {
            return availableEncoders.includes(e);
        });
        this.settingsService.setSettingsPatch({
            Output: { RecEncoder: bestEncoder, RecFormat: 'mp4' },
        });
    }
    ADD_RECORDING_ENTRY(timestamp, filename) {
        Vue.set(this.state.recordingHistory, timestamp, { timestamp, filename });
    }
    REMOVE_RECORDING_ENTRY(timestamp) {
        Vue.delete(this.state.recordingHistory, timestamp);
    }
    SET_RECORDING_ENTRIES(entries) {
        this.state.recordingHistory = entries;
    }
    SET_RECORDING_MODE(val) {
        this.state.enabled = val;
    }
    SET_UPLOAD_INFO(info) {
        this.state.uploadInfo = Object.assign(Object.assign({}, this.state.uploadInfo), info);
    }
    CLEAR_UPLOAD_INFO() {
        this.state.uploadInfo = { uploading: false };
    }
}
RecordingModeService.defaultState = {
    enabled: false,
    recordingHistory: {},
    uploadInfo: { uploading: false },
};
__decorate([
    Inject()
], RecordingModeService.prototype, "layoutService", void 0);
__decorate([
    Inject()
], RecordingModeService.prototype, "scenesService", void 0);
__decorate([
    Inject()
], RecordingModeService.prototype, "settingsService", void 0);
__decorate([
    Inject()
], RecordingModeService.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], RecordingModeService.prototype, "videoSettingsService", void 0);
__decorate([
    Inject()
], RecordingModeService.prototype, "defaultHardwareService", void 0);
__decorate([
    Inject()
], RecordingModeService.prototype, "notificationsService", void 0);
__decorate([
    Inject()
], RecordingModeService.prototype, "jsonrpcService", void 0);
__decorate([
    Inject()
], RecordingModeService.prototype, "usageStatisticsService", void 0);
__decorate([
    Inject()
], RecordingModeService.prototype, "navigationService", void 0);
__decorate([
    Inject()
], RecordingModeService.prototype, "sharedStorageService", void 0);
__decorate([
    RunInLoadingMode()
], RecordingModeService.prototype, "addRecordingWebcam", null);
__decorate([
    mutation()
], RecordingModeService.prototype, "ADD_RECORDING_ENTRY", null);
__decorate([
    mutation()
], RecordingModeService.prototype, "REMOVE_RECORDING_ENTRY", null);
__decorate([
    mutation()
], RecordingModeService.prototype, "SET_RECORDING_ENTRIES", null);
__decorate([
    mutation()
], RecordingModeService.prototype, "SET_RECORDING_MODE", null);
__decorate([
    mutation()
], RecordingModeService.prototype, "SET_UPLOAD_INFO", null);
__decorate([
    mutation()
], RecordingModeService.prototype, "CLEAR_UPLOAD_INFO", null);
//# sourceMappingURL=recording-mode.js.map