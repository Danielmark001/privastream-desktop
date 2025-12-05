var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Command } from './command';
import { Inject } from 'services/core';
import cloneDeep from 'lodash/cloneDeep';
import { $t } from 'services/i18n';
export class EditTransitionCommand extends Command {
    constructor(transitionId, changes) {
        super();
        this.transitionId = transitionId;
        this.changes = changes;
        if (changes.formData != null)
            changes.formData = cloneDeep(changes.formData);
        this.description = $t('Edit %{transitionName}', {
            transitionName: this.transitionsService.getTransition(this.transitionId).name,
        });
    }
    execute() {
        const transition = this.transitionsService.getTransition(this.transitionId);
        if (this.changes.name != null) {
            this.beforeName = transition.name;
            this.transitionsService.renameTransition(this.transitionId, this.changes.name);
        }
        if (this.changes.duration != null) {
            this.beforeDuration = transition.duration;
            this.transitionsService.setDuration(this.transitionId, this.changes.duration);
        }
        if (this.changes.type != null) {
            this.beforeType = transition.type;
            this.transitionsService.changeTransitionType(this.transitionId, this.changes.type);
        }
        if (this.changes.formData != null) {
            this.beforeFormData = this.transitionsService.getPropertiesFormData(this.transitionId);
            this.transitionsService.setPropertiesFormData(this.transitionId, this.changes.formData);
        }
    }
    rollback() {
        if (this.changes.name != null) {
            this.transitionsService.renameTransition(this.transitionId, this.beforeName);
        }
        if (this.changes.duration != null) {
            this.transitionsService.setDuration(this.transitionId, this.beforeDuration);
        }
        if (this.changes.type != null) {
            this.transitionsService.changeTransitionType(this.transitionId, this.beforeType);
        }
        if (this.changes.formData != null) {
            this.transitionsService.setPropertiesFormData(this.transitionId, this.beforeFormData);
        }
    }
}
__decorate([
    Inject()
], EditTransitionCommand.prototype, "transitionsService", void 0);
//# sourceMappingURL=edit-transition.js.map