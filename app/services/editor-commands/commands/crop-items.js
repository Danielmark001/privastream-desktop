import { ModifyTransformCommand } from './modify-transform';
import { $t } from 'services/i18n';
export class CropItemsCommand extends ModifyTransformCommand {
    constructor(selection, crop, position, display) {
        super(selection, display);
        this.crop = crop;
        this.position = position;
        this.display = display;
    }
    get description() {
        return $t('Crop %{sourceName}', { sourceName: this.selection.getNodes()[0].name });
    }
    modifyTransform() {
        this.selection.getItems(this.display).forEach(item => {
            item.setTransform({
                position: this.position,
                crop: this.crop,
            });
        });
    }
}
//# sourceMappingURL=crop-items.js.map