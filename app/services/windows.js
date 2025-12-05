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
import cloneDeep from 'lodash/cloneDeep';
import { mutation, StatefulService } from 'services/core/stateful-service';
import electron from 'electron';
import Vue from 'vue';
import Utils from 'services/utils';
import { Subject } from 'rxjs';
import { throttle } from 'lodash-decorators';
import * as remote from '@electron/remote';
import FFZSettings from 'components/windows/FFZSettings.vue';
import SceneTransitions from 'components/windows/SceneTransitions.vue';
import { NameFolder, NameScene, GoLiveWindow, EditStreamWindow, IconLibraryProperties, ScreenCaptureProperties, GuestCamProperties, SharedComponentsLibrary, SourceProperties, RenameSource, AdvancedStatistics, ManageSceneCollections, WidgetWindow, CustomCodeWindow, SafeMode, AdvancedAudio, SourceShowcase, SourceFilters, MediaGallery, Projector, AddSource, WelcomeToPrime, NotificationsAndNews, PlatformAppPopOut, RecentEventsWindow, EditTransform, Blank, Main, MultistreamChatInfo, MarketingModal, Settings, Troubleshooter, } from 'components/shared/ReactComponentList';
import SourcePropertiesDeprecated from 'components/windows/SourceProperties.vue';
import GameOverlayEventFeed from 'components/windows/GameOverlayEventFeed';
import EventFilterMenu from 'components/windows/EventFilterMenu';
import OverlayPlaceholder from 'components/windows/OverlayPlaceholder';
import BrowserSourceInteraction from 'components/windows/BrowserSourceInteraction';
import BitGoal from 'components/widgets/goal/BitGoal';
import DonationGoal from 'components/widgets/goal/DonationGoal';
import SubGoal from 'components/widgets/goal/SubGoal';
import StarsGoal from 'components/widgets/goal/StarsGoal';
import SupporterGoal from 'components/widgets/goal/SupporterGoal';
import SubscriberGoal from 'components/widgets/goal/SubscriberGoal';
import FollowerGoal from 'components/widgets/goal/FollowerGoal';
import CharityGoal from 'components/widgets/goal/CharityGoal';
import StreamBoss from 'components/widgets/StreamBoss.vue';
import Credits from 'components/widgets/Credits.vue';
import EventList from 'components/widgets/EventList.vue';
import TipJar from 'components/widgets/TipJar.vue';
import MediaShare from 'components/widgets/MediaShare';
import AlertBox from 'components/widgets/AlertBox.vue';
import SpinWheel from 'components/widgets/SpinWheel.vue';
import Poll from 'components/widgets/Poll';
import ChatHighlight from 'components/widgets/ChatHighlight';
import SuperchatGoal from 'components/widgets/goal/SuperchatGoal';
import { byOS, OS } from 'util/operating-systems';
import { Inject } from 'services/core';
import MessageBoxModal from 'components/shared/modals/MessageBoxModal';
import Modal from 'components/shared/modals/Modal';
const { ipcRenderer } = electron;
const BrowserWindow = remote.BrowserWindow;
const uuid = window['require']('uuid/v4');
export function getComponents() {
    return {
        Main,
        Settings,
        FFZSettings,
        SceneTransitions,
        RenameSource,
        AddSource,
        NameScene,
        NameFolder,
        SafeMode,
        SourceProperties,
        SourcePropertiesDeprecated,
        SourceFilters,
        Blank,
        AdvancedAudio,
        NotificationsAndNews,
        Troubleshooter,
        ManageSceneCollections,
        Projector,
        RecentEvents: RecentEventsWindow,
        MediaGallery,
        PlatformAppPopOut,
        EditTransform,
        OverlayPlaceholder,
        BrowserSourceInteraction,
        EventFilterMenu,
        GameOverlayEventFeed,
        AdvancedStatistics,
        BitGoal,
        DonationGoal,
        FollowerGoal,
        StarsGoal,
        SupporterGoal,
        SubscriberGoal,
        SuperchatGoal,
        MultistreamChatInfo,
        CharityGoal,
        Credits,
        EventList,
        TipJar,
        StreamBoss,
        SubGoal,
        MediaShare,
        AlertBox,
        SpinWheel,
        Poll,
        ChatHighlight,
        WelcomeToPrime,
        GoLiveWindow,
        EditStreamWindow,
        IconLibraryProperties,
        ScreenCaptureProperties,
        GuestCamProperties,
        SharedComponentsLibrary,
        WidgetWindow,
        CustomCodeWindow,
        SourceShowcase,
        MarketingModal,
    };
}
const DEFAULT_WINDOW_OPTIONS = {
    componentName: '',
    scaleFactor: 1,
    isShown: true,
    hideStyleBlockers: false,
};
export class WindowsService extends StatefulService {
    constructor() {
        super(...arguments);
        this.components = getComponents();
        this.windowUpdated = new Subject();
        this.windowDestroyed = new Subject();
        this.styleBlockersUpdated = new Subject();
        this.windows = {};
    }
    static showModal(vm, renderFn) {
        const renderer = () => vm.$createElement(Modal, [renderFn()]);
        this.modalChanged.next({ renderFn: renderer });
    }
    static hideModal() {
        this.modalChanged.next({ renderFn: null });
    }
    static showMessageBox(vm, renderFn) {
        const renderer = () => vm.$createElement(MessageBoxModal, [renderFn()]);
        this.showModal(vm, renderer);
    }
    init() {
        const windowIds = ipcRenderer.sendSync('getWindowIds');
        this.windows.worker = BrowserWindow.fromId(windowIds.worker);
        this.windows.main = BrowserWindow.fromId(windowIds.main);
        this.windows.child = BrowserWindow.fromId(windowIds.child);
        this.windows.worker.webContents.setBackgroundThrottling(false);
        this.windows.main.webContents.setBackgroundThrottling(false);
        this.updateScaleFactor('main');
        this.updateScaleFactor('child');
        this.windows.main.on('move', () => this.updateScaleFactor('main'));
        this.windows.child.on('move', () => this.updateScaleFactor('child'));
        if (remote.screen.getAllDisplays().length > 1) {
            this.usageStatisticsService.recordFeatureUsage('MultipleDisplays');
        }
    }
    updateScaleFactor(windowId) {
        const window = this.windows[windowId];
        if (window && !window.isDestroyed()) {
            const bounds = byOS({
                [OS.Windows]: () => remote.screen.dipToScreenRect(window, window.getBounds()),
                [OS.Mac]: () => window.getBounds(),
            });
            const currentDisplay = remote.screen.getDisplayMatching(bounds);
            this.UPDATE_SCALE_FACTOR(windowId, currentDisplay.scaleFactor);
        }
    }
    getWindowIdFromElectronId(electronWindowId) {
        return Object.keys(this.windows).find(win => this.windows[win].id === electronWindowId);
    }
    getElectronWindowIdFromWindowId(windowId) {
        return this.windows[windowId].id;
    }
    getIsChildWindowShown(componentName) {
        return this.state.child.isShown && this.state.child.componentName === componentName;
    }
    showWindow(options) {
        if (options.componentName !== this.state.child.componentName) {
            options.center = true;
        }
        if (options.size && !Utils.env.CI) {
            const { width: screenWidth, height: screenHeight } = remote.screen.getDisplayMatching(this.windows.main.getBounds()).workAreaSize;
            options.size.width = Math.min(options.size.width, screenWidth);
            options.size.height = Math.min(options.size.height, screenHeight);
        }
        this.centerChildWindow(options);
        this.windows.child.show();
        this.windows.child.restore();
    }
    centerChildWindow(options) {
        const mainWindow = this.windows.main;
        const childWindow = this.windows.child;
        this.updateChildWindowOptions(options);
        try {
            const bounds = mainWindow.getBounds();
            const childX = bounds.x + bounds.width / 2 - options.size.width / 2;
            const childY = bounds.y + bounds.height / 2 - options.size.height / 2;
            childWindow.setMinimumSize(options.size.width, options.size.height);
            if (options.center) {
                childWindow.setBounds({
                    x: Math.floor(childX),
                    y: Math.floor(childY),
                    width: options.size.width,
                    height: options.size.height,
                });
            }
        }
        catch (err) {
            console.error('Recovering from error:', err);
            childWindow.setMinimumSize(options.size.width, options.size.height);
            childWindow.setSize(options.size.width, options.size.height);
            childWindow.center();
            childWindow.focus();
        }
    }
    getMainWindowDisplay() {
        const window = this.windows.main;
        const bounds = window.getBounds();
        return remote.screen.getDisplayMatching(bounds);
    }
    setWindowOnTop(window = 'main') {
        const win = window === 'child' ? Utils.getChildWindow() : Utils.getMainWindow();
        win.setAlwaysOnTop(true);
        win.show();
        win.focus();
        win.setAlwaysOnTop(false);
        if (window === 'all') {
            const child = Utils.getChildWindow();
            child.setAlwaysOnTop(true);
            child.show();
            child.focus();
            child.setAlwaysOnTop(false);
        }
    }
    closeChildWindow() {
        return __awaiter(this, void 0, void 0, function* () {
            const windowOptions = this.state.child;
            if (windowOptions.preservePrevWindow && windowOptions.prevWindowOptions) {
                const options = Object.assign(Object.assign({}, windowOptions.prevWindowOptions), { isPreserved: true });
                ipcRenderer.send('window-showChildWindow', options);
                this.centerChildWindow(options);
                return;
            }
            this.updateChildWindowOptions({ componentName: '', isShown: false });
            yield new Promise(r => setTimeout(r, 50));
            ipcRenderer.send('window-focusMain');
            ipcRenderer.send('window-closeChildWindow');
        });
    }
    closeMainWindow() {
        remote.getCurrentWindow().close();
    }
    hideMainWindow() {
        this.windows.main.hide();
    }
    createOneOffWindow(options, windowId) {
        windowId = windowId || uuid();
        if (this.windows[windowId]) {
            this.windows[windowId].restore();
            this.windows[windowId].focus();
            return windowId;
        }
        this.CREATE_ONE_OFF_WINDOW(windowId, Object.assign(Object.assign({}, DEFAULT_WINDOW_OPTIONS), options));
        const newWindow = (this.windows[windowId] = new BrowserWindow(Object.assign(Object.assign(Object.assign({ frame: false, titleBarStyle: 'hidden', fullscreenable: byOS({ [OS.Windows]: true, [OS.Mac]: false }), width: 400, height: 400, title: 'New Window', backgroundColor: '#17242D', show: false, webPreferences: {
                nodeIntegration: true,
                webviewTag: true,
                contextIsolation: false,
                backgroundThrottling: false,
            } }, options), options.size), (options.position || {}))));
        electron.ipcRenderer.sendSync('webContents-enableRemote', newWindow.webContents.id);
        newWindow.removeMenu();
        if (options.persistWebContents) {
            newWindow.on('close', (e) => {
                e.preventDefault();
                return e.defaultPrevented;
            });
        }
        newWindow.on('closed', () => {
            this.windowDestroyed.next(windowId);
            delete this.windows[windowId];
            this.DELETE_ONE_OFF_WINDOW(windowId);
        });
        this.updateScaleFactor(windowId);
        newWindow.on('move', () => this.updateScaleFactor(windowId));
        if (Utils.isDevMode())
            newWindow.webContents.openDevTools({ mode: 'detach' });
        const indexUrl = remote.getGlobal('indexUrl');
        newWindow.loadURL(`${indexUrl}?windowId=${windowId}`);
        newWindow.show();
        return windowId;
    }
    createOneOffWindowForOverlay(options, windowId) {
        windowId = windowId || uuid();
        this.CREATE_ONE_OFF_WINDOW(windowId, options);
        const newWindow = (this.windows[windowId] = new BrowserWindow(options));
        electron.ipcRenderer.sendSync('webContents-enableRemote', newWindow.webContents.id);
        const indexUrl = remote.getGlobal('indexUrl');
        newWindow.loadURL(`${indexUrl}?windowId=${windowId}`);
        return newWindow;
    }
    setOneOffFullscreen(windowId, fullscreen) {
        this.UPDATE_ONE_OFF_WINDOW(windowId, { isFullScreen: fullscreen });
    }
    closeAllOneOffs() {
        const closingPromises = [];
        Object.keys(this.windows).forEach(windowId => {
            if (windowId === 'worker')
                return;
            if (windowId === 'main')
                return;
            if (windowId === 'child')
                return;
            closingPromises.push(this.closeOneOffWindow(windowId));
        });
        return Promise.all(closingPromises);
    }
    closeOneOffWindow(windowId) {
        if (!this.windows[windowId] || this.windows[windowId].isDestroyed())
            return Promise.resolve();
        return new Promise(resolve => {
            this.windows[windowId].on('closed', resolve);
            this.windows[windowId].destroy();
        });
    }
    shutdown() {
        this.closeAllOneOffs();
        this.windows.child.close();
    }
    getChildWindowOptions() {
        return this.state.child;
    }
    getChildWindowQueryParams() {
        return this.getChildWindowOptions().queryParams || {};
    }
    getWindowOptions(windowId) {
        return this.state[windowId].queryParams || {};
    }
    updateStyleBlockers(windowId, hideStyleBlockers) {
        this.UPDATE_HIDE_STYLE_BLOCKERS(windowId, hideStyleBlockers);
        this.styleBlockersUpdated.next({ windowId, hideStyleBlockers });
    }
    updateChildWindowOptions(optionsPatch) {
        const newOptions = Object.assign(Object.assign(Object.assign({}, DEFAULT_WINDOW_OPTIONS), optionsPatch), { scaleFactor: this.state.child.scaleFactor });
        if (newOptions.preservePrevWindow) {
            const currentOptions = cloneDeep(this.state.child);
            if (currentOptions.preservePrevWindow) {
                throw new Error("You can't use preservePrevWindow option for more that 1 window in the row");
            }
            newOptions.prevWindowOptions = currentOptions;
            delete newOptions.prevWindowOptions.prevWindowOptions;
        }
        this.SET_CHILD_WINDOW_OPTIONS(newOptions);
        this.windowUpdated.next({ windowId: 'child', options: newOptions });
    }
    updateMainWindowOptions(options) {
        this.UPDATE_MAIN_WINDOW_OPTIONS(options);
    }
    SET_CHILD_WINDOW_OPTIONS(options) {
        options.queryParams = options.queryParams || {};
        this.state.child = options;
    }
    UPDATE_MAIN_WINDOW_OPTIONS(options) {
        this.state.main = Object.assign(Object.assign({}, this.state.main), options);
    }
    UPDATE_SCALE_FACTOR(windowId, scaleFactor) {
        this.state[windowId].scaleFactor = scaleFactor;
    }
    UPDATE_HIDE_STYLE_BLOCKERS(windowId, hideStyleBlockers) {
        this.state[windowId].hideStyleBlockers = hideStyleBlockers;
    }
    CREATE_ONE_OFF_WINDOW(windowId, options) {
        const opts = Object.assign({ componentName: 'Blank', scaleFactor: 1 }, options);
        Vue.set(this.state, windowId, opts);
    }
    UPDATE_ONE_OFF_WINDOW(windowId, options) {
        const oldOpts = this.state[windowId];
        Vue.set(this.state, windowId, Object.assign(Object.assign({}, oldOpts), options));
    }
    DELETE_ONE_OFF_WINDOW(windowId) {
        Vue.delete(this.state, windowId);
    }
}
WindowsService.initialState = {
    main: {
        componentName: 'Main',
        scaleFactor: 1,
        isShown: true,
        hideStyleBlockers: true,
        title: `Streamlabs Desktop - ${Utils.env.SLOBS_VERSION}`,
    },
    child: {
        componentName: '',
        scaleFactor: 1,
        hideStyleBlockers: false,
        isShown: false,
    },
};
WindowsService.modalOptions = {
    renderFn: null,
};
WindowsService.modalChanged = new Subject();
__decorate([
    Inject()
], WindowsService.prototype, "usageStatisticsService", void 0);
__decorate([
    throttle(500)
], WindowsService.prototype, "updateScaleFactor", null);
__decorate([
    mutation()
], WindowsService.prototype, "SET_CHILD_WINDOW_OPTIONS", null);
__decorate([
    mutation()
], WindowsService.prototype, "UPDATE_MAIN_WINDOW_OPTIONS", null);
__decorate([
    mutation()
], WindowsService.prototype, "UPDATE_SCALE_FACTOR", null);
__decorate([
    mutation()
], WindowsService.prototype, "UPDATE_HIDE_STYLE_BLOCKERS", null);
__decorate([
    mutation()
], WindowsService.prototype, "CREATE_ONE_OFF_WINDOW", null);
__decorate([
    mutation()
], WindowsService.prototype, "UPDATE_ONE_OFF_WINDOW", null);
__decorate([
    mutation()
], WindowsService.prototype, "DELETE_ONE_OFF_WINDOW", null);
//# sourceMappingURL=windows.js.map