var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Command } from './command';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
export class RemoveFolderCommand extends Command {
    constructor(sceneId, folderId) {
        super();
        this.sceneId = sceneId;
        this.folderId = folderId;
    }
    get description() {
        return $t('Remove %{folderName}', { folderName: this.name });
    }
    execute() {
        const folder = this.scenesService.views.getScene(this.sceneId).getFolder(this.folderId);
        this.name = folder.name;
        this.childrenIds = folder.childrenIds;
        this.parentId = folder.parentId;
        folder.ungroup();
    }
    rollback() {
        const scene = this.scenesService.views.getScene(this.sceneId);
        const folder = scene.createFolder(this.name, { id: this.folderId });
        scene.getSelection(this.childrenIds).setParent(this.folderId);
        if (this.parentId)
            folder.setParent(this.parentId);
    }
}
__decorate([
    Inject()
], RemoveFolderCommand.prototype, "scenesService", void 0);
//# sourceMappingURL=remove-folder.js.map