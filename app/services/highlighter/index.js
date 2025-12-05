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
import { mutation, Inject, InitAfter, Service, PersistentStatefulService } from 'services/core';
import path from 'path';
import Vue from 'vue';
import fs from 'fs-extra';
import * as remote from '@electron/remote';
import { EStreamingState } from 'services/streaming';
import { getPlatformService } from 'services/platforms';
import os from 'os';
import { SCRUB_SPRITE_DIRECTORY, SUPPORTED_FILE_TYPES } from './constants';
import { pmap } from 'util/pmap';
import { RenderingClip } from './rendering/rendering-clip';
import { throttle } from 'lodash-decorators';
import * as Sentry from '@sentry/browser';
import { $t } from 'services/i18n';
import { EDismissable } from 'services/dismissables';
import { ENotificationType } from 'services/notifications';
import moment from 'moment';
import uuid from 'uuid';
import { EMenuItemKey } from 'services/side-nav';
import { AiHighlighterUpdater } from './ai-highlighter-updater';
import { EUploadPlatform, isAiClip, EHighlighterView, } from './models/highlighter.models';
import { EExportStep, } from './models/rendering.models';
import { ProgressTracker, getHighlightClips } from './ai-highlighter-utils';
import { EAiDetectionState, EOrientation, EGame, } from './models/ai-highlighter.models';
import { HighlighterViews } from './highlighter-views';
import { startRendering } from './rendering/start-rendering';
import { cutHighlightClips, getVideoDuration } from './cut-highlight-clips';
import { extractDateTimeFromPath, fileExists } from './file-utils';
import { addVerticalFilterToExportOptions } from './vertical-export';
import { isGameSupported } from './models/game-config.models';
import Utils from 'services/utils';
import { getOS, OS } from '../../util/operating-systems';
let HighlighterService = class HighlighterService extends PersistentStatefulService {
    constructor() {
        super(...arguments);
        this.aiHighlighterFeatureEnabled = getOS() === OS.Windows || Utils.isDevMode();
        this.streamMilestones = null;
        this.renderingClips = {};
        this.directoryCleared = false;
        this.cancelFunction = null;
    }
    static filter(state) {
        return Object.assign(Object.assign({}, this.defaultState), { clips: state.clips, highlightedStreams: state.highlightedStreams, highlightedStreamsDictionary: state.highlightedStreamsDictionary, video: state.video, audio: state.audio, transition: state.transition, useAiHighlighter: state.useAiHighlighter, highlighterVersion: state.highlighterVersion });
    }
    ADD_CLIP(clip) {
        Vue.set(this.state.clips, clip.path, clip);
        this.state.export.exported = false;
    }
    UPDATE_CLIP(clip) {
        Vue.set(this.state.clips, clip.path, Object.assign(Object.assign({}, this.state.clips[clip.path]), clip));
        this.state.export.exported = false;
    }
    REMOVE_CLIP(clipPath) {
        Vue.delete(this.state.clips, clipPath);
        this.state.export.exported = false;
    }
    SET_EXPORT_INFO(exportInfo) {
        this.state.export = Object.assign(Object.assign(Object.assign({}, this.state.export), { exported: false }), exportInfo);
    }
    SET_UPLOAD_INFO(uploadInfo) {
        const platform = uploadInfo.platform;
        const existingIndex = this.state.uploads.findIndex(u => u.platform === platform);
        if (existingIndex !== -1) {
            this.state.uploads = [
                ...this.state.uploads.slice(0, existingIndex),
                Object.assign(Object.assign({}, this.state.uploads[existingIndex]), uploadInfo),
                ...this.state.uploads.slice(existingIndex + 1),
            ];
        }
        else {
            const newUpload = Object.assign({ uploading: false, uploadedBytes: 0, totalBytes: 0, cancelRequested: false, videoId: null, error: false }, uploadInfo);
            this.state.uploads.push(newUpload);
        }
    }
    CLEAR_UPLOAD() {
        this.state.uploads = [];
    }
    SET_TRANSITION_INFO(transitionInfo) {
        this.state.transition = Object.assign(Object.assign({}, this.state.transition), transitionInfo);
        this.state.export.exported = false;
    }
    SET_AUDIO_INFO(audioInfo) {
        this.state.audio = Object.assign(Object.assign({}, this.state.audio), audioInfo);
        this.state.export.exported = false;
    }
    SET_VIDEO_INFO(videoInfo) {
        this.state.video = Object.assign(Object.assign({}, this.state.video), videoInfo);
        this.state.export.exported = false;
    }
    DISMISS_TUTORIAL() {
        this.state.dismissedTutorial = true;
    }
    SET_ERROR(error) {
        this.state.error = error;
    }
    SET_USE_AI_HIGHLIGHTER(useAiHighlighter) {
        Vue.set(this.state, 'useAiHighlighter', useAiHighlighter);
        this.state.useAiHighlighter = useAiHighlighter;
    }
    ADD_HIGHLIGHTED_STREAM(streamInfo) {
        Vue.set(this.state.highlightedStreamsDictionary, streamInfo.id, streamInfo);
    }
    UPDATE_HIGHLIGHTED_STREAM(updatedStreamInfo) {
        Vue.set(this.state.highlightedStreamsDictionary, updatedStreamInfo.id, updatedStreamInfo);
    }
    REMOVE_HIGHLIGHTED_STREAM(id) {
        Vue.delete(this.state.highlightedStreamsDictionary, id);
    }
    SET_UPDATER_PROGRESS(progress) {
        this.state.updaterProgress = progress;
    }
    SET_UPDATER_STATE(isRunning) {
        this.state.isUpdaterRunning = isRunning;
    }
    SET_HIGHLIGHTER_VERSION(version) {
        this.state.highlighterVersion = version;
    }
    SET_TEMP_RECORDING_INFO(tempRecordingInfo) {
        this.state.tempRecordingInfo = tempRecordingInfo;
    }
    get views() {
        return new HighlighterViews(this.state);
    }
    migrateHighlightedStreamsToDictionary() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.state &&
                    this.state.highlightedStreams &&
                    Array.isArray(this.state.highlightedStreams) &&
                    this.state.highlightedStreams.length > 0 &&
                    Object.keys(this.state.highlightedStreamsDictionary).length === 0) {
                    const streamsDict = this.state.highlightedStreams.reduce((dict, stream) => {
                        if (stream && stream.id) {
                            dict[stream.id] = stream;
                        }
                        return dict;
                    }, {});
                    this.state.highlightedStreamsDictionary = streamsDict;
                }
                else {
                }
            }
            catch (error) {
                console.error('Error during highlightedStreams migration:', error);
                this.state.highlightedStreamsDictionary = this.state.highlightedStreamsDictionary || {};
            }
        });
    }
    init() {
        const _super = Object.create(null, {
            init: { get: () => super.init }
        });
        return __awaiter(this, void 0, void 0, function* () {
            _super.init.call(this);
            yield this.migrateHighlightedStreamsToDictionary();
            if (this.aiHighlighterFeatureEnabled && !this.aiHighlighterUpdater) {
                this.aiHighlighterUpdater = new AiHighlighterUpdater();
            }
            this.views.clips.forEach(clip => {
                if (isAiClip(clip) && clip.aiInfo.moments) {
                    clip.aiInfo.inputs = clip.aiInfo.moments;
                    delete clip.aiInfo.moments;
                }
            });
            this.views.clips.forEach(c => {
                if (!fileExists(c.path)) {
                    this.removeClip(c.path, undefined);
                }
            });
            if (this.views.exportInfo.exporting) {
                this.SET_EXPORT_INFO({
                    exporting: false,
                    error: null,
                    cancelRequested: false,
                });
            }
            this.views.highlightedStreams
                .filter(stream => stream.state.type === 'detection-in-progress')
                .forEach(stream => {
                this.UPDATE_HIGHLIGHTED_STREAM(Object.assign(Object.assign({}, stream), { state: { type: EAiDetectionState.CANCELED_BY_USER, progress: 0 } }));
            });
            this.views.clips.forEach(c => {
                this.UPDATE_CLIP({
                    path: c.path,
                    loaded: false,
                });
            });
            try {
                this.SET_EXPORT_INFO({
                    file: path.join(remote.app.getPath('videos'), 'Output.mp4'),
                });
            }
            catch (e) {
                console.error('Got error fetching videos directory', e);
            }
            this.handleStreamingChanges();
        });
    }
    handleStreamingChanges() {
        let aiRecordingStartTime = moment();
        let streamInfo;
        let streamStarted = false;
        let aiRecordingInProgress = false;
        this.streamingService.replayBufferFileWrite.subscribe((clipPath) => __awaiter(this, void 0, void 0, function* () {
            const streamId = (streamInfo === null || streamInfo === void 0 ? void 0 : streamInfo.id) || undefined;
            let endTime;
            if (streamId) {
                endTime = moment().diff(aiRecordingStartTime, 'seconds');
            }
            else {
                endTime = undefined;
            }
            const REPLAY_BUFFER_DURATION = 20;
            const startTime = Math.max(0, endTime ? endTime - REPLAY_BUFFER_DURATION : 0);
            this.addClips([{ path: clipPath, startTime, endTime }], streamId, 'ReplayBuffer');
        }));
        this.streamingService.streamingStatusChange.subscribe((status) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (status === EStreamingState.Live) {
                streamStarted = true;
                const streamId = 'fromStreamRecording' + uuid();
                this.usageStatisticsService.recordAnalyticsEvent('AIHighlighter', {
                    type: 'AiRecordingGoinglive',
                    streamId,
                    game: this.streamingService.views.game,
                });
                if (!this.aiHighlighterFeatureEnabled) {
                    this.usageStatisticsService.recordAnalyticsEvent('AIHighlighter', {
                        type: 'AiHighlighterFeatureNotEnabled',
                        streamId,
                        game: this.streamingService.views.game,
                    });
                    return;
                }
                if (this.views.useAiHighlighter === false) {
                    return;
                }
                this.usageStatisticsService.recordAnalyticsEvent('AIHighlighter', {
                    type: 'AiRecordingHighlighterIsActive',
                    streamId,
                    game: this.streamingService.views.game,
                });
                if (!isGameSupported(this.streamingService.views.game)) {
                    return;
                }
                let game;
                const normalizedGameName = isGameSupported(this.streamingService.views.game);
                if (normalizedGameName) {
                    game = normalizedGameName;
                }
                else {
                    game = EGame.UNSET;
                }
                streamInfo = {
                    id: streamId,
                    title: (_a = this.streamingService.views.settings.platforms.twitch) === null || _a === void 0 ? void 0 : _a.title,
                    game,
                };
                this.usageStatisticsService.recordAnalyticsEvent('AIHighlighter', {
                    type: 'AiRecordingStarted',
                    streamId: streamInfo === null || streamInfo === void 0 ? void 0 : streamInfo.id,
                });
                if (this.streamingService.views.isRecording === false) {
                    this.streamingService.actions.toggleRecording();
                }
                aiRecordingInProgress = true;
                aiRecordingStartTime = moment();
            }
            if (status === EStreamingState.Offline) {
                if (streamStarted &&
                    this.views.clips.length > 0 &&
                    this.dismissablesService.views.shouldShow(EDismissable.HighlighterNotification)) {
                    this.notificationsService.push({
                        type: ENotificationType.SUCCESS,
                        lifeTime: -1,
                        message: $t('Edit your replays with Highlighter, a free editor built in to Streamlabs.'),
                        action: this.jsonrpcService.createRequest(Service.getResourceId(this), 'notificationAction'),
                    });
                    this.usageStatisticsService.recordAnalyticsEvent(this.views.useAiHighlighter ? 'AIHighlighter' : 'Highlighter', {
                        type: 'NotificationShow',
                    });
                }
                streamStarted = false;
            }
            if (status === EStreamingState.Ending) {
                if (!aiRecordingInProgress) {
                    return;
                }
                this.usageStatisticsService.recordAnalyticsEvent('AIHighlighter', {
                    type: 'AiRecordingFinished',
                    streamId: streamInfo === null || streamInfo === void 0 ? void 0 : streamInfo.id,
                    game: this.streamingService.views.game,
                });
                this.streamingService.actions.toggleRecording();
                yield this.loadClips(streamInfo.id);
            }
        }));
        this.streamingService.latestRecordingPath.subscribe(path => {
            if (!aiRecordingInProgress) {
                return;
            }
            getVideoDuration(path)
                .then(duration => {
                if (isNaN(duration)) {
                    duration = -1;
                }
                this.usageStatisticsService.recordAnalyticsEvent('AIHighlighter', {
                    type: 'AiRecordingExists',
                    duration,
                    streamId: streamInfo === null || streamInfo === void 0 ? void 0 : streamInfo.id,
                    game: this.streamingService.views.game,
                });
            })
                .catch(error => {
                console.error('Failed getting duration right after the recoding.', error);
            });
            aiRecordingInProgress = false;
            const tempRecordingInfo = {
                recordingPath: path,
                streamInfo,
                source: 'after-stream',
            };
            this.setTempRecordingInfo(tempRecordingInfo);
            this.navigationService.actions.navigate('Highlighter', {
                view: EHighlighterView.STREAM,
            }, EMenuItemKey.Highlighter);
        });
    }
    notificationAction() {
        this.navigationService.navigate('Highlighter');
        this.dismissablesService.dismiss(EDismissable.HighlighterNotification);
        this.usageStatisticsService.recordAnalyticsEvent(this.views.useAiHighlighter ? 'AIHighlighter' : 'Highlighter', {
            type: 'NotificationClick',
        });
    }
    setTransition(transition) {
        this.SET_TRANSITION_INFO(transition);
    }
    setAudio(audio) {
        this.SET_AUDIO_INFO(audio);
    }
    setVideo(video) {
        this.SET_VIDEO_INFO(video);
    }
    resetExportedState() {
        this.SET_EXPORT_INFO({ exported: false });
    }
    setExportFile(file) {
        this.SET_EXPORT_INFO({ file });
    }
    setFps(fps) {
        this.SET_EXPORT_INFO({ fps });
    }
    setResolution(resolution) {
        this.SET_EXPORT_INFO({ resolution });
    }
    setPreset(preset) {
        this.SET_EXPORT_INFO({ preset });
    }
    dismissError() {
        if (this.state.export.error)
            this.SET_EXPORT_INFO({ error: null });
        this.state.uploads
            .filter(u => u.error)
            .forEach(u => this.SET_UPLOAD_INFO({ error: false, platform: u.platform }));
        if (this.state.error)
            this.SET_ERROR('');
    }
    dismissTutorial() {
        this.DISMISS_TUTORIAL();
    }
    addClips(newClips, streamId, source) {
        newClips.forEach((clipData, index) => {
            const currentClips = this.getClips(this.views.clips, streamId);
            const allClips = this.getClips(this.views.clips, undefined);
            const getHighestGlobalOrderPosition = allClips.length;
            let newStreamInfo = {};
            if (source === 'Manual') {
                if (streamId) {
                    currentClips.forEach(clip => {
                        var _a;
                        if (((_a = clip === null || clip === void 0 ? void 0 : clip.streamInfo) === null || _a === void 0 ? void 0 : _a[streamId]) === undefined) {
                            return;
                        }
                        const updatedStreamInfo = Object.assign(Object.assign({}, clip.streamInfo), { [streamId]: Object.assign(Object.assign({}, clip.streamInfo[streamId]), { orderPosition: clip.streamInfo[streamId].orderPosition + 1 }) });
                        this.UPDATE_CLIP({
                            path: clip.path,
                            streamInfo: updatedStreamInfo,
                        });
                    });
                    allClips.forEach(clip => {
                        this.UPDATE_CLIP({
                            path: clip.path,
                            globalOrderPosition: clip.globalOrderPosition + 1,
                        });
                    });
                    newStreamInfo = {
                        [streamId]: {
                            orderPosition: 0 + index,
                        },
                    };
                }
                else {
                    currentClips.forEach(clip => {
                        this.UPDATE_CLIP({
                            path: clip.path,
                            globalOrderPosition: clip.globalOrderPosition + 1,
                        });
                    });
                }
            }
            else {
                if (streamId) {
                    newStreamInfo = {
                        [streamId]: {
                            orderPosition: index + currentClips.length + 1,
                            initialStartTime: clipData.startTime,
                            initialEndTime: clipData.endTime,
                        },
                    };
                }
            }
            if (this.state.clips[clipData.path]) {
                const updatedStreamInfo = Object.assign(Object.assign({}, this.state.clips[clipData.path].streamInfo), newStreamInfo);
                this.UPDATE_CLIP({
                    path: clipData.path,
                    streamInfo: updatedStreamInfo,
                });
                return;
            }
            else {
                this.ADD_CLIP({
                    path: clipData.path,
                    loaded: false,
                    enabled: true,
                    startTrim: 0,
                    endTrim: 0,
                    deleted: false,
                    source,
                    globalOrderPosition: source === 'Manual' ? 0 + index : index + getHighestGlobalOrderPosition + 1,
                    streamInfo: streamId !== undefined ? newStreamInfo : undefined,
                });
            }
        });
        return;
    }
    addAiClips(newClips, newStreamInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentHighestOrderPosition = this.getClips(this.views.clips, newStreamInfo.id).length;
            const getHighestGlobalOrderPosition = this.getClips(this.views.clips, undefined).length;
            newClips.forEach((clip, index) => {
                if (this.state.clips[clip.path])
                    return;
                const streamInfo = {
                    [newStreamInfo.id]: {
                        orderPosition: index + currentHighestOrderPosition + (currentHighestOrderPosition === 0 ? 0 : 1),
                        initialStartTime: clip.startTime,
                        initialEndTime: clip.endTime,
                    },
                };
                this.ADD_CLIP({
                    path: clip.path,
                    loaded: false,
                    enabled: true,
                    startTrim: clip.startTrim,
                    endTrim: clip.endTrim,
                    deleted: false,
                    source: 'AiClip',
                    aiInfo: clip.aiClipInfo,
                    globalOrderPosition: index + getHighestGlobalOrderPosition + (getHighestGlobalOrderPosition === 0 ? 0 : 1),
                    streamInfo,
                });
            });
            this.sortStreamClipsByStartTime(this.views.clips, newStreamInfo);
            yield this.loadClips(newStreamInfo.id);
        });
    }
    sortStreamClipsByStartTime(clips, newStreamInfo) {
        const allClips = this.getClips(clips, newStreamInfo.id);
        const sortedClips = allClips.sort((a, b) => {
            var _a, _b, _c, _d;
            return (((_b = (_a = a.streamInfo) === null || _a === void 0 ? void 0 : _a[newStreamInfo.id]) === null || _b === void 0 ? void 0 : _b.initialStartTime) || 0) -
                (((_d = (_c = b.streamInfo) === null || _c === void 0 ? void 0 : _c[newStreamInfo.id]) === null || _d === void 0 ? void 0 : _d.initialStartTime) || 0);
        });
        sortedClips.forEach((clip, index) => {
            var _a, _b;
            this.UPDATE_CLIP({
                path: clip.path,
                streamInfo: {
                    [newStreamInfo.id]: Object.assign(Object.assign({}, ((_b = (_a = clip.streamInfo) === null || _a === void 0 ? void 0 : _a[newStreamInfo.id]) !== null && _b !== void 0 ? _b : {})), { orderPosition: index }),
                },
            });
        });
        return;
    }
    getGameByStreamId(streamId) {
        var _a;
        if (!streamId)
            return EGame.UNSET;
        const game = (_a = this.views.highlightedStreamsDictionary[streamId]) === null || _a === void 0 ? void 0 : _a.game;
        if (!game)
            return EGame.UNSET;
        const lowercaseGame = game.toLowerCase();
        if (Object.values(EGame).includes(lowercaseGame)) {
            return game;
        }
        return EGame.UNSET;
    }
    manuallyEnableClip(path, enabled, streamId) {
        const clipInfo = this.state.clips[path];
        let clipInputs;
        let clipScore;
        if (isAiClip(clipInfo)) {
            clipInputs = clipInfo.aiInfo.inputs.map(input => input.type);
            clipScore = clipInfo.aiInfo.score;
        }
        this.usageStatisticsService.recordAnalyticsEvent(this.views.useAiHighlighter ? 'AIHighlighter' : 'Highlighter', {
            type: 'ManualSelectUnselect',
            selected: enabled,
            events: clipInputs,
            score: clipScore,
            streamId,
        });
        this.enableClip(path, enabled);
    }
    enableClip(path, enabled) {
        this.UPDATE_CLIP({
            path,
            enabled,
        });
    }
    disableClip(path) {
        this.UPDATE_CLIP({
            path,
            enabled: false,
        });
    }
    setStartTrim(path, trim) {
        this.UPDATE_CLIP({
            path,
            startTrim: trim,
        });
    }
    setEndTrim(path, trim) {
        this.UPDATE_CLIP({
            path,
            endTrim: trim,
        });
    }
    removeClip(removePath_1, streamId_1) {
        return __awaiter(this, arguments, void 0, function* (removePath, streamId, deleteClipFromSystem = true) {
            var _a;
            const clip = this.state.clips[removePath];
            if (!clip) {
                console.warn(`Clip not found for path: ${removePath}`);
                return;
            }
            if (fileExists(removePath) &&
                streamId &&
                clip.streamInfo &&
                Object.keys(clip.streamInfo).length > 1) {
                const updatedStreamInfo = Object.assign({}, clip.streamInfo);
                delete updatedStreamInfo[streamId];
                this.UPDATE_CLIP({
                    path: clip.path,
                    streamInfo: updatedStreamInfo,
                });
            }
            else {
                this.REMOVE_CLIP(removePath);
                this.removeScrubFile(clip.scrubSprite);
                delete this.renderingClips[removePath];
                if (deleteClipFromSystem) {
                    try {
                        yield fs.unlink(removePath);
                        const folderPath = path.dirname(removePath);
                        const files = yield fs.readdir(folderPath);
                        if (files.length === 0) {
                            yield fs.rmdir(folderPath);
                        }
                        if (this.getClips(this.views.clips, streamId).length === 0) {
                            if (streamId) {
                                this.navigationService.actions.navigate('Highlighter', {
                                    view: EHighlighterView.STREAM,
                                }, EMenuItemKey.Highlighter);
                            }
                            else {
                                this.navigationService.actions.navigate('Highlighter', {
                                    view: EHighlighterView.SETTINGS,
                                }, EMenuItemKey.Highlighter);
                            }
                        }
                    }
                    catch (error) {
                        console.error('Error deleting clip or folder:', error);
                        if (error instanceof Error && error.code === 'EBUSY') {
                            yield remote.dialog.showMessageBox(Utils.getMainWindow(), {
                                title: $t('Deletion info'),
                                type: 'info',
                                message: $t('At least one clip could not be deleted from your system. Please delete it manually.'),
                            });
                        }
                    }
                }
            }
            if (clip.streamInfo !== undefined || streamId !== undefined) {
                const ids = streamId ? [streamId] : Object.keys((_a = clip.streamInfo) !== null && _a !== void 0 ? _a : {});
                const length = this.views.clips.length;
                ids.forEach(id => {
                    var _a;
                    let found = false;
                    if (length !== 0) {
                        for (let i = 0; i < length; i++) {
                            if (((_a = this.views.clips[i].streamInfo) === null || _a === void 0 ? void 0 : _a[id]) !== undefined) {
                                found = true;
                                break;
                            }
                        }
                    }
                    if (!found) {
                        this.REMOVE_HIGHLIGHTED_STREAM(id);
                    }
                });
            }
        });
    }
    loadClips(streamInfoId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const clipsToLoad = this.getClips(this.views.clips, streamInfoId);
            yield this.ensureScrubDirectory();
            for (const clip of clipsToLoad) {
                if (!fileExists(clip.path)) {
                    this.removeClip(clip.path, streamInfoId);
                    return;
                }
                if (!SUPPORTED_FILE_TYPES.map(e => `.${e}`).includes(path.parse(clip.path).ext)) {
                    this.removeClip(clip.path, streamInfoId);
                    this.SET_ERROR($t('One or more clips could not be imported because they were not recorded in a supported file format.'));
                }
                this.renderingClips[clip.path] =
                    (_a = this.renderingClips[clip.path]) !== null && _a !== void 0 ? _a : new RenderingClip(clip.path);
            }
            yield pmap(clipsToLoad.filter(c => !c.loaded), c => this.renderingClips[c.path].init(), {
                concurrency: os.cpus().length,
                onProgress: completed => {
                    var _a;
                    this.usageStatisticsService.recordAnalyticsEvent(this.views.useAiHighlighter ? 'AIHighlighter' : 'Highlighter', {
                        type: 'ClipImport',
                        source: completed.source,
                    });
                    this.UPDATE_CLIP({
                        path: completed.path,
                        loaded: true,
                        scrubSprite: (_a = this.renderingClips[completed.path].frameSource) === null || _a === void 0 ? void 0 : _a.scrubJpg,
                        duration: this.renderingClips[completed.path].duration,
                        deleted: this.renderingClips[completed.path].deleted,
                    });
                },
            });
            return;
        });
    }
    getClips(clips, streamId) {
        return clips.filter(clip => {
            var _a;
            if (clip.path === 'add') {
                return false;
            }
            const exists = fileExists(clip.path);
            if (!exists) {
                this.removeClip(clip.path, streamId);
                return false;
            }
            if (streamId) {
                return (_a = clip.streamInfo) === null || _a === void 0 ? void 0 : _a[streamId];
            }
            return true;
        });
    }
    getClipsLoaded(clips, streamId) {
        return this.getClips(clips, streamId).every(clip => clip.loaded);
    }
    hasUnloadedClips(streamId) {
        return !this.views.clips
            .filter(c => {
            if (!c.enabled)
                return false;
            if (!streamId)
                return true;
            return c.streamInfo && c.streamInfo[streamId] !== undefined;
        })
            .every(clip => clip.loaded);
    }
    enableOnlySpecificClips(clips, streamId) {
        clips.forEach(clip => {
            this.UPDATE_CLIP({
                path: clip.path,
                enabled: false,
            });
        });
        const clipsToEnable = this.getClips(clips, streamId);
        clipsToEnable.forEach(clip => {
            this.UPDATE_CLIP({
                path: clip.path,
                enabled: true,
            });
        });
    }
    addStream(streamInfo) {
        return new Promise(resolve => {
            this.ADD_HIGHLIGHTED_STREAM(streamInfo);
            setTimeout(() => {
                resolve();
            }, 2000);
        });
    }
    updateStream(streamInfo) {
        this.UPDATE_HIGHLIGHTED_STREAM(streamInfo);
    }
    removeStream(streamId, deleteClipsFromSystem = true) {
        this.REMOVE_HIGHLIGHTED_STREAM(streamId);
        const clipsToRemove = this.getClips(this.views.clips, streamId);
        clipsToRemove.forEach(clip => {
            this.removeClip(clip.path, streamId, deleteClipsFromSystem);
        });
    }
    ensureScrubDirectory() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                try {
                    yield fs.readdir(SCRUB_SPRITE_DIRECTORY);
                }
                catch (error) {
                    yield fs.mkdir(SCRUB_SPRITE_DIRECTORY);
                }
            }
            catch (error) {
                console.log('Error creating scrub sprite directory');
            }
        });
    }
    removeScrubFile(clipPath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!clipPath) {
                console.warn('No scrub file path provided');
                return;
            }
            try {
                yield fs.remove(clipPath);
            }
            catch (error) {
                console.error('Error removing scrub file', error);
            }
        });
    }
    export() {
        return __awaiter(this, arguments, void 0, function* (preview = false, streamId = undefined, orientation = EOrientation.HORIZONTAL) {
            this.resetRenderingClips();
            yield this.loadClips(streamId);
            if (this.hasUnloadedClips(streamId)) {
                console.error('Highlighter: Export called while clips are not fully loaded!: ');
                return;
            }
            if (this.views.exportInfo.exporting) {
                console.error('Highlighter: Cannot export until current export operation is finished');
                return;
            }
            this.SET_EXPORT_INFO({
                exporting: true,
                currentFrame: 0,
                step: EExportStep.AudioMix,
                cancelRequested: false,
                error: null,
            });
            let renderingClips = yield this.generateRenderingClips(streamId, orientation);
            const exportOptions = yield this.generateExportOptions(renderingClips, preview, orientation);
            yield pmap(renderingClips, c => c.reset(exportOptions), {
                onProgress: c => {
                    if (c.deleted) {
                        this.UPDATE_CLIP({ path: c.sourcePath, deleted: true });
                    }
                },
            });
            renderingClips = renderingClips.filter(c => !c.deleted);
            if (!renderingClips.length) {
                console.error('Highlighter: Export called without any clips!');
                this.SET_EXPORT_INFO({
                    exporting: false,
                    exported: false,
                    error: $t('Please select at least one clip to export a video'),
                });
                return;
            }
            const setExportInfo = (partialExportInfo) => {
                this.SET_EXPORT_INFO(partialExportInfo);
            };
            const recordAnalyticsEvent = (type, data) => {
                this.usageStatisticsService.recordAnalyticsEvent(type, data);
            };
            const handleFrame = (currentFrame) => {
                this.setCurrentFrame(currentFrame);
            };
            startRendering({
                isPreview: preview,
                renderingClips,
                exportInfo: this.views.exportInfo,
                exportOptions,
                audioInfo: this.views.audio,
                transitionDuration: this.views.transitionDuration,
                transition: this.views.transition,
                useAiHighlighter: this.views.useAiHighlighter,
                streamId,
            }, handleFrame, setExportInfo, recordAnalyticsEvent);
        });
    }
    generateExportOptions(renderingClips, preview, orientation) {
        return __awaiter(this, void 0, void 0, function* () {
            const exportOptions = preview
                ? { width: 1280 / 4, height: 720 / 4, fps: 30, preset: 'ultrafast' }
                : {
                    width: this.views.exportInfo.resolution === 720 ? 1280 : 1920,
                    height: this.views.exportInfo.resolution === 720 ? 720 : 1080,
                    fps: this.views.exportInfo.fps,
                    preset: this.views.exportInfo.preset,
                };
            if (orientation === 'vertical') {
                yield addVerticalFilterToExportOptions(this.views.clips, renderingClips, exportOptions);
            }
            return exportOptions;
        });
    }
    generateRenderingClips(streamId, orientation) {
        return __awaiter(this, void 0, void 0, function* () {
            let renderingClips = [];
            if (streamId) {
                renderingClips = this.getClips(this.views.clips, streamId)
                    .filter(clip => !!clip && clip.enabled && clip.streamInfo && clip.streamInfo[streamId] !== undefined)
                    .sort((a, b) => {
                    var _a, _b, _c, _d, _e, _f;
                    return ((_c = (_b = (_a = a.streamInfo) === null || _a === void 0 ? void 0 : _a[streamId]) === null || _b === void 0 ? void 0 : _b.orderPosition) !== null && _c !== void 0 ? _c : 0) -
                        ((_f = (_e = (_d = b.streamInfo) === null || _d === void 0 ? void 0 : _d[streamId]) === null || _e === void 0 ? void 0 : _e.orderPosition) !== null && _f !== void 0 ? _f : 0);
                })
                    .map(c => {
                    const clip = this.renderingClips[c.path];
                    clip.startTrim = c.startTrim;
                    clip.endTrim = c.endTrim;
                    return clip;
                });
            }
            else {
                renderingClips = this.views.clips
                    .filter(c => c.enabled)
                    .sort((a, b) => a.globalOrderPosition - b.globalOrderPosition)
                    .map(c => {
                    const clip = this.renderingClips[c.path];
                    clip.startTrim = c.startTrim;
                    clip.endTrim = c.endTrim;
                    return clip;
                });
            }
            if (this.views.video.intro.path && orientation !== 'vertical') {
                const intro = new RenderingClip(this.views.video.intro.path);
                yield intro.init();
                intro.startTrim = 0;
                intro.endTrim = 0;
                renderingClips.unshift(intro);
            }
            if (this.views.video.outro.path && orientation !== 'vertical') {
                const outro = new RenderingClip(this.views.video.outro.path);
                yield outro.init();
                outro.startTrim = 0;
                outro.endTrim = 0;
                renderingClips.push(outro);
            }
            return renderingClips;
        });
    }
    setCurrentFrame(frame) {
        if (this.views.exportInfo.exported)
            return;
        this.SET_EXPORT_INFO({ currentFrame: frame });
    }
    cancelExport() {
        this.SET_EXPORT_INFO({ cancelRequested: true });
    }
    resetRenderingClips() {
        this.renderingClips = {};
    }
    setAiHighlighter(state) {
        this.SET_USE_AI_HIGHLIGHTER(state);
        this.usageStatisticsService.recordAnalyticsEvent('AIHighlighter', {
            type: 'Toggled',
            value: state,
        });
    }
    toggleAiHighlighter() {
        if (this.state.useAiHighlighter) {
            this.SET_USE_AI_HIGHLIGHTER(false);
        }
        else {
            this.SET_USE_AI_HIGHLIGHTER(true);
        }
    }
    installAiHighlighter() {
        return __awaiter(this, arguments, void 0, function* (downloadNow = false, location, game) {
            this.usageStatisticsService.recordAnalyticsEvent('AIHighlighter', {
                type: 'Installation',
                location,
                game,
            });
            this.setAiHighlighter(true);
            if (downloadNow) {
                yield this.aiHighlighterUpdater.isNewVersionAvailable();
                this.startUpdater();
            }
            else {
                this.SET_HIGHLIGHTER_VERSION('0.0.0');
            }
        });
    }
    uninstallAiHighlighter() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            this.usageStatisticsService.recordAnalyticsEvent('AIHighlighter', {
                type: 'Uninstallation',
            });
            this.setAiHighlighter(false);
            this.SET_HIGHLIGHTER_VERSION('');
            yield ((_a = this.aiHighlighterUpdater) === null || _a === void 0 ? void 0 : _a.uninstall());
        });
    }
    setTempRecordingInfo(tempRecordingInfo) {
        this.SET_TEMP_RECORDING_INFO(tempRecordingInfo);
    }
    startUpdater() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.SET_UPDATER_STATE(true);
                this.SET_HIGHLIGHTER_VERSION(this.aiHighlighterUpdater.version || '');
                yield this.aiHighlighterUpdater.update(progress => this.updateProgress(progress));
            }
            catch (e) {
                console.error('Error updating AI Highlighter:', e);
                this.usageStatisticsService.recordAnalyticsEvent('Highlighter', {
                    type: 'UpdateError',
                    newVersion: this.aiHighlighterUpdater.version,
                });
            }
            finally {
                this.SET_UPDATER_STATE(false);
            }
        });
    }
    updateProgress(progress) {
        this.SET_UPDATER_PROGRESS(progress.percent * 100);
    }
    cancelHighlightGeneration(streamId) {
        const stream = this.views.highlightedStreamsDictionary[streamId];
        if (stream && stream.abortController) {
            stream.abortController.abort();
        }
    }
    restartAiDetection(filePath, streamInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            this.removeStream(streamInfo.id);
            const milestonesPath = yield this.prepareMilestonesFile(streamInfo.id);
            const streamInfoForHighlighter = {
                id: streamInfo.id,
                title: streamInfo.title,
                game: streamInfo.game,
                milestonesPath,
            };
            this.detectAndClipAiHighlights(filePath, streamInfoForHighlighter);
        });
    }
    detectAndClipAiHighlights(filePath_1, streamInfo_1) {
        return __awaiter(this, arguments, void 0, function* (filePath, streamInfo, delayStart = false) {
            var _a, _b, _c, _d;
            if (this.aiHighlighterFeatureEnabled === false) {
                console.log('HighlighterService: Not enabled');
                return;
            }
            if (this.aiHighlighterUpdater.updateInProgress) {
                yield this.aiHighlighterUpdater.currentUpdate;
            }
            else if (yield this.aiHighlighterUpdater.isNewVersionAvailable()) {
                this.usageStatisticsService.recordAnalyticsEvent('AIHighlighter', {
                    type: 'DetectionFlowHighlighterUpdateStart',
                    timeStamp: Date.now(),
                    streamId: streamInfo.id,
                });
                yield this.startUpdater();
                this.usageStatisticsService.recordAnalyticsEvent('AIHighlighter', {
                    type: 'DetectionFlowHighlighterUpdateFinished',
                    timeStamp: Date.now(),
                    streamId: streamInfo.id,
                });
            }
            const fallbackTitle = 'awesome-stream';
            const sanitizedTitle = streamInfo.title
                ? streamInfo.title.replace(/[\\/:"*?<>|]+/g, ' ')
                : extractDateTimeFromPath(filePath) || fallbackTitle;
            const setStreamInfo = {
                state: {
                    type: EAiDetectionState.IN_PROGRESS,
                    progress: 0,
                },
                date: moment().toISOString(),
                id: streamInfo.id || 'noId',
                title: sanitizedTitle,
                game: streamInfo.game || EGame.UNSET,
                abortController: new AbortController(),
                path: filePath,
            };
            this.streamMilestones = {
                streamId: setStreamInfo.id,
                milestones: [],
            };
            yield this.addStream(setStreamInfo);
            const progressTracker = new ProgressTracker(progress => {
                setStreamInfo.state.progress = progress;
                this.updateStream(setStreamInfo);
            });
            const renderHighlights = (partialHighlights) => __awaiter(this, void 0, void 0, function* () {
                console.log('🔄 cutHighlightClips');
                this.updateStream(setStreamInfo);
                const clipData = yield cutHighlightClips(filePath, partialHighlights, setStreamInfo);
                console.log('✅ cutHighlightClips');
                progressTracker.destroy();
                setStreamInfo.state.type = EAiDetectionState.FINISHED;
                setStreamInfo.highlights = partialHighlights;
                this.updateStream(setStreamInfo);
                console.log('🔄 addClips', clipData);
                this.addAiClips(clipData, streamInfo);
                console.log('✅ addClips');
            });
            console.log('🔄 HighlighterData');
            try {
                if (delayStart) {
                    yield this.wait(5000);
                }
                this.usageStatisticsService.recordAnalyticsEvent('AIHighlighter', {
                    type: 'StartDetection',
                    streamId: streamInfo.id,
                    timeStamp: Date.now(),
                    game: setStreamInfo.game,
                });
                const highlighterResponse = yield getHighlightClips(filePath, this.userService.getLocalUserId(), renderHighlights, setStreamInfo.abortController.signal, (progress) => {
                    progressTracker.updateProgressFromHighlighter(progress);
                }, streamInfo.milestonesPath, (milestone) => {
                    var _a, _b;
                    (_b = (_a = this.streamMilestones) === null || _a === void 0 ? void 0 : _a.milestones) === null || _b === void 0 ? void 0 : _b.push(milestone);
                    this.usageStatisticsService.recordAnalyticsEvent('AIHighlighter', {
                        type: 'DetectionMilestone',
                        milestone: milestone.name,
                        streamId: streamInfo.id,
                        timeStamp: Date.now(),
                        game: setStreamInfo.game,
                    });
                }, streamInfo.game === 'unset' ? undefined : streamInfo.game);
                this.usageStatisticsService.recordAnalyticsEvent('AIHighlighter', {
                    type: 'Detection',
                    clips: highlighterResponse.length,
                    game: setStreamInfo.game,
                    streamId: (_a = this.streamMilestones) === null || _a === void 0 ? void 0 : _a.streamId,
                });
                console.log('✅ Final HighlighterData', highlighterResponse);
            }
            catch (error) {
                if (error instanceof Error && error.message === 'Highlight generation canceled') {
                    setStreamInfo.state.type = EAiDetectionState.CANCELED_BY_USER;
                    this.usageStatisticsService.recordAnalyticsEvent('AIHighlighter', {
                        type: 'DetectionCanceled',
                        reason: EAiDetectionState.CANCELED_BY_USER,
                        game: setStreamInfo.game,
                        streamId: (_b = this.streamMilestones) === null || _b === void 0 ? void 0 : _b.streamId,
                    });
                }
                else {
                    console.error('Error in highlight generation:', error);
                    setStreamInfo.state.type = EAiDetectionState.ERROR;
                    this.usageStatisticsService.recordAnalyticsEvent('AIHighlighter', {
                        type: 'DetectionFailed',
                        reason: EAiDetectionState.ERROR,
                        game: setStreamInfo.game,
                        error_code: (_c = error === null || error === void 0 ? void 0 : error.code) !== null && _c !== void 0 ? _c : 1,
                        streamId: (_d = this.streamMilestones) === null || _d === void 0 ? void 0 : _d.streamId,
                    });
                }
            }
            finally {
                setStreamInfo.abortController = undefined;
                this.updateStream(setStreamInfo);
            }
            return;
        });
    }
    getRoundDetails(clips) {
        const roundsMap = {};
        clips.forEach(clip => {
            var _a, _b, _c, _d;
            const aiClip = isAiClip(clip) ? clip : undefined;
            const round = (_c = (_b = (_a = aiClip === null || aiClip === void 0 ? void 0 : aiClip.aiInfo) === null || _a === void 0 ? void 0 : _a.metadata) === null || _b === void 0 ? void 0 : _b.round) !== null && _c !== void 0 ? _c : undefined;
            if (((_d = aiClip === null || aiClip === void 0 ? void 0 : aiClip.aiInfo) === null || _d === void 0 ? void 0 : _d.inputs) && round) {
                if (!roundsMap[round]) {
                    roundsMap[round] = { inputs: [], duration: 0, hypeScore: 0, count: 0 };
                }
                roundsMap[round].inputs.push(...aiClip.aiInfo.inputs);
                roundsMap[round].duration += aiClip.duration
                    ? aiClip.duration - aiClip.startTrim - aiClip.endTrim
                    : 0;
                roundsMap[round].hypeScore += aiClip.aiInfo.score;
                roundsMap[round].count += 1;
            }
        });
        return Object.keys(roundsMap).map(round => {
            const averageScore = roundsMap[parseInt(round, 10)].hypeScore / roundsMap[parseInt(round, 10)].count;
            const hypeScore = Math.ceil(Math.min(1, Math.max(0, averageScore)) * 5);
            return {
                round: parseInt(round, 10),
                inputs: roundsMap[parseInt(round, 10)].inputs,
                duration: roundsMap[parseInt(round, 10)].duration,
                hypeScore,
            };
        });
    }
    prepareMilestonesFile(streamId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.streamMilestones ||
                this.streamMilestones.streamId !== streamId ||
                this.streamMilestones.milestones.length === 0) {
                return;
            }
            const milestonesPath = path.join(AiHighlighterUpdater.basepath, 'milestones', 'milestones.json');
            const milestonesData = JSON.stringify(this.streamMilestones.milestones);
            yield fs.outputFile(milestonesPath, milestonesData);
            return milestonesPath;
        });
    }
    getUploadInfo(uploadInfo, platform) {
        return uploadInfo.find(u => u.platform === platform);
    }
    cancelUpload(platform) {
        if (this.cancelFunction &&
            this.views.uploadInfo.find(u => u.platform === platform && u.uploading)) {
            this.SET_UPLOAD_INFO({ cancelRequested: true, platform });
            this.cancelFunction();
        }
    }
    clearUpload() {
        this.CLEAR_UPLOAD();
    }
    uploadYoutube(options, streamId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!((_a = this.userService.state.auth) === null || _a === void 0 ? void 0 : _a.platforms.youtube)) {
                throw new Error('Cannot upload without YT linked');
            }
            if (!this.views.exportInfo.exported) {
                throw new Error('Cannot upload when export is not complete');
            }
            if (this.views.uploadInfo.some(u => u.uploading)) {
                throw new Error('Cannot start a new upload when uploading is in progress');
            }
            this.SET_UPLOAD_INFO({
                platform: EUploadPlatform.YOUTUBE,
                uploading: true,
                cancelRequested: false,
                error: false,
            });
            const yt = getPlatformService('youtube');
            const { cancel, complete } = yt.uploader.uploadVideo(this.views.exportInfo.file, options, progress => {
                this.SET_UPLOAD_INFO({
                    platform: EUploadPlatform.YOUTUBE,
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
                if (this.views.uploadInfo.some(u => u.cancelRequested)) {
                    console.log('The upload was canceled');
                }
                else {
                    Sentry.withScope(scope => {
                        scope.setTag('feature', 'highlighter');
                        console.error('Got error uploading YT video', e);
                    });
                    this.SET_UPLOAD_INFO({ platform: EUploadPlatform.YOUTUBE, error: true });
                    const game = this.getGameByStreamId(streamId);
                    this.usageStatisticsService.recordAnalyticsEvent(this.views.useAiHighlighter ? 'AIHighlighter' : 'Highlighter', {
                        type: 'UploadYouTubeError',
                        game,
                    });
                }
            }
            this.cancelFunction = null;
            this.SET_UPLOAD_INFO({
                platform: EUploadPlatform.YOUTUBE,
                uploading: false,
                cancelRequested: false,
                videoId: result ? result.id : null,
            });
            if (result) {
                const game = this.getGameByStreamId(streamId);
                this.usageStatisticsService.recordAnalyticsEvent(this.views.useAiHighlighter ? 'AIHighlighter' : 'Highlighter', {
                    type: 'UploadYouTubeSuccess',
                    streamId,
                    game,
                    privacy: options.privacyStatus,
                    videoLink: options.privacyStatus === 'public'
                        ? `https://youtube.com/watch?v=${result.id}`
                        : undefined,
                });
            }
        });
    }
    uploadStorage(platform) {
        return __awaiter(this, void 0, void 0, function* () {
            this.SET_UPLOAD_INFO({ platform, uploading: true, cancelRequested: false, error: false });
            const { cancel, complete, size } = yield this.sharedStorageService.actions.return.uploadFile(this.views.exportInfo.file, progress => {
                this.SET_UPLOAD_INFO({
                    platform,
                    uploadedBytes: progress.uploadedBytes,
                    totalBytes: progress.totalBytes,
                });
            }, error => {
                this.SET_UPLOAD_INFO({ platform, error: true });
                console.error(error);
            });
            this.cancelFunction = cancel;
            let id;
            try {
                const result = yield complete;
                id = result.id;
            }
            catch (e) {
                if (this.views.uploadInfo.some(u => u.cancelRequested)) {
                    console.log('The upload was canceled');
                }
                else {
                    this.SET_UPLOAD_INFO({ platform, uploading: false, error: true });
                    this.usageStatisticsService.recordAnalyticsEvent('Highlighter', {
                        type: 'UploadStorageError',
                        fileSize: size,
                        platform,
                    });
                }
            }
            this.cancelFunction = null;
            this.SET_UPLOAD_INFO({
                platform,
                uploading: false,
                cancelRequested: false,
                videoId: id || null,
            });
            if (id) {
                this.usageStatisticsService.recordAnalyticsEvent('Highlighter', {
                    type: 'UploadStorageSuccess',
                    fileSize: size,
                    platform,
                });
            }
            return id;
        });
    }
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
HighlighterService.defaultState = {
    clips: {},
    transition: {
        type: 'fade',
        duration: 1,
    },
    video: {
        intro: { path: '', duration: null },
        outro: { path: '', duration: null },
    },
    audio: {
        musicEnabled: false,
        musicPath: '',
        musicVolume: 50,
    },
    export: {
        exporting: false,
        currentFrame: 0,
        totalFrames: 0,
        step: EExportStep.AudioMix,
        cancelRequested: false,
        file: '',
        previewFile: path.join(os.tmpdir(), 'highlighter-preview.mp4'),
        exported: false,
        error: null,
        fps: 30,
        resolution: 1080,
        preset: 'medium',
    },
    uploads: [],
    dismissedTutorial: false,
    error: '',
    useAiHighlighter: false,
    highlightedStreams: [],
    highlightedStreamsDictionary: {},
    updaterProgress: 0,
    isUpdaterRunning: false,
    highlighterVersion: '',
    tempRecordingInfo: {},
};
__decorate([
    Inject()
], HighlighterService.prototype, "streamingService", void 0);
__decorate([
    Inject()
], HighlighterService.prototype, "userService", void 0);
__decorate([
    Inject()
], HighlighterService.prototype, "usageStatisticsService", void 0);
__decorate([
    Inject()
], HighlighterService.prototype, "dismissablesService", void 0);
__decorate([
    Inject()
], HighlighterService.prototype, "notificationsService", void 0);
__decorate([
    Inject()
], HighlighterService.prototype, "jsonrpcService", void 0);
__decorate([
    Inject()
], HighlighterService.prototype, "navigationService", void 0);
__decorate([
    Inject()
], HighlighterService.prototype, "sharedStorageService", void 0);
__decorate([
    Inject()
], HighlighterService.prototype, "incrementalRolloutService", void 0);
__decorate([
    mutation()
], HighlighterService.prototype, "ADD_CLIP", null);
__decorate([
    mutation()
], HighlighterService.prototype, "UPDATE_CLIP", null);
__decorate([
    mutation()
], HighlighterService.prototype, "REMOVE_CLIP", null);
__decorate([
    mutation()
], HighlighterService.prototype, "SET_EXPORT_INFO", null);
__decorate([
    mutation()
], HighlighterService.prototype, "SET_UPLOAD_INFO", null);
__decorate([
    mutation()
], HighlighterService.prototype, "CLEAR_UPLOAD", null);
__decorate([
    mutation()
], HighlighterService.prototype, "SET_TRANSITION_INFO", null);
__decorate([
    mutation()
], HighlighterService.prototype, "SET_AUDIO_INFO", null);
__decorate([
    mutation()
], HighlighterService.prototype, "SET_VIDEO_INFO", null);
__decorate([
    mutation()
], HighlighterService.prototype, "DISMISS_TUTORIAL", null);
__decorate([
    mutation()
], HighlighterService.prototype, "SET_ERROR", null);
__decorate([
    mutation()
], HighlighterService.prototype, "SET_USE_AI_HIGHLIGHTER", null);
__decorate([
    mutation()
], HighlighterService.prototype, "ADD_HIGHLIGHTED_STREAM", null);
__decorate([
    mutation()
], HighlighterService.prototype, "UPDATE_HIGHLIGHTED_STREAM", null);
__decorate([
    mutation()
], HighlighterService.prototype, "REMOVE_HIGHLIGHTED_STREAM", null);
__decorate([
    mutation()
], HighlighterService.prototype, "SET_UPDATER_PROGRESS", null);
__decorate([
    mutation()
], HighlighterService.prototype, "SET_UPDATER_STATE", null);
__decorate([
    mutation()
], HighlighterService.prototype, "SET_HIGHLIGHTER_VERSION", null);
__decorate([
    mutation()
], HighlighterService.prototype, "SET_TEMP_RECORDING_INFO", null);
__decorate([
    throttle(100)
], HighlighterService.prototype, "setCurrentFrame", null);
HighlighterService = __decorate([
    InitAfter('StreamingService')
], HighlighterService);
export { HighlighterService };
//# sourceMappingURL=index.js.map