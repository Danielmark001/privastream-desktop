var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { CombinableCommand } from './combinable-command';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
export class EditFilterPropertiesCommand extends CombinableCommand {
    constructor(sourceId, filterName, formData) {
        super();
        this.sourceId = sourceId;
        this.filterName = filterName;
        this.formData = formData;
        this.description = $t('Edit %{filterName}', { filterName: this.filterName });
    }
    execute() {
        this.beforeFormData = this.sourceFiltersService.getPropertiesFormData(this.sourceId, this.filterName);
        this.sourceFiltersService.setPropertiesFormData(this.sourceId, this.filterName, this.afterFormData || this.formData);
        this.afterFormData = this.sourceFiltersService.getPropertiesFormData(this.sourceId, this.filterName);
    }
    rollback() {
        this.sourceFiltersService.setPropertiesFormData(this.sourceId, this.filterName, this.beforeFormData);
    }
    shouldCombine(other) {
        return this.sourceId === other.sourceId && this.filterName === other.filterName;
    }
    combine(other) {
        this.afterFormData = other.afterFormData;
    }
}
__decorate([
    Inject()
], EditFilterPropertiesCommand.prototype, "sourceFiltersService", void 0);
//# sourceMappingURL=edit-filter-properties.js.map