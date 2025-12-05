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
import path from 'path';
import { Service } from 'services/core/service';
import { Inject } from 'services/core/injector';
import electron, { ipcRenderer } from 'electron';
import url from 'url';
import { $t } from 'services/i18n';
import { WidgetType } from 'services/widgets';
import { InitAfter } from './core';
import Utils from './utils';
import { GuestApiHandler } from 'util/guest-api-handler';
import { assertIsDefined } from 'util/properties-type-guards';
import * as remote from '@electron/remote';
export function enableBTTVEmotesScript(isDarkTheme) {
    return `
localStorage.setItem('bttv_clickTwitchEmotes', true);
localStorage.setItem('bttv_darkenedMode', ${isDarkTheme ? 'true' : 'false'});

var bttvscript = document.createElement('script');
bttvscript.setAttribute('src','https://cdn.betterttv.net/betterttv.js');
document.head.appendChild(bttvscript);

function loadLazyEmotes() {
  var els = document.getElementsByClassName('lazy-emote');

  Array.prototype.forEach.call(els, el => {
    const src = el.getAttribute('data-src');
    if (el.src !== 'https:' + src) el.src = src;
  });

  setTimeout(loadLazyEmotes, 1000);
}

loadLazyEmotes();
0;
`;
}
let ChatService = class ChatService extends Service {
    constructor() {
        super(...arguments);
        this.chatUrl = '';
        this.exposedHighlightApi = false;
    }
    init() {
        this.chatUrl = this.streamingService.views.chatUrl;
        this.streamingService.streamInfoChanged.subscribe(streamInfo => {
            if (streamInfo.chatUrl === this.chatUrl)
                return;
            const oldChatUrl = this.chatUrl;
            this.chatUrl = streamInfo.chatUrl;
            if (oldChatUrl && !this.chatUrl) {
                this.unmountChat();
                return;
            }
            this.loadUrl();
        });
        this.userService.userLogout.subscribe(() => {
            this.deinitChat();
        });
        this.sourcesService.sourceAdded.subscribe((source) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (source.propertiesManagerType === 'widget' &&
                ((_a = source.propertiesManagerSettings) === null || _a === void 0 ? void 0 : _a.widgetType) === WidgetType.ChatHighlight) {
                this.exposeHighlightApi();
                this.refreshChat();
            }
        }));
    }
    refreshChat() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadUrl();
        });
    }
    hasChatHighlightWidget() {
        return !!this.widgetsService.views.widgetSources.find(source => source.type === WidgetType.ChatHighlight);
    }
    mountChat(electronWindowId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.chatView)
                this.initChat();
            this.electronWindowId = electronWindowId;
            const win = remote.BrowserWindow.fromId(electronWindowId);
            if (this.chatView && win)
                win.addBrowserView(this.chatView);
        });
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
    unmountChat() {
        if (!this.electronWindowId)
            return;
        const win = remote.BrowserWindow.fromId(this.electronWindowId);
        if (this.chatView && win)
            win.removeBrowserView(this.chatView);
        this.electronWindowId = null;
    }
    initChat() {
        var _a;
        if (this.chatView)
            return;
        if (!this.userService.isLoggedIn)
            return;
        const partition = (_a = this.userService.state.auth) === null || _a === void 0 ? void 0 : _a.partition;
        this.chatView = new remote.BrowserView({
            webPreferences: {
                partition,
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.resolve(remote.app.getAppPath(), 'bundles', 'guest-api.js'),
                sandbox: false,
            },
        });
        electron.ipcRenderer.sendSync('webContents-enableRemote', this.chatView.webContents.id);
        this.bindWindowListener();
        this.bindDomReadyListener();
        this.customizationService.settingsChanged.subscribe(changed => {
            this.handleSettingsChanged(changed);
        });
        if (this.chatUrl)
            this.loadUrl();
    }
    deinitChat() {
        this.unmountChat();
        this.exposedHighlightApi = false;
        this.chatView = null;
    }
    loadUrl() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.chatUrl)
                return;
            if (!this.chatView)
                return;
            yield this.chatView.webContents.loadURL(this.chatUrl).catch(this.handleRedirectError);
            yield Utils.sleep(1000);
            if (this.chatView.webContents.getURL() !== this.chatUrl) {
                yield this.chatView.webContents.loadURL(this.chatUrl).catch(this.handleRedirectError);
            }
        });
    }
    handleRedirectError(e) {
        if (!e.message.match(/\(\-3\) loading/)) {
            throw e;
        }
    }
    bindWindowListener() {
        if (!this.chatView)
            return;
        if (this.userService.platformType === 'youtube') {
            ipcRenderer.send('webContents-bindYTChat', this.chatView.webContents.id);
            this.chatView.webContents.on('will-navigate', (e, targetUrl) => {
                const parsed = url.parse(targetUrl);
                if (parsed.hostname === 'accounts.google.com') {
                    remote.dialog
                        .showMessageBox(Utils.getMainWindow(), {
                        title: $t('YouTube Chat'),
                        message: $t('This action cannot be performed inside Streamlabs Desktop. To interact with chat, you can open this chat in a web browser.'),
                        buttons: [$t('OK'), $t('Open In Web Browser')],
                    })
                        .then(({ response }) => {
                        if (response === 1) {
                            remote.shell.openExternal(this.chatUrl);
                        }
                    });
                }
            });
        }
        this.chatView.webContents.setWindowOpenHandler(details => {
            var _a;
            const parsedUrl = url.parse(details.url);
            const protocol = parsedUrl.protocol;
            if (protocol === 'http:' || protocol === 'https:') {
                if (parsedUrl.host &&
                    parsedUrl.query &&
                    (parsedUrl.host === 'twitch.tv' || parsedUrl.host.endsWith('.twitch.tv')) &&
                    parsedUrl.query.includes('ffz-settings')) {
                    this.windowsService.createOneOffWindow({
                        componentName: 'FFZSettings',
                        title: $t('FrankerFaceZ Settings'),
                        queryParams: {},
                        size: {
                            width: 800,
                            height: 800,
                        },
                    }, 'ffz-settings');
                }
                else if (details.url === 'https://trovo.live/?openLogin=1') {
                    const loginWindow = new remote.BrowserWindow({
                        width: 600,
                        height: 800,
                        webPreferences: {
                            partition: (_a = this.userService.views.auth) === null || _a === void 0 ? void 0 : _a.partition,
                            nodeIntegration: false,
                            autoplayPolicy: 'document-user-activation-required',
                        },
                    });
                    loginWindow.webContents.setAudioMuted(true);
                    let loadedOnce = false;
                    loginWindow.webContents.on('did-navigate', () => {
                        if (loadedOnce) {
                            loginWindow.close();
                        }
                        else {
                            loadedOnce = true;
                        }
                    });
                    loginWindow.removeMenu();
                    loginWindow.loadURL(details.url);
                }
                else {
                    remote.shell.openExternal(details.url);
                }
            }
            return { action: 'deny' };
        });
    }
    exposeHighlightApi() {
        if (!this.chatView)
            return;
        if (!this.hasChatHighlightWidget() || this.exposedHighlightApi)
            return;
        new GuestApiHandler().exposeApi(this.chatView.webContents.id, {
            pinMessage: (messageData) => this.chatHighlightService.pinMessage(messageData),
            unpinMessage: () => this.chatHighlightService.unpinMessage(),
            showUnpinButton: this.chatHighlightService.hasPinnedMessage,
        });
        this.exposedHighlightApi = true;
    }
    bindDomReadyListener() {
        if (!this.chatView)
            return;
        const settings = this.customizationService.state;
        this.exposeHighlightApi();
        this.chatView.webContents.on('dom-ready', () => {
            var _a, _b;
            if (!this.chatView)
                return;
            this.chatView.webContents.setZoomFactor(settings.chatZoomFactor);
            if (((_a = this.userService.platform) === null || _a === void 0 ? void 0 : _a.type) === 'twitch') {
                if (settings.enableBTTVEmotes) {
                    this.chatView.webContents.executeJavaScript(enableBTTVEmotesScript(this.customizationService.isDarkTheme), true);
                }
                if (settings.enableFFZEmotes) {
                    this.chatView.webContents.executeJavaScript(`
            var ffzscript1 = document.createElement('script');
            ffzscript1.setAttribute('src','https://cdn.frankerfacez.com/script/script.min.js');
            document.head.appendChild(ffzscript1);
            0;
          `, true);
                }
                if (this.hasChatHighlightWidget()) {
                    setTimeout(() => {
                        if (!this.chatView)
                            return;
                        const chatHighlightScript = require('!!raw-loader!./widgets/settings/chat-highlight-script.js');
                        assertIsDefined(chatHighlightScript.default);
                        this.chatView.webContents.executeJavaScript(chatHighlightScript.default, true);
                    }, 10000);
                }
            }
            if (((_b = this.userService.platform) === null || _b === void 0 ? void 0 : _b.type) === 'facebook') {
                Utils.sleep(2000).then(() => {
                    if (!this.chatView)
                        return;
                    this.chatView.webContents
                        .executeJavaScript(`
                document.querySelector('html').style = 'overflow-y: hidden !important;';

                var chatContainer = document.querySelector('iframe').contentDocument.querySelector('body > div > div > div');
                chatContainer.style.marginLeft = '0';
                chatContainer.style.marginRight = '0';
                chatContainer.style.maxWidth = 'none';
                `, true)
                        .catch(e => {
                        console.error(e);
                    });
                });
            }
        });
    }
    handleSettingsChanged(changed) {
        if (!this.chatView)
            return;
        if (changed.chatZoomFactor) {
            this.chatView.webContents.setZoomFactor(changed.chatZoomFactor);
        }
        if (changed.enableBTTVEmotes != null || changed.enableFFZEmotes != null) {
            this.refreshChat();
        }
    }
    showMultistreamChatWindow() {
        this.windowsService.createOneOffWindow({
            componentName: 'MultistreamChatInfo',
            title: $t('Multichat Platform Support'),
            size: {
                width: 748,
                height: 635,
                minWidth: 748,
                minHeight: 635,
            },
        }, 'MultistreamChatInfo');
    }
};
__decorate([
    Inject()
], ChatService.prototype, "userService", void 0);
__decorate([
    Inject()
], ChatService.prototype, "customizationService", void 0);
__decorate([
    Inject()
], ChatService.prototype, "windowsService", void 0);
__decorate([
    Inject()
], ChatService.prototype, "streamingService", void 0);
__decorate([
    Inject()
], ChatService.prototype, "chatHighlightService", void 0);
__decorate([
    Inject()
], ChatService.prototype, "widgetsService", void 0);
__decorate([
    Inject()
], ChatService.prototype, "sourcesService", void 0);
ChatService = __decorate([
    InitAfter('StreamingService')
], ChatService);
export { ChatService };
//# sourceMappingURL=chat.js.map