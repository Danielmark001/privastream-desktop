var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Command } from './command';
import { Inject } from 'services/core';
import { $t } from 'services/i18n';
export class UnhideMixerSourcesCommand extends Command {
    constructor() {
        super();
        this.description = $t('Unhide mixer items');
    }
    execute() {
        this.hiddenSources = this.audioService.views.sourcesForCurrentScene
            .filter(s => s.mixerHidden)
            .map(s => s.sourceId);
        this.audioService.unhideAllSourcesForCurrentScene();
    }
    rollback() {
        this.hiddenSources.forEach(sourceId => {
            this.audioService.views.getSource(sourceId).setHidden(true);
        });
    }
}
__decorate([
    Inject()
], UnhideMixerSourcesCommand.prototype, "audioService", void 0);
//# sourceMappingURL=unhide-mixer-sources.js.map