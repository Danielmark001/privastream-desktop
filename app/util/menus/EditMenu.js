var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Inject } from '../../services/core/injector';
import { Menu } from './Menu';
import { isItem } from '../../services/scenes';
import { SourceTransformMenu } from './SourceTransformMenu';
import { GroupMenu } from './GroupMenu';
import { $t } from 'services/i18n';
import * as remote from '@electron/remote';
import { ProjectorMenu } from './ProjectorMenu';
import { FiltersMenu } from './FiltersMenu';
import { ScaleFilteringMenu } from './ScaleFilteringMenu';
import { BlendingModeMenu } from './BlendingModeMenu';
import { BlendingMethodMenu } from './BlendingMethodMenu';
import { DeinterlacingModeMenu } from './DeinterlacingModeMenu';
export class EditMenu extends Menu {
    constructor(options) {
        var _a;
        super();
        this.options = options;
        this.scene = this.scenesService.views.getScene(this.options.selectedSceneId);
        this.showProjectionMenuItem = true;
        if (this.options.selectedSourceId) {
            this.source = this.sourcesService.views.getSource(this.options.selectedSourceId);
        }
        else if (this.options.showSceneItemMenu &&
            this.selectionService.views.globalSelection.isSceneItem()) {
            this.source = this.selectionService.views.globalSelection.getItems()[0].getSource();
        }
        this.showProjectionMenuItem =
            ((_a = this.options) === null || _a === void 0 ? void 0 : _a.display) !== 'vertical' &&
                !this.selectionService.views.globalSelection.getItems('vertical').length;
        this.appendEditMenuItems();
    }
    appendEditMenuItems() {
        var _a;
        if (this.scene) {
            this.append({
                label: $t('Paste (Reference)'),
                enabled: this.clipboardService.views.hasData(),
                accelerator: 'CommandOrControl+V',
                click: () => this.clipboardService.paste(),
            });
            this.append({
                label: $t('Paste (Duplicate)'),
                enabled: this.clipboardService.views.canDuplicate(),
                click: () => this.clipboardService.paste(true),
            });
        }
        const isSelectionSameNodeAcrossDisplays = (selectionSize) => {
            if (selectionSize !== 2) {
                return false;
            }
            const selectedItems = this.selectionService.views.globalSelection
                .getItems()
                .map(item => this.scenesService.views.getSceneItem(item.id));
            const [first, second] = selectedItems;
            const bothNodesHaveSameSourceId = first.sourceId === second.sourceId;
            const bothNodesHaveDifferentDisplay = first.display !== second.display;
            return bothNodesHaveSameSourceId && bothNodesHaveDifferentDisplay;
        };
        const selectionSize = this.selectionService.views.globalSelection.getSize();
        const isMultipleSelection = selectionSize > 1 && !isSelectionSameNodeAcrossDisplays(selectionSize);
        if (this.options.showSceneItemMenu) {
            const selectedItem = this.selectionService.views.globalSelection.getLastSelected();
            this.append({
                label: $t('Copy'),
                accelerator: 'CommandOrControl+C',
                click: () => this.clipboardService.copy(),
            });
            this.append({
                label: $t('Select All'),
                accelerator: 'CommandOrControl+A',
                click: () => this.selectionService.views.globalSelection.selectAll(),
            });
            this.append({
                label: $t('Invert Selection'),
                click: () => this.selectionService.views.globalSelection.invert(),
            });
            this.append({ type: 'separator' });
            this.append({
                label: $t('Transform'),
                submenu: this.transformSubmenu((_a = this.options) === null || _a === void 0 ? void 0 : _a.display).menu,
            });
            this.append({
                label: 'Group',
                submenu: this.groupSubmenu().menu,
            });
            this.append({ type: 'separator' });
            this.append({
                label: $t('Scale Filtering'),
                submenu: this.scaleFilteringSubmenu().menu,
            });
            this.append({
                label: $t('Blending Mode'),
                submenu: this.blendingModeSubmenu().menu,
            });
            this.append({
                label: $t('Blending Method'),
                submenu: this.blendingMethodSubmenu().menu,
            });
            if (selectedItem && isItem(selectedItem)) {
                if (selectedItem.getSource().async) {
                    this.append({
                        label: $t('Deinterlacing'),
                        submenu: this.deinterlacingSubmenu().menu,
                    });
                    this.append({ type: 'separator' });
                }
                const visibilityLabel = selectedItem.visible ? $t('Hide') : $t('Show');
                const streamVisLabel = selectedItem.streamVisible
                    ? $t('Hide on Stream')
                    : $t('Show on Stream');
                const recordingVisLabel = selectedItem.recordingVisible
                    ? $t('Hide on Recording')
                    : $t('Show on Recording');
                if (!isMultipleSelection) {
                    this.append({
                        label: visibilityLabel,
                        click: () => {
                            this.editorCommandsService.executeCommand('HideItemsCommand', selectedItem.getSelection(), selectedItem.visible);
                        },
                    });
                    if (this.streamingService.state.selectiveRecording) {
                        this.append({
                            label: streamVisLabel,
                            click: () => {
                                selectedItem.setStreamVisible(!selectedItem.streamVisible);
                            },
                        });
                        this.append({
                            label: recordingVisLabel,
                            click: () => {
                                selectedItem.setRecordingVisible(!selectedItem.recordingVisible);
                            },
                        });
                    }
                }
                else {
                    this.append({
                        label: $t('Show'),
                        click: () => {
                            this.editorCommandsService.executeCommand('HideItemsCommand', this.selectionService.views.globalSelection, false);
                        },
                    });
                    this.append({
                        label: $t('Hide'),
                        click: () => {
                            this.editorCommandsService.executeCommand('HideItemsCommand', this.selectionService.views.globalSelection, true);
                        },
                    });
                }
                if (this.source && this.source.getPropertiesManagerType() === 'widget') {
                    this.append({
                        label: $t('Export Widget'),
                        click: () => {
                            remote.dialog
                                .showSaveDialog({
                                filters: [{ name: 'Widget File', extensions: ['widget'] }],
                            })
                                .then(({ filePath }) => {
                                var _a;
                                if (!filePath)
                                    return;
                                const sceneItemId = ((_a = this.options) === null || _a === void 0 ? void 0 : _a.display) === 'vertical'
                                    ? this.dualOutputService.views.getDualOutputNodeId(selectedItem.sceneItemId)
                                    : selectedItem.sceneItemId;
                                console.log('sceneItemId ', sceneItemId);
                                this.widgetsService.saveWidgetFile(filePath, sceneItemId);
                            });
                        },
                    });
                }
            }
        }
        if (this.selectionService.views.globalSelection.isSceneFolder()) {
            this.append({
                label: $t('Rename'),
                click: () => this.scenesService.showNameFolder({
                    sceneId: this.scenesService.views.activeSceneId,
                    renameId: this.selectionService.views.globalSelection.getFolders()[0].id,
                }),
            });
        }
        if (this.source) {
            this.append({
                label: $t('Remove'),
                accelerator: 'Delete',
                click: () => {
                    if (this.options.showSceneItemMenu) {
                        this.selectionService.actions.removeSelected();
                    }
                    else {
                        if (!this.source.channel) {
                            const scene = this.scenesService.views.activeScene;
                            const itemsToRemoveIds = scene
                                .getItems()
                                .filter(item => item.sourceId === this.source.sourceId)
                                .reduce((itemIds, item) => {
                                itemIds.push(item.id);
                                if (this.dualOutputService.views.hasSceneNodeMaps) {
                                    const dualOutputNodeId = this.dualOutputService.views.getDualOutputNodeId(item.id);
                                    if (dualOutputNodeId)
                                        itemIds.push(dualOutputNodeId);
                                }
                                return itemIds;
                            }, []);
                            this.editorCommandsService.executeCommand('RemoveNodesCommand', scene.getSelection(itemsToRemoveIds));
                        }
                        else {
                            remote.dialog
                                .showMessageBox(remote.getCurrentWindow(), {
                                title: 'PrivaStream Desktop',
                                message: $t('This source will be removed from all of your scenes'),
                                type: 'warning',
                                buttons: [$t('Cancel'), $t('OK')],
                            })
                                .then(({ response }) => {
                                if (!response)
                                    return;
                                this.editorCommandsService.executeCommand('RemoveSourceCommand', this.source.sourceId);
                            });
                        }
                    }
                },
            });
            if (this.source.type === 'browser_source') {
                this.append({
                    label: $t('Interact'),
                    click: () => this.sourcesService.showInteractWindow(this.source.sourceId),
                });
            }
        }
        if (this.source && !isMultipleSelection) {
            this.append({
                label: $t('Rename'),
                click: () => {
                    if (this.source.type === 'scene') {
                        this.scenesService.actions.showNameScene({ rename: this.source.sourceId });
                    }
                    else {
                        this.sourcesService.actions.showRenameSource(this.source.sourceId);
                    }
                },
            });
            const filtersCount = this.sourceFiltersService.getFilters(this.source.sourceId).length;
            this.append({
                label: $t('Filters') + (filtersCount > 0 ? ` (${filtersCount})` : ''),
                submenu: new FiltersMenu(this.source.sourceId).menu,
            });
            this.append({
                label: $t('Properties'),
                click: () => {
                    this.showProperties();
                },
                enabled: this.source.hasProps(),
            });
        }
        if (!this.options.showSceneItemMenu && !this.source) {
            this.append({ type: 'separator' });
            this.append({
                label: $t('Lock Sources'),
                click: () => this.scenesService.setLockOnAllScenes(true),
            });
            this.append({
                label: $t('Unlock Sources'),
                click: () => this.scenesService.setLockOnAllScenes(false),
            });
        }
        this.append({ type: 'separator' });
        if (this.showProjectionMenuItem) {
            this.append({ label: $t('Projector'), submenu: this.projectorSubmenu().menu });
        }
        this.append({
            label: $t('Performance Mode'),
            type: 'checkbox',
            checked: this.customizationService.state.performanceMode,
            click: () => this.customizationService.setSettings({
                performanceMode: !this.customizationService.state.performanceMode,
            }),
        });
        this.append({ type: 'separator' });
        this.append({
            label: $t('Undo %{action}', { action: this.editorCommandsService.nextUndoDescription }),
            accelerator: 'CommandOrControl+Z',
            click: () => this.editorCommandsService.undo(),
            enabled: this.editorCommandsService.nextUndo != null,
        });
        this.append({
            label: $t('Redo %{action}', { action: this.editorCommandsService.nextRedoDescription }),
            accelerator: 'CommandOrControl+Y',
            click: () => this.editorCommandsService.redo(),
            enabled: this.editorCommandsService.nextRedo != null,
        });
        if (this.options.showAudioMixerMenu) {
            this.append({ type: 'separator' });
            this.append({
                label: $t('Hide'),
                click: () => {
                    this.editorCommandsService.executeCommand('HideMixerSourceCommand', this.source.sourceId);
                },
            });
            this.append({
                label: $t('Unhide All'),
                click: () => this.editorCommandsService.executeCommand('UnhideMixerSourcesCommand'),
            });
        }
    }
    showProperties() {
        if (this.options.showAudioMixerMenu || !this.source.video) {
            this.audioService.actions.showAdvancedSettings(this.source.sourceId);
        }
        else {
            this.sourcesService.actions.showSourceProperties(this.source.sourceId);
        }
    }
    transformSubmenu(display) {
        return new SourceTransformMenu(display);
    }
    groupSubmenu() {
        return new GroupMenu();
    }
    projectorSubmenu() {
        return new ProjectorMenu();
    }
    scaleFilteringSubmenu() {
        return new ScaleFilteringMenu();
    }
    blendingModeSubmenu() {
        return new BlendingModeMenu();
    }
    blendingMethodSubmenu() {
        return new BlendingMethodMenu();
    }
    deinterlacingSubmenu() {
        return new DeinterlacingModeMenu();
    }
}
__decorate([
    Inject()
], EditMenu.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], EditMenu.prototype, "scenesService", void 0);
__decorate([
    Inject()
], EditMenu.prototype, "sourceFiltersService", void 0);
__decorate([
    Inject()
], EditMenu.prototype, "clipboardService", void 0);
__decorate([
    Inject()
], EditMenu.prototype, "widgetsService", void 0);
__decorate([
    Inject()
], EditMenu.prototype, "customizationService", void 0);
__decorate([
    Inject()
], EditMenu.prototype, "selectionService", void 0);
__decorate([
    Inject()
], EditMenu.prototype, "projectorService", void 0);
__decorate([
    Inject()
], EditMenu.prototype, "editorCommandsService", void 0);
__decorate([
    Inject()
], EditMenu.prototype, "streamingService", void 0);
__decorate([
    Inject()
], EditMenu.prototype, "audioService", void 0);
__decorate([
    Inject()
], EditMenu.prototype, "dualOutputService", void 0);
//# sourceMappingURL=EditMenu.js.map