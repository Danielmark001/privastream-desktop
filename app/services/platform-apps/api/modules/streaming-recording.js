var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module, EApiPermissions, apiMethod, apiEvent } from './module';
import { Inject } from 'services/core/injector';
import { Subject } from 'rxjs';
export class StreamingRecordingModule extends Module {
    constructor() {
        super();
        this.moduleName = 'StreamingRecording';
        this.permissions = [EApiPermissions.Streaming];
        this.outputStateChanged = new Subject();
        this.streamInfoChanged = new Subject();
        this.streamingService.streamingStatusChange.subscribe(() => {
            this.outputStateChanged.next(this.streamingService.state);
        });
        this.streamingService.recordingStatusChange.subscribe(() => {
            this.outputStateChanged.next(this.streamingService.state);
        });
        this.streamingService.streamInfoChanged.subscribe(() => {
            this.streamInfoChanged.next(this.serializeStreamInfo());
        });
    }
    getOutputState() {
        return this.streamingService.state;
    }
    getStreamInfo() {
        return this.serializeStreamInfo();
    }
    startStreaming() {
        this.streamingService.goLive();
    }
    stopStreaming() {
        this.streamingService.toggleStreaming();
    }
    serializeStreamInfo() {
        const info = this.streamingService.views;
        const commonFields = info.commonFields;
        return {
            title: commonFields.title,
            game: info.game,
            viewerCount: info.viewerCount,
        };
    }
}
__decorate([
    Inject()
], StreamingRecordingModule.prototype, "streamingService", void 0);
__decorate([
    apiEvent()
], StreamingRecordingModule.prototype, "outputStateChanged", void 0);
__decorate([
    apiEvent()
], StreamingRecordingModule.prototype, "streamInfoChanged", void 0);
__decorate([
    apiMethod()
], StreamingRecordingModule.prototype, "getOutputState", null);
__decorate([
    apiMethod()
], StreamingRecordingModule.prototype, "getStreamInfo", null);
__decorate([
    apiMethod()
], StreamingRecordingModule.prototype, "startStreaming", null);
__decorate([
    apiMethod()
], StreamingRecordingModule.prototype, "stopStreaming", null);
//# sourceMappingURL=streaming-recording.js.map