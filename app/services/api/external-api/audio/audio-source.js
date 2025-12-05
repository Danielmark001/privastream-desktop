var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ServiceHelper, Inject } from 'services';
import { Fallback } from 'services/api/external-api';
let AudioSource = class AudioSource {
    constructor(sourceId) {
        this.sourceId = sourceId;
        this.audioSource = this.audioService.views.getSource(sourceId);
    }
    isDestroyed() {
        return this.audioSource.isDestroyed();
    }
    getModel() {
        const sourceModel = this.sourcesService.views.getSource(this.sourceId).getModel();
        return {
            name: sourceModel.name,
            sourceId: this.audioSource.sourceId,
            fader: this.audioSource.fader,
            audioMixers: this.audioSource.audioMixers,
            monitoringType: this.audioSource.monitoringType,
            forceMono: this.audioSource.forceMono,
            syncOffset: this.audioSource.syncOffset,
            muted: this.audioSource.muted,
            mixerHidden: this.audioSource.mixerHidden,
        };
    }
    setDeflection(deflection) {
        this.audioSource.setDeflection(deflection);
    }
    setMuted(muted) {
        this.audioSource.setMuted(muted);
    }
};
__decorate([
    Inject()
], AudioSource.prototype, "audioService", void 0);
__decorate([
    Inject()
], AudioSource.prototype, "sourcesService", void 0);
__decorate([
    Fallback()
], AudioSource.prototype, "audioSource", void 0);
AudioSource = __decorate([
    ServiceHelper('AudioService')
], AudioSource);
export { AudioSource };
//# sourceMappingURL=audio-source.js.map