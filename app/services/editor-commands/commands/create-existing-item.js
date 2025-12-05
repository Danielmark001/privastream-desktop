var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Command } from './command';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
export class CreateExistingItemCommand extends Command {
    constructor(sceneId, sourceId) {
        super();
        this.sceneId = sceneId;
        this.sourceId = sourceId;
        this.description = $t('Create %{sourceName}', {
            sourceName: this.sourcesService.views.getSource(this.sourceId).name,
        });
    }
    execute() {
        const item = this.scenesService.views
            .getScene(this.sceneId)
            .addSource(this.sourceId, { id: this.sceneItemId, display: 'horizontal' });
        if (this.dualOutputService.views.hasSceneNodeMaps) {
            if (this.dualOutputVerticalNodeId) {
                Promise.resolve(this.dualOutputService.actions.return.createOrAssignOutputNode(item, 'vertical', false, this.sceneId, this.dualOutputVerticalNodeId));
            }
            else {
                Promise.resolve(this.dualOutputService.actions.return.createOrAssignOutputNode(item, 'vertical', false, this.sceneId)).then(node => (this.dualOutputVerticalNodeId = node.id));
            }
        }
        this.sceneItemId = item.id;
    }
    rollback() {
        this.scenesService.views.getScene(this.sceneId).removeItem(this.sceneItemId);
        if (this.dualOutputVerticalNodeId) {
            this.scenesService.views.getScene(this.sceneId).removeItem(this.dualOutputVerticalNodeId);
            this.sceneCollectionsService.removeNodeMapEntry(this.sceneId, this.sceneItemId);
        }
    }
}
__decorate([
    Inject()
], CreateExistingItemCommand.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], CreateExistingItemCommand.prototype, "scenesService", void 0);
__decorate([
    Inject()
], CreateExistingItemCommand.prototype, "dualOutputService", void 0);
__decorate([
    Inject()
], CreateExistingItemCommand.prototype, "sceneCollectionsService", void 0);
//# sourceMappingURL=create-existing-item.js.map