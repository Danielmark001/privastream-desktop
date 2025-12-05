import { ModifyTransformCommand } from './modify-transform';
import { $t } from 'services/i18n';
export class RotateItemsCommand extends ModifyTransformCommand {
    constructor(selection, degrees) {
        super(selection);
        this.degrees = degrees;
    }
    get description() {
        return $t('Rotate %{sourceName}', { sourceName: this.selection.getNodes()[0].name });
    }
    modifyTransform() {
        this.selection.rotate(this.degrees);
    }
}
//# sourceMappingURL=rotate-items.js.map