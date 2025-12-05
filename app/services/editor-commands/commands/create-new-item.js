var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Command } from './command';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
export class CreateNewItemCommand extends Command {
    constructor(sceneId, name, type, settings, options = {}, verticalNodeId) {
        super();
        this.sceneId = sceneId;
        this.name = name;
        this.type = type;
        this.settings = settings;
        this.options = options;
        this.verticalNodeId = verticalNodeId;
        this.description = $t('Create %{sourceName}', { sourceName: name });
        this.dualOutputVerticalNodeId = this.verticalNodeId;
    }
    execute() {
        this.options.id = this.options.id || this.sceneItemId;
        this.options.sourceAddOptions.sourceId =
            this.options.sourceAddOptions.sourceId || this.sourceId;
        this.options.display = 'horizontal';
        const item = this.scenesService.views
            .getScene(this.sceneId)
            .createAndAddSource(this.name, this.type, this.settings, this.options);
        if (this.dualOutputService.views.hasSceneNodeMaps) {
            if (this.dualOutputVerticalNodeId) {
                Promise.resolve(this.dualOutputService.actions.return.createOrAssignOutputNode(item, 'vertical', false, this.sceneId, this.dualOutputVerticalNodeId));
            }
            else {
                Promise.resolve(this.dualOutputService.actions.return.createOrAssignOutputNode(item, 'vertical', false, this.sceneId)).then(node => {
                    this.dualOutputVerticalNodeId = node.id;
                });
            }
        }
        this.sourceId = item.sourceId;
        this.sceneItemId = item.id;
        return item;
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
], CreateNewItemCommand.prototype, "scenesService", void 0);
__decorate([
    Inject()
], CreateNewItemCommand.prototype, "dualOutputService", void 0);
__decorate([
    Inject()
], CreateNewItemCommand.prototype, "sceneCollectionsService", void 0);
//# sourceMappingURL=create-new-item.js.map