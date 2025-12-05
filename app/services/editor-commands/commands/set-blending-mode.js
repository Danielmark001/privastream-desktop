import { $t } from 'services/i18n';
import { Command } from './command';
export class SetBlendingModeCommand extends Command {
    constructor(selection, mode) {
        super();
        this.selection = selection;
        this.mode = mode;
        this.initialValues = {};
        this.selection.freeze();
        this.selection.getItems().forEach(item => (this.initialValues[item.id] = item.blendingMode));
    }
    get description() {
        let text = '';
        switch (this.mode) {
            case 0: {
                text = $t("Set blending mode 'Normal'");
                break;
            }
            case 1: {
                text = $t("Set blending mode 'Additive'");
                break;
            }
            case 2: {
                text = $t("Set blending mode 'Subtract'");
                break;
            }
            case 3: {
                text = $t("Set blending mode 'Screen'");
                break;
            }
            case 4: {
                text = $t("Set blending mode 'Multiply'");
                break;
            }
            case 5: {
                text = $t("Set blending mode 'Lighten'");
                break;
            }
            case 6: {
                text = $t("Set blending mode 'Darken'");
                break;
            }
            default: {
                text = $t("Set blending mode 'Normal'");
                break;
            }
        }
        return text;
    }
    execute() {
        this.selection.setBlendingMode(this.mode);
    }
    rollback() {
        this.selection.getItems().forEach(item => item.setBlendingMode(this.initialValues[item.id]));
    }
}
//# sourceMappingURL=set-blending-mode.js.map