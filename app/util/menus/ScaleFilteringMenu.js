var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Menu } from './Menu';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
export class ScaleFilteringMenu extends Menu {
    constructor() {
        super();
        this.appendMenuItems();
    }
    appendMenuItems() {
        this.append({
            label: $t('Disable'),
            click: () => this.editorCommandsService.executeCommand('SetScaleFilterCommand', this.selectionService.views.globalSelection, 0),
            checked: this.selectionService.views.globalSelection.isScaleFilterSelected(0),
            type: 'checkbox',
        });
        this.append({
            label: $t('Point'),
            click: () => this.editorCommandsService.executeCommand('SetScaleFilterCommand', this.selectionService.views.globalSelection, 1),
            checked: this.selectionService.views.globalSelection.isScaleFilterSelected(1),
            type: 'checkbox',
        });
        this.append({
            label: $t('Bicubic'),
            click: () => this.editorCommandsService.executeCommand('SetScaleFilterCommand', this.selectionService.views.globalSelection, 2),
            checked: this.selectionService.views.globalSelection.isScaleFilterSelected(2),
            type: 'checkbox',
        });
        this.append({
            label: $t('Bilinear'),
            click: () => this.editorCommandsService.executeCommand('SetScaleFilterCommand', this.selectionService.views.globalSelection, 3),
            checked: this.selectionService.views.globalSelection.isScaleFilterSelected(3),
            type: 'checkbox',
        });
        this.append({
            label: $t('Lanczos'),
            click: () => this.editorCommandsService.executeCommand('SetScaleFilterCommand', this.selectionService.views.globalSelection, 4),
            checked: this.selectionService.views.globalSelection.isScaleFilterSelected(4),
            type: 'checkbox',
        });
        this.append({
            label: $t('Area'),
            click: () => this.editorCommandsService.executeCommand('SetScaleFilterCommand', this.selectionService.views.globalSelection, 5),
            checked: this.selectionService.views.globalSelection.isScaleFilterSelected(5),
            type: 'checkbox',
        });
    }
}
__decorate([
    Inject()
], ScaleFilteringMenu.prototype, "selectionService", void 0);
__decorate([
    Inject()
], ScaleFilteringMenu.prototype, "editorCommandsService", void 0);
//# sourceMappingURL=ScaleFilteringMenu.js.map