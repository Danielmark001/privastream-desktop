var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Command } from './command';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
export class RenameSceneCommand extends Command {
    constructor(sceneId, name) {
        super();
        this.sceneId = sceneId;
        this.name = name;
    }
    get description() {
        return $t('Rename %{sceneName}', { sceneName: this.oldName });
    }
    execute() {
        const scene = this.scenesService.views.getScene(this.sceneId);
        this.oldName = scene.name;
        scene.setName(this.name);
    }
    rollback() {
        this.scenesService.views.getScene(this.sceneId).setName(this.oldName);
    }
}
__decorate([
    Inject()
], RenameSceneCommand.prototype, "scenesService", void 0);
//# sourceMappingURL=rename-scene.js.map