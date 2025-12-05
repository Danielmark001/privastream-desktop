var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { CombinableCommand } from './combinable-command';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
export class SetDeflectionCommand extends CombinableCommand {
    constructor(sourceId, deflection) {
        super();
        this.sourceId = sourceId;
        this.deflection = deflection;
        const source = this.audioService.views.getSource(this.sourceId);
        this.description = $t('Adjust %{sourceName} volume', { sourceName: source.name });
        this.initialValue = source.fader.deflection;
    }
    execute() {
        const source = this.audioService.views.getSource(this.sourceId);
        const deflection = this.endValue || this.deflection;
        source.setDeflection(deflection);
        this.endValue = deflection;
    }
    rollback() {
        const source = this.audioService.views.getSource(this.sourceId);
        source.setDeflection(this.initialValue);
    }
    shouldCombine(other) {
        return this.sourceId === other.sourceId;
    }
    combine(other) {
        this.endValue = other.endValue;
    }
}
__decorate([
    Inject()
], SetDeflectionCommand.prototype, "audioService", void 0);
//# sourceMappingURL=set-deflection.js.map