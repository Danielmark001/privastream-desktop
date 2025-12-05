var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Command } from './command';
import { Inject } from 'services/core';
import { $t } from 'services/i18n';
export class SetDefaultTransitionCommand extends Command {
    constructor(transitionId) {
        super();
        this.transitionId = transitionId;
        this.description = $t('Change default transition');
    }
    execute() {
        this.oldDefaultId = this.transitionsService.getDefaultTransition().id;
        this.transitionsService.setDefaultTransition(this.transitionId);
    }
    rollback() {
        this.transitionsService.setDefaultTransition(this.oldDefaultId);
    }
}
__decorate([
    Inject()
], SetDefaultTransitionCommand.prototype, "transitionsService", void 0);
//# sourceMappingURL=set-default-transition.js.map