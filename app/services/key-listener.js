import { Service } from './core/service';
import * as remote from '@electron/remote';
export class KeyListenerService extends Service {
    constructor() {
        super(...arguments);
        this.bindings = {};
        this.hookStarted = false;
    }
    init() {
        this.libuiohook = remote.require('node-libuiohook');
    }
    unregisterAll(namespace = 'global') {
        Object.keys(this.bindings).forEach(keystr => {
            if (this.bindings[keystr][namespace]) {
                this.unregister(this.bindings[keystr][namespace], namespace);
            }
        });
    }
    register(binding, namespace = 'global') {
        if (!this.hookStarted) {
            this.libuiohook.startHook();
            this.hookStarted = true;
        }
        if (!binding.key)
            return;
        const keystr = this.getKeyString(binding);
        if (!this.bindings[keystr]) {
            const success = this.libuiohook.registerCallback(Object.assign(Object.assign({}, binding), { callback: () => {
                    Object.keys(this.bindings[keystr]).forEach(namespace => {
                        this.bindings[keystr][namespace].callback();
                    });
                } }));
            if (!success)
                return;
            this.bindings[keystr] = {};
        }
        this.bindings[keystr][namespace] = binding;
        return true;
    }
    unregister(binding, namespace = 'global') {
        const keystr = this.getKeyString(binding);
        delete this.bindings[keystr][namespace];
        if (Object.keys(this.bindings[keystr]).length === 0) {
            delete this.bindings[keystr];
            this.libuiohook.unregisterCallback(binding);
        }
    }
    shutdown() {
        if (this.hookStarted) {
            this.libuiohook.unregisterAllCallbacks();
            this.libuiohook.stopHook();
        }
    }
    getKeyString(binding) {
        return (`${binding.key}-${binding.eventType}-${!!binding.modifiers.alt}-` +
            `${!!binding.modifiers.ctrl}-${!!binding.modifiers.shift}-${!!binding.modifiers.meta}`);
    }
}
//# sourceMappingURL=key-listener.js.map