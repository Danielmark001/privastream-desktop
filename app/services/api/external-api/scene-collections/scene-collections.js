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
import { Fallback, Singleton } from 'services/api/external-api';
import { Expensive } from 'services/api/external-api-limits';
let SceneCollectionsService = class SceneCollectionsService {
    get activeCollection() {
        const collection = this.sceneCollectionsService.activeCollection;
        return {
            id: collection.id,
            name: collection.name,
        };
    }
    get newUserFirstLogin() {
        return this.sceneCollectionsService.newUserFirstLogin;
    }
    fetchSceneCollectionsSchema() {
        return this.sceneCollectionsService.fetchSceneCollectionsSchema();
    }
    create(options) {
        return this.sceneCollectionsService.create(options);
    }
    load(id) {
        return this.sceneCollectionsService.load(id);
    }
    rename(newName, id) {
        return this.sceneCollectionsService.rename(newName, id);
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sceneCollectionsService.delete(id);
        });
    }
    get collectionAdded() {
        return this.sceneCollectionsService.collectionAdded;
    }
    get collectionRemoved() {
        return this.sceneCollectionsService.collectionRemoved;
    }
    get collectionWillSwitch() {
        return this.sceneCollectionsService.collectionWillSwitch;
    }
    get collectionSwitched() {
        return this.sceneCollectionsService.collectionSwitched;
    }
    get collectionUpdated() {
        return this.sceneCollectionsService.collectionUpdated;
    }
    get collections() {
        return this.sceneCollectionsService.collections;
    }
};
__decorate([
    Fallback(),
    Inject()
], SceneCollectionsService.prototype, "sceneCollectionsService", void 0);
__decorate([
    Expensive()
], SceneCollectionsService.prototype, "fetchSceneCollectionsSchema", null);
SceneCollectionsService = __decorate([
    Singleton()
], SceneCollectionsService);
export { SceneCollectionsService };
//# sourceMappingURL=scene-collections.js.map