var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { CombinableCommand } from './combinable-command';
import { Inject } from 'services/core';
import { $t } from 'services/i18n';
export class SetAudioSettingsCommand extends CombinableCommand {
    constructor(sourceId, changes) {
        super();
        this.sourceId = sourceId;
        this.changes = changes;
        this.description = $t('Edit %{sourceName}', {
            sourceName: this.audioService.views.getSource(this.sourceId).name,
        });
    }
    execute() {
        this.beforeChanges = this.getAudioSettings();
        this.audioService.setSettings(this.sourceId, this.afterChanges || this.changes);
        this.afterChanges = this.getAudioSettings();
    }
    rollback() {
        this.audioService.setSettings(this.sourceId, this.beforeChanges);
    }
    shouldCombine(other) {
        return this.sourceId === other.sourceId;
    }
    combine(other) {
        this.afterChanges = other.afterChanges;
    }
    getAudioSettings() {
        const source = this.audioService.views.getSource(this.sourceId);
        return {
            forceMono: source.forceMono,
            syncOffset: source.syncOffset,
            monitoringType: source.monitoringType,
            audioMixers: source.audioMixers,
        };
    }
}
__decorate([
    Inject()
], SetAudioSettingsCommand.prototype, "audioService", void 0);
//# sourceMappingURL=set-audio-settings.js.map