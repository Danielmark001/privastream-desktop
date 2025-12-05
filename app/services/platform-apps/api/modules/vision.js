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
import { BehaviorSubject, Subject } from 'rxjs';
import { Inject } from 'services';
import { apiEvent, apiMethod, Module } from './module';
export class VisionModule extends Module {
    constructor() {
        super(...arguments);
        this.moduleName = 'Vision';
        this.permissions = [];
        this.userState = new BehaviorSubject({});
        this.userStateTree = new BehaviorSubject({});
        this.visionEvent = new Subject();
        this.onVisionStateChanged = new BehaviorSubject('');
        this.onVisionGameChanged = new BehaviorSubject({ activeProcess: null, selectedGame: 'fortnite', availableProcesses: [] });
    }
    log(...args) {
        console.log('[VisionModule]', ...args);
    }
    startVision() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.visionService.ensureRunning();
        });
    }
    initiateSubscription() {
        if (!this.eventSub) {
            this.eventSub = this.websocketService.socketEvent.subscribe(e => {
                this.log('Received websocket event: ', JSON.stringify(e, null, 2));
                if (e.type === 'userStateUpdated') {
                    this.userState.next(e.message.updated_states);
                    this.userStateTree.next(e.message.updated_states_tree);
                }
                if (e.type === 'visionEvent') {
                    const event = e.message;
                    this.visionEvent.next(event);
                }
            });
            this.visionService.onState.subscribe(state => {
                const currentState = this.onVisionStateChanged.getValue();
                let newState = 'stopped';
                if (state.isRunning)
                    newState = 'running';
                else if (state.isStarting)
                    newState = 'starting';
                else if (state.isInstalling)
                    newState = 'installing';
                if (newState !== currentState) {
                    this.onVisionStateChanged.next(newState);
                }
            });
            this.visionService.onGame.subscribe(change => {
                var _a, _b;
                const current = this.onVisionGameChanged.getValue();
                if (((_a = current.activeProcess) === null || _a === void 0 ? void 0 : _a.pid) === ((_b = change.activeProcess) === null || _b === void 0 ? void 0 : _b.pid) &&
                    current.selectedGame === change.selectedGame &&
                    JSON.stringify(current.availableProcesses) === JSON.stringify(change.availableProcesses)) {
                    return;
                }
                this.onVisionGameChanged.next(change);
            });
        }
    }
    requestAvailableProcesses() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.visionService.requestAvailableProcesses();
        });
    }
    requestActiveProcess() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.visionService.requestActiveProcess();
        });
    }
    activateProcess(_ctx, pid, selectedGame) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.visionService.activateProcess(pid, selectedGame);
        });
    }
    requestFrame() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.visionService.requestFrame();
        });
    }
    resetState() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.visionService.resetState();
        });
    }
}
__decorate([
    Inject()
], VisionModule.prototype, "visionService", void 0);
__decorate([
    Inject()
], VisionModule.prototype, "websocketService", void 0);
__decorate([
    apiMethod()
], VisionModule.prototype, "startVision", null);
__decorate([
    apiEvent()
], VisionModule.prototype, "userState", void 0);
__decorate([
    apiEvent()
], VisionModule.prototype, "userStateTree", void 0);
__decorate([
    apiEvent()
], VisionModule.prototype, "visionEvent", void 0);
__decorate([
    apiEvent()
], VisionModule.prototype, "onVisionStateChanged", void 0);
__decorate([
    apiEvent()
], VisionModule.prototype, "onVisionGameChanged", void 0);
__decorate([
    apiMethod()
], VisionModule.prototype, "initiateSubscription", null);
__decorate([
    apiMethod()
], VisionModule.prototype, "requestAvailableProcesses", null);
__decorate([
    apiMethod()
], VisionModule.prototype, "requestActiveProcess", null);
__decorate([
    apiMethod()
], VisionModule.prototype, "activateProcess", null);
__decorate([
    apiMethod()
], VisionModule.prototype, "requestFrame", null);
__decorate([
    apiMethod()
], VisionModule.prototype, "resetState", null);
//# sourceMappingURL=vision.js.map