var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Inject } from 'services/core/injector';
import { Fallback, Singleton } from 'services/api/external-api';
var EGameOverlayState;
(function (EGameOverlayState) {
    EGameOverlayState["Disabled"] = "disabled";
    EGameOverlayState["Enabled"] = "enabled";
})(EGameOverlayState || (EGameOverlayState = {}));
var EGameOverlayVisibility;
(function (EGameOverlayVisibility) {
    EGameOverlayVisibility["Hidden"] = "hidden";
    EGameOverlayVisibility["Visible"] = "visible";
})(EGameOverlayVisibility || (EGameOverlayVisibility = {}));
let GameOverlayService = class GameOverlayService {
    get overlayStatusChanged() {
        return this.gameOverlayService.overlayStatusChanged;
    }
    get overlayVisibilityChanged() {
        return this.gameOverlayService.overlayVisibilityChanged;
    }
    getModel() {
        const state = this.gameOverlayService.state;
        return {
            isEnabled: state.isEnabled,
            isPreviewEnabled: state.isPreviewEnabled,
            isShowing: state.isShowing,
        };
    }
    enable() {
        this.gameOverlayService.setEnabled(true);
    }
    disable() {
        this.gameOverlayService.setEnabled(false);
    }
    show() {
        this.gameOverlayService.showOverlay();
    }
    hide() {
        this.gameOverlayService.hideOverlay();
    }
};
__decorate([
    Fallback(),
    Inject()
], GameOverlayService.prototype, "gameOverlayService", void 0);
GameOverlayService = __decorate([
    Singleton()
], GameOverlayService);
export { GameOverlayService };
//# sourceMappingURL=game-overlay.js.map