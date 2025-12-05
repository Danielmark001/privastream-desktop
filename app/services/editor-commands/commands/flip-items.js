import { ModifyTransformCommand } from './modify-transform';
import { $t } from 'services/i18n';
export var EFlipAxis;
(function (EFlipAxis) {
    EFlipAxis["Horizontal"] = "horizontal";
    EFlipAxis["Vertical"] = "vertical";
})(EFlipAxis || (EFlipAxis = {}));
export class FlipItemsCommand extends ModifyTransformCommand {
    constructor(selection, centeringType) {
        super(selection);
        this.centeringType = centeringType;
    }
    get description() {
        return $t('Flip %{sourceName}', { sourceName: this.selection.getNodes()[0].name });
    }
    modifyTransform() {
        switch (this.centeringType) {
            case EFlipAxis.Vertical:
                this.selection.flipY();
                break;
            case EFlipAxis.Horizontal:
                this.selection.flipX();
                break;
        }
    }
}
//# sourceMappingURL=flip-items.js.map