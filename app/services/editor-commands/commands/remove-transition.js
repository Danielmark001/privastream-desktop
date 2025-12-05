var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Command } from './command';
import { Inject } from 'services/core';
import { $t } from 'services/i18n';
export class RemoveTransitionCommand extends Command {
    constructor(transitionId) {
        super();
        this.transitionId = transitionId;
    }
    get description() {
        return $t('Remove %{transitionName}', { transitionName: this.name });
    }
    execute() {
        const transition = this.transitionsService.getTransition(this.transitionId);
        this.type = transition.type;
        this.name = transition.name;
        this.settings = this.transitionsService.getSettings(this.transitionId);
        this.propertiesManagerSettings = this.transitionsService.getPropertiesManagerSettings(this.transitionId);
        this.transitionsService.deleteTransition(this.transitionId);
    }
    rollback() {
        this.transitionsService.createTransition(this.type, this.name, {
            id: this.transitionId,
            settings: this.settings,
            propertiesManagerSettings: this.propertiesManagerSettings,
        });
    }
}
__decorate([
    Inject()
], RemoveTransitionCommand.prototype, "transitionsService", void 0);
//# sourceMappingURL=remove-transition.js.map