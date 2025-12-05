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
import { WidgetDefinitions } from '../../../services/widgets';
import { Services } from '../../service-provider';
import { throttle } from 'lodash-decorators';
import { assertIsDefined, getDefined } from '../../../util/properties-type-guards';
import pick from 'lodash/pick';
import cloneDeep from 'lodash/cloneDeep';
import { $t } from '../../../services/i18n';
import Utils from '../../../services/utils';
import { alertAsync } from '../../modals';
import merge from 'lodash/merge';
import { injectFormBinding, injectState, useModule } from 'slap';
export const DEFAULT_WIDGET_STATE = {
    isLoading: true,
    sourceId: '',
    shouldCreatePreviewSource: true,
    previewSourceId: '',
    isPreviewVisible: false,
    selectedTab: 'general',
    type: '',
    widgetData: {
        data: {
            settings: {},
        },
    },
    prevSettings: {},
    canRevert: false,
    browserSourceProps: null,
    staticConfig: null,
};
export class WidgetModule {
    constructor(params) {
        var _a, _b;
        this.params = params;
        this.state = injectState(Object.assign(Object.assign({}, DEFAULT_WIDGET_STATE), { sourceId: this.params.sourceId, shouldCreatePreviewSource: (_a = this.params.shouldCreatePreviewSource) !== null && _a !== void 0 ? _a : true, selectedTab: (_b = this.params.selectedTab) !== null && _b !== void 0 ? _b : 'general', staticConfig: null }));
        this.widgetsConfig = this.widgetsService.widgetsConfig;
        this.eventsConfig = this.widgetsService.alertsConfig;
        this.bind = injectFormBinding(() => this.settings, statePatch => this.updateSettings(statePatch));
        this.actions = this.widgetsService.actions;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const widget = this.widget;
            this.setBrowserSourceProps(widget.getSource().getPropertiesFormData());
            if ((_b = (_a = this.__provider) === null || _a === void 0 ? void 0 : _a.options) === null || _b === void 0 ? void 0 : _b.parentScope) {
                this.cancelUnload = () => { };
            }
            else {
                if (this.state.shouldCreatePreviewSource) {
                    const previewSource = widget.createPreviewSource();
                    this.state.previewSourceId = previewSource.sourceId;
                }
                this.cancelUnload = () => {
                    if (this.state.previewSourceId) {
                        this.widget.destroyPreviewSource();
                    }
                };
            }
            this.state.type = widget.type;
            const data = yield this.fetchData();
            this.setData(data);
            this.setPrevSettings(data);
            this.state.setIsLoading(false);
        });
    }
    destroy() {
        if (this.state.previewSourceId)
            this.widget.destroyPreviewSource();
        this.cancelUnload();
    }
    reload() {
        return __awaiter(this, void 0, void 0, function* () {
            this.state.setIsLoading(true);
            this.setData(yield this.fetchData());
            this.state.setIsLoading(false);
        });
    }
    close() {
        Services.WindowsService.actions.closeChildWindow();
    }
    get widgetState() {
        return getDefined(this.state.widgetData);
    }
    get widgetData() {
        return this.widgetState.data;
    }
    get settings() {
        return this.widgetData.settings;
    }
    get availableAlerts() {
        return Object.keys(this.eventsConfig);
    }
    get customCode() {
        return pick(this.settings, 'custom_enabled', 'custom_html', 'custom_css', 'custom_js', 'custom_json');
    }
    updateCustomCode(patch) {
        this.updateSettings(patch);
    }
    get hasCustomFields() {
        if (!this.customCode)
            return false;
        const { custom_enabled, custom_json } = this.customCode;
        return custom_enabled && custom_json;
    }
    openCustomCodeEditor() {
        return __awaiter(this, void 0, void 0, function* () {
            const { sourceId, selectedTab } = this.state;
            const windowId = `${sourceId}-code_editor`;
            const widgetWindowBounds = Utils.getChildWindow().getBounds();
            const position = {
                x: widgetWindowBounds.x + widgetWindowBounds.width,
                y: widgetWindowBounds.y,
            };
            const winId = yield Services.WindowsService.actions.return.createOneOffWindow({
                componentName: 'CustomCodeWindow',
                title: $t('Custom Code'),
                queryParams: { sourceId, selectedTab },
                size: {
                    width: 800,
                    height: 800,
                },
                position,
            }, windowId);
        });
    }
    get widgetsService() {
        return Services.WidgetsService;
    }
    get widget() {
        return this.widgetsService.views.getWidgetSource(this.state.sourceId);
    }
    get config() {
        return this.widgetsConfig[this.state.type];
    }
    get isCustomCodeEnabled() {
        var _a;
        return (_a = this.customCode) === null || _a === void 0 ? void 0 : _a.custom_enabled;
    }
    onMenuClickHandler(e) {
        this.state.setSelectedTab(e.key);
    }
    playAlert(type) {
        this.actions.playAlert(type);
    }
    updateSettings(formValues) {
        return __awaiter(this, void 0, void 0, function* () {
            const newSettings = merge(cloneDeep(this.settings), formValues);
            this.setSettings(newSettings);
            yield this.saveSettings(newSettings);
        });
    }
    replaceSettings(formValues) {
        return __awaiter(this, void 0, void 0, function* () {
            const newSettings = Object.assign(Object.assign({}, this.settings), formValues);
            this.setSettings(newSettings);
            yield this.saveSettings(newSettings);
        });
    }
    updateSetting(key) {
        return (value) => {
            if (Array.isArray(this.settings[key])) {
                this.replaceSettings({ [key]: value });
            }
            else {
                this.updateSettings({ [key]: value });
            }
        };
    }
    fetchData() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const widgetType = WidgetDefinitions[this.config.type].humanType;
            const [rawData, staticConfig] = yield Promise.all([
                this.actions.return.request({
                    url: this.config.dataFetchUrl,
                    method: 'GET',
                }),
                this.state.staticConfig
                    ? Promise.resolve(this.state.staticConfig)
                    : this.actions.return.request({
                        url: `https://${this.widgetsService.hostsService.streamlabs}/api/v5/widgets/static/config/${widgetType}`,
                        method: 'GET',
                    }),
            ]);
            this.setStaticConfig(staticConfig);
            if ((_a = staticConfig === null || staticConfig === void 0 ? void 0 : staticConfig.data) === null || _a === void 0 ? void 0 : _a.custom_code) {
                const makeLenses = (type) => {
                    const prop = `custom_${type}`;
                    if (this.config.useNewWidgetAPI) {
                        return {
                            get: () => rawData.data.settings.global[prop],
                            set: (val) => {
                                rawData.data.settings.global[prop] = val;
                            },
                        };
                    }
                    return {
                        get: () => rawData.settings[prop],
                        set: (val) => {
                            rawData.settings[prop] = val;
                        },
                    };
                };
                ['html', 'css', 'js'].forEach((customType) => {
                    const { get, set } = makeLenses(customType);
                    if (staticConfig.data.custom_code[customType] && !get()) {
                        set(staticConfig.data.custom_code[customType]);
                    }
                });
            }
            return this.patchAfterFetch(rawData);
        });
    }
    saveSettings(settings) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = this.patchBeforeSend(settings);
            const method = this.config.useNewWidgetAPI ? 'PUT' : 'POST';
            try {
                return yield this.actions.return.request({
                    body,
                    method,
                    url: this.config.settingsSaveUrl,
                });
            }
            catch (e) {
                yield alertAsync({
                    title: $t('Something went wrong while applying settings'),
                    style: { marginTop: '300px' },
                    okText: $t('Reload'),
                });
                yield this.reload();
            }
        });
    }
    patchAfterFetch(data) {
        if (this.config.useNewWidgetAPI) {
            return settingsFromGlobal(data);
        }
        return data;
    }
    patchBeforeSend(settings) {
        if (this.config.useNewWidgetAPI) {
            return settingsToGlobal(settings);
        }
        return settings;
    }
    updateBrowserSourceProps(formData) {
        const source = getDefined(this.widget.getSource());
        source.setPropertiesFormData(formData);
        const updatedProps = source.getPropertiesFormData();
        this.setBrowserSourceProps(updatedProps);
    }
    revertChanges() {
        return __awaiter(this, void 0, void 0, function* () {
            this.state.setIsLoading(true);
            yield this.updateSettings(this.state.prevSettings);
            this.state.setCanRevert(false);
            yield this.reload();
        });
    }
    setPrevSettings(data) {
        this.state.setPrevSettings(cloneDeep(data.settings));
    }
    setData(data) {
        this.state.mutate(state => {
            state.widgetData.data = data;
        });
    }
    setSettings(settings) {
        assertIsDefined(this.state.widgetData.data);
        this.state.mutate(state => {
            state.widgetData.data.settings = settings;
            state.canRevert = true;
        });
    }
    setBrowserSourceProps(props) {
        const propsOrder = [
            'width',
            'height',
            'css',
            'refreshnocache',
            'reroute_audio',
            'restart_when_active',
            'shutdown',
            'fps_custom',
            'fps',
        ];
        const sortedProps = propsOrder.map(propName => props.find(p => p.name === propName));
        this.state.setBrowserSourceProps(sortedProps);
    }
    setStaticConfig(resp) {
        this.state.setStaticConfig(resp);
    }
}
__decorate([
    throttle(500)
], WidgetModule.prototype, "saveSettings", null);
export function useWidgetRoot(Module, params) {
    return useModule(Module, [params], 'WidgetModule');
}
export function useWidget() {
    return useModule('WidgetModule');
}
export function createAlertsMap(obj) {
    return obj;
}
export function settingsFromGlobal(data) {
    return {
        settings: data.data.settings.global,
    };
}
export function settingsToGlobal(settings) {
    return { global: settings };
}
//# sourceMappingURL=useWidget.jsx.map