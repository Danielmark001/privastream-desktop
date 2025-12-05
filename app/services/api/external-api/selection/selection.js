var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Fallback, Singleton } from 'services/api/external-api';
import { Selection } from 'services/api/external-api/scenes/selection';
import { Inject } from 'services';
let SelectionService = class SelectionService extends Selection {
    get sceneId() {
        return this.selection.sceneId;
    }
    get selection() {
        return this.internalSelectionService.views.globalSelection;
    }
};
__decorate([
    Fallback(),
    Inject('SelectionService')
], SelectionService.prototype, "internalSelectionService", void 0);
SelectionService = __decorate([
    Singleton()
], SelectionService);
export { SelectionService };
//# sourceMappingURL=selection.js.map