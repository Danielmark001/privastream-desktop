var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { CombinableCommand } from './combinable-command';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
export class EditSourcePropertiesCommand extends CombinableCommand {
    constructor(sourceId, formData) {
        super();
        this.sourceId = sourceId;
        this.formData = formData;
        this.description = $t('Edit %{sourceName}', {
            sourceName: this.sourcesService.views.getSource(this.sourceId).name,
        });
    }
    execute() {
        const source = this.sourcesService.views.getSource(this.sourceId);
        this.beforeFormData = source.getPropertiesFormData();
        source.setPropertiesFormData(this.afterFormData || this.formData);
        this.afterFormData = source.getPropertiesFormData();
    }
    rollback() {
        this.sourcesService.views.getSource(this.sourceId).setPropertiesFormData(this.beforeFormData);
    }
    shouldCombine(other) {
        return this.sourceId === other.sourceId;
    }
    combine(other) {
        this.afterFormData = other.afterFormData;
    }
}
__decorate([
    Inject()
], EditSourcePropertiesCommand.prototype, "sourcesService", void 0);
//# sourceMappingURL=edit-source-properties.js.map