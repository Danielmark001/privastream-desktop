var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Menu } from './Menu';
import { Inject } from '../../services/core/injector';
import { $t } from 'services/i18n';
export class GroupMenu extends Menu {
    constructor() {
        super();
        this.appendMenuItems();
    }
    appendMenuItems() {
        const selectionSize = this.selectionService.views.globalSelection.getSize();
        const selectedItem = this.selectionService.views.globalSelection.getItems()[0];
        const selectedNodes = this.selectionService.views.globalSelection.getNodes();
        const nodesFolders = selectedNodes.map(node => node.parentId || null);
        this.append({
            label: $t('Group into Folder'),
            click: () => {
                this.scenesService.showNameFolder({
                    sceneId: this.scenesService.views.activeSceneId,
                    itemsToGroup: this.selectionService.views.globalSelection.getIds(),
                    parentId: nodesFolders[0],
                });
            },
            enabled: this.selectionService.views.globalSelection.canGroupIntoFolder(),
        });
        this.append({
            label: $t('Ungroup Folder'),
            click: () => {
                this.editorCommandsService.executeCommand('RemoveFolderCommand', this.scenesService.views.activeSceneId, this.selectionService.views.globalSelection.getFolders()[0].id);
            },
            enabled: this.selectionService.views.globalSelection.isSceneFolder(),
        });
        this.append({
            label: $t('Group into Scene'),
            click: () => {
                this.scenesService.showNameScene({
                    itemsToGroup: this.selectionService.views.globalSelection.getIds(),
                });
            },
            enabled: selectionSize > 1,
        });
        this.append({
            label: $t('Ungroup Scene'),
            click: () => {
                this.editorCommandsService.executeCommand('UngroupSceneCommand', selectedItem.id, this.scenesService.views.activeSceneId);
            },
            enabled: (() => {
                return !!(selectionSize === 1 && selectedItem && selectedItem.getSource().type === 'scene');
            })(),
        });
    }
}
__decorate([
    Inject()
], GroupMenu.prototype, "scenesService", void 0);
__decorate([
    Inject()
], GroupMenu.prototype, "selectionService", void 0);
__decorate([
    Inject()
], GroupMenu.prototype, "editorCommandsService", void 0);
//# sourceMappingURL=GroupMenu.js.map