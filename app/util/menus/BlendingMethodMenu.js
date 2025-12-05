var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Menu } from './Menu';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
export class BlendingMethodMenu extends Menu {
    constructor() {
        super();
        this.appendMenuItems();
    }
    appendMenuItems() {
        this.append({
            label: $t('Default'),
            click: () => this.editorCommandsService.executeCommand('SetBlendingMethodCommand', this.selectionService.views.globalSelection, 0),
            checked: this.selectionService.views.globalSelection.isBlendingMethodSelected(0),
            type: 'checkbox',
        });
        this.append({
            label: $t('SRGB Off'),
            click: () => this.editorCommandsService.executeCommand('SetBlendingMethodCommand', this.selectionService.views.globalSelection, 1),
            checked: this.selectionService.views.globalSelection.isBlendingMethodSelected(1),
            type: 'checkbox',
        });
    }
}
__decorate([
    Inject()
], BlendingMethodMenu.prototype, "selectionService", void 0);
__decorate([
    Inject()
], BlendingMethodMenu.prototype, "editorCommandsService", void 0);
//# sourceMappingURL=BlendingMethodMenu.js.map