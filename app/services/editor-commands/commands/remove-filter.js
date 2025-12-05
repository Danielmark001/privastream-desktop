var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Command } from './command';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
export class RemoveFilterCommand extends Command {
    constructor(sourceId, filterName) {
        super();
        this.sourceId = sourceId;
        this.filterName = filterName;
    }
    get description() {
        return $t('Remove %{filterName}', { filterName: this.removedFilter.name });
    }
    execute() {
        this.removedFilter = this.sourceFiltersService
            .getFilters(this.sourceId)
            .find((filter, index) => {
            if (filter.name === this.filterName) {
                this.removedFilterIndex = index;
                return true;
            }
        });
        this.sourceFiltersService.remove(this.sourceId, this.filterName);
    }
    rollback() {
        this.sourceFiltersService.add(this.sourceId, this.removedFilter.type, this.removedFilter.name, this.removedFilter.settings);
        this.sourceFiltersService.setVisibility(this.sourceId, this.removedFilter.name, this.removedFilter.visible);
    }
}
__decorate([
    Inject()
], RemoveFilterCommand.prototype, "sourceFiltersService", void 0);
//# sourceMappingURL=remove-filter.js.map