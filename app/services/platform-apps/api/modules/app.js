var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module, apiMethod } from './module';
import { Inject } from 'services/core/injector';
import { EAppPageSlot } from 'services/platform-apps';
var EPage;
(function (EPage) {
    EPage["Editor"] = "Editor";
    EPage["Live"] = "Live";
    EPage["Themes"] = "Themes";
    EPage["AppDetailsPage"] = "AppDetailsPage";
})(EPage || (EPage = {}));
export class AppModule extends Module {
    constructor() {
        super();
        this.moduleName = 'App';
        this.permissions = [];
        this.callbacks = {};
        this.pendingDeepLinks = {};
        this.deepLinkCallbacks = {};
        this.navigationService.navigated.subscribe(nav => {
            if (nav.currentPage === 'PlatformAppMainPage') {
                if (this.callbacks[nav.params.appId]) {
                    const data = {};
                    if (nav.params.sourceId)
                        data.sourceId = nav.params.sourceId;
                    this.callbacks[nav.params.appId](data);
                }
            }
        });
        this.protocolLinksService.appProtocolLink.subscribe(info => {
            if (this.deepLinkCallbacks[info.appId]) {
                this.deepLinkCallbacks[info.appId](info.url);
            }
            else {
                this.pendingDeepLinks[info.appId] = info;
            }
        });
    }
    onNavigation(ctx, cb) {
        this.callbacks[ctx.app.id] = cb;
    }
    navigate(ctx, page) {
        if (page === EPage.Editor) {
            this.navigationService.navigate('Studio');
        }
        else if (page === EPage.Themes) {
            this.navigationService.navigate('BrowseOverlays');
        }
        else if (page === EPage.AppDetailsPage) {
            this.navigationService.navigate('PlatformAppStore', { appId: ctx.app.id });
        }
    }
    reload(ctx) {
        this.platformAppsService.refreshApp(ctx.app.id);
    }
    popout(ctx, slot, windowOptions) {
        if (slot === EAppPageSlot.Background)
            return;
        let size;
        if (windowOptions.width && windowOptions.height) {
            size = { width: windowOptions.width, height: windowOptions.height };
        }
        this.platformAppsService.popOutAppPage(ctx.app.id, slot, {
            resizable: windowOptions.resizable,
            title: windowOptions.title,
            size,
        });
    }
    onDeepLink(ctx, cb) {
        this.deepLinkCallbacks[ctx.app.id] = cb;
        if (this.pendingDeepLinks[ctx.app.id]) {
            cb(this.pendingDeepLinks[ctx.app.id].url);
            delete this.pendingDeepLinks[ctx.app.id];
        }
    }
}
__decorate([
    Inject()
], AppModule.prototype, "navigationService", void 0);
__decorate([
    Inject()
], AppModule.prototype, "platformAppsService", void 0);
__decorate([
    Inject()
], AppModule.prototype, "protocolLinksService", void 0);
__decorate([
    apiMethod()
], AppModule.prototype, "onNavigation", null);
__decorate([
    apiMethod()
], AppModule.prototype, "navigate", null);
__decorate([
    apiMethod()
], AppModule.prototype, "reload", null);
__decorate([
    apiMethod()
], AppModule.prototype, "popout", null);
__decorate([
    apiMethod()
], AppModule.prototype, "onDeepLink", null);
//# sourceMappingURL=app.js.map