var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module, EApiPermissions, apiMethod, apiEvent } from './module';
import { EReplayBufferState } from 'services/streaming';
import { Inject } from 'services/core/injector';
import { Subject } from 'rxjs';
import { FileReturnWrapper } from 'util/guest-api-handler';
import uuid from 'uuid/v4';
export class ReplayModule extends Module {
    constructor() {
        super();
        this.moduleName = 'Replay';
        this.permissions = [EApiPermissions.Streaming];
        this.availableFiles = {};
        this.stateChanged = new Subject();
        this.fileSaved = new Subject();
        this.streamingService.replayBufferStatusChange.subscribe(() => {
            this.stateChanged.next(this.serializeState());
        });
        this.streamingService.replayBufferFileWrite.subscribe(filePath => {
            const id = uuid();
            this.availableFiles[id] = filePath;
            this.fileSaved.next({ id, filePath });
        });
    }
    getState() {
        return this.serializeState();
    }
    startBuffer() {
        this.streamingService.startReplayBuffer();
    }
    stopBuffer() {
        this.streamingService.stopReplayBuffer();
    }
    getEnabled() {
        return this.settingsService.views.values.Output.RecRB;
    }
    setEnabled(ctx, enabled) {
        if (this.getState().status === EReplayBufferState.Offline) {
            this.settingsService.setSettingsPatch({ Output: { RecRB: enabled } });
        }
        else {
            throw new Error('Replay buffer must be stopped before its settings can be changed!');
        }
    }
    getDuration() {
        return this.settingsService.views.values.Output.RecRBTime;
    }
    setDuration(ctx, duration) {
        if (this.getState().status === EReplayBufferState.Offline) {
            this.settingsService.setSettingsPatch({ Output: { RecRBTime: duration } });
        }
        else {
            throw new Error('Replay buffer must be stopped before its settings can be changed!');
        }
    }
    save() {
        this.streamingService.saveReplay();
    }
    getFileContents(ctx, fileId) {
        if (!this.availableFiles[fileId]) {
            throw new Error(`The file with id ${fileId} does not exist!`);
        }
        return new FileReturnWrapper(this.availableFiles[fileId]);
    }
    serializeState() {
        return {
            status: this.streamingService.state.replayBufferStatus,
            statusTime: this.streamingService.state.replayBufferStatusTime,
        };
    }
}
__decorate([
    Inject()
], ReplayModule.prototype, "streamingService", void 0);
__decorate([
    Inject()
], ReplayModule.prototype, "settingsService", void 0);
__decorate([
    apiEvent()
], ReplayModule.prototype, "stateChanged", void 0);
__decorate([
    apiEvent()
], ReplayModule.prototype, "fileSaved", void 0);
__decorate([
    apiMethod()
], ReplayModule.prototype, "getState", null);
__decorate([
    apiMethod()
], ReplayModule.prototype, "startBuffer", null);
__decorate([
    apiMethod()
], ReplayModule.prototype, "stopBuffer", null);
__decorate([
    apiMethod()
], ReplayModule.prototype, "getEnabled", null);
__decorate([
    apiMethod()
], ReplayModule.prototype, "setEnabled", null);
__decorate([
    apiMethod()
], ReplayModule.prototype, "getDuration", null);
__decorate([
    apiMethod()
], ReplayModule.prototype, "setDuration", null);
__decorate([
    apiMethod()
], ReplayModule.prototype, "save", null);
__decorate([
    apiMethod()
], ReplayModule.prototype, "getFileContents", null);
//# sourceMappingURL=replay.js.map