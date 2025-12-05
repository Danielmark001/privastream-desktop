var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Menu } from './Menu';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
export class DeinterlacingModeMenu extends Menu {
    constructor() {
        super();
        this.appendMenuItems();
    }
    appendMenuItems() {
        this.append({
            label: $t('Disable'),
            click: () => this.editorCommandsService.executeCommand('SetDeinterlacingModeCommand', this.selectionService.views.globalSelection, 0),
            checked: this.selectionService.views.globalSelection.isDeinterlacingModeSelected(0),
            type: 'checkbox',
        });
        this.append({
            label: $t('Discard'),
            click: () => this.editorCommandsService.executeCommand('SetDeinterlacingModeCommand', this.selectionService.views.globalSelection, 1),
            checked: this.selectionService.views.globalSelection.isDeinterlacingModeSelected(1),
            type: 'checkbox',
        });
        this.append({
            label: $t('Retro'),
            click: () => this.editorCommandsService.executeCommand('SetDeinterlacingModeCommand', this.selectionService.views.globalSelection, 2),
            checked: this.selectionService.views.globalSelection.isDeinterlacingModeSelected(2),
            type: 'checkbox',
        });
        this.append({
            label: $t('Blend'),
            click: () => this.editorCommandsService.executeCommand('SetDeinterlacingModeCommand', this.selectionService.views.globalSelection, 3),
            checked: this.selectionService.views.globalSelection.isDeinterlacingModeSelected(3),
            type: 'checkbox',
        });
        this.append({
            label: $t('Blend 2x'),
            click: () => this.editorCommandsService.executeCommand('SetDeinterlacingModeCommand', this.selectionService.views.globalSelection, 4),
            checked: this.selectionService.views.globalSelection.isDeinterlacingModeSelected(4),
            type: 'checkbox',
        });
        this.append({
            label: $t('Linear'),
            click: () => this.editorCommandsService.executeCommand('SetDeinterlacingModeCommand', this.selectionService.views.globalSelection, 5),
            checked: this.selectionService.views.globalSelection.isDeinterlacingModeSelected(5),
            type: 'checkbox',
        });
        this.append({
            label: $t('Linear 2x'),
            click: () => this.editorCommandsService.executeCommand('SetDeinterlacingModeCommand', this.selectionService.views.globalSelection, 6),
            checked: this.selectionService.views.globalSelection.isDeinterlacingModeSelected(6),
            type: 'checkbox',
        });
        this.append({
            label: $t('Yadif'),
            click: () => this.editorCommandsService.executeCommand('SetDeinterlacingModeCommand', this.selectionService.views.globalSelection, 7),
            checked: this.selectionService.views.globalSelection.isDeinterlacingModeSelected(7),
            type: 'checkbox',
        });
        this.append({
            label: $t('Yadif 2x'),
            click: () => this.editorCommandsService.executeCommand('SetDeinterlacingModeCommand', this.selectionService.views.globalSelection, 8),
            checked: this.selectionService.views.globalSelection.isDeinterlacingModeSelected(8),
            type: 'checkbox',
        });
        this.append({ type: 'separator' });
        this.append({
            label: $t('Top Field First'),
            click: () => this.editorCommandsService.executeCommand('SetDeinterlacingFieldOrderCommand', this.selectionService.views.globalSelection, 0),
            checked: this.selectionService.views.globalSelection.isDeinterlacingFieldOrderSelected(0),
            type: 'checkbox',
        });
        this.append({
            label: $t('Bottom Field First'),
            click: () => this.editorCommandsService.executeCommand('SetDeinterlacingFieldOrderCommand', this.selectionService.views.globalSelection, 1),
            checked: this.selectionService.views.globalSelection.isDeinterlacingFieldOrderSelected(1),
            type: 'checkbox',
        });
    }
}
__decorate([
    Inject()
], DeinterlacingModeMenu.prototype, "selectionService", void 0);
__decorate([
    Inject()
], DeinterlacingModeMenu.prototype, "editorCommandsService", void 0);
//# sourceMappingURL=DeinterlacingModeMenu.js.map