var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Menu } from './Menu';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
export class BlendingModeMenu extends Menu {
    constructor() {
        super();
        this.appendMenuItems();
    }
    appendMenuItems() {
        this.append({
            label: $t('Normal'),
            click: () => this.editorCommandsService.executeCommand('SetBlendingModeCommand', this.selectionService.views.globalSelection, 0),
            checked: this.selectionService.views.globalSelection.isBlendingModeSelected(0),
            type: 'checkbox',
        });
        this.append({
            label: $t('Additive'),
            click: () => this.editorCommandsService.executeCommand('SetBlendingModeCommand', this.selectionService.views.globalSelection, 1),
            checked: this.selectionService.views.globalSelection.isBlendingModeSelected(1),
            type: 'checkbox',
        });
        this.append({
            label: $t('Substract'),
            click: () => this.editorCommandsService.executeCommand('SetBlendingModeCommand', this.selectionService.views.globalSelection, 2),
            checked: this.selectionService.views.globalSelection.isBlendingModeSelected(2),
            type: 'checkbox',
        });
        this.append({
            label: $t('Screen'),
            click: () => this.editorCommandsService.executeCommand('SetBlendingModeCommand', this.selectionService.views.globalSelection, 3),
            checked: this.selectionService.views.globalSelection.isBlendingModeSelected(3),
            type: 'checkbox',
        });
        this.append({
            label: $t('Multiply'),
            click: () => this.editorCommandsService.executeCommand('SetBlendingModeCommand', this.selectionService.views.globalSelection, 4),
            checked: this.selectionService.views.globalSelection.isBlendingModeSelected(4),
            type: 'checkbox',
        });
        this.append({
            label: $t('Lighten'),
            click: () => this.editorCommandsService.executeCommand('SetBlendingModeCommand', this.selectionService.views.globalSelection, 5),
            checked: this.selectionService.views.globalSelection.isBlendingModeSelected(5),
            type: 'checkbox',
        });
        this.append({
            label: $t('Darken'),
            click: () => this.editorCommandsService.executeCommand('SetBlendingModeCommand', this.selectionService.views.globalSelection, 6),
            checked: this.selectionService.views.globalSelection.isBlendingModeSelected(6),
            type: 'checkbox',
        });
    }
}
__decorate([
    Inject()
], BlendingModeMenu.prototype, "selectionService", void 0);
__decorate([
    Inject()
], BlendingModeMenu.prototype, "editorCommandsService", void 0);
//# sourceMappingURL=BlendingModeMenu.js.map