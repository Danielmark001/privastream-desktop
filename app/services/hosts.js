var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Service } from './core/service';
import Util from 'services/utils';
import { Inject } from './core/injector';
export class HostsService extends Service {
    get streamlabs() {
        if (Util.shouldUseLocalHost()) {
            return 'streamlabs.site';
        }
        else if (Util.shouldUseBeta()) {
            return 'beta.streamlabs.com';
        }
        return 'streamlabs.com';
    }
    get overlays() {
        return 'overlays.streamlabs.com';
    }
    get media() {
        return 'media.streamlabs.com';
    }
    get io() {
        if (Util.shouldUseLocalHost()) {
            return 'http://io.streamlabs.site:4567';
        }
        else if (Util.shouldUseBeta()) {
            return 'https://beta.streamlabs.com';
        }
        return 'https://aws-io.streamlabs.com';
    }
    get cdn() {
        return 'cdn.streamlabs.com';
    }
    get platform() {
        return 'platform.streamlabs.com';
    }
    get analitycs() {
        return 'r2d2.streamlabs.com';
    }
}
export class UrlService extends Service {
    get protocol() {
        return Util.shouldUseLocalHost() ? 'http://' : 'https://';
    }
    getStreamlabsApi(endpoint) {
        return `${this.protocol}${this.hosts.streamlabs}/api/v5/slobs/${endpoint}`;
    }
    get supportLink() {
        const locale = this.i18nService.state.locale;
        return `https://support.streamlabs.com/hc/${locale.toLowerCase()}`;
    }
}
__decorate([
    Inject('HostsService')
], UrlService.prototype, "hosts", void 0);
__decorate([
    Inject('I18nService')
], UrlService.prototype, "i18nService", void 0);
//# sourceMappingURL=hosts.js.map