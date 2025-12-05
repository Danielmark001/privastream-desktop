import { ModifyTransformCommand } from './modify-transform';
import { Selection } from 'services/selection';
import { $t } from 'services/i18n';
export class ResizeItemsCommand extends ModifyTransformCommand {
    constructor(selection, deltaScale, origin, display) {
        super(selection, display);
        this.deltaScale = deltaScale;
        this.origin = origin;
        this.display = display;
    }
    get description() {
        return $t('Resize %{sourceName}', { sourceName: this.selection.getNodes()[0].name });
    }
    modifyTransform() {
        if (this.display) {
            const filteredItems = this.selection.getItems(this.display);
            const filteredSelection = new Selection(this.selection.sceneId, filteredItems);
            filteredSelection.scale(this.deltaScale, this.origin);
        }
        else {
            this.selection.scale(this.deltaScale, this.origin);
        }
    }
}
//# sourceMappingURL=resize-items.js.map