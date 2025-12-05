import { Command } from './command';
import { AddFilterCommand } from './add-filter';
import { $t } from 'services/i18n';
export class PasteFiltersCommand extends Command {
    constructor(sourceId, filterData) {
        super();
        this.sourceId = sourceId;
        this.filterData = filterData;
        this.description = $t('Paste %{filterName}', { filterName: this.filterData[0].name });
    }
    execute() {
        this.addFilterSubcommands = [];
        this.filterData.forEach(filterData => {
            const subcommand = new AddFilterCommand(this.sourceId, filterData.type, filterData.name, filterData.settings);
            this.addFilterSubcommands.push(subcommand);
            subcommand.execute();
        });
    }
    rollback() {
        this.addFilterSubcommands.forEach(subcommand => subcommand.rollback());
    }
}
//# sourceMappingURL=paste-filters.js.map