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
import { Inject } from './core/injector';
import fs from 'fs';
import path from 'path';
import { authorizedHeaders, handleResponse } from 'util/requests';
import throttle from 'lodash/throttle';
import { Service } from './core/service';
import Utils from './utils';
import os from 'os';
import * as remote from '@electron/remote';
import { getOS, OS } from 'util/operating-systems';
import { getWmiClass } from 'util/wmi';
import { Subject } from 'rxjs';
export function track(event) {
    return (target, methodName, descriptor) => {
        return Object.assign(Object.assign({}, descriptor), { value(...args) {
                UsageStatisticsService.instance.recordEvent(event);
                descriptor.value.apply(this, args);
            } });
    };
}
export class UsageStatisticsService extends Service {
    constructor() {
        super(...arguments);
        this.version = Utils.env.SLOBS_VERSION;
        this.analyticsEvents = [];
        this.refl = '';
        this.event = null;
        this.ultraSubscription = new Subject();
        this.session = {
            startTime: new Date(),
            features: {},
            sysInfo: this.getSysInfo(),
        };
    }
    init() {
        this.loadInstallerId();
        this.throttledSendAnalytics = throttle(this.sendAnalytics, 30 * 1000);
        setInterval(() => {
            this.recordAnalyticsEvent('Heartbeat', { bundle: SLOBS_BUNDLE_ID });
        }, 10 * 60 * 1000);
        this.ultraSubscription.subscribe(() => {
            if (this.refl === '') {
                console.warn('Ultra event recorded with empty refl.');
            }
            this.recordAnalyticsEvent(this.event, { refl: this.refl });
        });
    }
    loadInstallerId() {
        let installerId = localStorage.getItem('installerId');
        if (!installerId) {
            const exePath = remote.app.getPath('exe');
            const installerNamePath = path.join(path.dirname(exePath), 'installername');
            if (fs.existsSync(installerNamePath)) {
                try {
                    const installerName = fs.readFileSync(installerNamePath).toString();
                    if (installerName) {
                        const matches = installerName.match(/\-([A-Za-z0-9]+)\.exe/);
                        if (matches) {
                            installerId = matches[1];
                            localStorage.setItem('installerId', installerId);
                        }
                    }
                }
                catch (e) {
                    console.error('Error loading installer id', e);
                }
            }
        }
        this.installerId = installerId;
    }
    get isProduction() {
        return process.env.NODE_ENV === 'production';
    }
    recordEvent(event, metadata = {}) {
        if (!this.isProduction)
            return;
        let headers = new Headers();
        headers.append('Content-Type', 'application/json');
        if (this.userService.state.auth && this.userService.state.auth.primaryPlatform) {
            metadata['platform'] = this.userService.state.auth.primaryPlatform;
        }
        metadata['os'] = process.platform;
        const bodyData = {
            event,
            slobs_user_id: this.userService.getLocalUserId(),
            version: this.version,
            data: JSON.stringify(metadata),
        };
        if (this.userService.state.auth && this.userService.state.auth.apiToken) {
            headers = authorizedHeaders(this.userService.apiToken, headers);
        }
        if (this.installerId) {
            bodyData.installer_id = this.installerId;
        }
        const request = new Request(`https://${this.hostsService.streamlabs}/api/v5/slobs/log`, {
            headers,
            method: 'POST',
            body: JSON.stringify(bodyData),
        });
        return fetch(request);
    }
    recordAnalyticsEvent(event, value) {
        if (!this.isProduction)
            return;
        const analyticsEvent = {
            event,
            value,
            product: 'SLOBS',
            version: this.version,
            count: 1,
            uuid: this.userService.getLocalUserId(),
            time: new Date(),
        };
        if (this.userService.state.userId)
            analyticsEvent.userId = this.userService.state.userId;
        this.analyticsEvents.push(analyticsEvent);
        this.throttledSendAnalytics();
    }
    recordClick(component, target) {
        this.recordAnalyticsEvent('Click', { component, target });
    }
    recordShown(component, target) {
        this.recordAnalyticsEvent('Shown', { component, target });
    }
    recordUltra(target, event) {
        const eventName = event || 'Ultra';
        this.recordClick(eventName, target);
        this.refl = target;
        this.event = eventName;
    }
    flushEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            this.ultraSubscription.unsubscribe();
            this.session.endTime = new Date();
            const session = Object.assign(Object.assign({}, this.session), { features: Object.keys(this.session.features), isPrime: this.userService.state.isPrime });
            this.recordAnalyticsEvent('Session', session);
            yield this.sendAnalytics();
        });
    }
    getGpuInfo() {
        const gpuSection = {};
        if (getOS() === OS.Windows) {
            const gpuInfo = getWmiClass('Win32_VideoController', ['Name', 'DriverVersion', 'DriverDate']);
            [].concat(gpuInfo).forEach((gpu, index) => {
                gpuSection[`GPU ${index + 1}`] = {
                    Name: gpu.Name,
                    'Driver Version': gpu.DriverVersion,
                    'Driver Date': gpu.DriverDate,
                };
            });
        }
        return gpuSection;
    }
    getSysInfo() {
        return {
            os: {
                platform: os.platform(),
                release: os.release(),
            },
            arch: process.arch,
            cpu: os.cpus()[0].model,
            cores: os.cpus().length,
            mem: os.totalmem(),
            gpu: this.getGpuInfo(),
        };
    }
    recordFeatureUsage(feature) {
        this.session.features[feature] = true;
    }
    sendAnalytics() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.analyticsEvents.length)
                return;
            const data = { analyticsTokens: [...this.analyticsEvents] };
            const headers = authorizedHeaders(this.userService.apiToken);
            headers.append('Content-Type', 'application/json');
            this.analyticsEvents.length = 0;
            const request = new Request(`https://${this.hostsService.analitycs}/slobs/data/ping`, {
                headers,
                method: 'post',
                body: JSON.stringify(data || {}),
            });
            yield fetch(request)
                .then(handleResponse)
                .catch(e => {
                console.error('Error sending analytics events', e);
            });
        });
    }
}
__decorate([
    Inject()
], UsageStatisticsService.prototype, "userService", void 0);
__decorate([
    Inject()
], UsageStatisticsService.prototype, "hostsService", void 0);
__decorate([
    Inject()
], UsageStatisticsService.prototype, "diagnosticsService", void 0);
//# sourceMappingURL=usage-statistics.js.map