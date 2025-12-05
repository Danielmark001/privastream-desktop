import { Command } from './command';
import { $t } from 'services/i18n';
export var EPlaceType;
(function (EPlaceType) {
    EPlaceType["After"] = "after";
    EPlaceType["Before"] = "before";
    EPlaceType["Inside"] = "inside";
})(EPlaceType || (EPlaceType = {}));
export class ReorderNodesCommand extends Command {
    constructor(selection, destinationId, placeType) {
        super();
        this.selection = selection;
        this.destinationId = destinationId;
        this.placeType = placeType;
        this.initialParentMap = {};
        this.selection.freeze();
        this.initialNodeOrder = this.selection.getScene().getNodesIds();
        this.selection.getNodes().forEach(node => {
            this.initialParentMap[node.id] = node.parentId;
        });
    }
    get description() {
        return $t('Reorder %{sourceName}', { sourceName: this.selection.getNodes()[0].name });
    }
    execute() {
        switch (this.placeType) {
            case EPlaceType.After:
                this.selection.placeAfter(this.destinationId);
                break;
            case EPlaceType.Before:
                this.selection.placeBefore(this.destinationId);
                break;
            case EPlaceType.Inside:
                this.selection.setParent(this.destinationId);
                break;
        }
    }
    rollback() {
        const nodes = this.selection.getNodes();
        if (nodes.length > 0) {
            this.selection.getNodes().forEach(node => {
                node.setParent(this.initialParentMap[node.id]);
            });
            this.selection.getScene().setNodesOrder(this.initialNodeOrder);
        }
    }
}
//# sourceMappingURL=reorder-nodes.js.map