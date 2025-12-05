var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Command } from './command';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
export class RenameSourceCommand extends Command {
    constructor(sourceId, name) {
        super();
        this.sourceId = sourceId;
        this.name = name;
    }
    get description() {
        return $t('Rename %{sourceName}', { sourceName: this.oldName });
    }
    execute() {
        const source = this.sourcesService.views.getSource(this.sourceId);
        this.oldName = source.name;
        source.setName(this.name);
    }
    rollback() {
        this.sourcesService.views.getSource(this.sourceId).setName(this.oldName);
    }
}
__decorate([
    Inject()
], RenameSourceCommand.prototype, "sourcesService", void 0);
//# sourceMappingURL=rename-source.js.map