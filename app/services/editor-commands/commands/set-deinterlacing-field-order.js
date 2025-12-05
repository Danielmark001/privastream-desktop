import { $t } from 'services/i18n';
import { Command } from './command';
export class SetDeinterlacingFieldOrderCommand extends Command {
    constructor(selection, order) {
        super();
        this.selection = selection;
        this.order = order;
        this.initialValues = {};
        this.selection.freeze();
        this.selection
            .getItems()
            .forEach(item => (this.initialValues[item.id] = item.source.deinterlaceFieldOrder));
    }
    get description() {
        let text = '';
        switch (this.order) {
            case 0: {
                text = $t("Set deinterlacing 'Top Field First'");
                break;
            }
            case 1: {
                text = $t("Set deinterlacing 'Bottom Field First'");
                break;
            }
            default: {
                text = $t("Set deinterlacing 'Top Field First'");
                break;
            }
        }
        return text;
    }
    execute() {
        this.selection.setDeinterlaceFieldOrder(this.order);
    }
    rollback() {
        this.selection
            .getItems()
            .forEach(item => item.source.setDeinterlaceFieldOrder(this.initialValues[item.id]));
    }
}
//# sourceMappingURL=set-deinterlacing-field-order.js.map