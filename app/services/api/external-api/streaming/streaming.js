var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Inject } from 'services/core/injector';
import { Fallback, Singleton } from 'services/api/external-api';
var EStreamingState;
(function (EStreamingState) {
    EStreamingState["Offline"] = "offline";
    EStreamingState["Starting"] = "starting";
    EStreamingState["Live"] = "live";
    EStreamingState["Ending"] = "ending";
    EStreamingState["Reconnecting"] = "reconnecting";
})(EStreamingState || (EStreamingState = {}));
var ERecordingState;
(function (ERecordingState) {
    ERecordingState["Offline"] = "offline";
    ERecordingState["Starting"] = "starting";
    ERecordingState["Recording"] = "recording";
    ERecordingState["Stopping"] = "stopping";
    ERecordingState["Start"] = "start";
    ERecordingState["Wrote"] = "wrote";
})(ERecordingState || (ERecordingState = {}));
var EReplayBufferState;
(function (EReplayBufferState) {
    EReplayBufferState["Running"] = "running";
    EReplayBufferState["Stopping"] = "stopping";
    EReplayBufferState["Offline"] = "offline";
    EReplayBufferState["Saving"] = "saving";
    EReplayBufferState["Wrote"] = "wrote";
})(EReplayBufferState || (EReplayBufferState = {}));
let StreamingService = class StreamingService {
    get streamingStatusChange() {
        return this.streamingService.streamingStatusChange;
    }
    get recordingStatusChange() {
        return this.streamingService.recordingStatusChange;
    }
    get replayBufferStatusChange() {
        return this.streamingService.replayBufferStatusChange;
    }
    get streamErrorCreated() {
        return this.streamingService.streamErrorCreated;
    }
    getModel() {
        return this.streamingService.getModel();
    }
    toggleRecording() {
        return this.streamingService.toggleRecording();
    }
    toggleStreaming() {
        return this.streamingService.toggleStreaming();
    }
    startReplayBuffer() {
        return this.streamingService.startReplayBuffer();
    }
    stopReplayBuffer() {
        return this.streamingService.stopReplayBuffer();
    }
    saveReplay() {
        return this.streamingService.saveReplay();
    }
};
__decorate([
    Fallback(),
    Inject()
], StreamingService.prototype, "streamingService", void 0);
StreamingService = __decorate([
    Singleton()
], StreamingService);
export { StreamingService };
//# sourceMappingURL=streaming.js.map