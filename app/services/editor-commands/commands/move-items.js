import { ModifyTransformCommand } from './modify-transform';
import { $t } from 'services/i18n';
export class MoveItemsCommand extends ModifyTransformCommand {
    constructor(selection, deltaPosition, display) {
        super(selection, display);
        this.deltaPosition = deltaPosition;
        this.display = display;
    }
    get description() {
        return $t('Move %{sourceName}', { sourceName: this.selection.getNodes()[0].name });
    }
    modifyTransform() {
        this.selection.getItems(this.display).forEach(item => {
            item.setTransform({
                position: {
                    x: item.transform.position.x + (this.deltaPosition.x || 0),
                    y: item.transform.position.y + (this.deltaPosition.y || 0),
                },
            });
        });
    }
}
//# sourceMappingURL=move-items.js.map