import { $t } from 'services/i18n';
import { Command } from './command';
export class SetScaleFilterCommand extends Command {
    constructor(selection, filter) {
        super();
        this.selection = selection;
        this.filter = filter;
        this.initialValues = {};
        this.selection.freeze();
        this.selection.getItems().forEach(item => (this.initialValues[item.id] = item.scaleFilter));
    }
    get description() {
        let text = '';
        switch (this.filter) {
            case 0: {
                text = $t("Set scale filter 'Disable'");
                break;
            }
            case 1: {
                text = $t("Set scale filter 'Point'");
                break;
            }
            case 2: {
                text = $t("Set scale filter 'Bicubic'");
                break;
            }
            case 3: {
                text = $t("Set scale filter 'Bilinear'");
                break;
            }
            case 4: {
                text = $t("Set scale filter 'Lanczos'");
                break;
            }
            case 5: {
                text = $t("Set scale filter 'Area'");
                break;
            }
            default: {
                text = $t("Set scale filter 'Disable'");
                break;
            }
        }
        return text;
    }
    execute() {
        this.selection.setScaleFilter(this.filter);
    }
    rollback() {
        this.selection.getItems().forEach(item => item.setScaleFilter(this.initialValues[item.id]));
    }
}
//# sourceMappingURL=set-item-scale-filter.js.map