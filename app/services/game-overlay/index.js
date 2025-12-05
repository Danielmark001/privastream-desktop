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
import { ipcRenderer } from 'electron';
import { Subject } from 'rxjs';
import { Inject, InitAfter } from 'services/core';
import { enableBTTVEmotesScript } from 'services/chat';
import { PersistentStatefulService } from 'services/core/persistent-stateful-service';
import { mutation } from 'services/core/stateful-service';
import { $t } from 'services/i18n';
import { getOS, OS } from 'util/operating-systems';
import * as remote from '@electron/remote';
const { BrowserWindow } = remote;
const hideInteraction = `
  const elements = [];

  /* Platform Chats */
  // TODO: remove .chat-input if it was only for Twitch, as it wasn't working and fixed below
  elements.push(document.querySelector('.chat-input'));
  elements.push(document.querySelector('.webComposerBlock__3lT5b'));

  elements.forEach((el) => {
    if (el) { el.style.cssText = 'display: none !important'; }
  });

  const el = document.createElement('style');
  document.head.appendChild(el);
  const sheet = el.sheet;

  /* Recent Events */
  sheet.insertRule('.recent-events__header, .recent-events__tabs, .popout--recent-events { display: none !important; }');

  /* Twitch Chat */
  // Header
  sheet.insertRule('.stream-chat .stream-chat-header { display: none !important; }', sheet.cssRules.length);
  // Chat Input
  sheet.insertRule('.stream-chat .chat-input { display: none !important; }', sheet.cssRules.length);

  /* Trovo Chat */
  // Fix chat container that's cut off on Game Overlay's 300px wide window
  /*
   * The input box is rendered way after this code runs, insert a CSS rule to hide it instead of
   * manipulating style directly since we will never find the element here.
   * Since we're using CSSStyleSheet we add the rest of the rules here.
   *
   * 1. Fix chat wrapper width.
   * 2. Hide chat input panel.
   * 3. Hide all headers, including Gift Rank.
   */
  sheet.insertRule('#__layout .popout-container .chat-wrap { min-width: 300px }', sheet.cssRules.length);
  sheet.insertRule('#__layout .popout-container .chat-wrap .chat-header { display: none }', sheet.cssRules.length);
  sheet.insertRule('#__layout .popout-container .input-panels-container { display: none }', sheet.cssRules.length);
  sheet.insertRule('#__layout .popout-container .gift-rank-header { display: none }', sheet.cssRules.length);
`;
export var EGameOverlayState;
(function (EGameOverlayState) {
    EGameOverlayState["Disabled"] = "disabled";
    EGameOverlayState["Enabled"] = "enabled";
})(EGameOverlayState || (EGameOverlayState = {}));
export var EGameOverlayVisibility;
(function (EGameOverlayVisibility) {
    EGameOverlayVisibility["Hidden"] = "hidden";
    EGameOverlayVisibility["Visible"] = "visible";
})(EGameOverlayVisibility || (EGameOverlayVisibility = {}));
let GameOverlayService = class GameOverlayService extends PersistentStatefulService {
    constructor() {
        super(...arguments);
        this.windows = {};
        this.previewWindows = {};
        this.commonWindowOptions = {};
        this.overlayStatusChanged = new Subject();
        this.overlayVisibilityChanged = new Subject();
        this.overlayRunning = false;
    }
    init() {
        const _super = Object.create(null, {
            init: { get: () => super.init }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (getOS() !== OS.Windows)
                return;
            _super.init.call(this);
            this.userService.userLogout.subscribe(() => this.setEnabled(false));
        });
    }
    initializeOverlay() {
        if (!this.state.isEnabled)
            return;
        this.overlay = remote.require('game_overlay');
        if (this.overlayRunning)
            return;
        this.overlayRunning = true;
        let crashHandlerLogPath = '';
        if (process.env.NODE_ENV !== 'production' || !!process.env.SLOBS_PREVIEW) {
            const overlayLogFile = '\\game-overlays.log';
            crashHandlerLogPath = remote.app.getPath('userData') + overlayLogFile;
        }
        this.overlay.start(crashHandlerLogPath);
        this.assignCommonWindowOptions();
        const partition = this.userService.state.auth.partition;
        const chatWebPrefences = Object.assign(Object.assign({}, this.commonWindowOptions.webPreferences), { partition });
        this.windows.recentEvents = this.windowsService.createOneOffWindowForOverlay(Object.assign(Object.assign({}, this.commonWindowOptions), { width: 600, componentName: 'GameOverlayEventFeed', queryParams: { gameOverlay: true }, webPreferences: { offscreen: true, nodeIntegration: true, contextIsolation: false }, isFullScreen: true }));
        this.windows.chat = new BrowserWindow(Object.assign(Object.assign({}, this.commonWindowOptions), { height: 600, webPreferences: chatWebPrefences }));
        this.windows.chat.webContents.setAudioMuted(true);
        this.createPreviewWindows();
        this.configureWindows();
    }
    assignCommonWindowOptions() {
        const [containerX, containerY] = this.getWindowContainerStartingPosition();
        const { r, g, b } = this.customizationService.themeBackground;
        this.commonWindowOptions = {
            backgroundColor: '#' + r + g + b,
            show: false,
            frame: false,
            width: 300,
            height: 300,
            x: containerX,
            y: containerY,
            skipTaskbar: true,
            thickFrame: false,
            resizable: false,
            webPreferences: { nodeIntegration: false, offscreen: true },
        };
    }
    createPreviewWindows() {
        this.previewWindows.recentEvents = this.windowsService.createOneOffWindowForOverlay(Object.assign(Object.assign({}, this.commonWindowOptions), { width: 600, transparent: true, webPreferences: { offscreen: false, nodeIntegration: true, contextIsolation: false }, isFullScreen: true, alwaysOnTop: true, componentName: 'OverlayPlaceholder', title: $t('Recent Events') }));
        this.previewWindows.chat = this.windowsService.createOneOffWindowForOverlay(Object.assign(Object.assign({}, this.commonWindowOptions), { height: 600, transparent: true, webPreferences: { offscreen: false, nodeIntegration: true, contextIsolation: false }, isFullScreen: true, alwaysOnTop: true, componentName: 'OverlayPlaceholder', title: $t('Chat') }));
    }
    configureWindows() {
        Object.keys(this.windows).forEach((key) => {
            const win = this.windows[key];
            const position = this.determineStartPosition(key);
            const size = key === 'chat' ? { width: 300, height: 600 } : { width: 600, height: 300 };
            win.setBounds(Object.assign(Object.assign({}, position), size));
            this.previewWindows[key].setBounds(Object.assign(Object.assign({}, position), size));
        });
        this.createWindowOverlays();
        const chatUrl = this.streamingService.views.chatUrl;
        if (chatUrl) {
            this.windows.chat.loadURL(chatUrl).catch(this.handleRedirectError);
        }
        this.onChatUrlChangedSubscription = this.streamingService.streamInfoChanged.subscribe(streamInfo => {
            if (!this.state.isEnabled)
                return;
            const chatWindow = this.windows.chat;
            if (!chatWindow)
                return;
            if (streamInfo.chatUrl && streamInfo.chatUrl !== chatWindow.webContents.getURL()) {
                chatWindow.loadURL(streamInfo.chatUrl).catch(this.handleRedirectError);
            }
        });
    }
    handleRedirectError(e) {
        if (!e.message.match(/\(\-3\) loading/)) {
            throw e;
        }
    }
    determineStartPosition(window) {
        const pos = this.state.windowProperties[window].position;
        if (pos) {
            const display = remote.screen.getAllDisplays().find(display => {
                const bounds = display.bounds;
                const intBounds = pos.x >= bounds.x && pos.y >= bounds.y;
                const extBounds = pos.x < bounds.x + bounds.width && pos.y < bounds.y + bounds.height;
                return intBounds && extBounds;
            });
            if (display)
                return pos;
        }
        this.SET_WINDOW_POSITION(window, null);
        return this.defaultPosition(window);
    }
    resetPosition() {
        this.enabledWindows.forEach((key) => {
            const overlayId = this.state.windowProperties[key].id;
            if (!overlayId)
                return;
            this.SET_WINDOW_POSITION(key, null);
            const pos = this.defaultPosition(key);
            const size = key === 'chat' ? { width: 300, height: 600 } : { width: 600, height: 300 };
            this.windows[key].setBounds(Object.assign(Object.assign({}, pos), size));
            this.previewWindows[key].setBounds(Object.assign(Object.assign({}, pos), size));
            this.overlay.setPosition(overlayId, pos.x, pos.y, size.width, size.height);
        });
    }
    defaultPosition(key) {
        const [containerX, containerY] = this.getWindowContainerStartingPosition();
        const x = key === 'recentEvents' ? containerX - 600 : containerX;
        return { x, y: containerY };
    }
    showOverlay() {
        this.overlay.show();
        this.TOGGLE_OVERLAY(true);
        this.usageStatisticsService.recordFeatureUsage('GameOverlay');
        Object.values(this.windows).forEach(win => win.webContents.invalidate());
        this.overlayVisibilityChanged.next(EGameOverlayVisibility.Visible);
    }
    hideOverlay() {
        this.overlay.hide();
        this.TOGGLE_OVERLAY(false);
        this.overlayVisibilityChanged.next(EGameOverlayVisibility.Hidden);
    }
    toggleOverlay() {
        if (!this.state.isEnabled)
            return;
        this.initializeOverlay();
        if (this.overlay.getStatus() !== 'runing')
            return;
        if (this.state.previewMode)
            this.setPreviewMode(false);
        this.state.isShowing ? this.hideOverlay() : this.showOverlay();
    }
    get enabledWindows() {
        return Object.keys(this.windows).filter((win) => this.state.windowProperties[win].enabled);
    }
    setEnabled() {
        return __awaiter(this, arguments, void 0, function* (shouldEnable = true) {
            if (shouldEnable && !this.userService.isLoggedIn) {
                return Promise.reject();
            }
            const shouldStop = !shouldEnable && this.state.isEnabled;
            this.SET_ENABLED(shouldEnable);
            if (shouldStop)
                yield this.destroyOverlay();
            this.overlayStatusChanged.next(shouldEnable ? EGameOverlayState.Enabled : EGameOverlayState.Disabled);
        });
    }
    toggleWindowEnabled(window) {
        return __awaiter(this, void 0, void 0, function* () {
            this.TOGGLE_WINDOW_ENABLED(window);
            const id = this.state.windowProperties[window].id;
            this.overlay.setVisibility(id, this.state.windowProperties[window].enabled);
            if (!this.state.windowProperties[window].enabled) {
                this.previewWindows[window].hide();
            }
            else if (this.state.previewMode) {
                this.previewWindows[window].show();
            }
        });
    }
    setPreviewMode(previewMode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (previewMode)
                this.initializeOverlay();
            if (this.state.isShowing)
                this.hideOverlay();
            if (!this.state.isEnabled)
                return;
            this.SET_PREVIEW_MODE(previewMode);
            if (previewMode) {
                this.enabledWindows.forEach(win => this.previewWindows[win].show());
            }
            else {
                this.enabledWindows.forEach((key) => __awaiter(this, void 0, void 0, function* () {
                    const win = this.previewWindows[key];
                    const overlayId = this.state.windowProperties[key].id;
                    const [x, y] = win.getPosition();
                    this.SET_WINDOW_POSITION(key, { x, y });
                    const { width, height } = win.getBounds();
                    yield this.overlay.setPosition(overlayId, x, y, width, height);
                    win.hide();
                }));
            }
        });
    }
    setOverlayOpacity(percentage) {
        this.SET_OPACITY(percentage);
        if (!this.state.isEnabled)
            return;
        Object.keys(this.windows).forEach(key => {
            const overlayId = this.state.windowProperties[key].id;
            this.overlay.setTransparency(overlayId, percentage * 2.55);
        });
    }
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.destroyOverlay();
            this.overlayVisibilityChanged.next(EGameOverlayVisibility.Hidden);
        });
    }
    destroyOverlay() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.overlayRunning)
                return;
            this.overlayRunning = false;
            yield this.overlay.stop();
            if (this.windows)
                yield Object.values(this.windows).forEach(win => win.destroy());
            if (this.previewWindows) {
                yield Object.values(this.previewWindows).forEach(win => win.destroy());
            }
            this.onChatUrlChangedSubscription.unsubscribe();
            this.SET_PREVIEW_MODE(false);
            this.TOGGLE_OVERLAY(false);
        });
    }
    createWindowOverlays() {
        Object.keys(this.windows).forEach((key) => {
            const win = this.windows[key];
            if (win.isDestroyed())
                return;
            const overlayId = this.overlay.addHWND(win.getNativeWindowHandle());
            if (overlayId === -1 || overlayId == null) {
                win.hide();
                throw new Error('Error creating overlay');
            }
            this.SET_WINDOW_ID(key, overlayId);
            const position = this.getPosition(key, win);
            const { width, height } = win.getBounds();
            this.overlay.setPosition(overlayId, position.x, position.y, width, height);
            this.overlay.setTransparency(overlayId, this.state.opacity * 2.55);
            this.overlay.setVisibility(overlayId, this.state.windowProperties[key].enabled);
            win.webContents.executeJavaScript(hideInteraction);
            win.webContents.executeJavaScript(enableBTTVEmotesScript(this.customizationService.isDarkTheme), true);
            ipcRenderer.send('gameOverlayPaintCallback', { overlayId, contentsId: win.webContents.id });
            win.webContents.setFrameRate(1);
        });
    }
    getPosition(key, win) {
        if (this.state.windowProperties[key].position) {
            return this.state.windowProperties[key].position;
        }
        const [x, y] = win.getPosition();
        return { x, y };
    }
    getWindowContainerStartingPosition() {
        const display = this.windowsService.getMainWindowDisplay();
        return [display.workArea.height / 2 + 200, display.workArea.height / 2 - 300];
    }
    TOGGLE_OVERLAY(isShowing) {
        this.state.isShowing = isShowing;
    }
    SET_ENABLED(shouldEnable = true) {
        this.state.isEnabled = shouldEnable;
    }
    SET_PREVIEW_MODE(previewMode = true) {
        this.state.previewMode = previewMode;
    }
    SET_WINDOW_ID(window, id) {
        this.state.windowProperties[window].id = id;
    }
    SET_WINDOW_POSITION(window, position) {
        this.state.windowProperties[window].position = position;
    }
    TOGGLE_WINDOW_ENABLED(window) {
        this.state.windowProperties[window].enabled = !this.state.windowProperties[window].enabled;
    }
    SET_OPACITY(val) {
        this.state.opacity = val;
    }
};
GameOverlayService.defaultState = {
    isEnabled: false,
    isShowing: false,
    isPreviewEnabled: true,
    previewMode: false,
    opacity: 100,
    windowProperties: {
        chat: { position: null, id: null, enabled: true },
        recentEvents: { position: null, id: null, enabled: true },
    },
};
__decorate([
    Inject()
], GameOverlayService.prototype, "userService", void 0);
__decorate([
    Inject()
], GameOverlayService.prototype, "customizationService", void 0);
__decorate([
    Inject()
], GameOverlayService.prototype, "windowsService", void 0);
__decorate([
    Inject()
], GameOverlayService.prototype, "streamingService", void 0);
__decorate([
    Inject()
], GameOverlayService.prototype, "usageStatisticsService", void 0);
__decorate([
    mutation()
], GameOverlayService.prototype, "TOGGLE_OVERLAY", null);
__decorate([
    mutation()
], GameOverlayService.prototype, "SET_ENABLED", null);
__decorate([
    mutation()
], GameOverlayService.prototype, "SET_PREVIEW_MODE", null);
__decorate([
    mutation()
], GameOverlayService.prototype, "SET_WINDOW_ID", null);
__decorate([
    mutation()
], GameOverlayService.prototype, "SET_WINDOW_POSITION", null);
__decorate([
    mutation()
], GameOverlayService.prototype, "TOGGLE_WINDOW_ENABLED", null);
__decorate([
    mutation()
], GameOverlayService.prototype, "SET_OPACITY", null);
GameOverlayService = __decorate([
    InitAfter('UserService')
], GameOverlayService);
export { GameOverlayService };
//# sourceMappingURL=index.js.map