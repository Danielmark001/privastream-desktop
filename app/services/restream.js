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
import { StatefulService, ViewHandler } from 'services';
import { Inject, mutation, InitAfter } from 'services/core';
import { getPlatformService } from 'services/platforms';
import { UserService } from 'services/user';
import { authorizedHeaders, jfetch } from 'util/requests';
import electron from 'electron';
import * as remote from '@electron/remote';
import { throwStreamError } from './streaming/stream-error';
import uuid from 'uuid';
import Utils from './utils';
import { $t } from './i18n';
let RestreamService = class RestreamService extends StatefulService {
    get streamInfo() {
        return this.streamingService.views;
    }
    get customDestinations() {
        var _a;
        return (((_a = this.streamingService.state.info.settings) === null || _a === void 0 ? void 0 : _a.customDestinations.filter(d => d.enabled)) || []);
    }
    get facebookGrandfathered() {
        return this.state.grandfathered;
    }
    get tiktokGrandfathered() {
        return this.state.tiktokGrandfathered;
    }
    get streamShiftStatus() {
        return this.state.streamShiftStatus;
    }
    get streamShiftTargets() {
        return this.state.streamShiftTargets;
    }
    SET_ENABLED(enabled) {
        this.state.enabled = enabled;
    }
    SET_GRANDFATHERED(facebook, tiktok) {
        this.state.grandfathered = facebook;
        this.state.tiktokGrandfathered = tiktok;
    }
    SET_STREAM_SWITCHER_STREAM_ID(id) {
        this.state.streamShiftStreamId = id !== null && id !== void 0 ? id : null;
    }
    SET_STREAM_SWITCHER_STATUS(status) {
        this.state.streamShiftStatus = status;
    }
    SET_STREAM_SWITCHER_TARGETS(targets) {
        this.state.streamShiftTargets = targets;
    }
    SET_STREAM_SWITCHER_FORCE_GO_LIVE(shouldForce) {
        this.state.streamShiftForceGoLive = shouldForce;
    }
    init() {
        this.userService.userLogin.subscribe(() => this.loadUserSettings());
        this.userService.userLogout.subscribe(() => {
            this.settings = null;
            this.SET_ENABLED(false);
        });
        this.userService.scopeAdded.subscribe(() => {
            this.refreshChat();
            this.platformAppsService.refreshApp('restream');
        });
    }
    get views() {
        return new RestreamView(this.state);
    }
    loadUserSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            this.settings = yield this.fetchUserSettings();
            this.SET_GRANDFATHERED(this.settings.grandfathered, this.settings.tiktokGrandfathered);
            this.SET_ENABLED(this.settings.enabled && this.views.canEnableRestream);
        });
    }
    get host() {
        return this.hostsService.streamlabs;
    }
    get chatUrl() {
        const nightMode = this.customizationService.isDarkTheme ? 'night' : 'day';
        const platforms = this.streamInfo.enabledPlatforms
            .filter(platform => ['youtube', 'twitch', 'facebook'].includes(platform))
            .join(',');
        const hasFBTarget = this.streamInfo.enabledPlatforms.includes('facebook');
        let fbParams = '';
        if (hasFBTarget) {
            const fbView = this.facebookService.views;
            const videoId = fbView.state.settings.liveVideoId;
            const token = fbView.getDestinationToken();
            fbParams = `&fbVideoId=${videoId}`;
            fbParams += `&fbToken=${token}`;
        }
        if (platforms) {
            return `https://${this.host}/embed/chat?oauth_token=${this.userService.apiToken}${fbParams}&mode=${nightMode}&send=true&platforms=${platforms}`;
        }
        else {
            return `https://${this.host}/embed/chat?oauth_token=${this.userService.apiToken}${fbParams}`;
        }
    }
    get shouldGoLiveWithRestream() {
        if (!this.views.canEnableRestream)
            return false;
        return this.streamInfo.isMultiplatformMode || this.streamInfo.isDualOutputMode;
    }
    fetchUserSettings(mode) {
        const headers = authorizedHeaders(this.userService.apiToken);
        let url;
        switch (mode) {
            case 'landscape': {
                url = `https://${this.host}/api/v1/rst/user/settings?mode=landscape`;
                break;
            }
            case 'portrait': {
                url = `https://${this.host}/api/v1/rst/user/settings?mode=portrait`;
                break;
            }
            default: {
                url = `https://${this.host}/api/v1/rst/user/settings`;
            }
        }
        const request = new Request(url, { headers });
        return jfetch(request);
    }
    fetchTargets() {
        const headers = authorizedHeaders(this.userService.apiToken);
        const url = `https://${this.host}/api/v1/rst/targets`;
        const request = new Request(url, { headers });
        return jfetch(request);
    }
    fetchIngest() {
        const headers = authorizedHeaders(this.userService.apiToken);
        const url = `https://${this.host}/api/v1/rst/ingest`;
        const request = new Request(url, { headers });
        return jfetch(request);
    }
    setEnabled(enabled) {
        this.SET_ENABLED(enabled);
        const headers = authorizedHeaders(this.userService.apiToken, new Headers({ 'Content-Type': 'application/json' }));
        const url = `https://${this.host}/api/v1/rst/user/settings`;
        const enableStreamShift = this.streamInfo.isStreamShiftMode && !this.streamInfo.isDualOutputMode;
        const body = JSON.stringify({
            enabled,
            dcProtection: false,
            idleTimeout: 30,
            streamSwitch: enableStreamShift,
        });
        const request = new Request(url, { headers, body, method: 'PUT' });
        return jfetch(request);
    }
    beforeGoLive() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.streamInfo.getIsValidRestreamConfig()) {
                throwStreamError('RESTREAM_SETUP_FAILED');
            }
            const shouldSwitchStreams = this.state.streamShiftTargets.length > 0;
            if (this.streamInfo.isStreamShiftMode && shouldSwitchStreams) {
                yield Promise.all([this.setupIngest()]);
            }
            else {
                yield Promise.all([this.setupIngest(), this.setupTargets()]);
            }
        });
    }
    setupIngest() {
        return __awaiter(this, void 0, void 0, function* () {
            const ingest = (yield this.fetchIngest()).server;
            if (this.streamInfo.isStreamShiftMode) {
                this.streamSettingsService.setSettings({
                    streamType: 'rtmp_custom',
                });
                const streamId = uuid();
                this.SET_STREAM_SWITCHER_STREAM_ID(streamId);
                const streamKey = `${this.settings.streamKey}&sid=${streamId}`;
                this.streamSettingsService.setSettings({
                    streamType: 'rtmp_custom',
                    key: streamKey,
                    server: ingest,
                });
            }
            else if (this.streamingService.views.isDualOutputMode) {
                const displays = this.streamInfo.displaysToRestream;
                displays.forEach((display) => __awaiter(this, void 0, void 0, function* () {
                    const mode = this.getMode(display);
                    const settings = yield this.fetchUserSettings(mode);
                    this.streamSettingsService.setSettings({
                        streamType: 'rtmp_custom',
                    }, display);
                    this.streamSettingsService.setSettings({
                        key: settings.streamKey,
                        server: ingest,
                    }, display);
                }));
            }
            else {
                this.streamSettingsService.setSettings({
                    streamType: 'rtmp_custom',
                });
                this.streamSettingsService.setSettings({
                    streamType: 'rtmp_custom',
                    key: this.settings.streamKey,
                    server: ingest,
                });
            }
        });
    }
    setupTargets() {
        return __awaiter(this, void 0, void 0, function* () {
            const isDualOutputMode = this.streamingService.views.isDualOutputMode;
            const targets = yield this.fetchTargets();
            const promises = targets.map(t => this.deleteTarget(t.id));
            yield Promise.all(promises);
            const newTargets = [
                ...this.streamInfo.enabledPlatforms.map(platform => isDualOutputMode
                    ? {
                        platform,
                        streamKey: getPlatformService(platform).state.streamKey,
                        mode: this.getPlatformMode(platform),
                    }
                    : {
                        platform,
                        streamKey: getPlatformService(platform).state.streamKey,
                    }),
                ...this.customDestinations.map(dest => isDualOutputMode
                    ? {
                        platform: 'relay',
                        streamKey: `${this.formatUrl(dest.url)}${dest.streamKey}`,
                        mode: this.getMode(dest.display),
                    }
                    : {
                        platform: 'relay',
                        streamKey: `${this.formatUrl(dest.url)}${dest.streamKey}`,
                    }),
            ];
            const tikTokTarget = newTargets.find(t => t.platform === 'tiktok');
            if (tikTokTarget) {
                const ttSettings = this.tiktokService.state.settings;
                tikTokTarget.platform = 'relay';
                tikTokTarget.streamKey = `${ttSettings.serverUrl}/${ttSettings.streamKey}`;
                tikTokTarget.mode = isDualOutputMode ? this.getPlatformMode('tiktok') : 'landscape';
            }
            const twitterTarget = newTargets.find(t => t.platform === 'twitter');
            if (twitterTarget) {
                twitterTarget.platform = 'relay';
                twitterTarget.streamKey = `${this.twitterService.state.ingest}/${this.twitterService.state.streamKey}`;
                twitterTarget.mode = isDualOutputMode ? this.getPlatformMode('twitter') : 'landscape';
            }
            const instagramTarget = newTargets.find(t => t.platform === 'instagram');
            if (instagramTarget) {
                instagramTarget.platform = 'relay';
                instagramTarget.streamKey = `${this.instagramService.state.settings.streamUrl}${this.instagramService.state.streamKey}`;
                instagramTarget.mode = isDualOutputMode ? this.getPlatformMode('instagram') : 'landscape';
            }
            const kickTarget = newTargets.find(t => t.platform === 'kick');
            if (kickTarget) {
                kickTarget.platform = 'relay';
                kickTarget.streamKey = `${this.kickService.state.ingest}/${this.kickService.state.streamKey}`;
                kickTarget.mode = isDualOutputMode ? this.getPlatformMode('kick') : 'landscape';
            }
            if (isDualOutputMode) {
                const modesToRestream = this.streamInfo.displaysToRestream.map(display => this.getMode(display));
                const filteredTargets = newTargets.filter(target => target.mode && modesToRestream.includes(target.mode));
                yield this.createTargets(filteredTargets);
            }
            else {
                yield this.createTargets(newTargets);
            }
        });
    }
    formatUrl(url) {
        return url.replace(/^\s+|\/+$/g, '') + '/';
    }
    checkStatus() {
        const url = `https://${this.host}/api/v1/rst/util/status`;
        const request = new Request(url);
        return jfetch(request).then(j => j.find(service => service.name === 'restream').status);
    }
    checkIsLive() {
        return __awaiter(this, void 0, void 0, function* () {
            const status = yield this.fetchLiveStatus();
            console.debug('Stream Shift Status', status);
            if (status.isLive) {
                this.streamSettingsService.setGoLiveSettings({ streamShift: true });
                this.SET_STREAM_SWITCHER_STATUS('pending');
                this.SET_STREAM_SWITCHER_TARGETS(status.targets);
            }
            else if (this.state.streamShiftStatus === 'pending') {
                this.SET_STREAM_SWITCHER_STATUS('inactive');
                this.SET_STREAM_SWITCHER_TARGETS([]);
            }
            return status.isLive;
        });
    }
    fetchLiveStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = authorizedHeaders(this.userService.apiToken, new Headers({ 'Content-Type': 'application/json' }));
            const url = `https://${this.host}/api/v1/rst/user/is-live`;
            const request = new Request(url, { headers });
            return jfetch(request);
        });
    }
    fetchTargetData() {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = authorizedHeaders(this.userService.apiToken);
            const platforms = this.state.streamShiftTargets
                .filter(t => t.platform !== 'relay')
                .map(t => t.platform)
                .join(',');
            const url = `https://${this.host}/api/v5/slobs/platform/status?platforms=${platforms}`;
            const request = new Request(url, { headers, method: 'GET' });
            return jfetch(request)
                .then((res) => {
                const targets = this.state.streamShiftTargets.reduce((targetData, t) => {
                    var _a;
                    const platform = t.platform;
                    if (t.platform !== 'relay') {
                        const data = (_a = res[platform]) === null || _a === void 0 ? void 0 : _a[0];
                        if (data) {
                            targetData.push(Object.assign(Object.assign({}, t), data));
                        }
                    }
                    return targetData;
                }, []);
                console.debug('Stream Shift target data', targets);
                this.SET_STREAM_SWITCHER_TARGETS(targets);
            })
                .catch((e) => {
                console.error('Error fetching stream shift target data:', e);
                return null;
            });
        });
    }
    getTargetLiveData(platform) {
        return this.state.streamShiftTargets.find(t => t.platform === platform);
    }
    setStreamShiftStatus(status) {
        this.SET_STREAM_SWITCHER_STATUS(status);
    }
    createTargets(targets) {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = authorizedHeaders(this.userService.apiToken, new Headers({ 'Content-Type': 'application/json' }));
            const url = `https://${this.host}/api/v1/rst/targets`;
            const body = JSON.stringify(targets.map(target => {
                return {
                    platform: target.platform,
                    streamKey: target.streamKey,
                    enabled: true,
                    dcProtection: false,
                    idleTimeout: 30,
                    label: `${target.platform} target`,
                    mode: target === null || target === void 0 ? void 0 : target.mode,
                };
            }));
            const request = new Request(url, { headers, body, method: 'POST' });
            const res = yield fetch(request);
            if (!res.ok)
                throw yield res.json();
            return res.json();
        });
    }
    deleteTarget(id) {
        const headers = authorizedHeaders(this.userService.apiToken);
        const url = `https://${this.host}/api/v1/rst/targets/${id}`;
        const request = new Request(url, { headers, method: 'DELETE' });
        return fetch(request);
    }
    updateTarget(id, streamKey) {
        const headers = authorizedHeaders(this.userService.apiToken, new Headers({ 'Content-Type': 'application/json' }));
        const url = `https://${this.host}/api/v1/rst/targets`;
        const body = JSON.stringify([
            {
                id,
                streamKey,
            },
        ]);
        const request = new Request(url, { headers, body, method: 'PUT' });
        return fetch(request).then(res => res.json());
    }
    setSwitchStreamId(id) {
        this.SET_STREAM_SWITCHER_STREAM_ID(id);
    }
    resetStreamShift() {
        this.SET_STREAM_SWITCHER_STATUS('inactive');
        this.SET_STREAM_SWITCHER_STREAM_ID();
        this.SET_STREAM_SWITCHER_TARGETS([]);
    }
    confirmStreamShift(action) {
        return __awaiter(this, void 0, void 0, function* () {
            if (action === 'rejected') {
                this.SET_STREAM_SWITCHER_STATUS('pending');
            }
            else {
                if (this.streamInfo.isDualOutputMode) {
                    this.dualOutputService.toggleDisplay(false, 'vertical');
                }
                this.SET_STREAM_SWITCHER_STATUS('inactive');
                this.updateStreamShift('approved');
            }
        });
    }
    updateStreamShift(action) {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = authorizedHeaders(this.userService.apiToken, new Headers({ 'Content-Type': 'application/json' }));
            const url = `https://${this.host}/api/v1/rst/switch/action`;
            const body = JSON.stringify({
                identifier: this.state.streamShiftStreamId,
                action,
            });
            const request = new Request(url, { headers, body, method: 'POST' });
            const res = yield fetch(request);
            if (!res.ok)
                throw yield res.json();
            return res.json();
        });
    }
    endStreamShiftStream(remoteStreamId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.SET_STREAM_SWITCHER_STATUS('active');
                yield this.streamingService.toggleStreaming();
                this.SET_STREAM_SWITCHER_STREAM_ID(remoteStreamId);
            }
            catch (error) {
                console.error('Error ending stream:', error);
                this.SET_STREAM_SWITCHER_STATUS('inactive');
                remote.dialog.showMessageBox(Utils.getMainWindow(), {
                    title: $t('Error Ended Stream - PC'),
                    type: 'info',
                    message: $t('Error ending stream. Please try ending the stream from the other device again.'),
                });
            }
        });
    }
    forceStreamShiftGoLive(shouldForce) {
        if (shouldForce) {
            this.streamSettingsService.setGoLiveSettings({ streamShift: false });
            this.SET_STREAM_SWITCHER_STATUS('inactive');
        }
        this.SET_STREAM_SWITCHER_FORCE_GO_LIVE(shouldForce);
    }
    refreshChat() {
        if (!this.chatView)
            return;
        this.chatView.webContents.loadURL(this.chatUrl);
    }
    mountChat(electronWindowId) {
        if (!this.chatView)
            this.initChat();
        const win = remote.BrowserWindow.fromId(electronWindowId);
        win.addBrowserView(this.chatView);
    }
    setChatBounds(position, size) {
        if (!this.chatView)
            return;
        this.chatView.setBounds({
            x: Math.round(position.x),
            y: Math.round(position.y),
            width: Math.round(size.x),
            height: Math.round(size.y),
        });
    }
    unmountChat(electronWindowId) {
        if (!this.chatView)
            return;
        const win = remote.BrowserWindow.fromId(electronWindowId);
        win.removeBrowserView(this.chatView);
        if (!this.state.enabled)
            this.deinitChat();
    }
    initChat() {
        if (this.chatView)
            return;
        const partition = this.userService.state.auth.partition;
        this.chatView = new remote.BrowserView({
            webPreferences: {
                partition,
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: false,
            },
        });
        this.customizationService.settingsChanged.subscribe((changed) => {
            this.handleSettingsChanged(changed);
        });
        this.chatView.webContents.loadURL(this.chatUrl);
        electron.ipcRenderer.send('webContents-preventPopup', this.chatView.webContents.id);
    }
    deinitChat() {
        if (!this.chatView)
            return;
        this.chatView.destroy();
        this.chatView = null;
    }
    handleSettingsChanged(changed) {
        if (!this.chatView)
            return;
        if (changed.chatZoomFactor) {
            this.chatView.webContents.setZoomFactor(changed.chatZoomFactor);
        }
    }
    getPlatformMode(platform) {
        const display = this.streamingService.views.getPlatformDisplayType(platform);
        return this.getMode(display);
    }
    getMode(display) {
        if (!display)
            return 'landscape';
        return display === 'horizontal' ? 'landscape' : 'portrait';
    }
};
RestreamService.initialState = {
    enabled: true,
    grandfathered: false,
    tiktokGrandfathered: false,
    streamShiftStreamId: undefined,
    streamShiftStatus: 'inactive',
    streamShiftTargets: [],
    streamShiftForceGoLive: false,
};
__decorate([
    Inject()
], RestreamService.prototype, "hostsService", void 0);
__decorate([
    Inject()
], RestreamService.prototype, "userService", void 0);
__decorate([
    Inject()
], RestreamService.prototype, "customizationService", void 0);
__decorate([
    Inject()
], RestreamService.prototype, "streamSettingsService", void 0);
__decorate([
    Inject()
], RestreamService.prototype, "streamingService", void 0);
__decorate([
    Inject()
], RestreamService.prototype, "incrementalRolloutService", void 0);
__decorate([
    Inject()
], RestreamService.prototype, "facebookService", void 0);
__decorate([
    Inject('TikTokService')
], RestreamService.prototype, "tiktokService", void 0);
__decorate([
    Inject()
], RestreamService.prototype, "trovoService", void 0);
__decorate([
    Inject()
], RestreamService.prototype, "kickService", void 0);
__decorate([
    Inject()
], RestreamService.prototype, "instagramService", void 0);
__decorate([
    Inject()
], RestreamService.prototype, "videoSettingsService", void 0);
__decorate([
    Inject('TwitterPlatformService')
], RestreamService.prototype, "twitterService", void 0);
__decorate([
    Inject()
], RestreamService.prototype, "platformAppsService", void 0);
__decorate([
    Inject()
], RestreamService.prototype, "dualOutputService", void 0);
__decorate([
    mutation()
], RestreamService.prototype, "SET_ENABLED", null);
__decorate([
    mutation()
], RestreamService.prototype, "SET_GRANDFATHERED", null);
__decorate([
    mutation()
], RestreamService.prototype, "SET_STREAM_SWITCHER_STREAM_ID", null);
__decorate([
    mutation()
], RestreamService.prototype, "SET_STREAM_SWITCHER_STATUS", null);
__decorate([
    mutation()
], RestreamService.prototype, "SET_STREAM_SWITCHER_TARGETS", null);
__decorate([
    mutation()
], RestreamService.prototype, "SET_STREAM_SWITCHER_FORCE_GO_LIVE", null);
RestreamService = __decorate([
    InitAfter('UserService')
], RestreamService);
export { RestreamService };
class RestreamView extends ViewHandler {
    get isGrandfathered() {
        return this.state.grandfathered || this.state.tiktokGrandfathered;
    }
    get canEnableRestream() {
        const userView = this.getServiceViews(UserService);
        return userView.isPrime || (userView.auth && this.isGrandfathered);
    }
    get streamShiftStatus() {
        return this.state.streamShiftStatus;
    }
    get streamShiftTargets() {
        return this.state.streamShiftTargets;
    }
    get hasStreamShiftTargets() {
        return this.state.streamShiftTargets.length > 0;
    }
    get shouldForceGoLive() {
        return this.state.streamShiftForceGoLive;
    }
}
__decorate([
    Inject()
], RestreamView.prototype, "incrementalRolloutService", void 0);
//# sourceMappingURL=restream.js.map