var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module, EApiPermissions, apiMethod } from './module';
import url from 'url';
import uuid from 'uuid/v4';
import * as remote from '@electron/remote';
var EAuthWindowEventType;
(function (EAuthWindowEventType) {
    EAuthWindowEventType["AuthRedirect"] = "auth_redirect";
    EAuthWindowEventType["Show"] = "show";
    EAuthWindowEventType["Close"] = "close";
})(EAuthWindowEventType || (EAuthWindowEventType = {}));
export class AuthorizationModule extends Module {
    constructor() {
        super(...arguments);
        this.moduleName = 'Authorization';
        this.permissions = [EApiPermissions.Authorization];
        this.windowHandles = {};
    }
    showAuthorizationWindow(ctx, authUrl, options, eventHandler) {
        if (this.windowHandles[ctx.app.id]) {
            throw new Error('This application already has an open authorization window!');
        }
        const parsed = url.parse(authUrl);
        const valid = !!(ctx.app.manifest.authorizationUrls || []).find(allowlistUrl => {
            const allowlistParsed = url.parse(allowlistUrl);
            return allowlistParsed.host === parsed.host && allowlistParsed.pathname === parsed.pathname;
        });
        if (!valid) {
            throw new Error('Authorization URL is not allowlisted in the application manifest!');
        }
        const win = new remote.BrowserWindow({
            width: options.width || 600,
            height: options.height || 600,
            title: options.title,
            show: false,
            webPreferences: {
                nodeIntegration: false,
                sandbox: true,
                partition: uuid(),
            },
        });
        if (ctx.app.unpacked) {
            win.webContents.openDevTools({ mode: 'detach' });
        }
        win.webContents.session.protocol.registerFileProtocol('slobs-oauth', req => {
            eventHandler({ type: EAuthWindowEventType.AuthRedirect, url: req.url });
            win.close();
        });
        win.on('closed', () => {
            delete this.windowHandles[ctx.app.id];
            eventHandler({ type: EAuthWindowEventType.Close });
        });
        win.on('ready-to-show', () => {
            win.show();
            eventHandler({ type: EAuthWindowEventType.Show });
        });
        win.removeMenu();
        win.loadURL(authUrl);
        this.windowHandles[ctx.app.id] = win;
    }
    closeAuthorizationWindow(ctx) {
        if (this.windowHandles[ctx.app.id]) {
            this.windowHandles[ctx.app.id].close();
        }
    }
}
__decorate([
    apiMethod()
], AuthorizationModule.prototype, "showAuthorizationWindow", null);
__decorate([
    apiMethod()
], AuthorizationModule.prototype, "closeAuthorizationWindow", null);
//# sourceMappingURL=authorization.js.map