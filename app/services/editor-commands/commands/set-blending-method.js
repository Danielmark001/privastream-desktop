import { $t } from 'services/i18n';
import { Command } from './command';
export class SetBlendingMethodCommand extends Command {
    constructor(selection, mode) {
        super();
        this.selection = selection;
        this.mode = mode;
        this.initialValues = {};
        this.selection.freeze();
        this.selection.getItems().forEach(item => (this.initialValues[item.id] = item.blendingMethod));
    }
    get description() {
        let text = '';
        switch (this.mode) {
            case 0: {
                text = $t("Set blending method 'Default'");
                break;
            }
            case 1: {
                text = $t("Set blending method 'SRGB Off'");
                break;
            }
            default: {
                text = $t("Set blending method 'Normal'");
                break;
            }
        }
        return text;
    }
    execute() {
        this.selection.setBlendingMethod(this.mode);
    }
    rollback() {
        this.selection.getItems().forEach(item => item.setBlendingMethod(this.initialValues[item.id]));
    }
}
//# sourceMappingURL=set-blending-method.js.map