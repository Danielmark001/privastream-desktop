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
import uuid from 'uuid/v4';
import { mutation, StatefulService } from 'services/core/stateful-service';
import { Inject } from 'services/core/injector';
import electron, { ipcRenderer } from 'electron';
import { track } from 'services/usage-statistics';
import * as obs from '../../../obs-api';
import { RunInLoadingMode } from './app-decorators';
import Utils from 'services/utils';
import { Subject } from 'rxjs';
import { downloadFile } from '../../util/requests';
import { OS, getOS } from 'util/operating-systems';
import * as remote from '@electron/remote';
export class AppService extends StatefulService {
    constructor() {
        super(...arguments);
        this.appDataDirectory = remote.app.getPath('userData');
        this.loadingChanged = new Subject();
        this.loadingPromises = {};
        this.pid = require('process').pid;
        this.shutdownStarted = new Subject();
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            if (Utils.isDevMode()) {
                electron.ipcRenderer.on('showErrorAlert', () => {
                    this.SET_ERROR_ALERT(true);
                });
            }
            this.realmService.connect();
            yield Promise.all([
                this.userService.autoLogin(),
                this.downloadAutoGameCaptureConfig(),
            ]).catch(e => {
                console.error('Auto login failed', e);
            });
            this.crashReporterService.beginStartup();
            if (!this.userService.isLoggedIn) {
                yield this.sceneCollectionsService.initialize();
            }
            this.SET_ONBOARDED(this.onboardingService.startOnboardingIfRequired());
            this.dismissablesService.initialize();
            electron.ipcRenderer.on('shutdown', () => {
                this.windowsService.hideMainWindow();
                electron.ipcRenderer.send('acknowledgeShutdown');
                this.shutdownHandler();
            });
            this.performanceService.startMonitoringPerformance();
            this.ipcServerService.listen();
            this.tcpServerService.listen();
            this.patchNotesService.showPatchNotesIfRequired(this.state.onboarded);
            this.crashReporterService.endStartup();
            this.protocolLinksService.start(this.state.argv);
            if (getOS() === OS.Mac) {
                this.touchBarService;
                this.applicationMenuService;
            }
            ipcRenderer.send('AppInitFinished');
            const sceneCollectionLoadingTime = Date.now();
            this.metricsService.recordMetric('sceneCollectionLoadingTime', sceneCollectionLoadingTime);
            const metrics = this.metricsService.getMetrics();
            if (metrics === null || metrics === void 0 ? void 0 : metrics.appStartTime) {
                console.log('=================================\n', 'Time to load scene collection: ', (sceneCollectionLoadingTime - metrics.appStartTime) / 1000, 'seconds', '\n=================================');
            }
        });
    }
    shutdownHandler() {
        this.START_LOADING();
        this.loadingChanged.next(true);
        this.tcpServerService.stopListening();
        window.setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            obs.NodeObs.InitShutdownSequence();
            this.streamAvatarService.stopAvatarProcess();
            this.crashReporterService.beginShutdown();
            this.shutdownStarted.next();
            this.keyListenerService.shutdown();
            this.platformAppsService.unloadAllApps();
            yield this.usageStatisticsService.flushEvents();
            this.windowsService.shutdown();
            this.ipcServerService.stopListening();
            yield this.userService.flushUserSession();
            yield this.sceneCollectionsService.deinitialize();
            this.performanceService.stop();
            this.transitionsService.shutdown();
            this.videoSettingsService.shutdown();
            yield this.gameOverlayService.destroy();
            yield this.fileManagerService.flushAll();
            obs.NodeObs.RemoveSourceCallback();
            obs.NodeObs.RemoveTransitionCallback();
            obs.NodeObs.RemoveVolmeterCallback();
            obs.NodeObs.OBS_service_removeCallback();
            obs.IPC.disconnect();
            this.crashReporterService.endShutdown();
            electron.ipcRenderer.send('shutdownComplete');
        }), 300);
    }
    runInLoadingMode(fn_1) {
        return __awaiter(this, arguments, void 0, function* (fn, options = {}) {
            const opts = Object.assign({ hideStyleBlockers: true }, options);
            if (!this.state.loading) {
                if (opts.hideStyleBlockers)
                    this.windowsService.updateStyleBlockers('main', true);
                this.START_LOADING();
                this.loadingChanged.next(true);
                const childWindow = this.windowsService.state.child;
                const isManageSceneCollections = childWindow.componentName === 'ManageSceneCollections';
                const isStreamSettings = childWindow.componentName === 'Settings' &&
                    this.navigationService.state.currentSettingsTab === 'Stream';
                if (!isManageSceneCollections && !isStreamSettings) {
                    this.windowsService.closeChildWindow();
                }
                yield this.windowsService.closeAllOneOffs();
                yield new Promise(resolve => setTimeout(resolve, 200));
                yield this.sceneCollectionsService.disableAutoSave();
            }
            let error = null;
            let result = null;
            try {
                result = fn();
            }
            catch (e) {
                error = null;
            }
            let returningValue = result;
            if (result instanceof Promise) {
                const promiseId = uuid();
                this.loadingPromises[promiseId] = result;
                try {
                    returningValue = yield result;
                }
                catch (e) {
                    error = e;
                }
                delete this.loadingPromises[promiseId];
            }
            if (Object.keys(this.loadingPromises).length > 0) {
                if (error)
                    throw error;
                return returningValue;
            }
            this.tcpServerService.startRequestsHandling();
            this.sceneCollectionsService.enableAutoSave();
            this.FINISH_LOADING();
            this.loadingChanged.next(false);
            if (opts.hideStyleBlockers) {
                setTimeout(() => this.windowsService.updateStyleBlockers('main', false), 500);
            }
            if (error)
                throw error;
            return returningValue;
        });
    }
    downloadAutoGameCaptureConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            yield downloadFile('https://slobs-cdn.streamlabs.com/configs/game_capture_list.json', `${this.appDataDirectory}/game_capture_list.json`);
        });
    }
    START_LOADING() {
        this.state.loading = true;
    }
    FINISH_LOADING() {
        this.state.loading = false;
    }
    SET_ERROR_ALERT(errorAlert) {
        this.state.errorAlert = errorAlert;
    }
    SET_ARGV(argv) {
        this.state.argv = argv;
    }
    SET_ONBOARDED(onboarded) {
        this.state.onboarded = onboarded;
    }
}
AppService.initialState = {
    loading: true,
    argv: remote.process.argv,
    errorAlert: false,
    onboarded: false,
};
__decorate([
    Inject()
], AppService.prototype, "onboardingService", void 0);
__decorate([
    Inject()
], AppService.prototype, "sceneCollectionsService", void 0);
__decorate([
    Inject()
], AppService.prototype, "hotkeysService", void 0);
__decorate([
    Inject()
], AppService.prototype, "userService", void 0);
__decorate([
    Inject()
], AppService.prototype, "shortcutsService", void 0);
__decorate([
    Inject()
], AppService.prototype, "patchNotesService", void 0);
__decorate([
    Inject()
], AppService.prototype, "windowsService", void 0);
__decorate([
    Inject()
], AppService.prototype, "outageNotificationsService", void 0);
__decorate([
    Inject()
], AppService.prototype, "platformAppsService", void 0);
__decorate([
    Inject()
], AppService.prototype, "gameOverlayService", void 0);
__decorate([
    Inject()
], AppService.prototype, "touchBarService", void 0);
__decorate([
    Inject()
], AppService.prototype, "transitionsService", void 0);
__decorate([
    Inject()
], AppService.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], AppService.prototype, "scenesService", void 0);
__decorate([
    Inject()
], AppService.prototype, "videoService", void 0);
__decorate([
    Inject()
], AppService.prototype, "streamlabelsService", void 0);
__decorate([
    Inject()
], AppService.prototype, "ipcServerService", void 0);
__decorate([
    Inject()
], AppService.prototype, "tcpServerService", void 0);
__decorate([
    Inject()
], AppService.prototype, "performanceService", void 0);
__decorate([
    Inject()
], AppService.prototype, "fileManagerService", void 0);
__decorate([
    Inject()
], AppService.prototype, "protocolLinksService", void 0);
__decorate([
    Inject()
], AppService.prototype, "crashReporterService", void 0);
__decorate([
    Inject()
], AppService.prototype, "announcementsService", void 0);
__decorate([
    Inject()
], AppService.prototype, "incrementalRolloutService", void 0);
__decorate([
    Inject()
], AppService.prototype, "recentEventsService", void 0);
__decorate([
    Inject()
], AppService.prototype, "dismissablesService", void 0);
__decorate([
    Inject()
], AppService.prototype, "restreamService", void 0);
__decorate([
    Inject()
], AppService.prototype, "applicationMenuService", void 0);
__decorate([
    Inject()
], AppService.prototype, "keyListenerService", void 0);
__decorate([
    Inject()
], AppService.prototype, "metricsService", void 0);
__decorate([
    Inject()
], AppService.prototype, "settingsService", void 0);
__decorate([
    Inject()
], AppService.prototype, "usageStatisticsService", void 0);
__decorate([
    Inject()
], AppService.prototype, "videoSettingsService", void 0);
__decorate([
    Inject()
], AppService.prototype, "dualOutputService", void 0);
__decorate([
    Inject()
], AppService.prototype, "realmService", void 0);
__decorate([
    Inject()
], AppService.prototype, "streamAvatarService", void 0);
__decorate([
    Inject()
], AppService.prototype, "navigationService", void 0);
__decorate([
    track('app_start'),
    RunInLoadingMode()
], AppService.prototype, "load", null);
__decorate([
    track('app_close')
], AppService.prototype, "shutdownHandler", null);
__decorate([
    mutation()
], AppService.prototype, "START_LOADING", null);
__decorate([
    mutation()
], AppService.prototype, "FINISH_LOADING", null);
__decorate([
    mutation()
], AppService.prototype, "SET_ERROR_ALERT", null);
__decorate([
    mutation()
], AppService.prototype, "SET_ARGV", null);
__decorate([
    mutation()
], AppService.prototype, "SET_ONBOARDED", null);
//# sourceMappingURL=app.js.map