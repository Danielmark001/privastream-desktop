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
import { RemoveFolderCommand } from './remove-folder';
import { RemoveItemCommand } from './remove-item';
import { $t } from 'services/i18n';
import { Inject } from 'services/core';
export class RemoveNodesCommand extends Command {
    constructor(selection) {
        super();
        this.selection = selection;
        this.selection.freeze();
        this.selectionName = this.selection.getNodes()[0].name;
    }
    get description() {
        return $t('Remove %{sourceName}', { sourceName: this.selectionName });
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            this.removeFolderSubCommands = [];
            this.removeItemSubCommands = [];
            this.nodeOrder = this.selection.getScene().getNodesIds();
            const hasNodeMap = this.dualOutputService.views.hasSceneNodeMaps;
            this.selection.getFolders().forEach(folder => {
                if (hasNodeMap &&
                    this.dualOutputService.views.getVerticalNodeId(folder.id, this.selection.sceneId)) {
                    this.nodeMapEntries = Object.assign(Object.assign({}, this.nodeMapEntries), { [folder.id]: this.dualOutputService.views.getVerticalNodeId(folder.id, this.selection.sceneId) });
                    this.sceneCollectionsService.removeNodeMapEntry(this.selection.sceneId, folder.id);
                }
                const subCommand = new RemoveFolderCommand(this.selection.sceneId, folder.id);
                subCommand.execute();
                this.removeFolderSubCommands.push(subCommand);
            });
            for (const item of this.selection.getItems()) {
                const verticalNodeId = this.dualOutputService.views.getVerticalNodeId(item.id, this.selection.sceneId);
                if ((item === null || item === void 0 ? void 0 : item.display) === 'horizontal') {
                    const subCommand = new RemoveItemCommand(item.id, verticalNodeId);
                    yield subCommand.execute();
                    this.removeItemSubCommands.push(subCommand);
                }
            }
        });
    }
    rollback() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const itemCommand of [...this.removeItemSubCommands].reverse()) {
                yield itemCommand.rollback();
            }
            [...this.removeFolderSubCommands].reverse().forEach(cmd => cmd.rollback());
            this.selection.getScene().setNodesOrder(this.nodeOrder);
            if (this.nodeMapEntries) {
                const sceneId = this.selection.sceneId;
                Object.keys(this.nodeMapEntries).forEach(horizontalNodeId => {
                    this.sceneCollectionsService.createNodeMapEntry(sceneId, horizontalNodeId, this.nodeMapEntries[horizontalNodeId]);
                });
            }
        });
    }
}
__decorate([
    Inject()
], RemoveNodesCommand.prototype, "dualOutputService", void 0);
__decorate([
    Inject()
], RemoveNodesCommand.prototype, "sceneCollectionsService", void 0);
//# sourceMappingURL=remove-nodes.js.map