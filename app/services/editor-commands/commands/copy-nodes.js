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
import { Command } from './command';
import { Inject } from 'services/core';
import compact from 'lodash/compact';
import { $t } from 'services/i18n';
export class CopyNodesCommand extends Command {
    constructor(selection, destSceneId, duplicateSources = false, display) {
        super();
        this.selection = selection;
        this.destSceneId = destSceneId;
        this.duplicateSources = duplicateSources;
        this.display = display;
        this.nodeIdsMap = {};
        this.selection.freeze();
        const nodes = this.selection.getNodes();
        this.description = $t('Paste %{nodeName}', { nodeName: nodes[0] ? nodes[0].name : '' });
        this.hasNodeMap = this.dualOutputService.views.hasNodeMap(this.selection.sceneId);
    }
    execute() {
        const scene = this.scenesService.views.getScene(this.destSceneId);
        const insertedNodes = [];
        const initialNodeOrder = scene.getNodesIds();
        const isDualOutputMode = this.dualOutputService.views.dualOutputMode;
        if (this.duplicateSources) {
            this.sourceIdsMap = {};
            this.selection.getSources().forEach(source => {
                const dup = source.duplicate(this.sourceIdsMap[source.sourceId]);
                this.sourceIdsMap[source.sourceId] = dup ? dup.sourceId : source.sourceId;
            });
        }
        if (isDualOutputMode && !this.hasNodeMap) {
            this.selection.getNodes().forEach(node => {
                var _a, _b;
                if (node.isFolder()) {
                    const display = (_a = this.display) !== null && _a !== void 0 ? _a : this.dualOutputService.views.getNodeDisplay(node.id, this.selection.sceneId);
                    const folder = scene.createFolder(node.name, { id: this.nodeIdsMap[node.id], display });
                    if (this.display === 'vertical') {
                        this.sceneCollectionsService.createNodeMapEntry(this.destSceneId, node.id, folder.id);
                    }
                    this.nodeIdsMap[node.id] = folder.id;
                    insertedNodes.push(folder);
                }
                else {
                    const itemDisplay = (_b = this.display) !== null && _b !== void 0 ? _b : this.dualOutputService.views.getNodeDisplay(node.id, this.selection.sceneId);
                    const sourceId = this.sourceIdsMap != null ? this.sourceIdsMap[node.sourceId] : node.sourceId;
                    const item = scene.addSource(sourceId, {
                        id: this.nodeIdsMap[node.id],
                        display: itemDisplay,
                    });
                    if (this.display === 'vertical') {
                        item.setTransform({ position: { x: 0, y: 0 } });
                        item.setVisibility(true);
                        item.setLocked(node.locked);
                        this.sceneCollectionsService.createNodeMapEntry(this.destSceneId, node.id, item.id);
                    }
                    else {
                        const _c = node.getSettings(), { display, output } = _c, settings = __rest(_c, ["display", "output"]);
                        item.setSettings(settings);
                    }
                    this.nodeIdsMap[node.id] = item.id;
                    insertedNodes.push(item);
                }
            });
            this.hasNodeMap = true;
        }
        else {
            this.selection.getNodes().forEach(node => {
                var _a, _b;
                if (node.isFolder()) {
                    const display = (_a = this.display) !== null && _a !== void 0 ? _a : this.dualOutputService.views.getNodeDisplay(node.id, this.selection.sceneId);
                    const folder = scene.createFolder(node.name, { id: this.nodeIdsMap[node.id], display });
                    this.nodeIdsMap[node.id] = folder.id;
                    insertedNodes.push(folder);
                }
                else {
                    const itemDisplay = (_b = this.display) !== null && _b !== void 0 ? _b : this.dualOutputService.views.getNodeDisplay(node.id, this.selection.sceneId);
                    const sourceId = this.sourceIdsMap != null ? this.sourceIdsMap[node.sourceId] : node.sourceId;
                    const item = scene.addSource(sourceId, {
                        id: this.nodeIdsMap[node.id],
                        display: itemDisplay,
                    });
                    const _c = node.getSettings(), { display, output } = _c, settings = __rest(_c, ["display", "output"]);
                    item.setSettings(settings);
                    this.nodeIdsMap[node.id] = item.id;
                    insertedNodes.push(item);
                }
            });
        }
        this.selection.getNodes().forEach(node => {
            const mappedNode = scene.getNode(this.nodeIdsMap[node.id]);
            const mappedParent = this.nodeIdsMap[node.parentId]
                ? scene.getNode(this.nodeIdsMap[node.parentId])
                : null;
            if (mappedParent) {
                mappedNode.setParent(mappedParent.id);
            }
        });
        if (this.hasNodeMap) {
            const order = compact(this.selection
                .getScene()
                .getNodesIds()
                .map(origNodeId => {
                if (this.dualOutputService.views.getNodeDisplay(origNodeId, this.selection.sceneId) ===
                    'horizontal') {
                    const origVerticalNodeId = this.dualOutputService.views.getVerticalNodeId(origNodeId, this.selection.sceneId);
                    const newHorizontalNodeId = this.nodeIdsMap[origNodeId];
                    const newVerticalNodeId = this.nodeIdsMap[origVerticalNodeId];
                    this.sceneCollectionsService.createNodeMapEntry(this.destSceneId, newHorizontalNodeId, newVerticalNodeId);
                }
                return this.nodeIdsMap[origNodeId];
            }));
            scene.setNodesOrder(order.concat(initialNodeOrder));
        }
        else {
            const order = compact(this.selection
                .getScene()
                .getNodesIds()
                .map(origNodeId => this.nodeIdsMap[origNodeId]));
            scene.setNodesOrder(order.concat(initialNodeOrder));
        }
        return insertedNodes;
    }
    rollback() {
        const scene = this.scenesService.views.getScene(this.destSceneId);
        Object.values(this.nodeIdsMap).forEach(nodeId => {
            const node = scene.getNode(nodeId);
            if (node)
                node.remove();
            if (this.dualOutputService.views.hasNodeMap(scene.id)) {
                this.sceneCollectionsService.removeNodeMapEntry(nodeId, scene.id);
            }
        });
    }
}
__decorate([
    Inject()
], CopyNodesCommand.prototype, "scenesService", void 0);
__decorate([
    Inject()
], CopyNodesCommand.prototype, "dualOutputService", void 0);
__decorate([
    Inject()
], CopyNodesCommand.prototype, "videoSettingsService", void 0);
__decorate([
    Inject()
], CopyNodesCommand.prototype, "editorService", void 0);
__decorate([
    Inject()
], CopyNodesCommand.prototype, "sceneCollectionsService", void 0);
//# sourceMappingURL=copy-nodes.js.map