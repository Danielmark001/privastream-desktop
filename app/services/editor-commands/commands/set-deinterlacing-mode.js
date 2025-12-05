import { $t } from 'services/i18n';
import { Command } from './command';
export class SetDeinterlacingModeCommand extends Command {
    constructor(selection, mode) {
        super();
        this.selection = selection;
        this.mode = mode;
        this.initialValues = {};
        this.selection.freeze();
        this.selection
            .getItems()
            .forEach(item => (this.initialValues[item.id] = item.source.deinterlaceMode));
    }
    get description() {
        let text = '';
        switch (this.mode) {
            case 0: {
                text = $t("Set deinterlacing 'Disable'");
                break;
            }
            case 1: {
                text = $t("Set deinterlacing 'Discard'");
                break;
            }
            case 2: {
                text = $t("Set deinterlacing 'Retro'");
                break;
            }
            case 3: {
                text = $t("Set deinterlacing 'Blend'");
                break;
            }
            case 4: {
                text = $t("Set deinterlacing 'Blend 2x'");
                break;
            }
            case 5: {
                text = $t("Set deinterlacing 'Linear'");
                break;
            }
            case 6: {
                text = $t("Set deinterlacing 'Linear 2x'");
                break;
            }
            case 7: {
                text = $t("Set deinterlacing 'Yadif'");
                break;
            }
            case 8: {
                text = $t("Set deinterlacing 'Yadif 2x'");
                break;
            }
            default: {
                text = $t("Set deinterlacing 'Normal'");
                break;
            }
        }
        return text;
    }
    execute() {
        this.selection.setDeinterlaceMode(this.mode);
    }
    rollback() {
        this.selection
            .getItems()
            .forEach(item => item.source.setDeinterlaceMode(this.initialValues[item.id]));
    }
}
//# sourceMappingURL=set-deinterlacing-mode.js.map