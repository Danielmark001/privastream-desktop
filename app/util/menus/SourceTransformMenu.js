var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Menu } from './Menu';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
import { ECenteringType } from 'services/editor-commands/commands/center-items';
import { EFlipAxis } from 'services/editor-commands/commands/flip-items';
export class SourceTransformMenu extends Menu {
    constructor(display) {
        super();
        this.display = display;
        this.appendMenuItems(this.display);
    }
    appendMenuItems(display) {
        this.append({
            label: $t('Edit Transform'),
            click: () => this.selectionService.openEditTransform(display),
        });
        this.append({
            label: $t('Reset Transform'),
            click: () => this.editorCommandsService.executeCommand('ResetTransformCommand', this.selectionService.views.globalSelection),
        });
        this.append({ type: 'separator' });
        this.append({
            label: $t('Stretch to Screen'),
            click: () => this.editorCommandsService.executeCommand('StretchToScreenCommand', this.selectionService.views.globalSelection),
        });
        this.append({
            label: $t('Fit to Screen'),
            click: () => this.editorCommandsService.executeCommand('FitToScreenCommand', this.selectionService.views.globalSelection),
        });
        this.append({ type: 'separator' });
        this.append({
            label: $t('Center on Screen'),
            click: () => this.editorCommandsService.executeCommand('CenterItemsCommand', this.selectionService.views.globalSelection, ECenteringType.Screen),
        });
        this.append({
            label: $t('Center Horizontal'),
            click: () => this.editorCommandsService.executeCommand('CenterItemsCommand', this.selectionService.views.globalSelection, ECenteringType.Horizontal),
        });
        this.append({
            label: $t('Center Vertical'),
            click: () => this.editorCommandsService.executeCommand('CenterItemsCommand', this.selectionService.views.globalSelection, ECenteringType.Vertical),
        });
        this.append({ type: 'separator' });
        this.append({
            label: $t('Flip Vertical'),
            click: () => this.editorCommandsService.executeCommand('FlipItemsCommand', this.selectionService.views.globalSelection, EFlipAxis.Vertical),
        });
        this.append({
            label: $t('Flip Horizontal'),
            click: () => this.editorCommandsService.executeCommand('FlipItemsCommand', this.selectionService.views.globalSelection, EFlipAxis.Horizontal),
        });
        this.append({ type: 'separator' });
        this.append({
            label: $t('Rotate 90 Degrees CW'),
            click: () => this.editorCommandsService.executeCommand('RotateItemsCommand', this.selectionService.views.globalSelection, 90),
        });
        this.append({
            label: $t('Rotate 90 Degrees CCW'),
            click: () => this.editorCommandsService.executeCommand('RotateItemsCommand', this.selectionService.views.globalSelection, -90),
        });
        this.append({
            label: $t('Rotate 180 Degrees'),
            click: () => this.editorCommandsService.executeCommand('RotateItemsCommand', this.selectionService.views.globalSelection, 180),
        });
    }
}
__decorate([
    Inject()
], SourceTransformMenu.prototype, "selectionService", void 0);
__decorate([
    Inject()
], SourceTransformMenu.prototype, "editorCommandsService", void 0);
//# sourceMappingURL=SourceTransformMenu.js.map