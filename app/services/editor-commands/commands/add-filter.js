var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Command } from './command';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
export class AddFilterCommand extends Command {
    constructor(sourceId, type, name, settings) {
        super();
        this.sourceId = sourceId;
        this.type = type;
        this.name = name;
        this.settings = settings;
    }
    get description() {
        return $t('Add %{filterName}', { filterName: this.name });
    }
    execute() {
        this.sourceFiltersService.add(this.sourceId, this.type, this.name, this.settings);
    }
    rollback() {
        this.sourceFiltersService.remove(this.sourceId, this.name);
    }
}
__decorate([
    Inject()
], AddFilterCommand.prototype, "sourceFiltersService", void 0);
//# sourceMappingURL=add-filter.js.map