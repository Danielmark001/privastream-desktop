var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { apiEvent, apiMethod, EApiPermissions, Module, NotImplementedError, } from './module';
import { Inject } from 'services/core/injector';
import { Subject } from 'rxjs';
var ESceneNodeType;
(function (ESceneNodeType) {
    ESceneNodeType["Folder"] = "folder";
    ESceneNodeType["SceneItem"] = "scene_item";
})(ESceneNodeType || (ESceneNodeType = {}));
export class ScenesModule extends Module {
    constructor() {
        super();
        this.moduleName = 'Scenes';
        this.permissions = [EApiPermissions.ScenesSources];
        this.sceneAdded = new Subject();
        this.sceneSwitched = new Subject();
        this.sceneRemoved = new Subject();
        this.sceneItemAdded = new Subject();
        this.sceneItemUpdated = new Subject();
        this.sceneItemRemoved = new Subject();
        this.scenesService.sceneAdded.subscribe(sceneData => {
            const scene = this.scenesService.views.getScene(sceneData.id);
            this.sceneAdded.next(this.serializeScene(scene));
        });
        this.scenesService.sceneSwitched.subscribe(sceneData => {
            const scene = this.scenesService.views.getScene(sceneData.id);
            this.sceneSwitched.next(this.serializeScene(scene));
        });
        this.scenesService.sceneRemoved.subscribe(sceneData => {
            this.sceneRemoved.next(sceneData.id);
        });
        this.scenesService.itemAdded.subscribe(itemData => {
            const item = this.scenesService.views.getSceneItem(itemData.sceneItemId);
            this.sceneItemAdded.next(this.serializeNode(item));
        });
        this.scenesService.itemUpdated.subscribe(itemData => {
            const item = this.scenesService.views.getSceneItem(itemData.sceneItemId);
            this.sceneItemUpdated.next(this.serializeNode(item));
        });
        this.scenesService.itemRemoved.subscribe(itemData => {
            this.sceneItemRemoved.next(itemData.sceneItemId);
        });
    }
    getScenes() {
        return this.scenesService.views.scenes.map(scene => this.serializeScene(scene));
    }
    getScene(_ctx, id) {
        const scene = this.scenesService.views.getScene(id);
        return scene ? this.serializeScene(scene) : null;
    }
    getSceneItem(_ctx, id) {
        const sceneItem = this.scenesService.views.getSceneItem(id);
        return sceneItem ? this.serializeNode(sceneItem) : null;
    }
    getActiveScene() {
        return this.serializeScene(this.scenesService.views.activeScene);
    }
    createScene() {
        throw new NotImplementedError();
    }
    updateScene(ctx, patch) {
        this.validatePatch(['id'], patch);
        if (patch.name)
            this.scenesService.views.getScene(patch.id).setName(patch.name);
    }
    removeScene() {
        throw new NotImplementedError();
    }
    makeSceneActive(ctx, id) {
        this.scenesService.makeSceneActive(id);
    }
    createSceneItem(ctx, sceneId, sourceId) {
        const scene = this.scenesService.views.getScene(sceneId);
        if (!scene)
            throw new Error(`Scene ${sceneId} does not exist!`);
        const sceneItem = scene.addSource(sourceId, { display: 'horizontal' });
        if (this.dualOutputService.views.hasNodeMap(sceneId)) {
            this.dualOutputService.createOrAssignOutputNode(sceneItem, 'vertical', false, sceneId);
        }
        return this.serializeNode(sceneItem);
    }
    updateSceneItem(ctx, patch) {
        this.validatePatch(['id'], patch);
        const sceneItem = this.scenesService.views.getSceneItem(patch.id);
        if (patch.locked != null)
            sceneItem.setLocked(patch.locked);
        if (patch.visible != null)
            sceneItem.setVisibility(patch.visible);
        if (patch.transform != null)
            sceneItem.setTransform(patch.transform);
        if (this.dualOutputService.views.hasNodeMap()) {
            const verticalNodeId = this.dualOutputService.views.getVerticalNodeId(sceneItem.id);
            if (!verticalNodeId)
                return;
            const verticalSceneItem = this.scenesService.views.getSceneItem(verticalNodeId);
            if (patch.locked != null)
                verticalSceneItem.setLocked(patch.locked);
            if (patch.visible != null)
                verticalSceneItem.setVisibility(patch.visible);
            if (patch.transform != null)
                verticalSceneItem.setTransform(patch.transform);
        }
    }
    removeSceneItem(ctx, sceneId, sceneItemId) {
        const scene = this.scenesService.views.getScene(sceneId);
        if (!scene)
            throw new Error(`Scene ${sceneId} does not exist!`);
        scene.removeItem(sceneItemId);
        if (this.dualOutputService.views.hasNodeMap(sceneId)) {
            const verticalNodeId = this.dualOutputService.views.getVerticalNodeId(sceneItemId);
            if (!verticalNodeId)
                return;
            scene.removeItem(verticalNodeId);
            this.sceneCollectionsService.removeNodeMapEntry(sceneItemId, sceneId);
        }
    }
    serializeScene(scene) {
        return {
            id: scene.id,
            name: scene.name,
            nodes: scene.getNodes().map(node => {
                return this.serializeNode(node);
            }),
        };
    }
    serializeNode(node) {
        if (node.isFolder()) {
            return {
                id: node.id,
                type: ESceneNodeType.Folder,
                name: node.name,
                childrenIds: node.childrenIds,
                display: node === null || node === void 0 ? void 0 : node.display,
            };
        }
        if (node.isItem()) {
            return {
                id: node.id,
                type: ESceneNodeType.SceneItem,
                sourceId: node.sourceId,
                visible: node.visible,
                locked: node.locked,
                transform: node.transform,
                display: node === null || node === void 0 ? void 0 : node.display,
            };
        }
    }
}
__decorate([
    Inject()
], ScenesModule.prototype, "scenesService", void 0);
__decorate([
    Inject()
], ScenesModule.prototype, "dualOutputService", void 0);
__decorate([
    Inject()
], ScenesModule.prototype, "sceneCollectionsService", void 0);
__decorate([
    apiEvent()
], ScenesModule.prototype, "sceneAdded", void 0);
__decorate([
    apiEvent()
], ScenesModule.prototype, "sceneSwitched", void 0);
__decorate([
    apiEvent()
], ScenesModule.prototype, "sceneRemoved", void 0);
__decorate([
    apiEvent()
], ScenesModule.prototype, "sceneItemAdded", void 0);
__decorate([
    apiEvent()
], ScenesModule.prototype, "sceneItemUpdated", void 0);
__decorate([
    apiEvent()
], ScenesModule.prototype, "sceneItemRemoved", void 0);
__decorate([
    apiMethod()
], ScenesModule.prototype, "getScenes", null);
__decorate([
    apiMethod()
], ScenesModule.prototype, "getScene", null);
__decorate([
    apiMethod()
], ScenesModule.prototype, "getSceneItem", null);
__decorate([
    apiMethod()
], ScenesModule.prototype, "getActiveScene", null);
__decorate([
    apiMethod()
], ScenesModule.prototype, "createScene", null);
__decorate([
    apiMethod()
], ScenesModule.prototype, "updateScene", null);
__decorate([
    apiMethod()
], ScenesModule.prototype, "removeScene", null);
__decorate([
    apiMethod()
], ScenesModule.prototype, "makeSceneActive", null);
__decorate([
    apiMethod()
], ScenesModule.prototype, "createSceneItem", null);
__decorate([
    apiMethod()
], ScenesModule.prototype, "updateSceneItem", null);
__decorate([
    apiMethod()
], ScenesModule.prototype, "removeSceneItem", null);
//# sourceMappingURL=scenes.js.map