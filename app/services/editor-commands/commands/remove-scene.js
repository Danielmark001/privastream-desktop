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
import { Command } from './command';
import { Inject } from 'services/core/injector';
import { RemoveNodesCommand } from './remove-nodes';
import { $t } from 'services/i18n';
import { RemoveItemCommand } from './remove-item';
export class RemoveSceneCommand extends Command {
    constructor(sceneId) {
        super();
        this.sceneId = sceneId;
        this.sceneName = this.scenesService.views.getScene(this.sceneId).name;
        this.sceneOrder = this.scenesService.state.displayOrder.slice();
    }
    get description() {
        return $t('Remove %{sceneName}', { sceneName: this.sceneName });
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            const scene = this.scenesService.views.getScene(this.sceneId);
            this.removeItemSubcommands = [];
            this.hasSceneNodeMap = this.dualOutputService.views.hasNodeMap(this.sceneId);
            for (const item of this.scenesService.views.getSceneItemsBySourceId(this.sceneId)) {
                const command = new RemoveItemCommand(item.id);
                yield command.execute();
                this.removeItemSubcommands.push(command);
            }
            if (scene.getNodesIds().length) {
                this.removeNodesSubcommand = new RemoveNodesCommand(scene.getSelection(scene.getNodesIds()));
                yield this.removeNodesSubcommand.execute();
            }
            if (this.hasSceneNodeMap) {
                this.sceneCollectionsService.removeNodeMap(scene.id);
            }
            scene.remove();
        });
    }
    rollback() {
        return __awaiter(this, void 0, void 0, function* () {
            this.scenesService.createScene(this.sceneName, { sceneId: this.sceneId });
            this.scenesService.setSceneOrder(this.sceneOrder.slice());
            if (this.hasSceneNodeMap) {
                this.sceneCollectionsService.restoreNodeMap(this.sceneId);
            }
            if (this.removeNodesSubcommand)
                yield this.removeNodesSubcommand.rollback();
            for (const command of this.removeItemSubcommands) {
                yield command.rollback();
            }
        });
    }
}
__decorate([
    Inject()
], RemoveSceneCommand.prototype, "scenesService", void 0);
__decorate([
    Inject()
], RemoveSceneCommand.prototype, "dualOutputService", void 0);
__decorate([
    Inject()
], RemoveSceneCommand.prototype, "sceneCollectionsService", void 0);
//# sourceMappingURL=remove-scene.js.map