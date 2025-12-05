var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Command } from './command';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
export class RenameFolderCommand extends Command {
    constructor(sceneId, folderId, name) {
        super();
        this.sceneId = sceneId;
        this.folderId = folderId;
        this.name = name;
    }
    get description() {
        return $t('Rename %{folderName}', { folderName: this.oldName });
    }
    execute() {
        const folder = this.scenesService.views.getScene(this.sceneId).getFolder(this.folderId);
        this.oldName = folder.name;
        folder.setName(this.name);
    }
    rollback() {
        this.scenesService.views.getScene(this.sceneId).getFolder(this.folderId).setName(this.oldName);
    }
}
__decorate([
    Inject()
], RenameFolderCommand.prototype, "scenesService", void 0);
//# sourceMappingURL=rename-folder.js.map