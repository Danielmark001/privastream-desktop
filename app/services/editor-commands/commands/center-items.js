import { ModifyTransformCommand } from './modify-transform';
import { $t } from 'services/i18n';
export var ECenteringType;
(function (ECenteringType) {
    ECenteringType["Screen"] = "screen";
    ECenteringType["Horizontal"] = "horizontal";
    ECenteringType["Vertical"] = "vertical";
})(ECenteringType || (ECenteringType = {}));
export class CenterItemsCommand extends ModifyTransformCommand {
    constructor(selection, centeringType) {
        super(selection);
        this.centeringType = centeringType;
    }
    get description() {
        return $t('Center %{sourceName}', { sourceName: this.selection.getNodes()[0].name });
    }
    modifyTransform() {
        switch (this.centeringType) {
            case ECenteringType.Screen:
                this.selection.centerOnScreen();
                break;
            case ECenteringType.Horizontal:
                this.selection.centerOnHorizontal();
                break;
            case ECenteringType.Vertical:
                this.selection.centerOnVertical();
                break;
        }
    }
}
//# sourceMappingURL=center-items.js.map