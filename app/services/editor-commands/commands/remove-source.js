var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Command } from './command';
import { Inject } from 'services/core/injector';
import { $t } from '../../i18n';
export class RemoveSourceCommand extends Command {
    constructor(sourceId) {
        super();
        this.sourceId = sourceId;
    }
    get description() {
        return `${$t('Remove source')} ${this.name}`;
    }
    execute() {
        const source = this.sourcesService.views.getSource(this.sourceId);
        this.name = source.name;
        this.type = source.type;
        this.addSourceOptions = {
            sourceId: source.sourceId,
            channel: source.channel,
        };
        this.sourcesService.removeSource(this.sourceId);
    }
    rollback() {
        this.sourcesService.createSource(this.name, this.type, {}, this.addSourceOptions);
    }
}
__decorate([
    Inject()
], RemoveSourceCommand.prototype, "sourcesService", void 0);
//# sourceMappingURL=remove-source.js.map