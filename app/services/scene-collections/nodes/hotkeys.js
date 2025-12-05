var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ArrayNode } from './array-node';
import { Inject } from '../../core/injector';
export class HotkeysNode extends ArrayNode {
    constructor() {
        super(...arguments);
        this.schemaVersion = 2;
    }
    getItems(context = {}) {
        let items = [];
        if (context.sceneId) {
            items = this.hotkeysService.getSceneHotkeys(context.sceneId);
        }
        else if (context.sceneItemId) {
            items = this.hotkeysService.getSceneItemHotkeys(context.sceneItemId);
        }
        else if (context.sourceId) {
            items = this.hotkeysService.getSourceHotkeys(context.sourceId);
        }
        else {
            items = [
                ...this.hotkeysService.getGeneralHotkeys(),
                ...this.hotkeysService.getMarkerHotkeys(),
            ];
        }
        return items.filter(hotkey => hotkey.bindings.length);
    }
    saveItem(hotkey, context) {
        const hotkeyObj = hotkey.getModel();
        Object.keys(context).forEach(key => delete hotkeyObj[key]);
        return Promise.resolve(hotkeyObj);
    }
    loadItem(obj, context) {
        this.hotkeysService.addHotkey(Object.assign(Object.assign({}, obj), context));
        return Promise.resolve();
    }
    migrate(version) {
        if (version === 1)
            this.data = { items: [] };
    }
}
__decorate([
    Inject()
], HotkeysNode.prototype, "hotkeysService", void 0);
//# sourceMappingURL=hotkeys.js.map