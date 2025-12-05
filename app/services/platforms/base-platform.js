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
import { ExecuteInCurrentWindow, Inject, mutation, StatefulService } from 'services/core';
import { EPlatformCallResult, } from './index';
import * as remote from '@electron/remote';
import { ENotificationType } from 'services/notifications';
const VIEWER_COUNT_UPDATE_INTERVAL = 60 * 1000;
export class BasePlatformService extends StatefulService {
    hasCapability(capability) {
        return this.capabilities.has(capability);
    }
    hasLiveDockFeature(feature) {
        return this.liveDockFeatures.has(feature);
    }
    get mergeUrl() {
        const host = this.hostsService.streamlabs;
        const token = this.userService.apiToken;
        return `https://${host}/slobs/merge/${token}/${this.platform}_account`;
    }
    afterGoLive() {
        return __awaiter(this, void 0, void 0, function* () {
            this.averageViewers = 0;
            this.peakViewers = 0;
            this.nViewerSamples = 0;
            const runInterval = () => __awaiter(this, void 0, void 0, function* () {
                if (this.hasCapability('viewerCount')) {
                    const count = yield this.fetchViewerCount();
                    this.nViewerSamples += 1;
                    this.averageViewers =
                        (this.averageViewers * (this.nViewerSamples - 1) + count) / this.nViewerSamples;
                    this.peakViewers = Math.max(this.peakViewers, count);
                    this.SET_VIEWERS_COUNT(count);
                }
                if (this.streamingService.views.isMidStreamMode) {
                    setTimeout(runInterval, VIEWER_COUNT_UPDATE_INTERVAL);
                }
            });
            if (this.hasCapability('viewerCount'))
                yield runInterval();
        });
    }
    unlink() {
        remote.shell.openExternal(`https://${this.hostsService.streamlabs}/dashboard#/settings/account-settings/platforms`);
    }
    syncSettingsWithLocalStorage() {
        const savedSettings = JSON.parse(localStorage.getItem(this.serviceName));
        if (savedSettings)
            this.UPDATE_STREAM_SETTINGS(savedSettings);
        this.store.watch(() => this.state.settings, () => {
            localStorage.setItem(this.serviceName, JSON.stringify(this.state.settings));
        }, { deep: true });
    }
    validatePlatform() {
        return __awaiter(this, void 0, void 0, function* () {
            return EPlatformCallResult.Success;
        });
    }
    postError(message) {
        this.notificationsService.actions.push({
            message,
            type: ENotificationType.WARNING,
            lifeTime: 5000,
        });
    }
    fetchUserInfo() {
        return Promise.resolve({});
    }
    setPlatformContext(platform) {
        if (this.streamingService.views.isDualOutputMode) {
            const display = this.streamingService.views.getPlatformDisplayType(platform);
            const mode = display === 'vertical' ? 'portrait' : 'landscape';
            this.UPDATE_STREAM_SETTINGS({
                mode,
            });
        }
    }
    SET_VIEWERS_COUNT(viewers) {
        this.state.viewersCount = viewers;
    }
    SET_STREAM_KEY(key) {
        this.state.streamKey = key;
    }
    SET_PREPOPULATED(isPrepopulated) {
        this.state.isPrepopulated = isPrepopulated;
    }
    SET_STREAM_SETTINGS(settings) {
        this.state.settings = settings;
    }
    UPDATE_STREAM_SETTINGS(settingsPatch) {
        this.state.settings = Object.assign(Object.assign({}, this.state.settings), settingsPatch);
    }
}
BasePlatformService.initialState = {
    streamKey: '',
    viewersCount: 0,
    settings: null,
    isPrepopulated: false,
};
__decorate([
    Inject()
], BasePlatformService.prototype, "streamingService", void 0);
__decorate([
    Inject()
], BasePlatformService.prototype, "userService", void 0);
__decorate([
    Inject()
], BasePlatformService.prototype, "hostsService", void 0);
__decorate([
    Inject()
], BasePlatformService.prototype, "streamSettingsService", void 0);
__decorate([
    Inject()
], BasePlatformService.prototype, "dualOutputService", void 0);
__decorate([
    Inject()
], BasePlatformService.prototype, "videoSettingsService", void 0);
__decorate([
    Inject()
], BasePlatformService.prototype, "notificationsService", void 0);
__decorate([
    ExecuteInCurrentWindow()
], BasePlatformService.prototype, "hasCapability", null);
__decorate([
    ExecuteInCurrentWindow()
], BasePlatformService.prototype, "hasLiveDockFeature", null);
__decorate([
    mutation()
], BasePlatformService.prototype, "SET_VIEWERS_COUNT", null);
__decorate([
    mutation()
], BasePlatformService.prototype, "SET_STREAM_KEY", null);
__decorate([
    mutation()
], BasePlatformService.prototype, "SET_PREPOPULATED", null);
__decorate([
    mutation()
], BasePlatformService.prototype, "SET_STREAM_SETTINGS", null);
__decorate([
    mutation()
], BasePlatformService.prototype, "UPDATE_STREAM_SETTINGS", null);
//# sourceMappingURL=base-platform.js.map