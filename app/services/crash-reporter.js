var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Service } from 'services/core/service';
import { EStreamingState } from 'services/streaming';
import { Inject } from 'services/core/injector';
import path from 'path';
import fs from 'fs';
import Utils from './utils';
var EAppState;
(function (EAppState) {
    EAppState["Starting"] = "starting";
    EAppState["Idle"] = "idle";
    EAppState["StreamStarting"] = "stream_starting";
    EAppState["StreamEnding"] = "stream_ending";
    EAppState["Streaming"] = "streaming";
    EAppState["StreamReconnecting"] = "stream_reconnecting";
    EAppState["Closing"] = "closing";
    EAppState["CleanExit"] = "clean_exit";
})(EAppState || (EAppState = {}));
export class CrashReporterService extends Service {
    beginStartup() {
        this.appState = this.readStateFile();
        this.usageStatisticsService.recordAnalyticsEvent('AppStart', {
            exitState: this.appState,
            sysInfo: this.usageStatisticsService.getSysInfo(),
        });
        if (this.appState.code !== EAppState.CleanExit) {
            this.usageStatisticsService.recordEvent('crash', {
                crashType: this.appState,
            });
        }
        this.writeStateFile(EAppState.Starting);
    }
    endStartup() {
        this.writeStateFile(EAppState.Idle);
        this.streamingSubscription = this.streamingService.streamingStatusChange.subscribe(status => {
            switch (status) {
                case EStreamingState.Starting:
                    this.writeStateFile(EAppState.StreamStarting);
                    break;
                case EStreamingState.Reconnecting:
                    this.writeStateFile(EAppState.StreamReconnecting);
                    break;
                case EStreamingState.Live:
                    this.writeStateFile(EAppState.Streaming);
                    break;
                case EStreamingState.Ending:
                    this.writeStateFile(EAppState.StreamEnding);
                    break;
                case EStreamingState.Offline:
                    this.writeStateFile(EAppState.Idle);
                    break;
            }
        });
    }
    beginShutdown() {
        this.streamingSubscription.unsubscribe();
        this.writeStateFile(EAppState.Closing);
    }
    endShutdown() {
        this.writeStateFile(EAppState.CleanExit);
    }
    writeStateFile(code) {
        this.appState = this.readStateFile();
        this.appState.code = code;
        if (this.appState.code === EAppState.Starting) {
            this.appState.detected = '';
            this.appState.version = this.version;
        }
        if (process.env.NODE_ENV !== 'production')
            return;
        try {
            fs.writeFileSync(this.appStateFile, JSON.stringify(this.appState));
        }
        catch (e) {
            console.error('Error writing app state file', e);
        }
    }
    get appStateFile() {
        return path.join(this.appService.appDataDirectory, 'appState');
    }
    readStateFile() {
        const clearState = { code: EAppState.CleanExit, version: this.version, detected: '' };
        try {
            if (!fs.existsSync(this.appStateFile))
                return clearState;
            const stateString = fs.readFileSync(this.appStateFile).toString();
            try {
                return JSON.parse(stateString);
            }
            catch (e) {
                return { code: stateString, version: this.version, detected: '' };
            }
        }
        catch (e) {
            console.error('Error loading app state file', e);
            return clearState;
        }
    }
    get version() {
        return Utils.env.SLOBS_VERSION;
    }
}
__decorate([
    Inject()
], CrashReporterService.prototype, "streamingService", void 0);
__decorate([
    Inject()
], CrashReporterService.prototype, "usageStatisticsService", void 0);
__decorate([
    Inject()
], CrashReporterService.prototype, "appService", void 0);
//# sourceMappingURL=crash-reporter.js.map