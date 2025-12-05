import { Command } from './command';
import { $t } from 'services/i18n';
export class HideItemsCommand extends Command {
    constructor(selection, hidden) {
        super();
        this.selection = selection;
        this.hidden = hidden;
        this.initialValues = {};
        this.selection.freeze();
        const action = hidden ? 'Hide %{sourceName}' : 'Show %{sourceName}';
        this.description = $t(action, { sourceName: this.selection.getNodes()[0].name });
        this.selection.getItems().forEach(item => (this.initialValues[item.id] = item.visible));
    }
    execute() {
        this.selection.setVisibility(!this.hidden);
    }
    rollback() {
        this.selection.getItems().forEach(item => item.setVisibility(this.initialValues[item.id]));
    }
}
//# sourceMappingURL=hide-items.js.map