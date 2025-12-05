var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { PersistentStatefulService, Service, InitAfter, Inject, ViewHandler, mutation, } from 'services/core';
import { verticalDisplayData } from '../settings-v2/default-settings-data';
import { EPlaceType } from 'services/editor-commands/commands/reorder-nodes';
import { Subject } from 'rxjs';
import { Selection } from 'services/selection';
import { RunInLoadingMode } from 'services/app/app-decorators';
import compact from 'lodash/compact';
import invert from 'lodash/invert';
import forEachRight from 'lodash/forEachRight';
import { ENotificationType } from 'services/notifications';
import { $t } from 'services/i18n';
var EOutputDisplayType;
(function (EOutputDisplayType) {
    EOutputDisplayType["Horizontal"] = "horizontal";
    EOutputDisplayType["Vertical"] = "vertical";
})(EOutputDisplayType || (EOutputDisplayType = {}));
class DualOutputViews extends ViewHandler {
    get isLoading() {
        return this.state.isLoading;
    }
    get activeSceneId() {
        return this.scenesService.views.activeSceneId;
    }
    get dualOutputMode() {
        return this.state.dualOutputMode;
    }
    get activeCollection() {
        return this.sceneCollectionsService.activeCollection;
    }
    get sceneNodeMaps() {
        var _a;
        return ((_a = this.activeCollection) === null || _a === void 0 ? void 0 : _a.sceneNodeMaps) || {};
    }
    get activeSceneNodeMap() {
        var _a, _b;
        return (_b = (_a = this.sceneCollectionsService) === null || _a === void 0 ? void 0 : _a.sceneNodeMaps) === null || _b === void 0 ? void 0 : _b[this.activeSceneId];
    }
    get hasVerticalNodes() {
        return !!this.sceneNodeMaps[this.activeSceneId];
    }
    get hasSceneNodeMaps() {
        var _a;
        const nodeMaps = (_a = this.sceneCollectionsService) === null || _a === void 0 ? void 0 : _a.sceneNodeMaps;
        return this.dualOutputMode || (!!nodeMaps && Object.entries(nodeMaps).length > 0);
    }
    get isDualOutputCollection() {
        var _a;
        const nodeMaps = (_a = this.sceneCollectionsService) === null || _a === void 0 ? void 0 : _a.sceneNodeMaps;
        if (!nodeMaps)
            return false;
        return Object.entries(nodeMaps).length > 0;
    }
    getEnabledTargets(destinationId = 'url') {
        const platforms = this.streamingService.views.activeDisplayPlatforms;
        const destinations = this.streamingService.views.customDestinations.reduce((displayDestinations, destination) => {
            var _a;
            if (destination.enabled) {
                const id = destinationId === 'name' ? destination.name : destination.url;
                displayDestinations[(_a = destination.display) !== null && _a !== void 0 ? _a : 'horizontal'].push(id);
            }
            return displayDestinations;
        }, { horizontal: [], vertical: [] });
        return {
            platforms,
            destinations,
        };
    }
    get horizontalNodeIds() {
        if (!this.activeSceneNodeMap)
            return;
        return Object.keys(this.activeSceneNodeMap);
    }
    get verticalNodeIds() {
        if (!this.activeSceneNodeMap)
            return;
        return Object.values(this.activeSceneNodeMap);
    }
    get videoSettings() {
        return this.state.videoSettings;
    }
    get recording() {
        return this.state.recording;
    }
    get activeDisplays() {
        return this.state.videoSettings.activeDisplays;
    }
    get showHorizontalDisplay() {
        return !this.state.dualOutputMode || (this.activeDisplays.horizontal && !this.state.isLoading);
    }
    get showVerticalDisplay() {
        return this.state.dualOutputMode && this.activeDisplays.vertical && !this.state.isLoading;
    }
    get onlyVerticalDisplayActive() {
        return this.activeDisplays.vertical && !this.activeDisplays.horizontal;
    }
    get platformsDualStreaming() {
        var _a, _b;
        const streamingPlatforms = ((_b = (_a = this.streamingService.views) === null || _a === void 0 ? void 0 : _a.settings) === null || _b === void 0 ? void 0 : _b.platforms) || {};
        const dualStreaming = Object.entries(streamingPlatforms).reduce((platforms, [key, value]) => {
            if (value.display === 'both') {
                platforms.push(key);
            }
            if (!value.display) {
                console.log('Platform missing display: ', key);
            }
            return platforms;
        }, []);
        return dualStreaming.length ? dualStreaming : 'None';
    }
    getHorizontalNodeId(verticalNodeId, sceneId) {
        const sceneNodeMap = sceneId ? this.sceneNodeMaps[sceneId] : this.activeSceneNodeMap;
        if (!sceneNodeMap)
            return;
        return Object.keys(sceneNodeMap).find((horizontalNodeId) => sceneNodeMap[horizontalNodeId] === verticalNodeId);
    }
    getVerticalNodeId(horizontalNodeId, sceneId) {
        const sceneNodeMap = sceneId ? this.sceneNodeMaps[sceneId] : this.activeSceneNodeMap;
        if (!sceneNodeMap)
            return;
        return Object.values(sceneNodeMap).find((verticalNodeId) => sceneNodeMap[horizontalNodeId] === verticalNodeId);
    }
    getDualOutputNodeId(nodeId, sceneId) {
        var _a;
        return (_a = this.getHorizontalNodeId(nodeId, sceneId)) !== null && _a !== void 0 ? _a : this.getVerticalNodeId(nodeId, sceneId);
    }
    getVerticalNodeIds(sceneId) {
        if (!this.sceneNodeMaps[sceneId])
            return;
        return Object.values(this.sceneNodeMaps[sceneId]);
    }
    getNodeDisplay(nodeId, sceneId) {
        const sceneNodeMap = sceneId ? this.sceneNodeMaps[sceneId] : this.activeSceneNodeMap;
        if (sceneNodeMap && Object.values(sceneNodeMap).includes(nodeId)) {
            return 'vertical';
        }
        return 'horizontal';
    }
    getIsHorizontalVisible(nodeId, sceneId) {
        if (!this.hasVerticalNodes)
            return false;
        return this.scenesService.views.getNodeVisibility(nodeId, sceneId !== null && sceneId !== void 0 ? sceneId : this.activeSceneId);
    }
    getIsVerticalVisible(nodeId, sceneId) {
        if (!this.hasVerticalNodes)
            return false;
        const id = this.activeDisplays.vertical && !this.activeDisplays.horizontal
            ? nodeId
            : this.activeSceneNodeMap[nodeId];
        return this.scenesService.views.getNodeVisibility(id, sceneId !== null && sceneId !== void 0 ? sceneId : this.activeSceneId);
    }
    hasNodeMap(sceneId) {
        var _a;
        if (!((_a = this.sceneCollectionsService) === null || _a === void 0 ? void 0 : _a.sceneNodeMaps))
            return false;
        const nodeMap = sceneId ? this.sceneNodeMaps[sceneId] : this.activeSceneNodeMap;
        return !!nodeMap && Object.keys(nodeMap).length > 0;
    }
}
__decorate([
    Inject()
], DualOutputViews.prototype, "scenesService", void 0);
__decorate([
    Inject()
], DualOutputViews.prototype, "sceneCollectionsService", void 0);
__decorate([
    Inject()
], DualOutputViews.prototype, "streamingService", void 0);
let DualOutputService = class DualOutputService extends PersistentStatefulService {
    constructor() {
        super(...arguments);
        this.sceneNodeHandled = new Subject();
        this.collectionHandled = new Subject();
        this.dualOutputModeChanged = new Subject();
    }
    get views() {
        return new DualOutputViews(this.state);
    }
    init() {
        super.init();
        this.confirmDestinationDisplays();
        this.disableGlobalRescaleIfNeeded();
        this.sceneCollectionsService.collectionSwitched.subscribe(collection => {
            const hasNodeMap = (collection === null || collection === void 0 ? void 0 : collection.sceneNodeMaps) && Object.entries(collection === null || collection === void 0 ? void 0 : collection.sceneNodeMaps).length > 0;
            if (this.state.dualOutputMode && !hasNodeMap) {
                this.convertSingleOutputToDualOutputCollection();
            }
            else if (hasNodeMap) {
                this.validateDualOutputCollection();
            }
            else {
                this.collectionHandled.next(null);
            }
        });
        this.scenesService.sceneSwitched.subscribe(() => {
            if (this.state.isLoading) {
                this.setIsLoading(false);
            }
        });
        this.collectionHandled.subscribe(() => {
            this.setIsLoading(false);
        });
        this.userService.userLogout.subscribe(() => {
            if (this.state.dualOutputMode) {
                this.setDualOutputMode(false);
            }
        });
    }
    setDualOutputModeIfPossible(status = true, skipShowVideoSettings = false, showGoLiveWindow) {
        if (!this.userService.isLoggedIn)
            return;
        if (status === true && !this.streamSettingsService.protectedModeEnabled) {
            this.notificationsService.actions.push({
                message: $t('Unable to start Dual Output, update your Stream Settings to "Use Recommended Settings"'),
                type: ENotificationType.WARNING,
                lifeTime: 2000,
                action: this.jsonrpcService.createRequest(Service.getResourceId(this.settingsService), 'showSettings', 'Stream'),
            });
            return;
        }
        this.setDualOutputMode(status, skipShowVideoSettings, showGoLiveWindow);
    }
    setDualOutputMode(status = true, skipShowVideoSettings = false, showGoLiveWindow) {
        this.toggleDualOutputMode(status);
        if (this.state.dualOutputMode) {
            this.disableGlobalRescaleIfNeeded();
            if (!this.views.isDualOutputCollection) {
                this.convertSingleOutputToDualOutputCollection();
            }
            if (!this.streamingService.state.selectiveRecording) {
                this.toggleDisplay(true, 'vertical');
            }
            if (this.streamingService.views.isStreamShiftMode) {
                this.streamSettingsService.actions.setGoLiveSettings({ streamShift: false });
            }
        }
        else {
            this.selectionService.views.globalSelection.reset();
        }
        if (!skipShowVideoSettings) {
            this.settingsService.showSettings('Video');
        }
        else if (showGoLiveWindow) {
            this.streamingService.showGoLiveWindow();
        }
        this.SET_IS_LOADING(false);
        this.dualOutputModeChanged.next(status);
    }
    toggleDualOutputMode(status) {
        this.SET_SHOW_DUAL_OUTPUT(status);
    }
    disableGlobalRescaleIfNeeded() {
        if (this.state.dualOutputMode) {
            const output = this.settingsService.state.Output.formData;
            const globalRescaleOutput = this.settingsService.findSettingValue(output, 'Streaming', 'Rescale');
            if (globalRescaleOutput) {
                this.settingsService.setSettingValue('Output', 'Rescale', false);
                this.settingsService.refreshVideoSettings();
            }
        }
    }
    convertSingleOutputToDualOutputCollection() {
        this.SET_IS_LOADING(true);
        this.videoSettingsService.validateVideoContext();
        try {
            this.scenesService.views.scenes.forEach(scene => {
                this.createPartnerNodes(scene.id);
            });
        }
        catch (error) {
            console.error('Error converting to single output collection to dual output: ', error);
            this.collectionHandled.next();
        }
        this.collectionHandled.next(this.sceneCollectionsService.sceneNodeMaps);
    }
    createPartnerNodes(sceneId) {
        const scene = this.scenesService.views.getScene(sceneId);
        const selection = new Selection(scene.id, scene.getNodes());
        const verticalNodes = [];
        const initialNodeOrder = scene.getNodesIds();
        const nodeIdsMap = {};
        selection.getNodes().forEach(node => {
            const verticalNode = this.createPartnerNode(node);
            nodeIdsMap[node.id] = verticalNode.id;
            verticalNodes.push(verticalNode);
        });
        selection.getNodes().forEach(node => {
            const mappedNode = scene.getNode(nodeIdsMap[node.id]);
            const mappedParent = nodeIdsMap[node.parentId]
                ? scene.getNode(nodeIdsMap[node.parentId])
                : null;
            if (mappedParent) {
                mappedNode.setParent(mappedParent.id);
            }
            this.sceneNodeHandled.next();
        });
        const order = compact(scene.getNodesIds().map(origNodeId => nodeIdsMap[origNodeId]));
        scene.setNodesOrder(order.concat(initialNodeOrder));
    }
    createPartnerNode(node, repair = false, partnerNodeId, sourceId) {
        const scene = node.getScene();
        const display = node.display === 'vertical' ? 'horizontal' : 'vertical';
        if (node.isFolder()) {
            const folder = scene.createFolder(node.name, {
                id: partnerNodeId,
                display,
            });
            if (display === 'horizontal') {
                this.sceneCollectionsService.createNodeMapEntry(scene.id, folder.id, node.id);
                folder.placeBefore(node.id);
            }
            else {
                this.sceneCollectionsService.createNodeMapEntry(scene.id, node.id, folder.id);
                folder.placeAfter(node.id);
            }
            return folder;
        }
        else {
            const item = scene.addSource(sourceId !== null && sourceId !== void 0 ? sourceId : node.sourceId, {
                id: partnerNodeId,
                display,
                sourceAddOptions: { sourceId: sourceId !== null && sourceId !== void 0 ? sourceId : node.sourceId },
            });
            if (display === 'horizontal') {
                this.sceneCollectionsService.createNodeMapEntry(scene.id, item.id, node.id);
                item.placeBefore(node.id);
            }
            else {
                this.sceneCollectionsService.createNodeMapEntry(scene.id, node.id, item.id);
                item.placeAfter(node.id);
            }
            item.setTransform({ position: { x: 0, y: 0 } });
            if (repair) {
                const visibility = item.display === 'horizontal' ? false : node.visible;
                item.setVisibility(visibility);
            }
            else {
                const visibility = item.display === 'vertical' ? true : node.visible;
                item.setVisibility(visibility);
            }
            item.setLocked(node.locked);
            return item;
        }
    }
    validateDualOutputCollection() {
        this.SET_IS_LOADING(true);
        this.videoSettingsService.validateVideoContext();
        try {
            this.scenesService.views.scenes.forEach(scene => {
                if (this.views.hasNodeMap(scene.id)) {
                    this.validateSceneNodes(scene.id);
                }
                else {
                    this.createPartnerNodes(scene.id);
                }
            });
        }
        catch (error) {
            console.error('Error validating dual output collection: ', error);
            this.collectionHandled.next();
        }
        this.collectionHandled.next(this.sceneCollectionsService.sceneNodeMaps);
    }
    validateSceneNodes(sceneId) {
        this.SET_IS_LOADING(true);
        const sceneNodes = this.scenesService.views.getSceneNodesBySceneId(sceneId);
        if (!sceneNodes)
            return;
        const corruptedNodeIds = new Set();
        forEachRight(sceneNodes, (node, index) => {
            if (corruptedNodeIds.has(node.id))
                return;
            const nodeMap = (node === null || node === void 0 ? void 0 : node.display) === 'vertical'
                ? invert(this.views.sceneNodeMaps[sceneId])
                : this.views.sceneNodeMaps[sceneId];
            const partnerNode = this.validatePartnerNode(node, nodeMap, sceneNodes);
            if (node.isItem() && partnerNode.isItem()) {
                this.validateOutput(node, sceneId);
                const corruptedNode = this.validateSource(node, partnerNode);
                if (corruptedNode) {
                    corruptedNodeIds.add(corruptedNode.id);
                }
            }
            this.sceneNodeHandled.next(index);
        });
        this.SET_IS_LOADING(false);
    }
    validatePartnerNode(node, nodeMap, sceneNodes) {
        const partnerNodeId = nodeMap[node.id];
        if (!partnerNodeId) {
            return this.createPartnerNode(node, (node === null || node === void 0 ? void 0 : node.display) === 'horizontal');
        }
        const partnerNode = sceneNodes.find(node => node && node.id === partnerNodeId);
        if (!partnerNode) {
            return this.createPartnerNode(node, (node === null || node === void 0 ? void 0 : node.display) === 'horizontal', partnerNodeId);
        }
        return partnerNode;
    }
    validateSource(node, partnerNode) {
        if (node.sourceId === partnerNode.sourceId)
            return;
        const horizontalNode = node.display === 'horizontal' ? node : partnerNode;
        const verticalNode = node.display === 'vertical' ? node : partnerNode;
        const matchVisibility = node.display === 'horizontal';
        const _a = Object.assign(verticalNode.getSettings()), { visible } = _a, settings = __rest(_a, ["visible"]);
        const verticalNodeId = verticalNode.id;
        this.sceneCollectionsService.removeNodeMapEntry(horizontalNode.id, horizontalNode.sceneId);
        verticalNode.remove();
        const newPartner = this.createPartnerNode(horizontalNode, matchVisibility, verticalNodeId, horizontalNode.sourceId);
        const context = this.videoSettingsService.contexts[newPartner.display];
        newPartner.setSettings(Object.assign(Object.assign({}, settings), { output: context }));
        newPartner.setVisibility(visible);
        return partnerNode;
    }
    validateOutput(node, sceneId) {
        var _a;
        if (node === null || node === void 0 ? void 0 : node.output)
            return;
        const verticalNodeIds = new Set(this.views.getVerticalNodeIds(sceneId));
        const display = verticalNodeIds.has(node.id) ? 'vertical' : 'horizontal';
        this.assignNodeContext(node, (_a = node === null || node === void 0 ? void 0 : node.display) !== null && _a !== void 0 ? _a : display);
    }
    createOrAssignOutputNode(sceneItem, display, isHorizontalDisplay, sceneId, verticalNodeId) {
        if (isHorizontalDisplay) {
            this.assignNodeContext(sceneItem, display);
            return sceneItem;
        }
        else {
            const scene = this.scenesService.views.getScene(sceneId !== null && sceneId !== void 0 ? sceneId : this.views.activeSceneId);
            const copiedSceneItem = scene.addSource(sceneItem.sourceId, { id: verticalNodeId, display });
            if (!copiedSceneItem)
                return null;
            const selection = scene.getSelection(copiedSceneItem.id);
            this.editorCommandsService.executeCommand('ReorderNodesCommand', selection, sceneItem.id, EPlaceType.Before);
            this.sceneCollectionsService.createNodeMapEntry(sceneId, sceneItem.id, copiedSceneItem.id);
            return copiedSceneItem;
        }
    }
    assignNodeContext(node, display) {
        if (node.isItem()) {
            const context = this.videoSettingsService.contexts[display];
            if (!context)
                return null;
            node.setSettings({ output: context, display });
        }
        else {
            node.setDisplay(display);
        }
        return node.id;
    }
    confirmDestinationDisplays() {
        var _a;
        const customDestinations = (_a = this.streamSettingsService.settings.goLiveSettings) === null || _a === void 0 ? void 0 : _a.customDestinations;
        if (!customDestinations)
            return;
        customDestinations.forEach((destination, index) => {
            if (!destination.hasOwnProperty('display')) {
                const updatedDestinations = customDestinations.splice(index, 1, Object.assign(Object.assign({}, destination), { display: 'horizontal' }));
                this.streamSettingsService.setGoLiveSettings({ customDestinations: updatedDestinations });
            }
        });
    }
    toggleDisplay(status, display) {
        this.SET_DISPLAY_ACTIVE(status, display);
    }
    setVideoSetting(setting, display) {
        this.SET_VIDEO_SETTING(setting, display);
    }
    updateVideoSettings(settings, display = 'horizontal') {
        this.UPDATE_VIDEO_SETTING(settings, display);
    }
    setIsLoading(status) {
        this.SET_IS_LOADING(status);
    }
    SET_SHOW_DUAL_OUTPUT(status) {
        this.state = Object.assign(Object.assign({}, this.state), { dualOutputMode: status !== null && status !== void 0 ? status : !this.state.dualOutputMode });
    }
    SET_DISPLAY_ACTIVE(status, display) {
        this.state.videoSettings.activeDisplays = Object.assign(Object.assign({}, this.state.videoSettings.activeDisplays), { [display]: status });
    }
    SET_VIDEO_SETTING(setting, display = 'vertical') {
        this.state.videoSettings[display] = Object.assign(Object.assign({}, this.state.videoSettings[display]), setting);
    }
    UPDATE_VIDEO_SETTING(setting, display = 'vertical') {
        this.state.videoSettings[display] = Object.assign({}, setting);
    }
    SET_IS_LOADING(status) {
        this.state = Object.assign(Object.assign({}, this.state), { isLoading: status });
    }
};
DualOutputService.defaultState = {
    dualOutputMode: false,
    videoSettings: {
        horizontal: null,
        vertical: verticalDisplayData,
        activeDisplays: {
            horizontal: true,
            vertical: false,
        },
    },
    recording: ['horizontal'],
    isLoading: false,
};
__decorate([
    Inject()
], DualOutputService.prototype, "scenesService", void 0);
__decorate([
    Inject()
], DualOutputService.prototype, "videoSettingsService", void 0);
__decorate([
    Inject()
], DualOutputService.prototype, "editorCommandsService", void 0);
__decorate([
    Inject()
], DualOutputService.prototype, "sceneCollectionsService", void 0);
__decorate([
    Inject()
], DualOutputService.prototype, "streamSettingsService", void 0);
__decorate([
    Inject()
], DualOutputService.prototype, "userService", void 0);
__decorate([
    Inject()
], DualOutputService.prototype, "selectionService", void 0);
__decorate([
    Inject()
], DualOutputService.prototype, "streamingService", void 0);
__decorate([
    Inject()
], DualOutputService.prototype, "settingsService", void 0);
__decorate([
    Inject()
], DualOutputService.prototype, "notificationsService", void 0);
__decorate([
    Inject()
], DualOutputService.prototype, "jsonrpcService", void 0);
__decorate([
    RunInLoadingMode()
], DualOutputService.prototype, "setDualOutputMode", null);
__decorate([
    mutation()
], DualOutputService.prototype, "SET_SHOW_DUAL_OUTPUT", null);
__decorate([
    mutation()
], DualOutputService.prototype, "SET_DISPLAY_ACTIVE", null);
__decorate([
    mutation()
], DualOutputService.prototype, "SET_VIDEO_SETTING", null);
__decorate([
    mutation()
], DualOutputService.prototype, "UPDATE_VIDEO_SETTING", null);
__decorate([
    mutation()
], DualOutputService.prototype, "SET_IS_LOADING", null);
DualOutputService = __decorate([
    InitAfter('ScenesService')
], DualOutputService);
export { DualOutputService };
//# sourceMappingURL=dual-output.js.map