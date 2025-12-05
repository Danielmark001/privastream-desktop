var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { apiMethod, Module } from './module';
import { Display } from 'services/video';
import uuid from 'uuid/v4';
import * as remote from '@electron/remote';
export class DisplayModule extends Module {
    constructor() {
        super(...arguments);
        this.moduleName = 'Display';
        this.permissions = [];
        this.displays = {};
    }
    create(ctx, options) {
        const displayId = uuid();
        this.displays[displayId] = {
            displayId,
            options,
            display: null,
        };
        this.displays[displayId].tranformSubscription = ctx.pageTransform.subscribe(transform => {
            this.updateDisplay(this.displays[displayId], transform);
        });
        remote.webContents.fromId(ctx.webContentsId).on('destroyed', () => {
            this.destroyDisplay(displayId);
        });
        return displayId;
    }
    resize(ctx, displayId, size) {
        const entry = this.getDisplayEntry(displayId);
        entry.options.size = size;
        this.updateDisplay(entry, ctx.pageTransform.getValue());
    }
    move(ctx, displayId, position) {
        const entry = this.getDisplayEntry(displayId);
        entry.options.position = position;
        this.updateDisplay(entry, ctx.pageTransform.getValue());
    }
    destroy(ctx, displayId) {
        this.destroyDisplay(displayId);
    }
    updateDisplay(displayEntry, transform) {
        if (!transform.mounted) {
            if (displayEntry.display)
                this.removeDisplay(displayEntry);
            return;
        }
        if (displayEntry.display &&
            displayEntry.display.electronWindowId !== transform.electronWindowId) {
            this.removeDisplay(displayEntry);
        }
        if (!displayEntry.display) {
            displayEntry.display = new Display(displayEntry.displayId, {
                electronWindowId: transform.electronWindowId,
                slobsWindowId: transform.slobsWindowId,
                paddingColor: displayEntry.options.paddingColor,
                paddingSize: displayEntry.options.paddingSize || 0,
            });
        }
        displayEntry.display.resize(displayEntry.options.size.x, displayEntry.options.size.y);
        displayEntry.display.move(transform.pos.x + displayEntry.options.position.x, transform.pos.y + displayEntry.options.position.y);
    }
    removeDisplay(entry) {
        entry.display.destroy();
        entry.display = null;
    }
    destroyDisplay(displayId) {
        const displayEntry = this.getDisplayEntry(displayId);
        displayEntry.tranformSubscription.unsubscribe();
        if (displayEntry.display) {
            displayEntry.display.destroy();
        }
        delete this.displays[displayId];
    }
    getDisplayEntry(displayId) {
        if (!this.displays[displayId]) {
            throw new Error(`The display ${displayId} does not exist!`);
        }
        return this.displays[displayId];
    }
}
__decorate([
    apiMethod()
], DisplayModule.prototype, "create", null);
__decorate([
    apiMethod()
], DisplayModule.prototype, "resize", null);
__decorate([
    apiMethod()
], DisplayModule.prototype, "move", null);
__decorate([
    apiMethod()
], DisplayModule.prototype, "destroy", null);
//# sourceMappingURL=display.js.map