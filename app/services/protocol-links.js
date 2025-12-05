var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Service } from 'services/core/service';
import electron from 'electron';
import url from 'url';
import { Inject } from 'services/core/injector';
import { byOS, OS } from 'util/operating-systems';
import { ESideNavKey, ProtocolLinkKeyMap } from './side-nav';
import { Subject } from 'rxjs';
function protocolHandler(base) {
    return (target, methodName, descriptor) => {
        target.handlers = target.handlers || {};
        target.handlers[base] = methodName;
        return descriptor;
    };
}
export class ProtocolLinksService extends Service {
    constructor() {
        super(...arguments);
        this.appProtocolLink = new Subject();
    }
    start(argv) {
        electron.ipcRenderer.on('protocolLink', (event, link) => {
            this.handleLink(link);
        });
        byOS({
            [OS.Windows]: () => {
                argv.forEach(arg => {
                    if (arg.match(/^slobs:\/\//))
                        this.handleLink(arg);
                });
            },
            [OS.Mac]: () => {
                electron.ipcRenderer.send('protocolLinkReady');
            },
        });
    }
    handleLink(link) {
        const parsed = new url.URL(link);
        const info = {
            url: link,
            base: parsed.host,
            path: parsed.pathname,
            query: parsed.searchParams,
        };
        if (this.handlers[info.base]) {
            this[this.handlers[info.base]](info);
        }
    }
    navigateLibrary(info) {
        var _a;
        if (!this.userService.isLoggedIn)
            return;
        const parts = info.path.match(/^\/(.+)\/(.+)$/);
        const searchParams = new URLSearchParams(info.query);
        const install = searchParams === null || searchParams === void 0 ? void 0 : searchParams.get('install');
        if (parts) {
            this.navigationService.navigate('BrowseOverlays', {
                type: parts[1],
                id: parts[2],
                install,
            });
            const menuItem = ((_a = ProtocolLinkKeyMap[parts[1]]) !== null && _a !== void 0 ? _a : this.sideNavService.views.isOpen)
                ? ESideNavKey.Scene
                : ESideNavKey.Themes;
            this.sideNavService.setCurrentMenuItem(menuItem);
        }
    }
    updateUserBillingInfo(info) {
        if (!this.userService.isLoggedIn)
            return;
        this.platformAppStoreService.paypalAuthSuccess();
    }
    navigateApp(info) {
        if (!this.userService.isLoggedIn)
            return;
        const match = info.path.match(/(\w+)\/?/);
        if (!match) {
            return;
        }
        const appId = match[1];
        if (this.platformAppsService.views.getApp(appId)) {
            this.navigationService.navigate('PlatformAppMainPage', { appId });
            this.sideNavService.setCurrentMenuItem(appId);
            this.appProtocolLink.next(Object.assign(Object.assign({}, info), { appId }));
        }
        else {
            this.navigationService.navigate('PlatformAppStore', { appId });
            this.sideNavService.setCurrentMenuItem(ESideNavKey.AppsStoreHome);
        }
    }
    openSettings(info) {
        const category = info.path.replace('/', '');
        this.settingsService.showSettings(category);
    }
    guestCamJoin(info) {
        const hash = info.path.replace('/', '');
        this.guestCamService.joinAsGuest(hash);
    }
}
__decorate([
    Inject()
], ProtocolLinksService.prototype, "navigationService", void 0);
__decorate([
    Inject()
], ProtocolLinksService.prototype, "platformAppsService", void 0);
__decorate([
    Inject()
], ProtocolLinksService.prototype, "platformAppStoreService", void 0);
__decorate([
    Inject()
], ProtocolLinksService.prototype, "userService", void 0);
__decorate([
    Inject()
], ProtocolLinksService.prototype, "settingsService", void 0);
__decorate([
    Inject()
], ProtocolLinksService.prototype, "guestCamService", void 0);
__decorate([
    Inject()
], ProtocolLinksService.prototype, "sideNavService", void 0);
__decorate([
    protocolHandler('library')
], ProtocolLinksService.prototype, "navigateLibrary", null);
__decorate([
    protocolHandler('paypalauth')
], ProtocolLinksService.prototype, "updateUserBillingInfo", null);
__decorate([
    protocolHandler('app')
], ProtocolLinksService.prototype, "navigateApp", null);
__decorate([
    protocolHandler('settings')
], ProtocolLinksService.prototype, "openSettings", null);
__decorate([
    protocolHandler('join')
], ProtocolLinksService.prototype, "guestCamJoin", null);
//# sourceMappingURL=protocol-links.js.map