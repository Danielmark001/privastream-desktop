var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import electron from 'electron';
import { execSync } from 'child_process';
import { mutation, StatefulService, ViewHandler } from 'services/core/stateful-service';
import { ScenesService, SceneItemFolder, } from 'services/scenes';
import { shortcut } from 'services/shortcuts';
import { Inject } from 'services/core/injector';
import { byOS, OS } from 'util/operating-systems';
const { clipboard } = electron;
class ClipboardViews extends ViewHandler {
    hasData() {
        return this.hasItems() || this.hasSystemClipboard();
    }
    hasItems() {
        if (this.state.sceneNodesIds.length) {
            if (!this.getServiceViews(ScenesService).getScene(this.state.itemsSceneId))
                return false;
        }
        return !!(this.state.sceneNodesIds.length || this.hasItemsInUnloadedClipboard());
    }
    hasFilters() {
        return !!(this.state.filterIds.length || this.hasFiltersInUnloadedClipboard());
    }
    hasSystemClipboard() {
        return !!this.state.systemClipboard.files.length;
    }
    hasItemsInUnloadedClipboard() {
        const clipboard = this.state.unloadedCollectionClipboard;
        return !!(clipboard &&
            clipboard.scenesNodes &&
            clipboard.scenesNodes.current &&
            clipboard.scenesNodes.current.length);
    }
    hasFiltersInUnloadedClipboard() {
        return !!(this.state.unloadedCollectionClipboard &&
            this.state.unloadedCollectionClipboard.filters &&
            this.state.unloadedCollectionClipboard.filters.length);
    }
    canDuplicate() {
        if (this.hasItemsInUnloadedClipboard())
            return true;
        if (!this.hasItems())
            return false;
        const hasNoduplicapableSource = this.getServiceViews(ScenesService)
            .getScene(this.state.itemsSceneId)
            .getSelection(this.state.sceneNodesIds)
            .getSources()
            .some(source => source.doNotDuplicate);
        return !hasNoduplicapableSource;
    }
}
export class ClipboardService extends StatefulService {
    get views() {
        return new ClipboardViews(this.state);
    }
    init() {
        this.sceneCollectionsService.collectionWillSwitch.subscribe(() => {
            this.beforeCollectionSwitchHandler();
        });
        this.SET_SYSTEM_CLIPBOARD(this.fetchSystemClipboard());
    }
    copy() {
        clipboard.clear();
        this.clear();
        const activeSceneId = this.scenesService.views.activeScene.id;
        const ids = new Set(this.selectionService.views.globalSelection.getIds());
        if (this.dualOutputService.views.hasNodeMap(activeSceneId)) {
            this.selectionService.views.globalSelection.getIds().forEach(id => {
                const dualOutputNodeId = this.dualOutputService.views.getDualOutputNodeId(id, activeSceneId);
                if (dualOutputNodeId && !ids.has(dualOutputNodeId)) {
                    ids.add(dualOutputNodeId);
                }
            });
        }
        this.SET_SCENE_ITEMS_IDS(Array.from(ids));
        this.SET_SCENE_ITEMS_SCENE(activeSceneId);
    }
    paste(duplicateSources = false) {
        if (this.navigationService.state.currentPage !== 'Studio')
            return;
        const systemClipboard = this.fetchSystemClipboard();
        if (JSON.stringify(this.state.systemClipboard) !== JSON.stringify(systemClipboard)) {
            this.clear();
            this.SET_SYSTEM_CLIPBOARD(systemClipboard);
        }
        if (this.views.hasItems()) {
            if (this.views.hasItemsInUnloadedClipboard()) {
                this.pasteItemsFromUnloadedClipboard();
                return;
            }
            const insertedItems = this.editorCommandsService.executeCommand('CopyNodesCommand', this.scenesService.views
                .getScene(this.state.itemsSceneId)
                .getSelection(this.state.sceneNodesIds), this.scenesService.views.activeSceneId, duplicateSources);
            if (insertedItems.length)
                this.selectionService.views.globalSelection.select(insertedItems);
        }
        else if (this.views.hasSystemClipboard()) {
            this.pasteFromSystemClipboard();
        }
    }
    copyFilters(sourceId) {
        const source = sourceId
            ? this.sourcesService.views.getSource(sourceId)
            : this.selectionService.views.globalSelection.getLastSelected();
        if (!source)
            return;
        if (source instanceof SceneItemFolder)
            return;
        this.SET_FILTERS_IDS([source.sourceId]);
        this.SET_UNLOADED_CLIPBOARD_FILTERS([]);
    }
    pasteFilters(sourceId) {
        const source = sourceId
            ? this.sourcesService.views.getSource(sourceId)
            : this.selectionService.views.globalSelection.getLastSelected();
        if (!source)
            return;
        if (source instanceof SceneItemFolder)
            return;
        const filterData = [];
        if (this.views.hasFiltersInUnloadedClipboard()) {
            this.state.unloadedCollectionClipboard.filters.forEach(filter => {
                filterData.push({
                    name: this.sourceFiltersService.suggestName(source.sourceId, filter.name),
                    type: filter.type,
                    settings: filter.settings,
                });
            });
        }
        else {
            this.state.filterIds.forEach(fromSourceId => {
                const filters = this.sourceFiltersService.getFilters(fromSourceId);
                filters.forEach(filter => {
                    filterData.push({
                        name: this.sourceFiltersService.suggestName(source.sourceId, filter.name),
                        type: filter.type,
                        settings: filter.settings,
                    });
                });
            });
        }
        this.editorCommandsService.executeCommand('PasteFiltersCommand', source.sourceId, filterData);
    }
    clear() {
        this.SET_FILTERS_IDS([]);
        this.SET_SCENE_ITEMS_IDS([]);
        this.SET_SCENE_ITEMS_SCENE('');
        this.SET_UNLOADED_CLIPBOARD_NODES({}, { current: [] });
        this.SET_UNLOADED_CLIPBOARD_FILTERS([]);
    }
    fetchSystemClipboard() {
        let files = [];
        const text = clipboard.readText() || '';
        if (!text)
            files = this.getFiles();
        return { files };
    }
    pasteItemsFromUnloadedClipboard() {
        const sourceIdMap = {};
        const sources = this.state.unloadedCollectionClipboard.sources;
        const scene = this.scenesService.views.activeScene;
        Object.keys(sources).forEach(sourceId => {
            const sourceInfo = sources[sourceId];
            const sourceModel = sourceInfo.source;
            let createdSource;
            if (sourceModel.type === 'scene') {
                const scene = this.scenesService.createScene(sourceModel.name);
                createdSource = scene.getSource();
                sourceIdMap[sourceModel.sourceId] = createdSource.sourceId;
                this.pasteSceneNodes(sourceModel.sourceId, this.state.unloadedCollectionClipboard.scenesNodes, sourceIdMap);
            }
            else {
                createdSource = this.sourcesService.createSource(sourceModel.name, sourceModel.type, sourceInfo.settings, {
                    propertiesManager: sourceInfo.propertiesManagerType,
                    propertiesManagerSettings: sourceInfo.propertiesManagerSettings,
                });
                sourceIdMap[sourceModel.sourceId] = createdSource.sourceId;
            }
            sourceInfo.filters.forEach(filter => {
                this.sourceFiltersService.add(createdSource.sourceId, filter.type, filter.name, filter.settings);
            });
        });
        const insertedNodesIds = this.pasteSceneNodes('current', this.state.unloadedCollectionClipboard.scenesNodes, sourceIdMap);
        this.SET_SCENE_ITEMS_IDS(insertedNodesIds);
        this.SET_SCENE_ITEMS_SCENE(scene.id);
        this.SET_UNLOADED_CLIPBOARD_NODES({}, { current: [] });
    }
    pasteSceneNodes(sceneId, scenesNodes, sourceIdMap) {
        const scene = sceneId === 'current'
            ? this.scenesService.views.activeScene
            : this.scenesService.views.getScene(sourceIdMap[sceneId]);
        const insertedNodesIds = [];
        const folderIdMap = {};
        const nodes = scenesNodes[sceneId].concat([]).reverse();
        nodes
            .filter(node => node.folder)
            .forEach(node => {
            const folderModel = node.folder;
            const folder = scene.createFolder(folderModel.name);
            folderIdMap[folderModel.id] = folder.id;
            insertedNodesIds.push(folder.id);
        });
        nodes.forEach(node => {
            var _a, _b, _c;
            if (node.folder) {
                const folderModel = node.folder;
                if (folderModel.parentId) {
                    scene.getFolder(folderIdMap[folderModel.id]).setParent(folderIdMap[folderModel.parentId]);
                }
                return;
            }
            const itemModel = node.item;
            const display = (_b = (_a = node.settings) === null || _a === void 0 ? void 0 : _a.display) !== null && _b !== void 0 ? _b : (_c = node === null || node === void 0 ? void 0 : node.item) === null || _c === void 0 ? void 0 : _c.display;
            const sceneItem = scene.addSource(sourceIdMap[itemModel.sourceId], { display });
            if (itemModel.parentId)
                sceneItem.setParent(folderIdMap[itemModel.parentId]);
            insertedNodesIds.push(sceneItem.id);
        });
        return insertedNodesIds;
    }
    pasteFromSystemClipboard() {
        const clipboard = this.state.systemClipboard;
        const scene = this.scenesService.views.activeScene;
        if (clipboard.files.length) {
            clipboard.files.forEach(filePath => scene.addFile(filePath));
            return;
        }
    }
    beforeCollectionSwitchHandler() {
        if (!this.views.hasItemsInUnloadedClipboard() && this.views.hasItems()) {
            let sourcesInfo = {};
            const scenes = this.scenesService.views.activeScene.getNestedScenes();
            const scenesNodes = { current: [] };
            scenes.forEach(scene => {
                const sceneInfo = this.getSceneInfo(scene, sourcesInfo);
                scenesNodes[scene.id] = sceneInfo.sceneNodes;
                sourcesInfo = sceneInfo.sources;
            });
            const sceneInfo = this.getSceneInfo(this.scenesService.views.getScene(this.state.itemsSceneId), sourcesInfo, this.state.sceneNodesIds);
            scenesNodes.current = sceneInfo.sceneNodes;
            sourcesInfo = sceneInfo.sources;
            this.SET_UNLOADED_CLIPBOARD_NODES(sourcesInfo, scenesNodes);
        }
        if (!this.views.hasFiltersInUnloadedClipboard() && this.views.hasFilters()) {
            this.SET_UNLOADED_CLIPBOARD_FILTERS(this.sourceFiltersService.getFilters(this.state.filterIds[0]));
        }
        this.SET_FILTERS_IDS([]);
        this.SET_SCENE_ITEMS_IDS([]);
        this.SET_SCENE_ITEMS_SCENE('');
    }
    getSceneInfo(scene, sourcesInfo, nodesIds = []) {
        const selection = nodesIds.length
            ? scene.getSelection(nodesIds)
            : scene.getSelection().selectAll();
        const nodes = selection.getNodes();
        const nodesInfo = nodes.map(node => {
            if (node.isFolder()) {
                return { folder: node.getModel() };
            }
            const item = node;
            if (!sourcesInfo[item.sourceId]) {
                const source = item.getSource();
                sourcesInfo[item.sourceId] = {
                    source: item.getModel(),
                    settings: source.getSettings(),
                    propertiesManagerType: source.getPropertiesManagerType(),
                    propertiesManagerSettings: source.getPropertiesManagerSettings(),
                    filters: this.sourceFiltersService.getFilters(source.sourceId),
                };
            }
            return {
                item: node.getModel(),
                settings: item.getSettings(),
            };
        });
        return {
            sources: sourcesInfo,
            sceneNodes: nodesInfo,
        };
    }
    getFiles() {
        return byOS({
            [OS.Windows]: () => {
                try {
                    return execSync('Powershell -command Add-Type -AssemblyName System.Windows.Forms;' +
                        '[System.Windows.Forms.Clipboard]::GetFileDropList()')
                        .toString()
                        .split('\n')
                        .filter(fineName => fineName)
                        .map(fileName => fileName.trim());
                }
                catch (e) {
                    console.error('Error fetching clipboard files from powershell', e);
                    return [];
                }
            },
            [OS.Mac]: [],
        });
    }
    SET_SYSTEM_CLIPBOARD(systemClipboard) {
        this.state.systemClipboard = systemClipboard;
    }
    SET_SCENE_ITEMS_IDS(ids) {
        this.state.sceneNodesIds = ids;
    }
    SET_FILTERS_IDS(filtersIds) {
        this.state.filterIds = filtersIds;
    }
    SET_SCENE_ITEMS_SCENE(sceneId) {
        this.state.itemsSceneId = sceneId;
    }
    SET_UNLOADED_CLIPBOARD_NODES(sources, scenesNodes) {
        this.state.unloadedCollectionClipboard.sources = sources;
        this.state.unloadedCollectionClipboard.scenesNodes = scenesNodes;
    }
    SET_UNLOADED_CLIPBOARD_FILTERS(filters) {
        this.state.unloadedCollectionClipboard.filters = filters;
    }
}
ClipboardService.initialState = {
    itemsSceneId: '',
    sceneNodesIds: [],
    filterIds: [],
    systemClipboard: {
        files: [],
    },
    unloadedCollectionClipboard: {
        sources: {},
        scenesNodes: {
            current: [],
        },
        filters: [],
    },
};
__decorate([
    Inject()
], ClipboardService.prototype, "scenesService", void 0);
__decorate([
    Inject()
], ClipboardService.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], ClipboardService.prototype, "sourceFiltersService", void 0);
__decorate([
    Inject()
], ClipboardService.prototype, "selectionService", void 0);
__decorate([
    Inject()
], ClipboardService.prototype, "sceneCollectionsService", void 0);
__decorate([
    Inject()
], ClipboardService.prototype, "editorCommandsService", void 0);
__decorate([
    Inject()
], ClipboardService.prototype, "navigationService", void 0);
__decorate([
    Inject()
], ClipboardService.prototype, "dualOutputService", void 0);
__decorate([
    Inject()
], ClipboardService.prototype, "videoSettingsService", void 0);
__decorate([
    shortcut('Ctrl+C')
], ClipboardService.prototype, "copy", null);
__decorate([
    shortcut('Ctrl+V')
], ClipboardService.prototype, "paste", null);
__decorate([
    mutation()
], ClipboardService.prototype, "SET_SYSTEM_CLIPBOARD", null);
__decorate([
    mutation()
], ClipboardService.prototype, "SET_SCENE_ITEMS_IDS", null);
__decorate([
    mutation()
], ClipboardService.prototype, "SET_FILTERS_IDS", null);
__decorate([
    mutation()
], ClipboardService.prototype, "SET_SCENE_ITEMS_SCENE", null);
__decorate([
    mutation()
], ClipboardService.prototype, "SET_UNLOADED_CLIPBOARD_NODES", null);
__decorate([
    mutation()
], ClipboardService.prototype, "SET_UNLOADED_CLIPBOARD_FILTERS", null);
//# sourceMappingURL=clipboard.js.map