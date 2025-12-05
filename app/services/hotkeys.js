var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { StreamingService } from 'services/streaming';
import { ScenesService } from 'services/scenes';
import { SourcesService } from 'services/sources';
import { TransitionsService } from 'services/transitions';
import { MarkersService } from 'services/markers';
import { Inject } from 'services/core/injector';
import { StatefulService, mutation, ServiceHelper } from 'services';
import { DualOutputService } from 'services/dual-output';
import defer from 'lodash/defer';
import mapValues from 'lodash/mapValues';
import { $t } from 'services/i18n';
import * as obs from '../../obs-api';
import { GameOverlayService } from './game-overlay';
import { CustomizationService } from './customization';
import { RecentEventsService } from './recent-events';
import { getOS, OS } from 'util/operating-systems';
import { VirtualWebcamService } from 'app-services';
function getScenesService() {
    return ScenesService.instance;
}
function getSourcesService() {
    return SourcesService.instance;
}
function getStreamingService() {
    return StreamingService.instance;
}
function getTransitionsService() {
    return TransitionsService.instance;
}
function getGameOverlayService() {
    return GameOverlayService.instance;
}
function getCustomizationService() {
    return CustomizationService.instance;
}
function getRecentEventsService() {
    return RecentEventsService.instance;
}
function getVirtualCameraService() {
    return VirtualWebcamService.instance;
}
function getMarkersService() {
    return MarkersService.instance;
}
function getDualOutputService() {
    return DualOutputService.instance;
}
const isAudio = (sourceId) => {
    const source = getSourcesService().views.getSource(sourceId);
    return source ? source.audio : false;
};
const isSourceType = (type) => (sourceId) => {
    const source = getSourcesService().views.getSource(sourceId);
    return source ? source.type === type : false;
};
function getHotkeyHash(hotkey) {
    return `${hotkey.actionName}/${hotkey.sceneId || ''}${hotkey.sourceId || ''}/${hotkey.sceneItemId || ''}`;
}
const processObsHotkey = (isKeyDown) => (itemId, hotkeyId) => {
    obs.NodeObs.OBS_API_ProcessHotkeyStatus(hotkeyId, isKeyDown);
};
const GENERAL_ACTIONS = {
    TOGGLE_START_STREAMING: {
        name: 'TOGGLE_START_STREAMING',
        description: () => $t('Start Streaming'),
        down: () => getStreamingService().toggleStreaming(),
        isActive: () => {
            const streamingService = getStreamingService();
            return streamingService.isStreaming;
        },
    },
    TOGGLE_STOP_STREAMING: {
        name: 'TOGGLE_STOP_STREAMING',
        description: () => $t('Stop Streaming'),
        down: () => {
            const streamingService = getStreamingService();
            streamingService.toggleStreaming();
        },
        isActive: () => {
            const streamingService = getStreamingService();
            return !streamingService.isStreaming;
        },
    },
    TOGGLE_START_RECORDING: {
        name: 'TOGGLE_START_RECORDING',
        description: () => $t('Start Recording'),
        down: () => getStreamingService().toggleRecording(),
        isActive: () => getStreamingService().isRecording,
    },
    TOGGLE_STOP_RECORDING: {
        name: 'TOGGLE_STOP_RECORDING',
        description: () => $t('Stop Recording'),
        down: () => getStreamingService().toggleRecording(),
        isActive: () => !getStreamingService().isRecording,
    },
    ENABLE_STUDIO_MODE: {
        name: 'ENABLE_STUDIO_MODE',
        description: () => $t('Enable Studio Mode'),
        down: () => getTransitionsService().enableStudioMode(),
        isActive: () => getTransitionsService().state.studioMode,
    },
    DISABLE_STUDIO_MODE: {
        name: 'DISABLE_STUDIO_MODE',
        description: () => $t('Disable Studio Mode'),
        down: () => getTransitionsService().disableStudioMode(),
        isActive: () => !getTransitionsService().state.studioMode,
    },
    TRANSITION_STUDIO_MODE: {
        name: 'TRANSITION_STUDIO_MODE',
        description: () => $t('Transition (Studio Mode)'),
        down: () => getTransitionsService().executeStudioModeTransition(),
    },
    SAVE_REPLAY: {
        name: 'SAVE_REPLAY',
        description: () => $t('Save Replay'),
        down: () => getStreamingService().saveReplay(),
    },
    SPLIT_FILE: {
        name: 'SPLIT_FILE',
        description: () => $t('Split Recording File'),
        down: () => getStreamingService().splitFile(),
    },
    TOGGLE_OVERLAY: {
        name: 'TOGGLE_OVERLAY',
        description: () => $t('Toggle in-game overlay'),
        down: () => getGameOverlayService().toggleOverlay(),
        shouldApply: () => getOS() === OS.Windows,
    },
    TOGGLE_OVERLAY_POSITIONING: {
        name: 'TOGGLE_OVERLAY_POSITIONING',
        description: () => $t('Toggle overlay positioning mode'),
        down: () => getGameOverlayService().setPreviewMode(!getGameOverlayService().state.previewMode),
        shouldApply: () => getOS() === OS.Windows,
    },
    TOGGLE_PERFORMANCE_MODE: {
        name: 'TOGGLE_PERFORMANCE_MODE',
        description: () => $t('Toggle Performance Mode'),
        down: () => getCustomizationService().togglePerformanceMode(),
    },
    SKIP_ALERT: {
        name: 'SKIP_ALERT',
        description: () => $t('Skip Alert'),
        down: () => getRecentEventsService().skipAlert(),
    },
    TOGGLE_VIRTUAL_CAMERA_ON: {
        name: 'TOGGLE_VIRTUAL_CAMERA_ON',
        description: () => $t('Start Virtual Camera'),
        down: () => getVirtualCameraService().start(),
        isActive: () => getVirtualCameraService().state.running,
    },
    TOGGLE_VIRTUAL_CAMERA_OFF: {
        name: 'TOGGLE_VIRTUAL_CAMERA_OFF',
        description: () => $t('Stop Virtual Camera'),
        down: () => getVirtualCameraService().stop(),
        isActive: () => !getVirtualCameraService().state.running,
    },
};
const SOURCE_ACTIONS = {
    TOGGLE_MUTE: {
        name: 'TOGGLE_MUTE',
        description: () => $t('Mute'),
        down: sourceId => getSourcesService().setMuted(sourceId, true),
        isActive: sourceId => { var _a; return !!((_a = getSourcesService().views.getSource(sourceId)) === null || _a === void 0 ? void 0 : _a.muted); },
        shouldApply: isAudio,
    },
    TOGGLE_UNMUTE: {
        name: 'TOGGLE_UNMUTE',
        description: () => $t('Unmute'),
        down: sourceId => getSourcesService().setMuted(sourceId, false),
        isActive: sourceId => { var _a; return ((_a = getSourcesService().views.getSource(sourceId)) === null || _a === void 0 ? void 0 : _a.muted) === false; },
        shouldApply: isAudio,
    },
    PUSH_TO_MUTE: {
        name: 'PUSH_TO_MUTE',
        description: () => $t('Push to Mute'),
        down: sourceId => getSourcesService().setMuted(sourceId, true),
        up: sourceId => getSourcesService().setMuted(sourceId, false),
        shouldApply: isAudio,
    },
    PUSH_TO_TALK: {
        name: 'PUSH_TO_TALK',
        description: () => $t('Push to Talk'),
        down: sourceId => getSourcesService().setMuted(sourceId, false),
        up: sourceId => getSourcesService().setMuted(sourceId, true),
        shouldApply: isAudio,
    },
    GAME_CAPTURE_HOTKEY_START: {
        name: 'GAME_CAPTURE_HOTKEY_START',
        description: () => $t('Capture Foreground Window'),
        up: processObsHotkey(false),
        down: processObsHotkey(true),
        shouldApply: isSourceType('game_capture'),
    },
    GAME_CAPTURE_HOTKEY_STOP: {
        name: 'GAME_CAPTURE_HOTKEY_STOP',
        description: () => $t('Deactivate Capture'),
        up: processObsHotkey(false),
        down: processObsHotkey(true),
        shouldApply: isSourceType('game_capture'),
    },
    SLIDESHOW_PLAYPAUSE: {
        name: 'SLIDESHOW_PLAYPAUSE',
        description: () => $t('Play/Pause'),
        down: processObsHotkey(true),
        up: processObsHotkey(false),
        shouldApply: isSourceType('slideshow'),
    },
    SLIDESHOW_RESTART: {
        name: 'SLIDESHOW_RESTART',
        description: () => $t('Restart'),
        down: processObsHotkey(true),
        up: processObsHotkey(false),
        shouldApply: isSourceType('slideshow'),
    },
    SLIDESHOW_STOP: {
        name: 'SLIDESHOW_STOP',
        description: () => $t('Stop'),
        down: processObsHotkey(true),
        up: processObsHotkey(false),
        shouldApply: isSourceType('slideshow'),
    },
    SLIDESHOW_NEXTSLIDE: {
        name: 'SLIDESHOW_NEXTSLIDE',
        description: () => $t('Next Slide'),
        down: processObsHotkey(true),
        up: processObsHotkey(false),
        shouldApply: isSourceType('slideshow'),
    },
    SLIDESHOW_PREVIOUSSLIDE: {
        name: 'SLIDESHOW_PREVIOUSSLIDE',
        description: () => $t('Previous Slide'),
        down: processObsHotkey(true),
        up: processObsHotkey(false),
        shouldApply: isSourceType('slideshow'),
    },
    FFMPEG_SOURCE_RESTART: {
        name: 'FFMPEG_SOURCE_RESTART',
        description: () => $t('Restart'),
        down: processObsHotkey(true),
        up: processObsHotkey(false),
        shouldApply: isSourceType('ffmpeg_source'),
    },
};
const SCENE_ACTIONS = {
    SWITCH_TO_SCENE: {
        name: 'SWITCH_TO_SCENE',
        description: () => $t('Switch to scene'),
        down: sceneId => getScenesService().makeSceneActive(sceneId),
    },
};
const SCENE_ITEM_ACTIONS = {
    TOGGLE_SOURCE_VISIBILITY_SHOW: {
        name: 'TOGGLE_SOURCE_VISIBILITY_SHOW',
        description: sceneItemId => {
            const sceneItem = getScenesService().views.getSceneItem(sceneItemId);
            return $t('Show %{sourcename}', { sourcename: sceneItem === null || sceneItem === void 0 ? void 0 : sceneItem.source.name });
        },
        shouldApply: sceneItemId => { var _a; return !!((_a = getScenesService().views.getSceneItem(sceneItemId)) === null || _a === void 0 ? void 0 : _a.video); },
        isActive: sceneItemId => { var _a; return !!((_a = getScenesService().views.getSceneItem(sceneItemId)) === null || _a === void 0 ? void 0 : _a.visible); },
        down: sceneItemId => {
            var _a, _b;
            (_a = getScenesService().views.getSceneItem(sceneItemId)) === null || _a === void 0 ? void 0 : _a.setVisibility(true);
            const dualOutputNodeId = getDualOutputService().views.getDualOutputNodeId(sceneItemId);
            const dualOutputMode = getDualOutputService().state.dualOutputMode;
            if (dualOutputNodeId && !dualOutputMode) {
                (_b = getScenesService().views.getSceneItem(dualOutputNodeId)) === null || _b === void 0 ? void 0 : _b.setVisibility(true);
            }
        },
    },
    TOGGLE_SOURCE_VISIBILITY_HIDE: {
        name: 'TOGGLE_SOURCE_VISIBILITY_HIDE',
        description: sceneItemId => {
            const sceneItem = getScenesService().views.getSceneItem(sceneItemId);
            return $t('Hide %{sourcename}', { sourcename: sceneItem === null || sceneItem === void 0 ? void 0 : sceneItem.source.name });
        },
        shouldApply: sceneItemId => { var _a; return !!((_a = getScenesService().views.getSceneItem(sceneItemId)) === null || _a === void 0 ? void 0 : _a.video); },
        isActive: sceneItemId => { var _a; return ((_a = getScenesService().views.getSceneItem(sceneItemId)) === null || _a === void 0 ? void 0 : _a.visible) === false; },
        down: sceneItemId => {
            var _a, _b;
            (_a = getScenesService().views.getSceneItem(sceneItemId)) === null || _a === void 0 ? void 0 : _a.setVisibility(false);
            const dualOutputNodeId = getDualOutputService().views.getDualOutputNodeId(sceneItemId);
            const dualOutputMode = getDualOutputService().state.dualOutputMode;
            if (dualOutputNodeId && !dualOutputMode) {
                (_b = getScenesService().views.getSceneItem(dualOutputNodeId)) === null || _b === void 0 ? void 0 : _b.setVisibility(false);
            }
        },
    },
    PUSH_TO_SOURCE_SHOW: {
        name: 'PUSH_TO_SOURCE_SHOW',
        description: sceneItemId => {
            const sceneItem = getScenesService().views.getSceneItem(sceneItemId);
            return $t('Push to Show %{sourcename}', { sourcename: sceneItem === null || sceneItem === void 0 ? void 0 : sceneItem.source.name });
        },
        shouldApply: sceneItemId => { var _a; return !!((_a = getScenesService().views.getSceneItem(sceneItemId)) === null || _a === void 0 ? void 0 : _a.video); },
        up: sceneItemId => { var _a; return (_a = getScenesService().views.getSceneItem(sceneItemId)) === null || _a === void 0 ? void 0 : _a.setVisibility(false); },
        down: sceneItemId => { var _a; return (_a = getScenesService().views.getSceneItem(sceneItemId)) === null || _a === void 0 ? void 0 : _a.setVisibility(true); },
    },
    PUSH_TO_SOURCE_HIDE: {
        name: 'PUSH_TO_SOURCE_HIDE',
        description: sceneItemId => {
            const sceneItem = getScenesService().views.getSceneItem(sceneItemId);
            return $t('Push to Hide %{sourcename}', { sourcename: sceneItem === null || sceneItem === void 0 ? void 0 : sceneItem.source.name });
        },
        shouldApply: sceneItemId => { var _a; return !!((_a = getScenesService().views.getSceneItem(sceneItemId)) === null || _a === void 0 ? void 0 : _a.video); },
        up: sceneItemId => { var _a; return (_a = getScenesService().views.getSceneItem(sceneItemId)) === null || _a === void 0 ? void 0 : _a.setVisibility(true); },
        down: sceneItemId => { var _a; return (_a = getScenesService().views.getSceneItem(sceneItemId)) === null || _a === void 0 ? void 0 : _a.setVisibility(false); },
    },
};
const MARKERS_ACTIONS = {
    MARKER_1: {
        name: 'MARKER_1',
        description: () => getMarkersService().views.getLabel('MARKER_1'),
        down: () => getMarkersService().actions.addMarker('MARKER_1'),
    },
    MARKER_2: {
        name: 'MARKER_2',
        description: () => getMarkersService().views.getLabel('MARKER_2'),
        down: () => getMarkersService().actions.addMarker('MARKER_2'),
    },
    MARKER_3: {
        name: 'MARKER_3',
        description: () => getMarkersService().views.getLabel('MARKER_3'),
        down: () => getMarkersService().actions.addMarker('MARKER_3'),
    },
    MARKER_4: {
        name: 'MARKER_4',
        description: () => getMarkersService().views.getLabel('MARKER_4'),
        down: () => getMarkersService().actions.addMarker('MARKER_4'),
    },
};
const ACTIONS = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, GENERAL_ACTIONS), SOURCE_ACTIONS), SCENE_ACTIONS), SCENE_ITEM_ACTIONS), MARKERS_ACTIONS);
export class HotkeysService extends StatefulService {
    init() {
        this.scenesService.sceneAdded.subscribe(() => this.invalidate());
        this.scenesService.sceneRemoved.subscribe(() => this.invalidate());
        this.scenesService.itemAdded.subscribe(() => this.invalidate());
        this.scenesService.itemRemoved.subscribe(() => this.invalidate());
        this.sourcesService.sourceAdded.subscribe(() => this.invalidate());
        this.sourcesService.sourceRemoved.subscribe(() => this.invalidate());
    }
    addHotkey(hotkeyModel) {
        this.ADD_HOTKEY(hotkeyModel);
    }
    invalidate() {
        this.registeredHotkeys = null;
    }
    updateRegisteredHotkeys() {
        const hotkeys = {};
        const addedHotkeys = new Set();
        Object.values(GENERAL_ACTIONS).forEach(action => {
            const hotkey = {
                actionName: action.name,
                bindings: [],
            };
            hotkeys[getHotkeyHash(hotkey)] = hotkey;
            addedHotkeys.add(action.name);
        });
        this.scenesService.views.scenes.forEach(scene => {
            Object.values(SCENE_ACTIONS).forEach(action => {
                const hotkey = {
                    actionName: action.name,
                    bindings: [],
                    sceneId: scene.id,
                };
                hotkeys[getHotkeyHash(hotkey)] = hotkey;
                addedHotkeys.add(`${action.name}-${scene.id}`);
            });
            scene.getItems().forEach(sceneItem => {
                Object.values(SCENE_ITEM_ACTIONS).forEach(action => {
                    const hotkey = {
                        actionName: action.name,
                        bindings: [],
                        sceneItemId: sceneItem.sceneItemId,
                        display: sceneItem === null || sceneItem === void 0 ? void 0 : sceneItem.display,
                    };
                    hotkeys[getHotkeyHash(hotkey)] = hotkey;
                    addedHotkeys.add(`${action.name}-${sceneItem.sceneItemId}`);
                });
            });
        });
        Object.values(MARKERS_ACTIONS).forEach(action => {
            const hotkey = {
                actionName: action.name,
                bindings: [],
                isMarker: true,
            };
            hotkeys[getHotkeyHash(hotkey)] = hotkey;
            addedHotkeys.add(action.name);
        });
        const obsHotkeys = obs.NodeObs.OBS_API_QueryHotkeys();
        obsHotkeys
            .filter(hotkey => this.isSupportedHotkey(hotkey))
            .forEach(hotkey => {
            const action = this.getActionForHotkey(hotkey);
            if (action && action.name) {
                const hk = {
                    sourceId: hotkey.ObjectName,
                    actionName: action.name,
                    bindings: [],
                    hotkeyId: hotkey.HotkeyId,
                };
                if (!hotkeys[getHotkeyHash(hk)]) {
                    hotkeys[getHotkeyHash(hk)] = hk;
                }
            }
        });
        this.state.hotkeys.forEach(savedHotkey => {
            const hotkey = hotkeys[getHotkeyHash(savedHotkey)];
            if (hotkey)
                hotkey.bindings = [...savedHotkey.bindings];
        });
        this.registeredHotkeys = Object.keys(hotkeys).map(key => this.getHotkey(hotkeys[key]));
    }
    getHotkey(obj) {
        return new Hotkey(obj);
    }
    getGeneralHotkeyByName(name) {
        return this.getHotkeysSet().general.find(hotkey => hotkey.actionName === name);
    }
    applyGeneralHotkey(hotkey) {
        const set = this.getHotkeysSet();
        set.general.forEach(h => {
            if (h.actionName === hotkey.actionName) {
                h.bindings = hotkey.bindings;
            }
        });
        this.applyHotkeySet(set);
    }
    getHotkeys() {
        var _a;
        if (!this.registeredHotkeys)
            this.updateRegisteredHotkeys();
        return ((_a = this.registeredHotkeys) !== null && _a !== void 0 ? _a : []).filter(hotkey => hotkey.shouldApply);
    }
    getHotkeysSet() {
        const sourcesHotkeys = {};
        this.sourcesService.views.getSources().forEach(source => {
            const sourceHotkeys = this.getSourceHotkeys(source.sourceId);
            if (sourceHotkeys.length)
                sourcesHotkeys[source.sourceId] = sourceHotkeys;
        });
        const scenesHotkeys = {};
        this.scenesService.views.scenes.forEach(scene => {
            const sceneItemsHotkeys = this.getSceneItemsHotkeys(scene.id);
            const sceneHotkeys = sceneItemsHotkeys.concat(this.getSceneHotkeys(scene.id));
            if (sceneHotkeys.length)
                scenesHotkeys[scene.id] = sceneHotkeys;
        });
        const markersHotkeys = this.getHotkeys().filter(hotkey => hotkey.type === 'MARKER');
        return {
            general: this.serializeHotkeys(this.getGeneralHotkeys()),
            sources: this.serializeHotkeys(sourcesHotkeys),
            scenes: this.serializeHotkeys(scenesHotkeys),
            markers: this.serializeHotkeys(markersHotkeys),
        };
    }
    serializeHotkeys(hotkeys) {
        if (Array.isArray(hotkeys)) {
            return hotkeys.map(h => (Object.assign(Object.assign({}, h.getModel()), { description: h.description })));
        }
        return mapValues(hotkeys, h => this.serializeHotkeys(h));
    }
    clearAllHotkeys() {
        this.applyHotkeySet({
            general: [],
            sources: {},
            scenes: {},
            markers: [],
        });
    }
    applyHotkeySet(hotkeySet) {
        const hotkeys = [];
        hotkeys.push(...hotkeySet.general);
        Object.keys(hotkeySet.scenes).forEach(sceneId => hotkeys.push(...hotkeySet.scenes[sceneId]));
        Object.keys(hotkeySet.sources).forEach(sourceId => hotkeys.push(...hotkeySet.sources[sourceId]));
        hotkeys.push(...hotkeySet.markers);
        this.setHotkeys(hotkeys);
        this.bindHotkeys();
    }
    getGeneralHotkeys() {
        return this.getHotkeys().filter(hotkey => hotkey.type === 'GENERAL');
    }
    getSourceHotkeys(sourceId) {
        return this.getHotkeys().filter(hotkey => hotkey.sourceId === sourceId);
    }
    getSceneHotkeys(sceneId) {
        return this.getHotkeys().filter(hotkey => hotkey.sceneId === sceneId);
    }
    getSceneItemsHotkeys(sceneId) {
        var _a;
        const scene = this.scenesService.views.getScene(sceneId);
        const sceneItemsIds = (_a = scene === null || scene === void 0 ? void 0 : scene.nodes.map(item => item.id)) !== null && _a !== void 0 ? _a : [];
        return this.getHotkeys().filter(hotkey => { var _a; return sceneItemsIds.includes((_a = hotkey.sceneItemId) !== null && _a !== void 0 ? _a : ''); });
    }
    getSceneItemHotkeys(sceneItemId) {
        return this.getHotkeys().filter(hotkey => hotkey.sceneItemId === sceneItemId);
    }
    getMarkerHotkeys() {
        return this.getHotkeys().filter(hotkey => hotkey.type === 'MARKER');
    }
    unregisterAll() {
        this.keyListenerService.unregisterAll();
    }
    setHotkeys(hotkeys) {
        this.CLEAR_HOTKEYS();
        hotkeys.forEach(hotkey => {
            if (hotkey.bindings.length)
                this.ADD_HOTKEY(hotkey);
        });
        this.invalidate();
    }
    bindHotkeys() {
        this.unregisterAll();
        const downBindingMap = new Map();
        const upBindingMap = new Map();
        this.getHotkeys().forEach(hotkey => {
            hotkey.bindings.forEach(binding => {
                const downHotkeys = downBindingMap.get(JSON.stringify(binding)) || [];
                const upHotkeys = upBindingMap.get(JSON.stringify(binding)) || [];
                if (hotkey.action.downHandler)
                    downHotkeys.push(hotkey);
                if (hotkey.action.upHandler)
                    upHotkeys.push(hotkey);
                downBindingMap.set(JSON.stringify(binding), downHotkeys);
                upBindingMap.set(JSON.stringify(binding), upHotkeys);
            });
        });
        downBindingMap.forEach((hotkeys, bindingStr) => {
            const binding = JSON.parse(bindingStr);
            this.keyListenerService.register(Object.assign(Object.assign({}, binding), { eventType: 'registerKeydown', callback: () => {
                    this.usageStatisticsService.recordFeatureUsage('HotkeyPress');
                    hotkeys.forEach(hotkey => hotkey.action.downHandler && hotkey.action.downHandler());
                } }));
        });
        upBindingMap.forEach((hotkeys, bindingStr) => {
            const binding = JSON.parse(bindingStr);
            this.keyListenerService.register(Object.assign(Object.assign({}, binding), { eventType: 'registerKeyup', callback: () => hotkeys.forEach(hotkey => hotkey.action.upHandler && hotkey.action.upHandler()) }));
        });
    }
    ADD_HOTKEY(hotkeyObj) {
        this.state.hotkeys.push(hotkeyObj);
    }
    SET_BINDINGS(hotkeyInd, bindings) {
        this.state.hotkeys[hotkeyInd].bindings = bindings;
    }
    CLEAR_HOTKEYS() {
        this.state.hotkeys = [];
    }
    isSupportedHotkey(hotkey) {
        if (hotkey.ObjectType !== 1) {
            return false;
        }
        const action = this.getActionForHotkey(hotkey);
        return action && action.name && idPropFor(hotkey);
    }
    getActionForHotkey(hotkey) {
        const action = getActionFromName(hotkey.HotkeyName);
        if (action && action.name) {
            return action;
        }
        const source = this.sourcesService.views.getSource(hotkey.ObjectName);
        if (source) {
            return ACTIONS[`${source.type.toUpperCase()}_${hotkey.HotkeyName}`];
        }
        return null;
    }
}
HotkeysService.initialState = {
    hotkeys: [],
};
__decorate([
    Inject()
], HotkeysService.prototype, "scenesService", void 0);
__decorate([
    Inject()
], HotkeysService.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], HotkeysService.prototype, "keyListenerService", void 0);
__decorate([
    Inject()
], HotkeysService.prototype, "usageStatisticsService", void 0);
__decorate([
    mutation()
], HotkeysService.prototype, "ADD_HOTKEY", null);
__decorate([
    mutation()
], HotkeysService.prototype, "SET_BINDINGS", null);
__decorate([
    mutation()
], HotkeysService.prototype, "CLEAR_HOTKEYS", null);
let Hotkey = class Hotkey {
    constructor(hotkeyModel) {
        var _a, _b, _c, _d;
        Object.assign(this, hotkeyModel);
        this.hotkeyModel = hotkeyModel;
        if (this.sourceId) {
            this.type = 'SOURCE';
        }
        else if (this.sceneItemId) {
            this.type = 'SCENE_ITEM';
        }
        else if (this.sceneId) {
            this.type = 'SCENE';
        }
        else if (this.isMarker) {
            this.type = 'MARKER';
        }
        else {
            this.type = 'GENERAL';
        }
        const entityId = (_c = (_b = (_a = this.sourceId) !== null && _a !== void 0 ? _a : this.sceneId) !== null && _b !== void 0 ? _b : this.sceneItemId) !== null && _c !== void 0 ? _c : 'NO_ENTITY';
        this.action = this.getAction(entityId);
        this.description = this.action.description(entityId);
        this.shouldApply = (_d = (this.action.shouldApply && this.action.shouldApply(entityId))) !== null && _d !== void 0 ? _d : false;
    }
    isDestroyed() {
        return false;
    }
    equals(other) {
        return (this.actionName === other.actionName &&
            this.sceneId === other.sceneId &&
            this.sourceId === other.sourceId &&
            this.sceneItemId === other.sceneItemId);
    }
    getModel() {
        return Object.assign({}, this.hotkeyModel);
    }
    getAction(entityId) {
        const action = getActionFromName(this.actionName);
        const { up, down } = action;
        if (!action.isActive)
            action.isActive = () => false;
        if (!action.shouldApply)
            action.shouldApply = () => true;
        if (up) {
            action.upHandler = () => {
                if (action.isActive && !action.isActive(entityId)) {
                    defer(() => up(entityId, this.hotkeyModel.hotkeyId));
                }
            };
        }
        if (down) {
            action.downHandler = () => {
                if (action.isActive && !action.isActive(entityId)) {
                    defer(() => down(entityId, this.hotkeyModel.hotkeyId));
                }
            };
        }
        return action;
    }
};
Hotkey = __decorate([
    ServiceHelper('HotkeysService')
], Hotkey);
export { Hotkey };
const getMigrationMapping = (actionName) => {
    return {
        MUTE: 'TOGGLE_MUTE',
        UNMUTE: 'TOGGLE_UNMUTE',
    }[normalizeActionName(actionName)];
};
const getActionFromName = (actionName) => (Object.assign({}, (ACTIONS[actionName] || ACTIONS[getMigrationMapping(actionName)])));
const isSceneItem = (hotkey) => !!getScenesService().views.getSceneItem(hotkey.ObjectName);
const isSource = (hotkey) => !!getSourcesService().views.getSource(hotkey.ObjectName);
const isScene = (hotkey) => !!getScenesService().views.getScene(hotkey.ObjectName);
const idPropFor = (hotkey) => {
    if (isSource(hotkey)) {
        return 'sourceId';
    }
    else if (isScene(hotkey)) {
        return 'sceneId';
    }
    else if (isSceneItem(hotkey)) {
        return 'sceneItemId';
    }
    else {
        return null;
    }
};
const normalizeActionName = (actionName) => actionName.split('.')[0];
//# sourceMappingURL=hotkeys.js.map