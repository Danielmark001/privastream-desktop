var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Service, Inject } from 'services/core';
import { OS } from 'util/operating-systems';
import * as remote from '@electron/remote';
export class ApplicationMenuService extends Service {
    init() {
        if (process.platform !== OS.Mac)
            return;
        const menu = this.buildMenu();
        remote.Menu.setApplicationMenu(menu);
        this.bindDynamicMenuItems();
    }
    buildMenu() {
        return remote.Menu.buildFromTemplate([
            {
                label: 'Streamlabs Desktop',
                submenu: [
                    { role: 'about' },
                    {
                        label: 'Preferences…',
                        accelerator: 'Command+,',
                        click: () => {
                            if (this.appService.state.loading)
                                return;
                            this.settingsService.showSettings();
                        },
                    },
                    { type: 'separator' },
                    { role: 'services' },
                    { type: 'separator' },
                    { role: 'hide' },
                    { role: 'hideOthers' },
                    { role: 'unhide' },
                    { type: 'separator' },
                    { role: 'quit' },
                ],
            },
            { role: 'fileMenu' },
            {
                id: 'edit',
                label: 'Edit',
                submenu: [
                    {
                        id: 'undo',
                        label: 'Undo',
                        accelerator: 'Command+Z',
                        click: () => {
                            if (this.isEditorFocused()) {
                                if (this.appService.state.loading)
                                    return;
                                this.editorCommandsService.undo();
                            }
                            else {
                                remote.Menu.sendActionToFirstResponder('undo:');
                            }
                        },
                    },
                    {
                        id: 'redo',
                        label: 'Redo',
                        accelerator: 'Command+Shift+Z',
                        click: () => {
                            if (this.isEditorFocused()) {
                                if (this.appService.state.loading)
                                    return;
                                this.editorCommandsService.redo();
                            }
                            else {
                                remote.Menu.sendActionToFirstResponder('redo:');
                            }
                        },
                    },
                    { type: 'separator' },
                    {
                        id: 'copy',
                        label: 'Copy',
                        accelerator: 'Command+C',
                        click: () => {
                            if (this.isEditorFocused()) {
                                if (this.appService.state.loading)
                                    return;
                                this.clipboardService.copy();
                            }
                            else {
                                remote.Menu.sendActionToFirstResponder('copy:');
                            }
                        },
                    },
                    {
                        id: 'paste',
                        label: 'Paste',
                        accelerator: 'Command+V',
                        click: () => {
                            if (this.isEditorFocused()) {
                                if (this.appService.state.loading)
                                    return;
                                this.clipboardService.paste();
                            }
                            else {
                                remote.Menu.sendActionToFirstResponder('paste:');
                            }
                        },
                    },
                    {
                        id: 'delete',
                        label: 'Delete',
                        click: () => {
                            if (this.isEditorFocused()) {
                                if (this.appService.state.loading)
                                    return;
                                this.selectionService.removeSelected();
                            }
                        },
                    },
                    {
                        label: 'Select All',
                        accelerator: 'Command+A',
                        click: () => {
                            if (this.isEditorFocused()) {
                                if (this.appService.state.loading)
                                    return;
                                this.selectionService.views.globalSelection.selectAll();
                            }
                            else {
                                remote.Menu.sendActionToFirstResponder('selectAll:');
                            }
                        },
                    },
                    { type: 'separator' },
                    {
                        id: 'nudgeUp',
                        label: 'Nudge Selection Up',
                        accelerator: 'Up',
                        click: () => {
                            if (this.isEditorFocused()) {
                                if (this.appService.state.loading)
                                    return;
                                this.editorCommandsService.nudgeActiveItemsUp();
                            }
                        },
                    },
                    {
                        id: 'nudgeDown',
                        label: 'Nudge Selection Down',
                        accelerator: 'Down',
                        click: () => {
                            if (this.isEditorFocused()) {
                                if (this.appService.state.loading)
                                    return;
                                this.editorCommandsService.nudgeActiveItemsDown();
                            }
                        },
                    },
                    {
                        id: 'nudgeLeft',
                        label: 'Nudge Selection Left',
                        accelerator: 'Left',
                        click: () => {
                            if (this.isEditorFocused()) {
                                if (this.appService.state.loading)
                                    return;
                                this.editorCommandsService.nudgeActiveItemsLeft();
                            }
                        },
                    },
                    {
                        id: 'nudgeRight',
                        label: 'Nudge Selection Right',
                        accelerator: 'Right',
                        click: () => {
                            if (this.isEditorFocused()) {
                                if (this.appService.state.loading)
                                    return;
                                this.editorCommandsService.nudgeActiveItemsRight();
                            }
                        },
                    },
                    { type: 'separator' },
                    {
                        label: 'Speech',
                        submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }],
                    },
                ],
            },
            {
                label: 'View',
                submenu: [{ role: 'togglefullscreen' }],
            },
            { role: 'windowMenu' },
            {
                label: 'Help',
                role: 'help',
                submenu: [
                    {
                        label: 'Streamlabs Desktop Support',
                        click: () => {
                            remote.shell.openExternal('https://support.streamlabs.com');
                        },
                    },
                ],
            },
        ]);
    }
    isEditorFocused() {
        return (this.windowsService.windows.main.webContents.isFocused() &&
            this.navigationService.state.currentPage === 'Studio');
    }
    bindDynamicMenuItems() {
        const appMenu = remote.Menu.getApplicationMenu();
        this.selectionService.updated.subscribe(state => {
            appMenu.getMenuItemById('nudgeUp').enabled = !!state.selectedIds.length;
            appMenu.getMenuItemById('nudgeDown').enabled = !!state.selectedIds.length;
            appMenu.getMenuItemById('nudgeLeft').enabled = !!state.selectedIds.length;
            appMenu.getMenuItemById('nudgeRight').enabled = !!state.selectedIds.length;
        });
    }
}
__decorate([
    Inject()
], ApplicationMenuService.prototype, "editorCommandsService", void 0);
__decorate([
    Inject()
], ApplicationMenuService.prototype, "clipboardService", void 0);
__decorate([
    Inject()
], ApplicationMenuService.prototype, "selectionService", void 0);
__decorate([
    Inject()
], ApplicationMenuService.prototype, "appService", void 0);
__decorate([
    Inject()
], ApplicationMenuService.prototype, "windowsService", void 0);
__decorate([
    Inject()
], ApplicationMenuService.prototype, "navigationService", void 0);
__decorate([
    Inject()
], ApplicationMenuService.prototype, "settingsService", void 0);
//# sourceMappingURL=application-menu.js.map