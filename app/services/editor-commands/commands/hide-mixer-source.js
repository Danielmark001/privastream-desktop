var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Command } from './command';
import { Inject } from 'services/core';
import { $t } from 'services/i18n';
export class HideMixerSourceCommand extends Command {
    constructor(sourceId) {
        super();
        this.sourceId = sourceId;
        this.description = $t('Hide %{sourceName}', {
            sourceName: this.audioService.views.getSource(this.sourceId).name,
        });
    }
    execute() {
        this.audioService.views.getSource(this.sourceId).setHidden(true);
    }
    rollback() {
        this.audioService.views.getSource(this.sourceId).setHidden(false);
    }
}
__decorate([
    Inject()
], HideMixerSourceCommand.prototype, "audioService", void 0);
//# sourceMappingURL=hide-mixer-source.js.map