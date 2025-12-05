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
export class EditConnectionCommand extends Command {
    constructor(connectionId, changes) {
        super();
        this.connectionId = connectionId;
        this.changes = changes;
        this.description = $t('Edit a connection');
    }
    execute() {
        this.beforeConnection = cloneDeep(this.transitionsService.views.getConnection(this.connectionId));
        this.transitionsService.updateConnection(this.connectionId, this.changes);
    }
    rollback() {
        this.transitionsService.updateConnection(this.connectionId, this.beforeConnection);
    }
}
__decorate([
    Inject()
], EditConnectionCommand.prototype, "transitionsService", void 0);
//# sourceMappingURL=edit-connection.js.map