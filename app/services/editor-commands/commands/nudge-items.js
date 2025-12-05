import { ModifyTransformCommand } from './modify-transform';
import { $t } from 'services/i18n';
export var ENudgeDirection;
(function (ENudgeDirection) {
    ENudgeDirection["Up"] = "up";
    ENudgeDirection["Down"] = "down";
    ENudgeDirection["Right"] = "right";
    ENudgeDirection["Left"] = "left";
})(ENudgeDirection || (ENudgeDirection = {}));
export class NudgeItemsCommand extends ModifyTransformCommand {
    constructor(selection, direction) {
        super(selection);
        this.direction = direction;
    }
    get description() {
        return $t('Nudge %{sourceName}', { sourceName: this.selection.getNodes()[0].name });
    }
    modifyTransform() {
        switch (this.direction) {
            case ENudgeDirection.Up:
                this.selection.nudgeUp();
                break;
            case ENudgeDirection.Down:
                this.selection.nudgeDown();
                break;
            case ENudgeDirection.Right:
                this.selection.nudgeRight();
                break;
            case ENudgeDirection.Left:
                this.selection.nudgeLeft();
                break;
        }
    }
}
//# sourceMappingURL=nudge-items.js.map