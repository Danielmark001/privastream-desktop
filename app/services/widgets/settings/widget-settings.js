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
import { Inject } from '../../core/injector';
import { handleResponse, authorizedHeaders } from '../../../util/requests';
import { WidgetDefinitions, } from 'services/widgets';
import { Subject } from 'rxjs';
import { mutation, StatefulService } from 'services/core/stateful-service';
export const WIDGET_INITIAL_STATE = {
    loadingState: 'none',
    data: null,
    rawData: null,
    pendingRequests: 0,
    staticConfig: null,
};
export class WidgetSettingsService extends StatefulService {
    constructor() {
        super(...arguments);
        this.dataUpdated = new Subject();
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.lifecycle = yield this.userService.withLifecycle({
                init: () => Promise.resolve(this.subToWebsocket()),
                destroy: () => Promise.resolve(this.RESET_WIDGET_DATA()),
                context: this,
            });
        });
    }
    subToWebsocket() {
        this.websocketService.socketEvent.subscribe(event => {
            const apiSettings = this.getApiSettings();
            if (event.type === 'alertProfileChanged')
                this.onWidgetThemeChange();
            if (event.type !== apiSettings.settingsUpdateEvent)
                return;
            this.onSettingsUpdatedHandler(event);
        });
    }
    onSettingsUpdatedHandler(event) {
        if (!this.state.data)
            return;
        const rawData = cloneDeep(this.state.rawData);
        rawData.settings = event.message;
        const data = this.handleDataAfterFetch(rawData);
        this.SET_PENDING_REQUESTS(this.state.pendingRequests - 1);
        if (this.state.pendingRequests !== 0)
            return;
        this.SET_WIDGET_DATA(data, rawData);
        this.dataUpdated.next(this.state.data);
    }
    onWidgetThemeChange() {
        this.RESET_WIDGET_DATA();
    }
    fetchData() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.state.data)
                yield this.loadData();
            return this.state.data;
        });
    }
    toggleCustomCode(enabled, data, variation) {
        this.saveSettings(Object.assign(Object.assign({}, data), { custom_enabled: enabled }));
    }
    loadData() {
        return __awaiter(this, void 0, void 0, function* () {
            const isFirstLoading = !this.state.data;
            if (isFirstLoading)
                this.SET_LOADING_STATE('pending');
            const apiSettings = this.getApiSettings();
            let rawData;
            try {
                const widgetType = WidgetDefinitions[apiSettings.type].humanType;
                const [widgetData, staticConfig] = yield Promise.all([
                    this.request({
                        url: apiSettings.dataFetchUrl,
                        method: 'GET',
                    }),
                    this.state.staticConfig
                        ? Promise.resolve(this.state.staticConfig)
                        : this.request({
                            url: `https://${this.hostsService.streamlabs}/api/v5/widgets/static/config/${widgetType}`,
                            method: 'GET',
                        }),
                ]);
                rawData = widgetData;
                this.SET_WIDGET_STATIC_CONFIG(staticConfig);
            }
            catch (e) {
                if (isFirstLoading)
                    this.SET_LOADING_STATE('fail');
                throw e;
            }
            this.SET_LOADING_STATE('success');
            const data = this.handleDataAfterFetch(rawData);
            this.SET_WIDGET_DATA(data, rawData);
            this.dataUpdated.next(this.state.data);
        });
    }
    refreshData() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadData();
            this.dataUpdated.next(this.state.data);
        });
    }
    handleDataAfterFetch(rawData) {
        var _a, _b;
        const data = cloneDeep(rawData);
        const { staticConfig } = this.state;
        if ((_a = staticConfig === null || staticConfig === void 0 ? void 0 : staticConfig.data) === null || _a === void 0 ? void 0 : _a.custom_code) {
            data.custom_defaults = (_b = staticConfig.data) === null || _b === void 0 ? void 0 : _b.custom_code;
            ['html', 'css', 'js'].forEach(customType => {
                const prop = `custom_${customType}`;
                if (staticConfig.data.custom_code[customType] && !data.settings[prop]) {
                    data.settings[prop] = staticConfig.data.custom_code[customType];
                }
            });
        }
        data.type = this.getApiSettings().type;
        return this.patchAfterFetch(data);
    }
    patchAfterFetch(data) {
        return data;
    }
    patchBeforeSend(settings) {
        return settings;
    }
    getMetadata(...options) {
        return {};
    }
    saveSettings(settings) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = this.patchBeforeSend(settings);
            const apiSettings = this.getApiSettings();
            this.SET_PENDING_REQUESTS(this.state.pendingRequests + 1);
            return yield this.request({
                body,
                url: apiSettings.settingsSaveUrl,
                method: 'POST',
            });
        });
    }
    request(req) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = req.method || 'GET';
            const headers = authorizedHeaders(this.getApiToken());
            headers.append('Content-Type', 'application/json');
            const request = new Request(req.url, {
                headers,
                method,
                body: req.body ? JSON.stringify(req.body) : void 0,
            });
            return fetch(request)
                .then(res => {
                return Promise.resolve(res);
            })
                .then(handleResponse);
        });
    }
    getHost() {
        return this.hostsService.streamlabs;
    }
    getWidgetToken() {
        return this.userService.widgetToken;
    }
    getApiToken() {
        return this.userService.apiToken;
    }
    SET_PENDING_REQUESTS(pendingRequestsCnt) {
        this.state.pendingRequests = pendingRequestsCnt;
    }
    SET_LOADING_STATE(loadingState) {
        this.state.loadingState = loadingState;
    }
    SET_WIDGET_DATA(data, rawData) {
        this.state.data = data;
        this.state.rawData = rawData;
    }
    SET_WIDGET_STATIC_CONFIG(data) {
        this.state.staticConfig = data;
    }
    RESET_WIDGET_DATA() {
        this.state.loadingState = 'none';
        this.state.data = null;
        this.state.rawData = null;
    }
}
__decorate([
    Inject()
], WidgetSettingsService.prototype, "hostsService", void 0);
__decorate([
    Inject()
], WidgetSettingsService.prototype, "userService", void 0);
__decorate([
    Inject()
], WidgetSettingsService.prototype, "widgetsService", void 0);
__decorate([
    Inject()
], WidgetSettingsService.prototype, "websocketService", void 0);
__decorate([
    mutation()
], WidgetSettingsService.prototype, "SET_PENDING_REQUESTS", null);
__decorate([
    mutation()
], WidgetSettingsService.prototype, "SET_LOADING_STATE", null);
__decorate([
    mutation()
], WidgetSettingsService.prototype, "SET_WIDGET_DATA", null);
__decorate([
    mutation()
], WidgetSettingsService.prototype, "SET_WIDGET_STATIC_CONFIG", null);
__decorate([
    mutation()
], WidgetSettingsService.prototype, "RESET_WIDGET_DATA", null);
//# sourceMappingURL=widget-settings.js.map