var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { CombinableCommand } from './combinable-command';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
export class EditSourceSettingsCommand extends CombinableCommand {
    constructor(sourceId, settings) {
        super();
        this.sourceId = sourceId;
        this.settings = settings;
        this.description = $t('Edit %{sourceName}', {
            sourceName: this.sourcesService.views.getSource(this.sourceId).name,
        });
    }
    execute() {
        var _a;
        const source = this.sourcesService.views.getSource(this.sourceId);
        this.beforeSettings = source.getSettings();
        source.updateSettings((_a = this.afterSettings) !== null && _a !== void 0 ? _a : this.settings);
        this.afterSettings = source.getSettings();
    }
    rollback() {
        this.sourcesService.views.getSource(this.sourceId).updateSettings(this.beforeSettings);
    }
    shouldCombine(other) {
        return this.sourceId === other.sourceId;
    }
    combine(other) {
        this.afterSettings = other.afterSettings;
    }
}
__decorate([
    Inject()
], EditSourceSettingsCommand.prototype, "sourcesService", void 0);
//# sourceMappingURL=edit-source-settings.js.map