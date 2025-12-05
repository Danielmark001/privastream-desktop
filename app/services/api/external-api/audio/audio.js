var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Fallback, Singleton } from 'services/api/external-api';
import { AudioSource } from './audio-source';
import { Inject } from 'services';
let AudioService = class AudioService {
    getSource(sourceId) {
        const source = this.audioService.views.getSource(sourceId);
        return source ? new AudioSource(sourceId) : null;
    }
    getSources() {
        return this.audioService.views.getSources().map(source => this.getSource(source.sourceId));
    }
    getSourcesForCurrentScene() {
        return this.audioService.views.sourcesForCurrentScene.map(source => this.getSource(source.sourceId));
    }
    getSourcesForScene(sceneId) {
        return this.audioService.views
            .getSourcesForScene(sceneId)
            .map(source => this.getSource(source.sourceId));
    }
};
__decorate([
    Fallback(),
    Inject()
], AudioService.prototype, "audioService", void 0);
AudioService = __decorate([
    Singleton()
], AudioService);
export { AudioService };
//# sourceMappingURL=audio.js.map