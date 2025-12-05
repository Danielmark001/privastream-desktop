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
import { Service } from 'services';
import { Inject } from 'services/core';
import { authorizedHeaders, jfetch } from 'util/requests';
import * as remote from '@electron/remote';
import { byOS, OS } from 'util/operating-systems';
export class MagicLinkService extends Service {
    getDashboardMagicLink() {
        return __awaiter(this, arguments, void 0, function* (subPage = '', source, os) {
            const token = (yield this.fetchNewToken()).login_token;
            const sourceString = source ? `&refl=${source}` : '';
            const osString = os ? `&os=${os}` : '';
            if (subPage === 'multistream') {
                return `https://${this.hostsService.streamlabs}/content-hub/post/how-to-multistream-the-ultimate-guide-to-multistreaming?login_token=${token}`;
            }
            return `https://${this.hostsService.streamlabs}/slobs/magic/dashboard?login_token=${token}&r=${subPage !== null && subPage !== void 0 ? subPage : ''}${sourceString}${osString}`;
        });
    }
    fetchNewToken() {
        const headers = authorizedHeaders(this.userService.apiToken);
        const request = new Request(`https://${this.hostsService.streamlabs}/api/v5/slobs/login/token`, { headers });
        return jfetch(request);
    }
    linkToPrime(refl, event) {
        return __awaiter(this, void 0, void 0, function* () {
            const os = byOS({ [OS.Windows]: 'windows', [OS.Mac]: 'mac' });
            this.usageStatisticsService.recordUltra(refl, event);
            if (!this.userService.views.isLoggedIn) {
                return remote.shell.openExternal(`https://${this.hostsService.streamlabs}/ultra?refl=${refl}&os=${os}`);
            }
            try {
                const link = yield this.getDashboardMagicLink('prime', refl, os);
                remote.shell.openExternal(link);
            }
            catch (e) {
                console.error('Error generating dashboard magic link', e);
            }
        });
    }
    openWidgetThemesMagicLink() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const link = yield this.getDashboardMagicLink('widgetthemes');
                remote.shell.openExternal(link);
            }
            catch (e) {
                console.error('Error generating dashboard magic link', e);
            }
        });
    }
    openDonationSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const link = yield this.getDashboardMagicLink('settings/donation-settings');
                remote.shell.openExternal(link);
                this.usageStatisticsService.recordFeatureUsage('openDonationSettings');
            }
            catch (e) {
                console.error('Error generating dashboard magic link', e);
            }
        });
    }
    openAdvancedAlertTesting() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const link = yield this.getDashboardMagicLink('advancedtesting');
                remote.shell.openExternal(link);
                this.usageStatisticsService.recordFeatureUsage('openAdvancedAlertTesting');
            }
            catch (e) {
                console.error('Error generating dashboard magic link', e);
            }
        });
    }
    getMagicSessionUrl(targetUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const loginToken = (yield this.fetchNewToken()).login_token;
                return `https://${this.hostsService.streamlabs}/slobs/magic/init-session?login_token=${loginToken}&r=${encodeURIComponent(targetUrl)}`;
            }
            catch (e) {
                console.error('Error generating session magic link', e);
            }
        });
    }
}
__decorate([
    Inject()
], MagicLinkService.prototype, "userService", void 0);
__decorate([
    Inject()
], MagicLinkService.prototype, "hostsService", void 0);
__decorate([
    Inject()
], MagicLinkService.prototype, "usageStatisticsService", void 0);
//# sourceMappingURL=magic-link.js.map