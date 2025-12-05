var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Command } from './command';
import { Inject } from 'services/core/injector';
import { ReorderNodesCommand, EPlaceType } from './reorder-nodes';
import { $t } from 'services/i18n';
export class CreateFolderCommand extends Command {
    constructor(sceneId, name, items) {
        super();
        this.sceneId = sceneId;
        this.name = name;
        this.items = items;
        if (this.items)
            this.items.freeze();
    }
    get description() {
        return $t('Create %{folderName}', { folderName: this.name });
    }
    execute() {
        const scene = this.scenesService.views.getScene(this.sceneId);
        const folder = scene.createFolder(this.name, { id: this.folderId, display: 'horizontal' });
        this.folderId = folder.id;
        if (this.dualOutputService.views.hasSceneNodeMaps) {
            const verticalFolder = scene.createFolder(this.name, {
                id: this.verticalFolderId,
                display: 'vertical',
            });
            this.verticalFolderId = verticalFolder.id;
            this.sceneCollectionsService.createNodeMapEntry(this.sceneId, this.folderId, this.verticalFolderId);
        }
        if (this.items) {
            if (this.verticalFolderId) {
                const verticalNodes = [];
                const horizontalNodes = [];
                this.items.getNodes().forEach(node => {
                    if (this.dualOutputService.views.verticalNodeIds.includes(node.id)) {
                        verticalNodes.push(node);
                    }
                    else {
                        horizontalNodes.push(node);
                    }
                });
                const verticalSelection = scene.getSelection(verticalNodes);
                const horizontalSelection = scene.getSelection(horizontalNodes);
                this.moveToFolderSubCommand = new ReorderNodesCommand(horizontalSelection, folder.id, EPlaceType.Inside);
                this.moveToFolderSubCommand.execute();
                this.dualOutputModeToFolderSubCommand = new ReorderNodesCommand(verticalSelection, this.verticalFolderId, EPlaceType.Inside);
                this.dualOutputModeToFolderSubCommand.execute();
            }
            else {
                this.moveToFolderSubCommand = new ReorderNodesCommand(this.items, folder.id, EPlaceType.Inside);
                this.moveToFolderSubCommand.execute();
            }
        }
    }
    rollback() {
        if (this.dualOutputService.views.hasNodeMap(this.sceneId)) {
            if (this.dualOutputModeToFolderSubCommand)
                this.dualOutputModeToFolderSubCommand.rollback();
            this.scenesService.views.getScene(this.sceneId).removeFolder(this.verticalFolderId);
            this.sceneCollectionsService.removeNodeMapEntry(this.folderId, this.sceneId);
        }
        if (this.moveToFolderSubCommand)
            this.moveToFolderSubCommand.rollback();
        this.scenesService.views.getScene(this.sceneId).removeFolder(this.folderId);
    }
}
__decorate([
    Inject()
], CreateFolderCommand.prototype, "scenesService", void 0);
__decorate([
    Inject()
], CreateFolderCommand.prototype, "dualOutputService", void 0);
__decorate([
    Inject()
], CreateFolderCommand.prototype, "sceneCollectionsService", void 0);
//# sourceMappingURL=create-folder.js.map