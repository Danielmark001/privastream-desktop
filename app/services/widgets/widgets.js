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
import { Inject } from 'services/core/injector';
import { UserService } from '../user';
import { ScalableRectangle } from 'util/ScalableRectangle';
import namingHelpers from 'util/NamingHelpers';
import fs from 'fs';
import { ServicesManager } from 'services-manager';
import { authorizedHeaders, handleResponse } from 'util/requests';
import { WidgetType, WidgetDefinitions, makeWidgetTesters } from './widgets-data';
import { mutation, StatefulService, ViewHandler } from '../core/stateful-service';
import { WidgetSource } from './widget-source';
import { InitAfter } from 'services/core/service-initialization-observer';
import Vue from 'vue';
import cloneDeep from 'lodash/cloneDeep';
import { Subject } from 'rxjs';
import { Throttle } from 'lodash-decorators';
import { getAlertsConfig } from './alerts-config';
import { getWidgetsConfig } from './widgets-config';
import { WidgetDisplayData } from '.';
import { EAvailableFeatures } from 'services/incremental-rollout';
class WidgetsServiceViews extends ViewHandler {
    get userService() {
        return this.getServiceViews(UserService);
    }
    get widgetSources() {
        return Object.keys(this.state.widgetSources).map(id => this.getWidgetSource(id));
    }
    getWidgetSource(sourceId) {
        return this.state.widgetSources[sourceId] ? new WidgetSource(sourceId) : null;
    }
    get testers() {
        if (!this.userService.isLoggedIn)
            return;
        const widgetTesters = makeWidgetTesters(this.hostsService.streamlabs);
        return widgetTesters
            .filter(tester => {
            return tester.platforms.includes(this.userService.platform.type);
        })
            .map(tester => {
            const url = typeof tester.url === 'function'
                ? tester.url(this.userService.platform.type)
                : tester.url;
            return {
                url,
                name: tester.name,
            };
        });
    }
}
__decorate([
    Inject()
], WidgetsServiceViews.prototype, "hostsService", void 0);
let WidgetsService = class WidgetsService extends StatefulService {
    constructor() {
        super(...arguments);
        this.widgetDisplayData = WidgetDisplayData();
        this.previewSourceWatchers = {};
        this.settingsInvalidated = new Subject();
    }
    init() {
        this.sourcesService.sourceAdded.subscribe(sourceModel => {
            this.register(sourceModel.sourceId);
        });
        this.sourcesService.sourceUpdated.subscribe(sourceModel => {
            if (sourceModel.propertiesManagerType === 'widget' &&
                !this.state.widgetSources[sourceModel.sourceId]) {
                this.register(sourceModel.sourceId);
            }
            else if (sourceModel.propertiesManagerType !== 'widget' &&
                this.state.widgetSources[sourceModel.sourceId]) {
                this.unregister(sourceModel.sourceId);
            }
        });
        this.sourcesService.sourceRemoved.subscribe(sourceModel => {
            if (!this.state.widgetSources[sourceModel.sourceId])
                return;
            this.unregister(sourceModel.sourceId);
        });
    }
    get views() {
        return new WidgetsServiceViews(this.state);
    }
    get widgetSources() {
        return Object.keys(this.state.widgetSources).map(id => this.getWidgetSource(id));
    }
    getWidgetSource(sourceId) {
        return this.state.widgetSources[sourceId] ? new WidgetSource(sourceId) : null;
    }
    createWidget(type, name) {
        var _a, _b;
        if (!this.userService.isLoggedIn)
            return;
        const widget = this.widgetsConfig[type] || WidgetDefinitions[type];
        const widgetTransform = ((_a = this.widgetsConfig[type]) === null || _a === void 0 ? void 0 : _a.defaultTransform) || WidgetDefinitions[type];
        const suggestedName = name ||
            namingHelpers.suggestName(name || ((_b = WidgetDisplayData()[type]) === null || _b === void 0 ? void 0 : _b.name), (name) => {
                return this.sourcesService.views.getSourcesByName(name).length;
            });
        const rect = new ScalableRectangle({
            x: 0,
            y: 0,
            width: widgetTransform.width,
            height: widgetTransform.height,
        });
        rect.withAnchor(widgetTransform.anchor, () => {
            rect.x = widgetTransform.x * this.videoSettingsService.baseResolutions.horizontal.baseWidth;
            rect.y = widgetTransform.y * this.videoSettingsService.baseResolutions.horizontal.baseHeight;
        });
        const item = this.editorCommandsService.executeCommand('CreateNewItemCommand', this.scenesService.views.activeSceneId, suggestedName, 'browser_source', {
            url: this.widgetsConfig[type]
                ? widget.url
                : widget.url(this.hostsService.streamlabs, this.userService.widgetToken),
            width: widgetTransform.width,
            height: widgetTransform.height,
        }, {
            sourceAddOptions: {
                propertiesManager: 'widget',
                propertiesManagerSettings: {
                    widgetType: type,
                },
            },
            initialTransform: {
                position: {
                    x: rect.x,
                    y: rect.y,
                },
            },
            display: 'horizontal',
        });
        return item;
    }
    getWidgetUrl(type) {
        if (!this.userService.isLoggedIn || !WidgetDefinitions[type])
            return;
        return WidgetDefinitions[type].url(this.hostsService.streamlabs, this.userService.widgetToken);
    }
    getWidgetComponent(type) {
        return WidgetType[type];
    }
    getWidgetSettingsService(type) {
        const servicesManager = ServicesManager.instance;
        const serviceName = `${this.getWidgetComponent(type)}Service`;
        return servicesManager.getResource(serviceName);
    }
    test(testerName) {
        const tester = this.views.testers.find(tester => tester.name === testerName);
        const headers = authorizedHeaders(this.userService.apiToken);
        return fetch(new Request(tester.url, { headers, method: 'POST' }));
    }
    playAlert(alertType) {
        const config = this.alertsConfig[alertType];
        const host = this.hostsService.streamlabs;
        const headers = authorizedHeaders(this.userService.apiToken);
        return fetch(new Request(`https://${host}/api/v5/widgets/desktop/test/${alertType}`, {
            headers,
            method: 'POST',
        }));
    }
    syncPreviewSource(sourceId, previewSourceId) {
        if (this.previewSourceWatchers[previewSourceId]) {
            throw new Error('PreviewSource is already watching');
        }
        this.previewSourceWatchers[previewSourceId] = this.sourcesService.sourceUpdated.subscribe(sourceModel => {
            if (sourceModel.sourceId !== sourceId)
                return;
            const widget = this.views.getWidgetSource(sourceId);
            const source = widget.getSource();
            const newPreviewSettings = cloneDeep(source.getSettings());
            delete newPreviewSettings.shutdown;
            const config = this.widgetsConfig[widget.type];
            newPreviewSettings.url =
                (config === null || config === void 0 ? void 0 : config.previewUrl) || widget.getSettingsService().getApiSettings().previewUrl;
            const previewSource = widget.getPreviewSource();
            previewSource.updateSettings(newPreviewSettings);
            previewSource.refresh();
        });
    }
    stopSyncPreviewSource(previewSourceId) {
        if (!this.previewSourceWatchers[previewSourceId]) {
            console.warn('Trying to destroy preview source', previewSourceId, 'which is not on the watcher list, perhaps called twice?');
            return;
        }
        this.previewSourceWatchers[previewSourceId].unsubscribe();
        delete this.previewSourceWatchers[previewSourceId];
    }
    saveWidgetFile(path, widgetItemId) {
        return __awaiter(this, void 0, void 0, function* () {
            const widgetItem = this.scenesService.views.getSceneItem(widgetItemId);
            const data = this.exportWidgetJSON(widgetItem);
            const json = JSON.stringify(data, null, 2);
            yield new Promise((resolve, reject) => {
                fs.writeFile(path, json, err => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    }
    getWidgetTypeByUrl(url) {
        if (!this.userService.views.isLoggedIn)
            return -1;
        const type = Number(Object.keys(WidgetDefinitions).find(WidgetType => {
            let regExpStr = WidgetDefinitions[WidgetType].url(this.hostsService.streamlabs, '')
                .split('?')[0]
                .replace(/\//g, '\\/');
            regExpStr = `${regExpStr}([A-z0-9]+)?(\\?token=[A-z0-9]+)?$`;
            return new RegExp(regExpStr).test(url);
        }));
        return isNaN(type) ? -1 : type;
    }
    register(sourceId) {
        const source = this.sourcesService.views.getSource(sourceId);
        if (source.getPropertiesManagerType() !== 'widget')
            return;
        const widgetType = source.getPropertiesManagerSettings().widgetType;
        this.ADD_WIDGET_SOURCE({
            sourceId: source.sourceId,
            type: widgetType,
            previewSourceId: '',
        });
    }
    unregister(sourceId) {
        if (!this.state.widgetSources[sourceId])
            return;
        const widgetSource = this.views.getWidgetSource(sourceId);
        if (widgetSource.previewSourceId)
            widgetSource.destroyPreviewSource();
        this.REMOVE_WIDGET_SOURCE(sourceId);
    }
    exportWidgetJSON(widgetItem) {
        const source = widgetItem.getSource();
        if (source.getPropertiesManagerType() !== 'widget') {
            throw new Error('Cannot export widget JSON for non-widget');
        }
        const settings = Object.assign({}, source.getObsInput().settings);
        settings.url = '';
        return {
            settings,
            name: source.name,
            type: source.getPropertiesManagerSettings().widgetType,
            x: widgetItem.transform.position.x /
                this.videoSettingsService.baseResolutions.horizontal.baseWidth,
            y: widgetItem.transform.position.y /
                this.videoSettingsService.baseResolutions.horizontal.baseHeight,
            scaleX: widgetItem.transform.scale.x /
                this.videoSettingsService.baseResolutions.horizontal.baseWidth,
            scaleY: widgetItem.transform.scale.y /
                this.videoSettingsService.baseResolutions.horizontal.baseHeight,
        };
    }
    loadWidgetFile(path, sceneId) {
        return __awaiter(this, void 0, void 0, function* () {
            const scene = this.scenesService.views.getScene(sceneId);
            const json = yield new Promise((resolve, reject) => {
                fs.readFile(path, (err, data) => {
                    if (err) {
                        reject();
                    }
                    else {
                        resolve(data.toString());
                    }
                });
            });
            const widget = JSON.parse(json);
            this.importWidgetJSON(widget, scene);
        });
    }
    importWidgetJSON(widget, scene) {
        let widgetItem;
        widgetItem = scene.getItems().find(item => {
            const source = item.getSource();
            if (source.getPropertiesManagerType() !== 'widget')
                return false;
            return source.getPropertiesManagerSettings().widgetType === widget.type;
        });
        if (!widgetItem) {
            widgetItem = scene.createAndAddSource(scene.name, 'browser_source', {
                display: 'horizontal',
            });
        }
        this.createWidgetFromJSON(widget, widgetItem, this.videoSettingsService.baseResolutions.horizontal.baseWidth, this.videoSettingsService.baseResolutions.horizontal.baseHeight, 'horizontal');
        if (this.dualOutputService.views.hasNodeMap()) {
            Promise.resolve(this.dualOutputService.actions.return.createOrAssignOutputNode(widgetItem, 'vertical', false, widgetItem.sceneId)).then(verticalSceneItem => {
                this.createWidgetFromJSON(widget, verticalSceneItem, this.videoSettingsService.baseResolutions.horizontal.baseWidth, this.videoSettingsService.baseResolutions.horizontal.baseHeight, 'vertical');
            });
        }
    }
    createWidgetFromJSON(widget, widgetItem, baseWidth, baseHeight, display) {
        const source = widgetItem.getSource();
        source.setName(widget.name);
        source.updateSettings(widget.settings);
        source.replacePropertiesManager('widget', { widgetType: widget.type });
        widgetItem.setTransform({
            position: {
                x: display === 'vertical' ? 0 : widget.x * baseWidth,
                y: display === 'vertical' ? 0 : widget.y * baseHeight,
            },
            scale: {
                x: widget.scaleX * baseWidth,
                y: widget.scaleY * baseHeight,
            },
        });
    }
    get widgetsConfig() {
        const widgetsWithNewAPI = [];
        if (this.incrementalRolloutService.views.featureIsEnabled(EAvailableFeatures.newChatBox)) {
            widgetsWithNewAPI.push(WidgetType.ChatBox);
        }
        return getWidgetsConfig(this.hostsService.streamlabs, this.userService.widgetToken, widgetsWithNewAPI);
    }
    get alertsConfig() {
        const platforms = Object.keys(this.userService.views.platforms || []);
        return getAlertsConfig(this.hostsService.streamlabs, platforms);
    }
    request(req) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = req.method || 'GET';
            const headers = authorizedHeaders(this.userService.apiToken);
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
    invalidateSettingsWindow() {
        this.settingsInvalidated.next();
    }
    ADD_WIDGET_SOURCE(widgetSource) {
        Vue.set(this.state.widgetSources, widgetSource.sourceId, widgetSource);
    }
    REMOVE_WIDGET_SOURCE(sourceId) {
        Vue.delete(this.state.widgetSources, sourceId);
    }
};
WidgetsService.initialState = {
    widgetSources: {},
};
__decorate([
    Inject()
], WidgetsService.prototype, "userService", void 0);
__decorate([
    Inject()
], WidgetsService.prototype, "scenesService", void 0);
__decorate([
    Inject()
], WidgetsService.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], WidgetsService.prototype, "hostsService", void 0);
__decorate([
    Inject()
], WidgetsService.prototype, "editorCommandsService", void 0);
__decorate([
    Inject()
], WidgetsService.prototype, "dualOutputService", void 0);
__decorate([
    Inject()
], WidgetsService.prototype, "videoSettingsService", void 0);
__decorate([
    Inject()
], WidgetsService.prototype, "incrementalRolloutService", void 0);
__decorate([
    Throttle(1000)
], WidgetsService.prototype, "test", null);
__decorate([
    Throttle(1000)
], WidgetsService.prototype, "playAlert", null);
__decorate([
    mutation()
], WidgetsService.prototype, "ADD_WIDGET_SOURCE", null);
__decorate([
    mutation()
], WidgetsService.prototype, "REMOVE_WIDGET_SOURCE", null);
WidgetsService = __decorate([
    InitAfter('SourcesService')
], WidgetsService);
export { WidgetsService };
//# sourceMappingURL=widgets.js.map