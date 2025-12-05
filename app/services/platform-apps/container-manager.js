var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { EAppPageSlot } from '.';
import electron from 'electron';
import trim from 'lodash/trim';
import trimStart from 'lodash/trimStart';
import compact from 'lodash/compact';
import { Inject } from 'services/core/injector';
import url from 'url';
import path from 'path';
import { PlatformAppsApi } from './api';
import { lazyModule } from 'util/lazy-module';
import { GuestApiHandler } from 'util/guest-api-handler';
import { BehaviorSubject } from 'rxjs';
import uuid from 'uuid/v4';
import * as remote from '@electron/remote';
export function getPageUrl(app, page) {
    const url = getAssetUrl(app, page);
    return `${url}?app_token=${app.appToken}`;
}
export function getAssetUrl(app, asset) {
    let url;
    const trimmedAsset = trimStart(asset, '/');
    if (app.unpacked) {
        const trimmed = trim(app.manifest.buildPath, '/ ');
        url = compact([`http://localhost:${app.devPort}`, trimmed, trimmedAsset]).join('/');
    }
    else {
        url = compact([app.appUrl, trimmedAsset]).join('/');
    }
    return url;
}
export class PlatformContainerManager {
    constructor() {
        this.containers = [];
        this.sessionsInitialized = {};
    }
    registerApp(app) {
        this.unregisterApp(app);
        app.manifest.pages.forEach(page => {
            if (page.persistent || page.slot === EAppPageSlot.Background) {
                this.createContainer(app, page.slot, true);
            }
        });
    }
    unregisterApp(app) {
        this.containers.forEach(cont => {
            if (cont.appId === app.id) {
                this.destroyContainer(cont.id);
            }
        });
    }
    mountContainer(app, slot, electronWindowId, slobsWindowId) {
        const containerInfo = this.getContainerInfoForSlot(app, slot);
        const win = remote.BrowserWindow.fromId(electronWindowId);
        win.addBrowserView(containerInfo.container);
        containerInfo.mountedWindows.push(electronWindowId);
        containerInfo.transform.next(Object.assign(Object.assign({}, containerInfo.transform.getValue()), { electronWindowId,
            slobsWindowId, mounted: true }));
        return containerInfo.id;
    }
    setContainerBounds(containerId, pos, size) {
        const info = this.containers.find(cont => cont.id === containerId);
        if (!info)
            return;
        info.container.setBounds({
            x: Math.round(pos.x),
            y: Math.round(pos.y),
            width: Math.round(size.x),
            height: Math.round(size.y),
        });
        info.transform.next(Object.assign(Object.assign({}, info.transform.getValue()), { pos,
            size }));
    }
    unmountContainer(containerId, electronWindowId) {
        const info = this.containers.find(cont => cont.id === containerId);
        if (!info)
            return;
        const transform = info.transform.getValue();
        const win = remote.BrowserWindow.fromId(electronWindowId);
        if (win) {
            win.removeBrowserView(info.container);
        }
        info.mountedWindows = info.mountedWindows.filter(id => id !== electronWindowId);
        if (transform.electronWindowId === electronWindowId) {
            info.transform.next(Object.assign(Object.assign({}, transform), { mounted: false, electronWindowId: null, slobsWindowId: null }));
            if (!info.persistent) {
                this.destroyContainer(containerId);
            }
        }
    }
    refreshContainers(app) {
        this.containers
            .filter(info => info.appId === app.id)
            .forEach(info => info.container.webContents.loadURL(this.getPageUrlForSlot(app, info.slot)));
    }
    getContainerInfoForSlot(app, slot) {
        const existingContainer = this.containers.find(cont => cont.appId === app.id && cont.slot === slot);
        if (existingContainer && existingContainer.container.webContents) {
            return existingContainer;
        }
        return this.createContainer(app, slot);
    }
    createContainer(app, slot, persistent = false) {
        const opts = {
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false,
                partition: this.getAppPartition(app),
                preload: path.resolve(remote.app.getAppPath(), 'bundles', 'guest-api.js'),
                sandbox: false,
            },
        };
        if (app.highlyPrivileged) {
            opts.webPreferences.nodeIntegration = true;
            opts.webPreferences.contextIsolation = false;
        }
        const view = new remote.BrowserView(opts);
        electron.ipcRenderer.sendSync('webContents-enableRemote', view.webContents.id);
        const info = {
            id: uuid(),
            slot,
            persistent,
            container: view,
            appId: app.id,
            transform: new BehaviorSubject({
                pos: { x: 0, y: 0 },
                size: { x: 0, y: 0 },
                mounted: false,
                electronWindowId: null,
                slobsWindowId: null,
            }),
            mountedWindows: [],
        };
        if (app.unpacked)
            view.webContents.openDevTools();
        this.exposeApi(app, view.webContents.id, info.transform);
        electron.ipcRenderer.send('webContents-preventNavigation', view.webContents.id);
        if (app.beta) {
            view.webContents.on('before-input-event', (e, input) => {
                if (input.type === 'keyDown' && input.code === 'KeyI' && input.control && input.shift) {
                    view.webContents.openDevTools();
                }
            });
        }
        view.webContents.loadURL(this.getPageUrlForSlot(app, slot));
        this.containers.push(info);
        return info;
    }
    destroyContainer(containerId) {
        const info = this.containers.find(cont => cont.id === containerId);
        if (!info)
            return;
        this.containers = this.containers.filter(c => c.id !== containerId);
        info.mountedWindows.forEach(winId => {
            const win = remote.BrowserWindow.fromId(winId);
            if (win && !win.isDestroyed())
                win.removeBrowserView(info.container);
        });
        if (!info.container.webContents)
            return;
        info.container.webContents.close();
        if (!info.container.webContents)
            return;
        info.container.webContents.destroy();
    }
    getPageUrlForSlot(app, slot) {
        const page = app.manifest.pages.find(page => page.slot === slot);
        if (!page)
            return null;
        return getPageUrl(app, page.file);
    }
    getAppPartition(app) {
        const userId = this.userService.platformId;
        const partition = `platformApp-${app.id}-${userId}-${app.unpacked}`;
        if (!this.sessionsInitialized[partition]) {
            const session = remote.session.fromPartition(partition);
            const frameUrls = [];
            let mainFrame = '';
            session.webRequest.onBeforeRequest((details, cb) => {
                const parsed = url.parse(details.url);
                if (details.resourceType === 'mainFrame')
                    mainFrame = url.parse(details.url).hostname;
                if (parsed.hostname === 'cvp.twitch.tv' && (details.resourceType = 'script')) {
                    cb({});
                    return;
                }
                if (details.resourceType === 'subFrame') {
                    if (parsed.hostname !== mainFrame) {
                        frameUrls.push(details.url);
                        cb({});
                        return;
                    }
                }
                if (details['referrer'] && frameUrls.includes(details['referrer'])) {
                    cb({});
                    return;
                }
                if (details.resourceType === 'script') {
                    const scriptAllowlist = [
                        'https://cdn.streamlabs.com/slobs-platform/lib/streamlabs-platform.js',
                        'https://cdn.streamlabs.com/slobs-platform/lib/streamlabs-platform.min.js',
                    ];
                    const scriptDomainAllowlist = [
                        'www.googletagmanager.com',
                        'www.google-analytics.com',
                        'widget.intercom.io',
                        'js.intercomcdn.com',
                        'cdn.heapanalytics.com',
                        'edge.fullstory.com',
                        'www.youtube.com',
                        'cdn.segment.com',
                        'static.twitchcdn.net',
                        'www.google.com',
                        'www.gstatic.com',
                        'assets.twitch.tv',
                    ];
                    const parsed = url.parse(details.url);
                    if (scriptAllowlist.includes(details.url)) {
                        cb({});
                        return;
                    }
                    if (scriptDomainAllowlist.includes(parsed.hostname)) {
                        cb({});
                        return;
                    }
                    if (details.url.startsWith(app.appUrl)) {
                        cb({});
                        return;
                    }
                    if (parsed.host === `localhost:${app.devPort}`) {
                        cb({});
                        return;
                    }
                    if (parsed.protocol === 'devtools:') {
                        cb({});
                        return;
                    }
                    console.warn(`Canceling request to ${details.url} by app ${app.id}: ${app.manifest.name}`);
                    cb({ cancel: true });
                    return;
                }
                cb({});
            });
            this.sessionsInitialized[partition] = true;
        }
        return partition;
    }
    exposeApi(app, webContentsId, transform) {
        const api = this.apiManager.getApi(app, webContentsId, transform);
        new GuestApiHandler().exposeApi(webContentsId, { v1: api });
    }
}
__decorate([
    Inject()
], PlatformContainerManager.prototype, "userService", void 0);
__decorate([
    lazyModule(PlatformAppsApi)
], PlatformContainerManager.prototype, "apiManager", void 0);
//# sourceMappingURL=container-manager.js.map