var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module, EApiPermissions, apiMethod } from './module';
import { Inject } from 'services/core/injector';
var EKeyListenerType;
(function (EKeyListenerType) {
    EKeyListenerType["Up"] = "up";
    EKeyListenerType["Down"] = "down";
})(EKeyListenerType || (EKeyListenerType = {}));
export class HotkeysModule extends Module {
    constructor() {
        super(...arguments);
        this.moduleName = 'Hotkeys';
        this.permissions = [EApiPermissions.Hotkeys];
    }
    registerKey(ctx, reference, callback) {
        return this.keyListenerService.register(Object.assign(Object.assign({}, this.referenceToBinding(reference)), { callback }), this.getNamespace(ctx.app.id));
    }
    unregisterKey(ctx, reference) {
        this.keyListenerService.unregister(this.referenceToBinding(reference), this.getNamespace(ctx.app.id));
    }
    unregisterAll(ctx) {
        this.keyListenerService.unregisterAll(this.getNamespace(ctx.app.id));
    }
    referenceToBinding(ref) {
        return {
            eventType: ref.type === EKeyListenerType.Up ? 'registerKeyup' : 'registerKeydown',
            key: ref.key,
            modifiers: {
                alt: !!ref.modifiers.alt,
                ctrl: !!ref.modifiers.ctrl,
                shift: !!ref.modifiers.shift,
                meta: !!ref.modifiers.meta,
            },
        };
    }
    getNamespace(appId) {
        return `PlatformApp-${appId}`;
    }
}
__decorate([
    Inject()
], HotkeysModule.prototype, "keyListenerService", void 0);
__decorate([
    apiMethod()
], HotkeysModule.prototype, "registerKey", null);
__decorate([
    apiMethod()
], HotkeysModule.prototype, "unregisterKey", null);
__decorate([
    apiMethod()
], HotkeysModule.prototype, "unregisterAll", null);
//# sourceMappingURL=hotkeys.js.map