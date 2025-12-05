var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Command } from './command';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
export class MuteSourceCommand extends Command {
    constructor(sourceId, muted) {
        super();
        this.sourceId = sourceId;
        this.muted = muted;
        const action = muted ? 'Mute %{sourceName}' : 'Unmute %{sourceName}';
        this.description = $t(action, {
            sourceName: this.audioService.views.getSource(this.sourceId).name,
        });
    }
    execute() {
        const source = this.audioService.views.getSource(this.sourceId);
        this.oldValue = source.muted;
        source.setMuted(this.muted);
    }
    rollback() {
        const source = this.audioService.views.getSource(this.sourceId);
        source.setMuted(this.oldValue);
    }
}
__decorate([
    Inject()
], MuteSourceCommand.prototype, "audioService", void 0);
//# sourceMappingURL=mute-source.js.map