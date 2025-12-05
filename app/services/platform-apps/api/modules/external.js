var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module, EApiPermissions, apiMethod } from './module';
import url from 'url';
import * as remote from '@electron/remote';
export class ExternalModule extends Module {
    constructor() {
        super(...arguments);
        this.moduleName = 'External';
        this.permissions = [EApiPermissions.ExternalLinks];
    }
    openExternalLink(ctx, urlStr) {
        const parsed = url.parse(urlStr);
        const allowedProtocols = ['http:', 'https:'];
        if (!allowedProtocols.includes(parsed.protocol)) {
            throw new Error(`Protocol ${parsed.protocol} is not allowed.  Must be one of ${allowedProtocols}`);
        }
        remote.shell.openExternal(urlStr);
    }
}
__decorate([
    apiMethod()
], ExternalModule.prototype, "openExternalLink", null);
//# sourceMappingURL=external.js.map