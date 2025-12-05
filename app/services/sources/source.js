var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { PROPERTIES_MANAGER_TYPES, } from './index';
import { mutation, ServiceHelper, Inject, ExecuteInWorkerProcess } from 'services';
import Utils from 'services/utils';
import * as obs from '../../../obs-api';
import isEqual from 'lodash/isEqual';
import omitBy from 'lodash/omitBy';
import omit from 'lodash/omit';
import { assertIsDefined } from '../../util/properties-type-guards';
import { byOS, OS } from 'util/operating-systems';
let Source = class Source {
    getObsInput() {
        return obs.InputFactory.fromName(this.sourceId);
    }
    getModel() {
        return this.state;
    }
    updateSettings(settings) {
        this.getObsInput().update(settings);
        this.sourcesService.propertiesManagers[this.sourceId].manager.handleSettingsChange(settings);
        this.sourcesService.sourceUpdated.next(this.state);
    }
    getSettings() {
        return this.getObsInput().settings;
    }
    setForceHidden(val) {
        this.SET_FORCE_HIDDEN(val);
        this.scenesService.views.getSceneItemsBySourceId(this.sourceId).forEach(sceneItem => {
            if (val) {
                sceneItem.getObsSceneItem().visible = false;
            }
            else {
                sceneItem.getObsSceneItem().visible = sceneItem.visible;
            }
        });
    }
    setForceMuted(val) {
        this.SET_FORCE_MUTED(val);
        this.getObsInput().muted = val ? true : this.muted;
    }
    isSameType(comparison) {
        if (this.channel)
            return false;
        return isEqual(omitBy(this.getComparisonDetails(), v => v == null), omitBy(comparison, v => v == null));
    }
    getComparisonDetails() {
        const details = {
            type: this.type,
            propertiesManager: this.getPropertiesManagerType(),
        };
        if (this.getPropertiesManagerType() === 'streamlabels') {
            details.isStreamlabel = true;
        }
        if (this.getPropertiesManagerType() === 'widget') {
            details.widgetType = this.getPropertiesManagerSettings().widgetType;
        }
        if (this.getPropertiesManagerType() === 'platformApp') {
            details.appId = this.getPropertiesManagerSettings().appId;
            details.appSourceId = this.getPropertiesManagerSettings().appSourceId;
        }
        return details;
    }
    getPropertiesManagerType() {
        return this.propertiesManagerType;
    }
    getPropertiesManagerSettings() {
        return this.propertiesManagerSettings;
    }
    getPropertiesManagerUI() {
        return this.sourcesService.propertiesManagers[this.sourceId].manager.customUIComponent;
    }
    replacePropertiesManager(type, settings) {
        const oldManager = this.sourcesService.propertiesManagers[this.sourceId].manager;
        oldManager.destroy();
        const managerKlass = PROPERTIES_MANAGER_TYPES[type];
        this.sourcesService.propertiesManagers[this.sourceId].manager = new managerKlass(this.getObsInput(), settings, this.sourceId);
        this.sourcesService.propertiesManagers[this.sourceId].type = type;
        this.SET_PROPERTIES_MANAGER_TYPE(type);
        this.sourcesService.sourceUpdated.next(this.getModel());
    }
    setPropertiesManagerSettings(settings) {
        this.sourcesService.propertiesManagers[this.sourceId].manager.applySettings(settings);
    }
    getPropertiesFormData() {
        const manager = this.sourcesService.propertiesManagers[this.sourceId].manager;
        return manager.getPropertiesFormData();
    }
    setPropertiesFormData(properties) {
        const manager = this.sourcesService.propertiesManagers[this.sourceId].manager;
        manager.setPropertiesFormData(properties);
        this.sourcesService.sourceUpdated.next(this.state);
        if (this.transitionsService.state.studioMode && properties.length === 1) {
            const settings = properties.at(0);
            if ((settings === null || settings === void 0 ? void 0 : settings.enabled) && (settings === null || settings === void 0 ? void 0 : settings.name) === 'local_file' && this.type === 'ffmpeg_source') {
                this.getObsInput().play();
            }
        }
    }
    duplicate(newSourceId) {
        if (this.doNotDuplicate)
            return null;
        const newSource = this.sourcesService.createSource(this.name, this.type, this.getSettings(), {
            sourceId: newSourceId,
            propertiesManager: this.getPropertiesManagerType(),
            propertiesManagerSettings: omit(this.getPropertiesManagerSettings(), 'mediaBackup'),
        });
        this.sourceFiltersService.getFilters(this.sourceId).forEach(filter => {
            this.sourceFiltersService.add(newSource.sourceId, filter.type, filter.name, filter.settings);
        });
        return newSource;
    }
    remove() {
        this.sourcesService.removeSource(this.sourceId);
    }
    setName(newName) {
        this.SET_NAME(newName);
        this.sourcesService.sourceUpdated.next(this.state);
    }
    hasProps() {
        return this.configurable;
    }
    getMacVirtualKeyCode(code) {
        const keyMap = {
            8: { text: '', vkey: 51 },
            9: { text: '', vkey: 48 },
            45: { text: '', vkey: 114 },
            46: { text: '', vkey: 117 },
            37: { text: '', vkey: 123 },
            39: { text: '', vkey: 124 },
            38: { text: '', vkey: 126 },
            40: { text: '', vkey: 125 },
            36: { text: '', vkey: 115 },
            13: { text: '', vkey: 36 },
            35: { text: '', vkey: 119 },
            33: { text: '', vkey: 116 },
            34: { text: '', vkey: 121 },
            27: { text: '', vkey: 53 },
            32: { vkey: 49 },
            112: { text: '', vkey: 122 },
            113: { text: '', vkey: 120 },
            114: { text: '', vkey: 99 },
            115: { text: '', vkey: 118 },
            116: { text: '', vkey: 96 },
            117: { text: '', vkey: 97 },
            118: { text: '', vkey: 98 },
            119: { text: '', vkey: 100 },
            120: { text: '', vkey: 101 },
            121: { text: '', vkey: 109 },
            122: { text: '', vkey: 103 },
            123: { text: '', vkey: 111 },
            124: { text: '', vkey: 105 },
            48: { vkey: 29 },
            49: { vkey: 18 },
            50: { vkey: 19 },
            51: { vkey: 20 },
            52: { vkey: 21 },
            53: { vkey: 23 },
            54: { vkey: 22 },
            55: { vkey: 26 },
            56: { vkey: 28 },
            57: { vkey: 25 },
            76: { vkey: 37 },
        };
        return keyMap[code];
    }
    refresh() {
        const obsInput = this.getObsInput();
        obsInput.properties.get('refreshnocache').buttonClicked(obsInput);
    }
    mouseMove(pos) {
        this.getObsInput().sendMouseMove({
            modifiers: 0,
            x: Math.floor(pos.x),
            y: Math.floor(pos.y),
        }, false);
    }
    mouseClick(button, pos, mouseUp) {
        let obsFlags;
        let obsButton;
        if (button === 0) {
            obsFlags = 16;
            obsButton = 0;
        }
        else if (button === 1) {
            obsFlags = 32;
            obsButton = 1;
        }
        else if (button === 2) {
            obsFlags = 64;
            obsButton = 2;
        }
        else {
            return;
        }
        this.getObsInput().sendMouseClick({
            modifiers: obsFlags,
            x: Math.floor(pos.x),
            y: Math.floor(pos.y),
        }, obsButton, mouseUp, 1);
    }
    setDeinterlaceMode(mode) {
        this.SET_DEINTERLACE_MODE(mode);
        this.getObsInput().deinterlaceMode = mode;
    }
    setDeinterlaceFieldOrder(order) {
        this.SET_DEINTERLACE_FIELD_ORDER(order);
        this.getObsInput().deinterlaceFieldOrder = order;
    }
    mouseWheel(pos, delta) {
        console.log(pos, delta);
        this.getObsInput().sendMouseWheel({
            modifiers: 0,
            x: Math.floor(pos.x),
            y: Math.floor(pos.y),
        }, 0, Math.floor(delta.y) * -1);
    }
    keyInput(key, code, keyup, modifiers) {
        let normalizedText = key;
        let nativeVkey = code;
        let ignoreKeypress = false;
        byOS({
            [OS.Windows]: () => {
                if (code === 13)
                    normalizedText = '\r';
            },
            [OS.Mac]: () => {
                var _a;
                const entry = this.getMacVirtualKeyCode(code);
                if (entry) {
                    if (keyup) {
                        ignoreKeypress = true;
                    }
                    else {
                        normalizedText = (_a = entry.text) !== null && _a !== void 0 ? _a : key;
                        nativeVkey = entry.vkey;
                    }
                }
            },
        });
        if (!ignoreKeypress) {
            const altKey = (modifiers.alt && 8) || 0;
            const ctrlKey = (modifiers.ctrl && 4) || 0;
            const shiftKey = (modifiers.shift && 2) || 0;
            this.getObsInput().sendKeyClick({
                modifiers: altKey | ctrlKey | shiftKey,
                text: normalizedText,
                nativeModifiers: 0,
                nativeScancode: 0,
                nativeVkey,
            }, keyup);
        }
    }
    sendFocus(focus) {
        this.getObsInput().sendFocus(focus);
    }
    constructor(sourceId) {
        const state = this.sourcesService.state.sources[sourceId] ||
            this.sourcesService.state.temporarySources[sourceId];
        assertIsDefined(state);
        Utils.applyProxy(this, state);
        this.state = state;
    }
    isDestroyed() {
        return (!this.sourcesService.state.sources[this.sourceId] &&
            !this.sourcesService.state.temporarySources[this.sourceId]);
    }
    SET_FORCE_HIDDEN(val) {
        this.state.forceHidden = val;
    }
    SET_FORCE_MUTED(val) {
        this.state.forceMuted = val;
    }
    SET_NAME(newName) {
        this.state.name = newName;
    }
    SET_PROPERTIES_MANAGER_TYPE(type) {
        this.state.propertiesManagerType = type;
    }
    SET_DEINTERLACE_MODE(val) {
        this.state.deinterlaceMode = val;
    }
    SET_DEINTERLACE_FIELD_ORDER(val) {
        this.state.deinterlaceFieldOrder = val;
    }
};
__decorate([
    Inject()
], Source.prototype, "scenesService", void 0);
__decorate([
    Inject()
], Source.prototype, "sourceFiltersService", void 0);
__decorate([
    Inject()
], Source.prototype, "transitionsService", void 0);
__decorate([
    ExecuteInWorkerProcess()
], Source.prototype, "updateSettings", null);
__decorate([
    ExecuteInWorkerProcess()
], Source.prototype, "getSettings", null);
__decorate([
    ExecuteInWorkerProcess()
], Source.prototype, "setForceHidden", null);
__decorate([
    ExecuteInWorkerProcess()
], Source.prototype, "setForceMuted", null);
__decorate([
    ExecuteInWorkerProcess()
], Source.prototype, "getPropertiesManagerUI", null);
__decorate([
    ExecuteInWorkerProcess()
], Source.prototype, "replacePropertiesManager", null);
__decorate([
    ExecuteInWorkerProcess()
], Source.prototype, "setPropertiesManagerSettings", null);
__decorate([
    ExecuteInWorkerProcess()
], Source.prototype, "getPropertiesFormData", null);
__decorate([
    ExecuteInWorkerProcess()
], Source.prototype, "setPropertiesFormData", null);
__decorate([
    ExecuteInWorkerProcess()
], Source.prototype, "refresh", null);
__decorate([
    ExecuteInWorkerProcess()
], Source.prototype, "mouseMove", null);
__decorate([
    ExecuteInWorkerProcess()
], Source.prototype, "mouseClick", null);
__decorate([
    ExecuteInWorkerProcess()
], Source.prototype, "setDeinterlaceMode", null);
__decorate([
    ExecuteInWorkerProcess()
], Source.prototype, "setDeinterlaceFieldOrder", null);
__decorate([
    ExecuteInWorkerProcess()
], Source.prototype, "mouseWheel", null);
__decorate([
    ExecuteInWorkerProcess()
], Source.prototype, "keyInput", null);
__decorate([
    ExecuteInWorkerProcess()
], Source.prototype, "sendFocus", null);
__decorate([
    Inject()
], Source.prototype, "sourcesService", void 0);
__decorate([
    mutation()
], Source.prototype, "SET_FORCE_HIDDEN", null);
__decorate([
    mutation()
], Source.prototype, "SET_FORCE_MUTED", null);
__decorate([
    mutation()
], Source.prototype, "SET_NAME", null);
__decorate([
    mutation()
], Source.prototype, "SET_PROPERTIES_MANAGER_TYPE", null);
__decorate([
    mutation()
], Source.prototype, "SET_DEINTERLACE_MODE", null);
__decorate([
    mutation()
], Source.prototype, "SET_DEINTERLACE_FIELD_ORDER", null);
Source = __decorate([
    ServiceHelper('SourcesService')
], Source);
export { Source };
//# sourceMappingURL=source.js.map