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
import { mutation, StatefulService, ViewHandler } from 'services/core/stateful-service';
import { lazyModule } from 'util/lazy-module';
import path from 'path';
import fs from 'fs';
import { Subject } from 'rxjs';
import { Inject } from 'services/core/injector';
import { DevServer } from './dev-server';
import { authorizedHeaders, jfetch } from 'util/requests';
import trim from 'lodash/trim';
import without from 'lodash/without';
import { PlatformContainerManager, getPageUrl, getAssetUrl } from './container-manager';
import { InitAfter } from '../core';
import * as remote from '@electron/remote';
const DEV_PORT = 8081;
var EAppSourceType;
(function (EAppSourceType) {
    EAppSourceType["Browser"] = "browser_source";
})(EAppSourceType || (EAppSourceType = {}));
var ESourceSizeType;
(function (ESourceSizeType) {
    ESourceSizeType["Absolute"] = "absolute";
    ESourceSizeType["Relative"] = "relative";
})(ESourceSizeType || (ESourceSizeType = {}));
export var EAppPageSlot;
(function (EAppPageSlot) {
    EAppPageSlot["TopNav"] = "top_nav";
    EAppPageSlot["Chat"] = "chat";
    EAppPageSlot["Background"] = "background";
    EAppPageSlot["PopOut"] = "pop_out";
})(EAppPageSlot || (EAppPageSlot = {}));
class PlatformAppsViews extends ViewHandler {
    getApp(appId) {
        const enabledApp = this.state.loadedApps.find(app => app.id === appId && app.enabled);
        if (enabledApp)
            return enabledApp;
        return this.state.loadedApps.find(app => app.id === appId);
    }
    getAssetUrl(appId, asset) {
        const app = this.getApp(appId);
        if (!app)
            return null;
        return getAssetUrl(app, asset);
    }
    get enabledApps() {
        return this.state.loadedApps.filter(app => app.enabled);
    }
    get productionApps() {
        return this.state.loadedApps.filter(app => !app.unpacked);
    }
    getDelisted(appId) {
        return this.getApp(appId).delisted;
    }
    isAppHighlyPrivileged(appId) {
        return [
            'b472396e49',
            '04f85c93be',
            '875cf5de20',
            '93125d1c33',
            '9ef3e51301',
        ].includes(appId);
    }
}
let PlatformAppsService = class PlatformAppsService extends StatefulService {
    constructor() {
        super(...arguments);
        this.appLoad = new Subject();
        this.appUnload = new Subject();
        this.allAppsLoaded = new Subject();
        this.sourceRefresh = new Subject();
        this.unpackedLocalStorageKey = 'PlatformAppsUnpacked';
        this.disabledLocalStorageKey = 'PlatformAppsDisabled';
    }
    get views() {
        return new PlatformAppsViews(this.state);
    }
    init() {
        this.userService.userLogin.subscribe(() => __awaiter(this, void 0, void 0, function* () {
            this.unloadAllApps();
            this.loadProductionApps();
            this.SET_APP_STORE_VISIBILITY(yield this.fetchAppStoreVisibility());
            this.SET_DEV_MODE(yield this.getIsDevMode());
            if (this.state.devMode && localStorage.getItem(this.unpackedLocalStorageKey)) {
                const data = JSON.parse(localStorage.getItem(this.unpackedLocalStorageKey));
                if (data.appPath && data.appToken) {
                    this.loadUnpackedApp(data.appPath, data.appToken);
                }
            }
            this.allAppsLoaded.next(this.state.loadedApps);
        }));
        this.userService.userLogout.subscribe(() => {
            this.unloadAllApps();
            localStorage.removeItem(this.disabledLocalStorageKey);
        });
    }
    fetchProductionApps() {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = authorizedHeaders(this.userService.apiToken);
            const request = new Request(`https://${this.hostsService.platform}/api/v1/sdk/installed_apps`, {
                headers,
            });
            return jfetch(request).catch(() => []);
        });
    }
    getDisabledAppsFromStorage() {
        const disabledAppsStr = localStorage.getItem(this.disabledLocalStorageKey);
        return disabledAppsStr ? JSON.parse(disabledAppsStr) : [];
    }
    loadProductionApps() {
        return __awaiter(this, void 0, void 0, function* () {
            const productionApps = yield this.fetchProductionApps();
            const disabledApps = this.getDisabledAppsFromStorage();
            productionApps.forEach(app => {
                if (!app.manifest)
                    return;
                const unpackedVersionLoaded = this.state.loadedApps.find(loadedApp => loadedApp.id === app.id_hash && loadedApp.unpacked);
                this.loadApp({
                    id: app.id_hash,
                    manifest: app.manifest,
                    unpacked: false,
                    beta: app.is_beta,
                    appUrl: app.cdn_url,
                    appToken: app.app_token,
                    poppedOutSlots: [],
                    icon: app.icon,
                    delisted: app.delisted,
                    enabled: !(unpackedVersionLoaded || disabledApps.includes(app.id_hash)),
                    highlyPrivileged: this.views.isAppHighlyPrivileged(app.id_hash),
                });
            });
        });
    }
    fetchAppStoreVisibility() {
        const headers = authorizedHeaders(this.userService.apiToken);
        const request = new Request(`https://${this.hostsService.platform}/api/v1/sdk/is_app_store_visible`, { headers });
        return jfetch(request)
            .then(json => json.is_app_store_visible)
            .catch(() => false);
    }
    refreshProductionApps() {
        return __awaiter(this, void 0, void 0, function* () {
            this.unloadAllApps();
            this.loadProductionApps();
            this.sideNavService.actions.updateAllApps(this.state.loadedApps);
        });
    }
    loadUnpackedApp(appPath, appToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = yield this.getAppIdFromServer(appToken);
            if (id == null) {
                return 'Error: please check that your App Token is valid';
            }
            const manifestPath = path.join(appPath, 'manifest.json');
            if (!(yield this.fileExists(manifestPath))) {
                return 'Error: manifest.json is missing!';
            }
            const manifestData = yield this.loadManifestFromDisk(manifestPath);
            const manifest = JSON.parse(manifestData);
            try {
                yield this.validateManifest(manifest, appPath);
            }
            catch (e) {
                return e['message'];
            }
            if (this.devServer) {
                this.devServer.stopListening();
                this.devServer = null;
            }
            this.devServer = new DevServer(appPath, DEV_PORT);
            if (this.state.loadedApps.find(loadedApp => loadedApp.id === id && !loadedApp.unpacked)) {
                this.SET_PROD_APP_ENABLED(id, false);
            }
            this.loadApp({
                id,
                manifest,
                appPath,
                appToken,
                unpacked: true,
                beta: false,
                devPort: DEV_PORT,
                poppedOutSlots: [],
                enabled: true,
                highlyPrivileged: this.views.isAppHighlyPrivileged(id),
            });
        });
    }
    get enabledApps() {
        return this.state.loadedApps.filter(app => app.enabled);
    }
    get productionApps() {
        return this.state.loadedApps.filter(app => !app.unpacked);
    }
    loadApp(app) {
        const { id, appToken } = app;
        this.LOAD_APP(app);
        if (app.unpacked && app.appPath) {
            localStorage.setItem(this.unpackedLocalStorageKey, JSON.stringify({
                appToken,
                appPath: app.appPath,
            }));
        }
        if (app.enabled)
            this.containerManager.registerApp(app);
        this.appLoad.next(this.views.getApp(id));
    }
    validateManifest(manifest, appPath) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validateObject(manifest, 'manifest', [
                'name',
                'version',
                'permissions',
                'sources',
                'pages',
            ]);
            for (let i = 0; i < manifest.sources.length; i++) {
                const source = manifest.sources[i];
                this.validateObject(source, `manifest.sources[${i}]`, [
                    'type',
                    'name',
                    'id',
                    'about',
                    'file',
                ]);
                this.validateObject(source.about, `manifest.sources[${i}].about`, ['description']);
                const filePath = this.getFilePath(appPath, manifest.buildPath, source.file, true);
                const exists = yield this.fileExists(filePath);
                if (!exists) {
                    throw new Error(`Missing file: manifest.sources[${i}].file does not exist. Searching at path: ${filePath}`);
                }
            }
            const seenSlots = {};
            for (let i = 0; i < manifest.pages.length; i++) {
                const page = manifest.pages[i];
                this.validateObject(page, `manifest.pages[${i}]`, ['slot', 'file']);
                if (!Object.values(EAppPageSlot).includes(page.slot)) {
                    throw new Error(`Error: manifest.pages[${i}].slot "${page.slot}" is not a valid page slot.`);
                }
                if (seenSlots[page.slot]) {
                    throw new Error(`Error: manifest.pages[${i}].slot "${page.slot}" ` +
                        'is already taken. There can only be 1 page per slot.');
                }
                seenSlots[page.slot] = true;
                const filePath = this.getFilePath(appPath, manifest.buildPath, page.file, true);
                const exists = yield this.fileExists(filePath);
                if (!exists) {
                    throw new Error(`Missing file: manifest.pages[${i}].file does not exist. Searching at path: ${filePath}`);
                }
            }
        });
    }
    getFilePath(appPath, buildPath, file, isUnpacked = false) {
        if (isUnpacked) {
            return path.join(appPath, trim(buildPath), file);
        }
        return path.join(appPath, file);
    }
    validateObject(obj, objName, requiredFields) {
        requiredFields.forEach(field => {
            if (obj[field] == null) {
                throw new Error(`Missing property: ${objName} is missing required field "${field}"`);
            }
        });
    }
    fileExists(filePath) {
        return new Promise(resolve => {
            fs.exists(filePath, exists => resolve(exists));
        });
    }
    unloadAllApps() {
        this.state.loadedApps.forEach(app => this.unloadApp(app));
    }
    unloadApp(app) {
        this.containerManager.unregisterApp(app);
        this.navigateToEditorIfOnPage(app.id);
        this.UNLOAD_APP(app.id);
        if (app.unpacked) {
            localStorage.removeItem(this.unpackedLocalStorageKey);
            if (this.devServer) {
                this.devServer.stopListening();
                this.devServer = null;
            }
        }
        this.appUnload.next(app.id);
    }
    refreshApp(appId) {
        return __awaiter(this, void 0, void 0, function* () {
            const app = this.views.getApp(appId);
            if (app.unpacked) {
                const error = yield this.loadUnpackedApp(app.appPath, app.appToken);
                if (error) {
                    this.unloadApp(app);
                    return error;
                }
            }
            else {
                this.containerManager.refreshContainers(app);
            }
            this.sourceRefresh.next(appId);
            return '';
        });
    }
    getAppIdFromServer(appToken) {
        const headers = authorizedHeaders(this.userService.apiToken);
        const request = new Request(`https://${this.hostsService.platform}/api/v1/sdk/app_id?app_token=${appToken}`, { headers });
        return jfetch(request).then(json => json.id_hash);
    }
    getIsDevMode() {
        const headers = authorizedHeaders(this.userService.apiToken);
        const request = new Request(`https://${this.hostsService.platform}/api/v1/sdk/dev_mode`, {
            headers,
        });
        return jfetch(request)
            .then(json => json.dev_mode)
            .catch(() => false);
    }
    loadManifestFromDisk(manifestPath) {
        return new Promise((resolve, reject) => {
            fs.readFile(manifestPath, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(data.toString());
            });
        });
    }
    getPageUrlForSource(appId, appSourceId, settings = '') {
        const app = this.views.getApp(appId);
        if (!app)
            return null;
        const source = app.manifest.sources.find(source => source.id === appSourceId);
        if (!source)
            return null;
        let url = getPageUrl(app, source.file);
        if (settings) {
            url = `${url}&settings=${encodeURIComponent(settings)}`;
        }
        url = `${url}&source=true`;
        return url;
    }
    mountContainer(appId, slot, electronWindowId, slobsWindowId) {
        const app = this.views.getApp(appId);
        if (!app)
            return null;
        return this.containerManager.mountContainer(app, slot, electronWindowId, slobsWindowId);
    }
    setContainerBounds(containerId, pos, size) {
        return this.containerManager.setContainerBounds(containerId, pos, size);
    }
    unmountContainer(containerId, electronWindowId) {
        this.containerManager.unmountContainer(containerId, electronWindowId);
    }
    getAppSourceSize(appId, sourceId) {
        const app = this.views.getApp(appId);
        const source = app.manifest.sources.find(source => source.id === sourceId);
        if (source.initialSize) {
            if (source.initialSize.type === ESourceSizeType.Absolute) {
                return {
                    width: source.initialSize.width,
                    height: source.initialSize.height,
                };
            }
            if (source.initialSize.type === ESourceSizeType.Relative) {
                return {
                    width: source.initialSize.width * this.videoSettingsService.baseWidth,
                    height: source.initialSize.height * this.videoSettingsService.baseHeight,
                };
            }
        }
        return { width: 800, height: 600 };
    }
    getPagePopOutSize(appId, slot) {
        const app = this.views.getApp(appId);
        const page = app.manifest.pages.find(page => page.slot === slot);
        const popOutSize = page.popOutSize || {};
        return {
            width: popOutSize.width || 600,
            height: popOutSize.height || 500,
            minWidth: popOutSize.minWidth || 600,
            minHeight: popOutSize.minHeight || 500,
        };
    }
    getProductionApps() {
        return this.state.loadedApps.filter(app => !app.unpacked);
    }
    popOutAppPage(appId, pageSlot, windowOptions) {
        const app = this.views.getApp(appId);
        if (!app || !app.enabled)
            return;
        const windowId = `${appId}-${pageSlot}`;
        const mousePos = remote.screen.getCursorScreenPoint();
        this.windowsService.createOneOffWindow(Object.assign({ componentName: 'PlatformAppPopOut', queryParams: { appId, pageSlot }, title: app.manifest.name, size: this.getPagePopOutSize(appId, pageSlot), x: mousePos.x, y: mousePos.y, persistWebContents: true }, windowOptions), windowId);
        this.POP_OUT_SLOT(appId, pageSlot);
        const windowDestroyed = this.windowsService.windowDestroyed.subscribe(winId => {
            if (winId === windowId) {
                this.POP_IN_SLOT(appId, pageSlot);
                windowDestroyed.unsubscribe();
            }
        });
    }
    setEnabled(appId, enabling) {
        const app = this.views.getApp(appId);
        if (app.enabled === enabling)
            return;
        if (enabling) {
            this.containerManager.registerApp(app);
            this.appLoad.next(app);
            localStorage.setItem(this.disabledLocalStorageKey, JSON.stringify(without(this.getDisabledAppsFromStorage(), app.id)));
        }
        else {
            this.containerManager.unregisterApp(app);
            this.appUnload.next(appId);
            this.navigateToEditorIfOnPage(app.id);
            localStorage.setItem(this.disabledLocalStorageKey, JSON.stringify(this.getDisabledAppsFromStorage().concat([app.id])));
        }
        this.SET_PROD_APP_ENABLED(appId, enabling);
    }
    navigateToEditorIfOnPage(appId) {
        if (this.navigationService.state.currentPage === 'PlatformAppMainPage' &&
            this.navigationService.state.params &&
            this.navigationService.state.params.appId === appId) {
            this.navigationService.navigate('Studio');
        }
    }
    LOAD_APP(app) {
        this.state.loadedApps = this.state.loadedApps.filter(a => a.id !== app.id || a.unpacked !== app.unpacked);
        this.state.loadedApps.push(app);
    }
    UNLOAD_APP(appId) {
        if (this.state.loadedApps.find(app => app.id === appId && app.enabled)) {
            this.state.loadedApps = this.state.loadedApps.filter(app => app.id !== appId || !app.enabled);
        }
        else {
            this.state.loadedApps = this.state.loadedApps.filter(app => app.id !== appId);
        }
    }
    SET_DEV_MODE(devMode) {
        this.state.devMode = devMode;
    }
    POP_OUT_SLOT(appId, slot) {
        this.state.loadedApps.forEach(app => {
            if (app.id === appId) {
                app.poppedOutSlots.push(slot);
            }
        });
    }
    POP_IN_SLOT(appId, slot) {
        this.state.loadedApps.forEach(app => {
            if (app.id === appId) {
                app.poppedOutSlots = app.poppedOutSlots.filter(s => s !== slot);
            }
        });
    }
    SET_APP_STORE_VISIBILITY(visibility) {
        this.state.storeVisible = visibility;
    }
    SET_PROD_APP_ENABLED(appId, enabled) {
        this.state.loadedApps.forEach(app => {
            if (app.id === appId && !app.unpacked) {
                app.enabled = enabled;
            }
        });
    }
};
PlatformAppsService.initialState = {
    devMode: false,
    loadedApps: [],
    storeVisible: false,
};
__decorate([
    Inject()
], PlatformAppsService.prototype, "windowsService", void 0);
__decorate([
    Inject()
], PlatformAppsService.prototype, "videoSettingsService", void 0);
__decorate([
    Inject()
], PlatformAppsService.prototype, "hostsService", void 0);
__decorate([
    Inject()
], PlatformAppsService.prototype, "userService", void 0);
__decorate([
    Inject()
], PlatformAppsService.prototype, "navigationService", void 0);
__decorate([
    Inject()
], PlatformAppsService.prototype, "sideNavService", void 0);
__decorate([
    lazyModule(PlatformContainerManager)
], PlatformAppsService.prototype, "containerManager", void 0);
__decorate([
    mutation()
], PlatformAppsService.prototype, "LOAD_APP", null);
__decorate([
    mutation()
], PlatformAppsService.prototype, "UNLOAD_APP", null);
__decorate([
    mutation()
], PlatformAppsService.prototype, "SET_DEV_MODE", null);
__decorate([
    mutation()
], PlatformAppsService.prototype, "POP_OUT_SLOT", null);
__decorate([
    mutation()
], PlatformAppsService.prototype, "POP_IN_SLOT", null);
__decorate([
    mutation()
], PlatformAppsService.prototype, "SET_APP_STORE_VISIBILITY", null);
__decorate([
    mutation()
], PlatformAppsService.prototype, "SET_PROD_APP_ENABLED", null);
PlatformAppsService = __decorate([
    InitAfter('UserService')
], PlatformAppsService);
export { PlatformAppsService };
//# sourceMappingURL=index.js.map