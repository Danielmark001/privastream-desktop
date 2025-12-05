var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Command } from './command';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
export class CreateTransitionCommand extends Command {
    constructor(type, name) {
        super();
        this.type = type;
        this.name = name;
        this.description = $t('Create %{transitionName}', { transitionName: name });
    }
    execute() {
        const transition = this.transitionsService.createTransition(this.type, this.name, {
            id: this.transitionId,
        });
        this.transitionId = transition.id;
        return transition;
    }
    rollback() {
        this.transitionsService.deleteTransition(this.transitionId);
    }
}
__decorate([
    Inject()
], CreateTransitionCommand.prototype, "transitionsService", void 0);
//# sourceMappingURL=create-transition.js.map