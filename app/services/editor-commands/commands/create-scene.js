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
import { CopyNodesCommand } from './copy-nodes';
import { $t } from 'services/i18n';
export class CreateSceneCommand extends Command {
    constructor(name, options = {}) {
        super();
        this.name = name;
        this.options = options;
        this.description = $t('Create %{sceneName}', { sceneName: name });
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            const scene = this.scenesService.createScene(this.name, {
                sceneId: this.sceneId,
            });
            this.sceneId = scene.id;
            let nodesToCopy;
            if (this.options.duplicateItemsFromScene) {
                nodesToCopy = this.scenesService.views
                    .getScene(this.options.duplicateItemsFromScene)
                    .getSelection()
                    .selectAll();
            }
            if (this.options.groupFromOrigin) {
                nodesToCopy = this.scenesService.views
                    .getScene(this.options.groupFromOrigin.originSceneId)
                    .getSelection(this.options.groupFromOrigin.originItemIds);
            }
            if (nodesToCopy) {
                this.copyNodesSubcommand =
                    this.copyNodesSubcommand || new CopyNodesCommand(nodesToCopy, this.sceneId);
                this.copyNodesSubcommand.execute();
            }
            if (this.options.groupFromOrigin) {
                const originScene = this.scenesService.views.getScene(this.options.groupFromOrigin.originSceneId);
                const originSelection = originScene.getSelection(this.options.groupFromOrigin.originItemIds);
                const item = originScene.addSource(this.sceneId, { id: this.sceneSourceId });
                this.sceneSourceId = item.id;
                item.setContentCrop();
                this.removeNodesSubcommand = new RemoveNodesCommand(originSelection);
                yield this.removeNodesSubcommand.execute();
            }
            return scene.id;
        });
    }
    rollback() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.options.groupFromOrigin) {
                yield this.removeNodesSubcommand.rollback();
            }
            if (this.copyNodesSubcommand)
                this.copyNodesSubcommand.rollback();
            this.scenesService.removeScene(this.sceneId);
        });
    }
}
__decorate([
    Inject()
], CreateSceneCommand.prototype, "scenesService", void 0);
//# sourceMappingURL=create-scene.js.map