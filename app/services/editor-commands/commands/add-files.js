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
import { $t } from 'services/i18n';
import { CreateNewItemCommand } from './create-new-item';
import { Inject } from '../../core';
import { CreateFolderCommand } from './create-folder';
import { RemoveNodesCommand } from './remove-nodes';
export class AddFilesCommand extends Command {
    constructor(sceneId, files) {
        super();
        this.sceneId = sceneId;
        this.files = files;
    }
    get description() {
        return $t('Add files');
    }
    execute() {
        if (this.dualOutputService.views.dualOutputMode &&
            this.editorCommandsService.state.operationInProgress) {
            return;
        }
        const scene = this.scenesService.views.getScene(this.sceneId);
        if (!this.addNodesSubCommands) {
            const currentItemsSelection = scene.getSelection().selectAll();
            this.files.map(file => scene.addFile(file));
            const addedNodes = currentItemsSelection.getInverted();
            this.addNodesSubCommands = addedNodes
                .filter(node => (node === null || node === void 0 ? void 0 : node.display) === 'horizontal')
                .map((node) => {
                if (node.isItem()) {
                    const source = node.getSource();
                    const verticalNodeId = this.dualOutputService.views.getVerticalNodeId(node.id);
                    return new CreateNewItemCommand(this.sceneId, source.name, source.type, source.getSettings(), {
                        id: node.id,
                        sourceAddOptions: { sourceId: source.sourceId },
                    }, verticalNodeId);
                }
                return new CreateFolderCommand(this.sceneId, node.name);
            });
            this.removeNodesSubCommand = new RemoveNodesCommand(scene.getSelection(addedNodes));
        }
        else {
            this.addNodesSubCommands.forEach(cmd => cmd.execute());
        }
    }
    rollback() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.removeNodesSubCommand.execute();
        });
    }
}
__decorate([
    Inject()
], AddFilesCommand.prototype, "scenesService", void 0);
__decorate([
    Inject()
], AddFilesCommand.prototype, "dualOutputService", void 0);
__decorate([
    Inject()
], AddFilesCommand.prototype, "editorCommandsService", void 0);
//# sourceMappingURL=add-files.js.map