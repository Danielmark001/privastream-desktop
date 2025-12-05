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
import { Subject } from 'rxjs';
import debounce from 'lodash/debounce';
import { Service } from '../core/service';
import * as obs from '../../../obs-api';
import { Inject } from 'services';
export class AutoConfigService extends Service {
    constructor() {
        super(...arguments);
        this.configProgress = new Subject();
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            return;
        });
    }
    startRecording() {
        return __awaiter(this, void 0, void 0, function* () {
            return;
        });
    }
    handleProgress(progress) {
        if (progress.event === 'stopping_step') {
            if (progress.description === 'bandwidth_test') {
                obs.NodeObs.StartStreamEncoderTest();
            }
            else if (progress.description === 'streamingEncoder_test') {
                obs.NodeObs.StartRecordingEncoderTest();
            }
            else if (progress.description === 'recordingEncoder_test') {
                obs.NodeObs.StartCheckSettings();
            }
            else if (progress.description === 'checking_settings') {
                obs.NodeObs.StartSaveStreamSettings();
            }
            else if (progress.description === 'saving_service') {
                obs.NodeObs.StartSaveSettings();
            }
            else if (progress.description === 'setting_default_settings') {
                obs.NodeObs.StartSaveStreamSettings();
            }
        }
        if (progress.event === 'error') {
            obs.NodeObs.StartSetDefaultSettings();
            obs.NodeObs.TerminateAutoConfig();
            this.configProgress.next(progress);
        }
        if (progress.event === 'done') {
            obs.NodeObs.TerminateAutoConfig();
            this.videoSettingsService.migrateAutoConfigSettings();
        }
    }
    handleRecordingProgress(progress) {
        if (progress.event === 'stopping_step') {
            if (progress.description === 'recordingEncoder_test') {
                obs.NodeObs.StartSaveSettings();
            }
            else {
                obs.NodeObs.TerminateAutoConfig();
                this.videoSettingsService.migrateAutoConfigSettings();
                debounce(() => this.configProgress.next(Object.assign(Object.assign({}, progress), { event: 'done' })), 1000)();
            }
        }
    }
}
__decorate([
    Inject()
], AutoConfigService.prototype, "streamSettingsService", void 0);
__decorate([
    Inject()
], AutoConfigService.prototype, "videoSettingsService", void 0);
__decorate([
    Inject()
], AutoConfigService.prototype, "userService", void 0);
//# sourceMappingURL=index.js.map