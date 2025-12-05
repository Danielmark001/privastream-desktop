var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Subject } from 'rxjs';
import { Singleton, Fallback, InjectFromExternalApi } from 'services/api/external-api';
import { Inject } from 'services/core/injector';
import { Scene } from './scene';
import { getExternalSceneItemModel } from './scene-item';
import { Expensive } from 'services/api/external-api-limits';
import { map } from 'rxjs/operators';
let ScenesService = class ScenesService {
    constructor() {
        this.sceneAdded = this.scenesService.sceneAdded.pipe(map(m => this.convertToExternalSceneModel(m)));
        this.sceneRemoved = this.scenesService.sceneRemoved.pipe(map(m => this.convertToExternalSceneModel(m)));
        this.sceneSwitched = this.scenesService.sceneSwitched.pipe(map(m => this.convertToExternalSceneModel(m)));
        this.itemRemoved = this.scenesService.itemRemoved.pipe(map(m => this.convertToExternalSceneItemModel(m)));
        this.itemAdded = this.scenesService.itemAdded.pipe(map(m => this.convertToExternalSceneItemModel(m)));
        this.itemUpdated = (() => {
            const itemUpdated = new Subject();
            this.scenesService.itemUpdated.subscribe(m => {
                if (this.editorService.state.changingPositionInProgress)
                    return;
                itemUpdated.next(this.convertToExternalSceneItemModel(m));
            });
            this.editorService.positionUpdateFinished.subscribe(() => {
                const updatedItems = this.selectionService.views.globalSelection.getItems();
                updatedItems.forEach(item => itemUpdated.next(this.convertToExternalSceneItemModel(item)));
            });
            return itemUpdated;
        })();
    }
    convertToExternalSceneItemModel(internalItemModel) {
        const source = this.sourcesService.getSource(internalItemModel.sourceId);
        const name = source ? source.name : '';
        return getExternalSceneItemModel(internalItemModel, name);
    }
    convertToExternalSceneModel(internalSceneModel) {
        const scene = this.getScene(internalSceneModel.id);
        if (scene) {
            return scene.getModel();
        }
        else {
            return {
                id: internalSceneModel.id,
                name: internalSceneModel.name,
                nodes: [],
            };
        }
    }
    getScene(id) {
        if (!this.scenesService.state.scenes[id])
            return null;
        return new Scene(id);
    }
    getScenes() {
        return this.scenesService.views.scenes.map(scene => this.getScene(scene.id));
    }
    getSceneNames() {
        return this.scenesService.views.scenes.map(scene => scene.name);
    }
    createScene(name) {
        const scene = this.scenesService.createScene(name);
        return this.getScene(scene.id);
    }
    removeScene(id) {
        const model = this.getScene(id).getModel();
        this.scenesService.removeScene(id);
        return model;
    }
    makeSceneActive(id) {
        return this.scenesService.makeSceneActive(id);
    }
    get activeScene() {
        return this.getScene(this.activeSceneId);
    }
    get activeSceneId() {
        return this.scenesService.views.activeSceneId;
    }
};
__decorate([
    Fallback(),
    Inject()
], ScenesService.prototype, "scenesService", void 0);
__decorate([
    Inject()
], ScenesService.prototype, "editorService", void 0);
__decorate([
    Inject()
], ScenesService.prototype, "selectionService", void 0);
__decorate([
    InjectFromExternalApi()
], ScenesService.prototype, "sourcesService", void 0);
__decorate([
    Expensive(1, 'if you need to fetch only the list of scene names then use the getSceneNames() method')
], ScenesService.prototype, "getScenes", null);
ScenesService = __decorate([
    Singleton()
], ScenesService);
export { ScenesService };
//# sourceMappingURL=scenes.js.map