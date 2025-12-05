var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module, apiMethod, EApiPermissions } from './module';
import { Inject } from 'services/core/injector';
export class SceneCollectionsModule extends Module {
    constructor() {
        super(...arguments);
        this.moduleName = 'SceneCollections';
        this.permissions = [EApiPermissions.SceneCollections];
    }
    getSceneCollectionsSchema() {
        return this.sceneCollectionsService.fetchSceneCollectionsSchema();
    }
}
__decorate([
    Inject()
], SceneCollectionsModule.prototype, "sceneCollectionsService", void 0);
__decorate([
    apiMethod()
], SceneCollectionsModule.prototype, "getSceneCollectionsSchema", null);
//# sourceMappingURL=scene-collections.js.map