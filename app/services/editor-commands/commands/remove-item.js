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
import { SourcesNode } from 'services/scene-collections/nodes/sources';
import { ReorderNodesCommand, EPlaceType } from './reorder-nodes';
import { $t } from 'services/i18n';
class SourceReviver extends SourcesNode {
    constructor(source) {
        super();
        this.source = source;
    }
    getItems() {
        return [this.source];
    }
}
export class RemoveItemCommand extends Command {
    constructor(sceneItemId, verticalNodeId) {
        super();
        this.sceneItemId = sceneItemId;
        this.verticalNodeId = verticalNodeId;
        this.dualOutputVerticalNodeId = verticalNodeId;
    }
    get description() {
        return $t('Remove %{sourceName}', {
            sourceName: this.scenesService.views.getSceneItem(this.sceneItemId).name,
        });
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const item = this.scenesService.views.getSceneItem(this.sceneItemId);
            const scene = this.scenesService.views.getScene(item.sceneId);
            this.sceneId = item.sceneId;
            this.sourceId = item.sourceId;
            this.settings = item.getSettings();
            this.reorderNodesSubcommand = new ReorderNodesCommand(scene.getSelection(this.sceneItemId), void 0, EPlaceType.After);
            this.reorderNodesSubcommand.execute();
            if (this.dualOutputService.views.hasSceneNodeMaps || this.dualOutputVerticalNodeId) {
                const verticalNodeId = (_a = this.dualOutputVerticalNodeId) !== null && _a !== void 0 ? _a : this.dualOutputService.views.getVerticalNodeId(this.sceneItemId);
                this.sceneCollectionsService.removeNodeMapEntry(this.sceneId, item.id);
                if (verticalNodeId && this.scenesService.views.getSceneItem(this.verticalNodeId)) {
                    const verticalItem = this.scenesService.views.getSceneItem(this.verticalNodeId);
                    this.verticalReorderNodesSubcommand = new ReorderNodesCommand(scene.getSelection(this.verticalNodeId), void 0, EPlaceType.After);
                    this.verticalReorderNodesSubcommand.execute();
                    verticalItem.remove();
                }
            }
            if (this.scenesService.getSourceItemCount(item.sourceId) === 1 &&
                item.source.type !== 'scene') {
                this.sourceReviver = new SourceReviver(item.source);
                yield this.sourceReviver.save({});
            }
            item.remove();
        });
    }
    rollback() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (this.sourceReviver) {
                yield this.sourceReviver.load({});
            }
            const scene = this.scenesService.views.getScene(this.sceneId);
            const horizontalItem = scene.addSource(this.sourceId, {
                id: this.sceneItemId,
                select: false,
                display: (_a = this.settings) === null || _a === void 0 ? void 0 : _a.display,
            });
            if (this.dualOutputVerticalNodeId) {
                Promise.resolve(this.dualOutputService.actions.return.createOrAssignOutputNode(horizontalItem, 'vertical', false, this.sceneId, this.dualOutputVerticalNodeId));
                if (this.verticalReorderNodesSubcommand) {
                    this.verticalReorderNodesSubcommand.rollback();
                }
            }
            this.reorderNodesSubcommand.rollback();
        });
    }
}
__decorate([
    Inject()
], RemoveItemCommand.prototype, "scenesService", void 0);
__decorate([
    Inject()
], RemoveItemCommand.prototype, "dualOutputService", void 0);
__decorate([
    Inject()
], RemoveItemCommand.prototype, "sceneCollectionsService", void 0);
//# sourceMappingURL=remove-item.js.map