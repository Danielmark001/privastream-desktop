var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ShortcutsService_1;
import { Service } from './core/service';
import Utils from './utils';
import { Inject } from './core/injector';
import { InitAfter } from './core';
import { OS, getOS } from 'util/operating-systems';
export function shortcut(key) {
    return function (target, methodName, descriptor) {
        const shortcutsService = ShortcutsService.instance;
        shortcutsService.registerShortcut(key, () => target.constructor.instance[methodName]());
    };
}
let ShortcutsService = ShortcutsService_1 = class ShortcutsService extends Service {
    constructor() {
        super(...arguments);
        this.shortcuts = new Map();
    }
    init() {
        if (getOS() === OS.Mac)
            return;
        document.addEventListener('keydown', e => {
            if (e.target.tagName === 'WEBVIEW')
                return;
            if (this.navigationService.state.currentPage !== 'Studio')
                return;
            if (this.appService.state.loading)
                return;
            const shortcutName = ShortcutsService_1.getShortcutName(e);
            const handler = this.shortcuts.get(shortcutName);
            if (handler)
                handler();
        });
    }
    registerShortcut(key, handler) {
        if (Utils.isChildWindow())
            return;
        this.shortcuts.set(key.split(' ').join('').toUpperCase(), handler);
    }
    static getShortcutName(event) {
        const keys = [];
        if (event.ctrlKey)
            keys.push('Ctrl');
        if (event.shiftKey)
            keys.push('Shift');
        if (event.altKey)
            keys.push('Alt');
        const keyCode = event.code.replace('Key', '');
        keys.push(keyCode);
        return keys.join('+').toUpperCase();
    }
};
__decorate([
    Inject()
], ShortcutsService.prototype, "appService", void 0);
__decorate([
    Inject()
], ShortcutsService.prototype, "navigationService", void 0);
ShortcutsService = ShortcutsService_1 = __decorate([
    InitAfter('AppService')
], ShortcutsService);
export { ShortcutsService };
//# sourceMappingURL=shortcuts.js.map