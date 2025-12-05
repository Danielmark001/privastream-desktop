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
import { InitAfter, Inject, Service } from 'services';
import * as remote from '@electron/remote';
import path from 'path';
import { authorizedHeaders, jfetch } from 'util/requests';
import { RealmObject } from 'services/realm';
import uuid from 'uuid/v4';
import * as obs from '../../../obs-api';
import { convertDotNotationToTree } from 'util/dot-tree';
import { VisionRunner } from './vision-runner';
import { VisionUpdater } from './vision-updater';
import _ from 'lodash';
import pMemoize from 'p-memoize';
import { ESettingsCategory } from 'services/settings';
import { Subject } from 'rxjs';
export class VisionProcess extends RealmObject {
}
VisionProcess.schema = {
    name: 'VisionProcess',
    properties: {
        game: 'string',
        pid: 'int',
        executable_name: 'string',
        type: 'string',
        title: 'string',
        autostart: 'bool',
    },
};
VisionProcess.register();
export class VisionState extends RealmObject {
}
VisionState.schema = {
    name: 'VisionState',
    properties: {
        installedVersion: { type: 'string', default: '' },
        percentDownloaded: { type: 'double', default: 0 },
        isCurrentlyUpdating: { type: 'bool', default: false },
        isRunning: { type: 'bool', default: false },
        isInstalling: { type: 'bool', default: false },
        isStarting: { type: 'bool', default: false },
        pid: { type: 'int', default: 0 },
        port: { type: 'int', default: 0 },
        needsUpdate: { type: 'bool', default: false },
        hasFailedToUpdate: { type: 'bool', default: false },
        selectedProcessId: { type: 'int', optional: true },
        availableProcesses: { type: 'list', objectType: 'VisionProcess', default: [] },
        selectedGame: { type: 'string', default: 'fortnite' },
        availableGames: {
            type: 'dictionary',
            objectType: 'string',
            default: {
                apex_legends: 'Apex Legends',
                battlefield_6: 'Battlefield 6',
                black_ops_6: 'Call of Duty: Black Ops 6',
                counter_strike_2: 'Counter-Strike 2',
                fortnite: 'Fortnite',
                league_of_legends: 'League of Legends',
                marvel_rivals: 'Marvel Rivals',
                overwatch_2: 'Overwatch 2',
                pubg: 'PUBG: Battlegrounds',
                rainbow_six_siege: 'Rainbow Six Siege',
                valorant: 'Valorant',
                war_thunder: 'War Thunder',
                warzone: 'Call of Duty: Warzone',
            },
        },
    },
};
VisionState.register();
let VisionService = class VisionService extends Service {
    constructor() {
        super(...arguments);
        this.visionRunner = new VisionRunner();
        this.visionUpdater = new VisionUpdater(path.join(remote.app.getPath('userData'), '..', 'streamlabs-vision'));
        this.lastPromptAt = 0;
        this.promptCooldownMs = 500;
        this.onState = new Subject();
        this.onGame = new Subject();
        this.state = VisionState.inject();
        this.onSourceMessageCallback = (evt) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            for (const { sourceName, message } of evt) {
                const source = (_a = this.sourcesService.views.getSource(sourceName)) === null || _a === void 0 ? void 0 : _a.getObsInput();
                if (!source) {
                    continue;
                }
                const keys = JSON.parse(message).keys;
                const tree = convertDotNotationToTree(keys);
                const res = yield this.requestState({ query: tree });
                const payload = JSON.stringify({
                    type: 'state.update',
                    message: res,
                    key: keys === null || keys === void 0 ? void 0 : keys.join(','),
                    event_id: uuid(),
                });
                source.sendMessage({
                    message: payload,
                });
            }
        });
        this.ensureUpdated = pMemoize((...args_1) => __awaiter(this, [...args_1], void 0, function* ({ startAfterUpdate = true } = {}) {
            this.log('ensureUpdated()');
            this.writeState({ hasFailedToUpdate: false });
            const { needsUpdate, latestManifest } = yield this.visionUpdater.checkNeedsUpdate();
            if (needsUpdate) {
                this.writeState({ isCurrentlyUpdating: true });
                yield this.visionRunner.stop();
                try {
                    yield this.visionUpdater.downloadAndInstall(latestManifest, progress => {
                        this.writeState({ percentDownloaded: progress.percent });
                    });
                    this.writeState({
                        installedVersion: (latestManifest === null || latestManifest === void 0 ? void 0 : latestManifest.version) || '',
                        needsUpdate: false,
                        isCurrentlyUpdating: false,
                        percentDownloaded: 0,
                    });
                    if (startAfterUpdate) {
                        return this.ensureRunning();
                    }
                }
                catch (err) {
                    this.writeState({
                        needsUpdate: true,
                        hasFailedToUpdate: true,
                        isCurrentlyUpdating: false,
                        percentDownloaded: 0,
                    });
                    this.log('Error during downloadAndInstall: ', err);
                }
            }
        }), { cache: false });
        this.ensureRunning = pMemoize((...args_1) => __awaiter(this, [...args_1], void 0, function* ({ debugMode = false } = {}) {
            var _a, _b;
            this.log('ensureRunning(): { debugMode=', debugMode, ' }');
            this.writeState({ isStarting: true });
            try {
                const { needsUpdate, installedManifest, latestManifest, } = yield this.visionUpdater.checkNeedsUpdate();
                this.writeState({
                    needsUpdate,
                    installedVersion: (_a = installedManifest === null || installedManifest === void 0 ? void 0 : installedManifest.version) !== null && _a !== void 0 ? _a : '',
                });
                if (needsUpdate) {
                    if (installedManifest) {
                        this.log(`vision needs update: ${installedManifest.version} -> ${latestManifest.version}`);
                        yield this.ensureUpdated({ startAfterUpdate: false });
                    }
                    else {
                        const v = (_b = latestManifest.version) !== null && _b !== void 0 ? _b : 'unknown';
                        const now = Date.now();
                        const newVersion = this.lastPromptVersion !== v;
                        const cooledDown = now - this.lastPromptAt > this.promptCooldownMs;
                        if (newVersion || cooledDown) {
                            this.lastPromptVersion = v;
                            this.lastPromptAt = now;
                            yield this.settingsService.showSettings(ESettingsCategory.AI);
                        }
                        return { started: false, reason: 'needs-update' };
                    }
                }
                const { pid, port } = yield this.visionRunner.ensureStarted({ debugMode });
                this.writeState({ pid, port, isRunning: true });
                this.subscribeToEvents(port);
                yield this.requestAvailableProcesses();
                yield this.requestActiveProcess();
                return { started: true, pid, port };
            }
            finally {
                this.writeState({ isStarting: false });
            }
        }), { cache: false });
    }
    init() {
        obs.NodeObs.RegisterSourceMessageCallback(this.onSourceMessageCallback);
        window.addEventListener('beforeunload', () => this.stop());
        this.visionRunner.on('exit', () => {
            this.writeState({
                pid: 0,
                port: 0,
                isRunning: false,
            });
        });
    }
    subscribeToEvents(port) {
        var _a;
        this.log('subscribeToEvents()');
        (_a = this.eventSource) === null || _a === void 0 ? void 0 : _a.close();
        const eventSource = new EventSource(`http://localhost:${port}/events`);
        this.eventSource = eventSource;
        eventSource.onopen = () => this.log('EventSource opened');
        eventSource.onerror = e => this.log('EventSource error:', e, 'state=', eventSource.readyState);
        eventSource.onmessage = e => {
            this.log('EventSource message', e.data);
            try {
                const parsed = JSON.parse(e.data);
                if (Array.isArray(parsed.events) &&
                    parsed.events.some((x) => x.name === 'game_process_detected')) {
                    return;
                }
                parsed.vision_event_id = uuid();
                void this.forwardEventToApi(parsed);
            }
            catch (err) {
                this.log('Bad event', err);
            }
        };
    }
    notifyOfStateChange() {
        this.onState.next({
            isRunning: this.state.isRunning,
            isStarting: this.state.isStarting,
            isInstalling: this.state.isInstalling,
        });
        try {
            const active = this.state.availableProcesses.find(p => p.pid === this.state.selectedProcessId);
            const activeJson = JSON.stringify(active);
            const availableJson = JSON.stringify(this.state.availableProcesses || []);
            this.onGame.next({
                activeProcess: JSON.parse(activeJson !== null && activeJson !== void 0 ? activeJson : 'null'),
                selectedGame: this.state.selectedGame,
                availableProcesses: JSON.parse(availableJson),
            });
        }
        catch (err) {
            console.error('Error notifying of state change', err);
        }
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            this.closeEventSource();
            yield this.visionRunner.stop();
        });
    }
    log(...args) {
        console.log('[VisionService]', ...args);
    }
    closeEventSource() {
        var _a;
        try {
            (_a = this.eventSource) === null || _a === void 0 ? void 0 : _a.close();
        }
        catch (_b) {
        }
        this.eventSource = undefined;
    }
    forwardEventToApi(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.authPostWithTimeout(`https://${this.hostsService.streamlabs}/api/v5/vision/desktop/event`, payload, 8000);
        });
    }
    requestState(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.authPostWithTimeout(`https://${this.hostsService.streamlabs}/api/v5/user-state/desktop/query`, params, 8000);
        });
    }
    authPostWithTimeout(url_1, payload_1) {
        return __awaiter(this, arguments, void 0, function* (url, payload, timeoutMs = 8000) {
            const headers = authorizedHeaders(this.userService.apiToken, new Headers({ 'Content-Type': 'application/json' }));
            const controller = new AbortController();
            const { signal } = controller;
            const timeout = setTimeout(() => controller.abort(), timeoutMs);
            try {
                return yield jfetch(url, { headers, method: 'POST', body: JSON.stringify(payload), signal });
            }
            finally {
                clearTimeout(timeout);
            }
        });
    }
    writeState(patch) {
        this.state.db.write(() => Object.assign(this.state, patch));
        this.notifyOfStateChange();
    }
    requestFrame() {
        const url = `http://localhost:${this.state.port}/query/vision_frame`;
        const headers = new Headers({ 'Content-Type': 'application/json' });
        return jfetch(url, { headers, method: 'GET' });
    }
    requestActiveProcess() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `http://localhost:${this.state.port}/processes/active`;
            const headers = new Headers({ 'Content-Type': 'application/json' });
            const response = yield jfetch(url, { headers, method: 'GET' });
            if ((response === null || response === void 0 ? void 0 : response.pid) !== undefined) {
                this.writeState({ selectedProcessId: response.pid });
            }
            return response;
        });
    }
    requestAvailableProcesses() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `http://localhost:${this.state.port}/processes`;
            const headers = new Headers({ 'Content-Type': 'application/json' });
            const response = yield jfetch(url, { headers, method: 'GET' });
            if (response) {
                this.writeState({ availableProcesses: _.sortBy(response, 'title') });
            }
            return response;
        });
    }
    activateProcess(pid_1) {
        return __awaiter(this, arguments, void 0, function* (pid, gameHint = 'fortnite') {
            const url = `http://localhost:${this.state.port}/processes/${pid}/activate?game_hint=${gameHint}`;
            const headers = new Headers({ 'Content-Type': 'application/json' });
            const activeProcess = this.state.availableProcesses.find(p => p.pid === pid);
            console.log('Activating process', pid, 'with game hint', gameHint, 'process=', activeProcess);
            if (activeProcess.type === 'capture_device' || activeProcess.executable_name === 'vlc.exe') {
                this.writeState({ selectedProcessId: pid, selectedGame: gameHint });
            }
            else {
                this.writeState({ selectedProcessId: pid });
            }
            return jfetch(url, { headers, method: 'POST' });
        });
    }
    resetState() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `http://localhost:${this.state.port}/reset_state`;
            const headers = new Headers({ 'Content-Type': 'application/json' });
            return jfetch(url, { headers, method: 'POST' });
        });
    }
    testEvent(type) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.authPostWithTimeout(`https://${this.hostsService.streamlabs}/api/v5/vision/desktop/test-event`, {
                game: 'fortnite',
                events: [{ name: type }],
            }, 8000);
        });
    }
};
__decorate([
    Inject()
], VisionService.prototype, "userService", void 0);
__decorate([
    Inject()
], VisionService.prototype, "hostsService", void 0);
__decorate([
    Inject()
], VisionService.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], VisionService.prototype, "settingsService", void 0);
VisionService = __decorate([
    InitAfter('UserService')
], VisionService);
export { VisionService };
//# sourceMappingURL=index.js.map