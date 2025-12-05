var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import Vue from 'vue';
import without from 'lodash/without';
import { Subject } from 'rxjs';
import { mutation, StatefulService } from 'services/core/stateful-service';
import { Scene, SceneItem } from './index';
import { Inject } from 'services/core/injector';
import { SceneFactory } from '../../../obs-api';
import { $t } from 'services/i18n';
import namingHelpers from 'util/NamingHelpers';
import uuid from 'uuid/v4';
import { InitAfter, ViewHandler } from 'services/core';
class ScenesViews extends ViewHandler {
    getScene(sceneId) {
        const sceneModel = this.state.scenes[sceneId];
        if (!sceneModel)
            return null;
        return new Scene(sceneModel.id);
    }
    sceneSourcesForScene(sceneId) {
        const scene = this.getScene(sceneId);
        if (!scene)
            return [];
        return scene.getItems().filter(sceneItem => sceneItem.type === 'scene');
    }
    get activeSceneId() {
        return this.state.activeSceneId;
    }
    get activeScene() {
        if (this.activeSceneId)
            return this.getScene(this.activeSceneId);
        return null;
    }
    get scenes() {
        return this.state.displayOrder.map(id => this.getScene(id));
    }
    getSceneItems() {
        const sceneItems = [];
        this.scenes.forEach(scene => sceneItems.push(...scene.getItems()));
        return sceneItems;
    }
    getSceneItem(sceneItemId) {
        for (const scene of this.scenes) {
            const sceneItem = scene.getItem(sceneItemId);
            if (sceneItem)
                return sceneItem;
        }
        return null;
    }
    getSceneItemsBySceneId(sceneId) {
        const scene = this.getScene(sceneId);
        if (!scene)
            return;
        return scene.getItems();
    }
    getSceneNodesBySceneId(sceneId) {
        const scene = this.getScene(sceneId);
        if (!scene)
            return;
        return scene.getNodes();
    }
    getSceneItemsBySourceId(sourceId) {
        const items = [];
        this.scenes.forEach(scene => {
            scene.getItems().forEach(item => {
                if (item.sourceId === sourceId) {
                    items.push(item);
                }
            });
        });
        return items;
    }
    getSceneNode(nodeId) {
        for (const scene of this.scenes) {
            const sceneNode = scene.getNode(nodeId);
            if (sceneNode)
                return sceneNode;
        }
        return null;
    }
    getNodeVisibility(sceneNodeId, sceneId) {
        const nodeModel = this.getSceneNode(sceneNodeId);
        if (!nodeModel)
            return false;
        if (nodeModel instanceof SceneItem) {
            return nodeModel === null || nodeModel === void 0 ? void 0 : nodeModel.visible;
        }
        if (sceneId) {
            const scene = this.getScene(sceneId);
            if (!scene)
                return false;
            return scene.getItemsForNode(sceneNodeId).some(i => i.visible);
        }
        return false;
    }
}
__decorate([
    Inject()
], ScenesViews.prototype, "scenesService", void 0);
let ScenesService = class ScenesService extends StatefulService {
    constructor() {
        super(...arguments);
        this.sceneAdded = new Subject();
        this.sceneRemoved = new Subject();
        this.sceneSwitched = new Subject();
        this.itemAdded = new Subject();
        this.itemRemoved = new Subject();
        this.itemUpdated = new Subject();
    }
    get views() {
        return new ScenesViews(this.state);
    }
    ADD_SCENE(id, name) {
        Vue.set(this.state.scenes, id, {
            id,
            name,
            nodes: [],
        });
        this.state.displayOrder.push(id);
    }
    REMOVE_SCENE(id) {
        Vue.delete(this.state.scenes, id);
        this.state.displayOrder = without(this.state.displayOrder, id);
    }
    MAKE_SCENE_ACTIVE(id) {
        this.state.activeSceneId = id;
    }
    SET_SCENE_ORDER(order) {
        const sanitizedOrder = order.filter(id => this.state.scenes[id]);
        this.state.displayOrder = sanitizedOrder;
    }
    createScene(name, options = {}) {
        const id = options.sceneId || `scene_${uuid()}`;
        this.ADD_SCENE(id, name);
        const obsScene = SceneFactory.create(id);
        this.sourcesService.addSource(obsScene.source, name, { sourceId: id, display: 'horizontal' });
        if (options.duplicateSourcesFromScene) {
            const newScene = this.views.getScene(id);
            const oldScene = this.views.getScene(options.duplicateSourcesFromScene);
            if (!oldScene)
                return;
            oldScene
                .getItems()
                .slice()
                .reverse()
                .forEach(item => {
                var _a;
                const display = (_a = item === null || item === void 0 ? void 0 : item.display) !== null && _a !== void 0 ? _a : this.dualOutputService.views.getNodeDisplay(item.id, id);
                const newItem = newScene.addSource(item.sourceId, { display });
                if (this.dualOutputService.views.dualOutputMode) {
                    this.dualOutputService.actions.createOrAssignOutputNode(newItem, 'vertical', false, id);
                }
            });
        }
        this.sceneAdded.next(this.state.scenes[id]);
        if (options.makeActive)
            this.makeSceneActive(id);
        return this.views.getScene(id);
    }
    canRemoveScene() {
        return Object.keys(this.state.scenes).length > 1;
    }
    removeScene(id, force = false) {
        if (!force && Object.keys(this.state.scenes).length < 2) {
            return null;
        }
        const scene = this.views.getScene(id);
        if (!scene)
            return null;
        const sceneModel = this.state.scenes[id];
        scene.getItems().forEach(sceneItem => scene.removeItem(sceneItem.sceneItemId));
        this.views.getSceneItems().forEach(sceneItem => {
            if (sceneItem.sourceId !== scene.id)
                return;
            sceneItem.getScene().removeItem(sceneItem.sceneItemId);
        });
        if (this.state.activeSceneId === id) {
            const sceneIds = Object.keys(this.state.scenes).filter(sceneId => sceneId !== id);
            if (sceneIds[0]) {
                this.makeSceneActive(sceneIds[0]);
            }
        }
        this.REMOVE_SCENE(id);
        this.sceneRemoved.next(sceneModel);
        return sceneModel;
    }
    setLockOnAllScenes(locked) {
        this.views.scenes.forEach(scene => scene.setLockOnAllItems(locked));
    }
    getSourceItemCount(sourceId) {
        let count = 0;
        this.views.scenes.forEach(scene => {
            scene.getItems().forEach(sceneItem => {
                if (sceneItem.sourceId === sourceId)
                    count += 1;
            });
        });
        return count;
    }
    getSceneIds() {
        return Object.keys(this.state.scenes);
    }
    makeSceneActive(id) {
        const scene = this.views.getScene(id);
        if (!scene)
            return false;
        const activeScene = this.views.activeScene;
        if (this.dualOutputService.views.dualOutputMode && id !== this.state.activeSceneId) {
            this.dualOutputService.setIsLoading(true);
        }
        this.MAKE_SCENE_ACTIVE(id);
        this.transitionsService.transition(activeScene && activeScene.id, scene.id);
        this.sceneSwitched.next(scene.getModel());
        return true;
    }
    setSceneOrder(order) {
        this.SET_SCENE_ORDER(order);
    }
    getModel() {
        return this.state;
    }
    createAndAddSource(sceneId, sourceName, sourceType, settings) {
        const scene = this.views.getScene(sceneId);
        if (!scene) {
            throw new Error(`Can't find scene with ID: ${sceneId}`);
        }
        const sceneItem = scene.createAndAddSource(sourceName, sourceType, settings);
        if (this.dualOutputService.views.hasSceneNodeMaps) {
            this.dualOutputService.createPartnerNode(sceneItem);
            this.selectionService.associateSelectionWithDisplay('vertical');
        }
        return sceneItem.sceneItemId;
    }
    suggestName(name) {
        if (!this.views.activeScene)
            return name;
        const activeScene = this.views.activeScene;
        return namingHelpers.suggestName(name, (name) => {
            const ind = activeScene.getNodes().findIndex(node => node.name === name);
            return ind !== -1;
        });
    }
    showNameScene(options = {}) {
        this.windowsService.showWindow({
            componentName: 'NameScene',
            title: options.rename ? $t('Rename Scene') : $t('Name Scene'),
            queryParams: options,
            size: {
                width: 400,
                height: 250,
            },
        });
    }
    showNameFolder(options = {}) {
        this.windowsService.showWindow({
            componentName: 'NameFolder',
            title: options.renameId ? $t('Rename Folder') : $t('Name Folder'),
            queryParams: options,
            size: {
                width: 400,
                height: 250,
            },
        });
    }
    showDuplicateScene(sceneName) {
        this.windowsService.showWindow({
            componentName: 'NameScene',
            title: $t('Name Scene'),
            queryParams: { sceneToDuplicate: sceneName },
            size: {
                width: 400,
                height: 250,
            },
        });
    }
    repair() {
        const scenes = this.views.scenes;
        const visitedSourcesIds = [];
        for (const scene of scenes) {
            const visitedNodeIds = [];
            this.traverseScene(scene.id, node => {
                if (visitedNodeIds.includes(node.id)) {
                    console.log('Remove looped item', node.name);
                    node.setParent('');
                    node.remove();
                    this.repair();
                    return false;
                }
                visitedNodeIds.push(node.id);
                if (node.isItem())
                    visitedSourcesIds.push(node.sourceId);
                return true;
            });
            const allNodes = scene.getNodes();
            for (const node of allNodes) {
                if (!visitedNodeIds.includes(node.id)) {
                    console.log('Remove unreachable item', node.name, node.id);
                    node.setParent('');
                    node.remove();
                    this.repair();
                    return;
                }
            }
        }
        this.sourcesService.views
            .getSources()
            .filter(source => !source.channel && source.type !== 'scene')
            .forEach(source => {
            if (!visitedSourcesIds.includes(source.sourceId)) {
                console.log('Remove Unreachable source', source.name, source.sourceId);
                source.remove();
            }
        });
        console.log('repairing finished');
    }
    traverseScene(sceneId, cb, nodeId) {
        let canContinue = true;
        const scene = this.views.getScene(sceneId);
        if (!scene)
            return false;
        if (!nodeId) {
            const rootNodes = scene.getRootNodes();
            for (const node of rootNodes) {
                canContinue = this.traverseScene(sceneId, cb, node.id);
                if (!canContinue)
                    return false;
            }
            return true;
        }
        const node = scene.getNode(nodeId);
        if (!node)
            return false;
        if (node.isItem()) {
            canContinue = cb(node);
            if (!canContinue)
                return false;
        }
        else if (node.isFolder()) {
            canContinue = cb(node);
            if (!canContinue)
                return false;
            for (const childId of node.childrenIds) {
                canContinue = this.traverseScene(sceneId, cb, childId);
                if (!canContinue)
                    return false;
            }
        }
        return true;
    }
};
ScenesService.initialState = {
    activeSceneId: '',
    displayOrder: [],
    scenes: {},
};
__decorate([
    Inject()
], ScenesService.prototype, "dualOutputService", void 0);
__decorate([
    Inject()
], ScenesService.prototype, "sceneCollectionsService", void 0);
__decorate([
    Inject()
], ScenesService.prototype, "windowsService", void 0);
__decorate([
    Inject()
], ScenesService.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], ScenesService.prototype, "transitionsService", void 0);
__decorate([
    Inject()
], ScenesService.prototype, "selectionService", void 0);
__decorate([
    mutation()
], ScenesService.prototype, "ADD_SCENE", null);
__decorate([
    mutation()
], ScenesService.prototype, "REMOVE_SCENE", null);
__decorate([
    mutation()
], ScenesService.prototype, "MAKE_SCENE_ACTIVE", null);
__decorate([
    mutation()
], ScenesService.prototype, "SET_SCENE_ORDER", null);
ScenesService = __decorate([
    InitAfter('DualOutputService')
], ScenesService);
export { ScenesService };
//# sourceMappingURL=scenes.js.map