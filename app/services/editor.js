var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { StatefulService } from 'services';
import clamp from 'lodash/clamp';
import { DragHandler } from 'util/DragHandler';
import { Inject } from 'services/core/injector';
import { EditMenu } from 'util/menus/EditMenu';
import { AnchorPoint, AnchorPositions, ScalableRectangle } from 'util/ScalableRectangle';
import { Selection } from 'services/selection';
import { v2 } from '../util/vec2';
import { mutation } from './core';
import { byOS, OS } from 'util/operating-systems';
import { Subject } from 'rxjs';
export class EditorService extends StatefulService {
    constructor() {
        super(...arguments);
        this.positionUpdateFinished = new Subject();
        this.renderedWidths = {
            horizontal: 0,
            vertical: 0,
        };
        this.renderedHeights = {
            horizontal: 0,
            vertical: 0,
        };
        this.renderedOffsetXs = {
            horizontal: 0,
            vertical: 0,
        };
        this.renderedOffsetYs = {
            horizontal: 0,
            vertical: 0,
        };
        this.canDrag = true;
        this.messageActive = false;
    }
    handleOutputResize(region, display) {
        this.renderedWidths[display] = region.width;
        this.renderedHeights[display] = region.height;
        this.renderedOffsetXs[display] = region.x;
        this.renderedOffsetYs[display] = region.y;
    }
    handleMouseDown(event) {
        if (this.activeSources.length > 0) {
            const overResize = this.isOverResize(event);
            if (overResize) {
                this.startResizing(event, overResize);
                return;
            }
        }
        if (!this.getOverSources(event).length)
            this.canDrag = false;
        this.updateCursor(event);
    }
    handleMouseDblClick(event) {
        const overSources = this.getOverSources(event);
        if (!overSources.length)
            return;
        const parent = overSources[0].getParent();
        if (this.customizationService.state.folderSelection &&
            (!parent || (parent && parent.isSelected()))) {
            this.selectionService.views.globalSelection.select(overSources[0].id);
        }
        else if (parent) {
            this.selectionService.views.globalSelection.select(parent.id);
        }
    }
    startDragging(event) {
        const dragHandler = new DragHandler(event, {
            displaySize: {
                x: this.renderedWidths[event.display],
                y: this.renderedHeights[event.display],
            },
            displayOffset: {
                x: this.renderedOffsetXs[event.display],
                y: this.renderedOffsetYs[event.display],
            },
        });
        this.dragHandler = dragHandler;
        this.SET_CHANGING_POSITION_IN_PROGRESS(true);
        this.tcpServerService.stopRequestsHandling(false);
    }
    startResizing(event, region) {
        this.resizeRegion = region;
        this.currentX = event.pageX;
        this.currentY = event.pageY;
        if (event.altKey)
            this.isCropping = true;
        this.SET_CHANGING_POSITION_IN_PROGRESS(true);
        this.tcpServerService.stopRequestsHandling(false);
    }
    handleMouseUp(event) {
        this.canDrag = true;
        if (!this.dragHandler && !this.resizeRegion) {
            const overSources = this.getOverSources(event);
            const overSelected = this.selectionService.views.globalSelection
                .getItems()
                .find(item => overSources.some(source => source.id === item.id));
            if (event.button === 0) {
                if (overSources.length) {
                    let overNode = overSources[0];
                    if (this.customizationService.state.folderSelection) {
                        overNode = overSources[0].hasParent() ? overSources[0].getParent() : overSources[0];
                    }
                    if (byOS({ [OS.Windows]: event.ctrlKey, [OS.Mac]: event.metaKey })) {
                        if (overNode.isSelected()) {
                            overNode.deselect();
                        }
                        else {
                            overNode.addToSelection();
                        }
                    }
                    else {
                        if (overSelected && overSources.length > 1) {
                            const currentIndex = overSources.findIndex(source => source.id === overSelected.id);
                            overSources[(currentIndex + 1) % overSources.length].select();
                        }
                        else {
                            overNode.select();
                        }
                    }
                }
                else {
                    this.selectionService.views.globalSelection.reset();
                }
            }
            else if (event.button === 2) {
                let menu;
                if (overSelected) {
                    menu = new EditMenu({
                        selectedSceneId: this.scene.id,
                        showSceneItemMenu: true,
                        selectedSourceId: overSelected.sourceId,
                        display: event.display,
                    });
                }
                else if (overSources.length) {
                    this.selectionService.views.globalSelection.select(overSources[0].sceneItemId);
                    menu = new EditMenu({
                        selectedSceneId: this.scene.id,
                        showSceneItemMenu: true,
                        selectedSourceId: overSources[0].sourceId,
                        display: event.display,
                    });
                }
                else {
                    menu = new EditMenu({ selectedSceneId: this.scene.id, display: event.display });
                }
                menu.popup({ window: this.windowsService.windows.main, x: event.pageX, y: event.pageY });
            }
        }
        this.dragHandler = null;
        this.resizeRegion = null;
        this.isCropping = false;
        this.SET_CHANGING_POSITION_IN_PROGRESS(false);
        this.positionUpdateFinished.next();
        this.tcpServerService.startRequestsHandling();
        this.updateCursor(event);
    }
    handleMouseEnter(event) {
        if (event.buttons !== 1) {
            this.dragHandler = null;
            this.resizeRegion = null;
        }
    }
    handleMouseMove(event) {
        const factor = byOS({ [OS.Windows]: this.windowsService.state.main.scaleFactor, [OS.Mac]: 1 });
        const mousePosX = event.offsetX * factor - this.renderedOffsetXs[event.display];
        const mousePosY = event.offsetY * factor - this.renderedOffsetYs[event.display];
        const converted = this.convertScalarToBaseSpace(mousePosX, mousePosY, event.display);
        if (this.resizeRegion) {
            const name = this.resizeRegion.name;
            const optionsMap = {
                nw: { anchor: AnchorPoint.SouthEast },
                sw: { anchor: AnchorPoint.NorthEast },
                ne: { anchor: AnchorPoint.SouthWest },
                se: { anchor: AnchorPoint.NorthWest },
                n: { anchor: AnchorPoint.South, lockX: true },
                s: { anchor: AnchorPoint.North, lockX: true },
                e: { anchor: AnchorPoint.West, lockY: true },
                w: { anchor: AnchorPoint.East, lockY: true },
            };
            const options = Object.assign(Object.assign({}, optionsMap[name]), { lockRatio: !event.shiftKey });
            if (this.isCropping) {
                this.crop(converted.x, converted.y, options, event.display);
            }
            else {
                this.resize(converted.x, converted.y, options, event.display);
            }
        }
        else if (this.dragHandler) {
            return this.dragHandler.move(event);
        }
        else if (event.buttons === 1) {
            const sourcesInPriorityOrder = this.activeSources
                .concat(this.sceneItems)
                .filter(item => item);
            const overSource = sourcesInPriorityOrder.find(source => {
                return this.isOverSource(event, source);
            });
            if (overSource && this.canDrag) {
                const overNode = !overSource.isSelected() && overSource.hasParent() ? overSource.getParent() : overSource;
                if (event.ctrlKey || overNode.isSelected()) {
                    overNode.addToSelection();
                }
                else {
                    overNode.select();
                }
                this.startDragging(event);
            }
        }
        this.updateCursor(event);
    }
    crop(x, y, options, display) {
        const source = this.resizeRegion.item;
        const rect = new ScalableRectangle(source.rectangle);
        rect.normalized(() => {
            rect.withAnchor(options.anchor, () => {
                switch (options.anchor) {
                    case AnchorPoint.East: {
                        const croppableWidth = rect.width - rect.crop.right - 2;
                        const distance = croppableWidth * rect.scaleX - (rect.x - x);
                        rect.crop.left = Math.round(clamp(distance / rect.scaleX, 0, croppableWidth));
                        break;
                    }
                    case AnchorPoint.West: {
                        const croppableWidth = rect.width - rect.crop.left - 2;
                        const distance = croppableWidth * rect.scaleX + (rect.x - x);
                        rect.crop.right = Math.round(clamp(distance / rect.scaleX, 0, croppableWidth));
                        break;
                    }
                    case AnchorPoint.South: {
                        const croppableHeight = rect.height - rect.crop.bottom - 2;
                        const distance = croppableHeight * rect.scaleY - (rect.y - y);
                        rect.crop.top = Math.round(clamp(distance / rect.scaleY, 0, croppableHeight));
                        break;
                    }
                    case AnchorPoint.North: {
                        const croppableHeight = rect.height - rect.crop.top - 2;
                        const distance = croppableHeight * rect.scaleY + (rect.y - y);
                        rect.crop.bottom = Math.round(clamp(distance / rect.scaleY, 0, croppableHeight));
                        break;
                    }
                }
            });
        });
        this.editorCommandsService.executeCommand('CropItemsCommand', new Selection(this.scene.id, source.sceneItemId), rect.crop, { x: rect.x, y: rect.y }, display);
    }
    resize(x, y, options, display) {
        const opts = Object.assign({ lockRatio: true, lockX: false, lockY: false }, options);
        let scaleXDelta = 1;
        let scaleYDelta = 1;
        const rect = this.selectionService.views.globalSelection.getBoundingRect(display);
        if (!rect) {
            return;
        }
        const anchorPosition = rect.getOffsetFromOrigin(AnchorPositions[opts.anchor]);
        const oppositePointsMap = { 0: 1, 0.5: 0.5, 1: 0 };
        const resizeRegionPosition = v2(oppositePointsMap[AnchorPositions[opts.anchor].x], oppositePointsMap[AnchorPositions[opts.anchor].y]);
        const scaleVector = resizeRegionPosition.sub(v2(AnchorPositions[opts.anchor]));
        if (scaleVector.x && !opts.lockX) {
            const newWidth = Math.abs(x - anchorPosition.x);
            scaleXDelta = newWidth / rect.width;
        }
        if (scaleVector.y && !opts.lockY) {
            const newHeight = Math.abs(y - anchorPosition.y);
            scaleYDelta = newHeight / rect.height;
        }
        if (opts.lockRatio) {
            if ([
                AnchorPoint.SouthEast,
                AnchorPoint.SouthWest,
                AnchorPoint.NorthEast,
                AnchorPoint.NorthWest,
            ].includes(opts.anchor)) {
                scaleYDelta = scaleXDelta = Math.max(scaleXDelta, scaleYDelta);
            }
            else if (scaleVector.x) {
                scaleYDelta = scaleXDelta;
            }
            else {
                scaleXDelta = scaleYDelta;
            }
        }
        this.editorCommandsService.executeCommand('ResizeItemsCommand', this.selectionService.views.globalSelection, { x: scaleXDelta, y: scaleYDelta }, AnchorPositions[opts.anchor], display);
    }
    updateCursor(event) {
        if (this.dragHandler) {
            this.setCursor('-webkit-grabbing');
        }
        else if (this.resizeRegion) {
            this.setCursor(this.resizeRegion.cursor);
        }
        else {
            const overResize = this.isOverResize(event);
            if (overResize) {
                this.setCursor(overResize.cursor);
            }
            else {
                const overSource = this.getOverSources(event)[0];
                if (overSource) {
                    this.setCursor('-webkit-grab');
                }
                else {
                    this.setCursor('default');
                }
            }
        }
    }
    setCursor(cursor) {
        if (this.state.cursor !== cursor)
            this.SET_CURSOR(cursor);
    }
    isOverBox(event, x, y, width, height, borderWidth = 0) {
        const factor = byOS({ [OS.Windows]: this.windowsService.state.main.scaleFactor, [OS.Mac]: 1 });
        const mouse = this.convertVectorToBaseSpace(event.offsetX * factor, event.offsetY * factor, event.display);
        const box = { x, y, width, height };
        if (borderWidth > 0) {
            if (mouse.x < box.x - borderWidth && mouse.x < box.x) {
                return false;
            }
            if (mouse.y < box.y - borderWidth && mouse.y < box.y) {
                return false;
            }
            if (mouse.x > box.x + box.width + borderWidth && mouse.x > box.x + box.width) {
                return false;
            }
            if (mouse.y > box.y + box.height + borderWidth && mouse.y > box.y + box.height) {
                return false;
            }
        }
        else {
            if (mouse.x < box.x) {
                return false;
            }
            if (mouse.y < box.y) {
                return false;
            }
            if (mouse.x > box.x + box.width) {
                return false;
            }
            if (mouse.y > box.y + box.height) {
                return false;
            }
        }
        return true;
    }
    isOverSource(event, source) {
        if (event.display !== source.display) {
            return false;
        }
        const rect = new ScalableRectangle(source.rectangle);
        rect.normalize();
        return this.isOverBox(event, rect.x, rect.y, rect.scaledWidth, rect.scaledHeight);
    }
    getOverSources(event) {
        return this.sceneItems.filter(source => {
            return this.isOverSource(event, source);
        });
    }
    isOverResize(event) {
        if (this.activeSources.length > 0) {
            return this.resizeRegions.find(region => {
                if (event.display !== region.item.display) {
                    return false;
                }
                const borderWidth = event.display === 'vertical' ? 20 : 0;
                return this.isOverBox(event, region.x, region.y, region.width, region.height, borderWidth);
            });
        }
        return;
    }
    convertScalarToBaseSpace(x, y, display = 'horizontal') {
        return {
            x: (x * this.baseResolutions[display].baseWidth) / this.renderedWidths[display],
            y: (y * this.baseResolutions[display].baseHeight) / this.renderedHeights[display],
        };
    }
    convertVectorToBaseSpace(x, y, display) {
        const movedX = x - this.renderedOffsetXs[display];
        const movedY = y - this.renderedOffsetYs[display];
        return this.convertScalarToBaseSpace(movedX, movedY, display);
    }
    calculateVerticalScale(itemSize) {
        const x = Math.max(this.renderedWidths.horizontal, itemSize.x) /
            Math.min(this.renderedWidths.horizontal, itemSize.x);
        const y = Math.max(this.renderedHeights.vertical, itemSize.y) /
            Math.min(this.renderedHeights.vertical, itemSize.y);
        return {
            x,
            y,
        };
    }
    get activeSources() {
        return this.selectionService.views.globalSelection.getItems().filter(item => {
            return item.isVisualSource;
        });
    }
    get sceneItems() {
        const scene = this.scenesService.views.activeScene;
        if (scene) {
            return scene.getItems().filter(source => {
                return source.isVisualSource;
            });
        }
        return [];
    }
    get scene() {
        return this.scenesService.views.activeScene;
    }
    get baseResolutions() {
        return this.videoSettingsService.baseResolutions;
    }
    get resizeRegions() {
        let regions = [];
        this.selectionService.views.globalSelection.getItems().forEach(item => {
            regions = regions.concat(this.generateResizeRegionsForItem(item));
        });
        return regions;
    }
    generateResizeRegionsForItem(item) {
        var _a, _b, _c, _d;
        const renderedRegionRadius = 5;
        const factor = byOS({ [OS.Windows]: this.windowsService.state.main.scaleFactor, [OS.Mac]: 1 });
        const radiusLowerBound = Math.min(this.baseResolutions[(_a = item.display) !== null && _a !== void 0 ? _a : 'horizontal'].baseWidth, this.baseResolutions[(_b = item.display) !== null && _b !== void 0 ? _b : 'horizontal'].baseHeight);
        const radiusUpperBound = Math.max(this.baseResolutions[(_c = item.display) !== null && _c !== void 0 ? _c : 'horizontal'].baseWidth, this.baseResolutions[(_d = item.display) !== null && _d !== void 0 ? _d : 'horizontal'].baseHeight);
        const regionRadius = (renderedRegionRadius * factor * radiusUpperBound) / radiusLowerBound;
        const width = regionRadius * 2;
        const height = regionRadius * 2;
        const rect = new ScalableRectangle(item.rectangle);
        rect.normalize();
        return [
            {
                item,
                width,
                height,
                name: 'nw',
                x: rect.x - regionRadius,
                y: rect.y - regionRadius,
                cursor: 'nwse-resize',
            },
            {
                item,
                width,
                height,
                name: 'n',
                x: rect.x + rect.scaledWidth / 2 - regionRadius,
                y: rect.y - regionRadius,
                cursor: 'ns-resize',
            },
            {
                item,
                width,
                height,
                name: 'ne',
                x: rect.x + rect.scaledWidth - regionRadius,
                y: rect.y - regionRadius,
                cursor: 'nesw-resize',
            },
            {
                item,
                width,
                height,
                name: 'e',
                x: rect.x + rect.scaledWidth - regionRadius,
                y: rect.y + rect.scaledHeight / 2 - regionRadius,
                cursor: 'ew-resize',
            },
            {
                item,
                width,
                height,
                name: 'se',
                x: rect.x + rect.scaledWidth - regionRadius,
                y: rect.y + rect.scaledHeight - regionRadius,
                cursor: 'nwse-resize',
            },
            {
                item,
                width,
                height,
                name: 's',
                x: rect.x + rect.scaledWidth / 2 - regionRadius,
                y: rect.y + rect.scaledHeight - regionRadius,
                cursor: 'ns-resize',
            },
            {
                item,
                width,
                height,
                name: 'sw',
                x: rect.x - regionRadius,
                y: rect.y + rect.scaledHeight - regionRadius,
                cursor: 'nesw-resize',
            },
            {
                item,
                width,
                height,
                name: 'w',
                x: rect.x - regionRadius,
                y: rect.y + rect.scaledHeight / 2 - regionRadius,
                cursor: 'ew-resize',
            },
        ];
    }
    SET_CURSOR(cursor) {
        this.state.cursor = cursor;
    }
    SET_CHANGING_POSITION_IN_PROGRESS(enabled) {
        this.state.changingPositionInProgress = enabled;
    }
}
EditorService.initialState = {
    cursor: 'default',
    changingPositionInProgress: false,
};
__decorate([
    Inject()
], EditorService.prototype, "scenesService", void 0);
__decorate([
    Inject()
], EditorService.prototype, "windowsService", void 0);
__decorate([
    Inject()
], EditorService.prototype, "selectionService", void 0);
__decorate([
    Inject()
], EditorService.prototype, "customizationService", void 0);
__decorate([
    Inject()
], EditorService.prototype, "editorCommandsService", void 0);
__decorate([
    Inject()
], EditorService.prototype, "tcpServerService", void 0);
__decorate([
    Inject()
], EditorService.prototype, "videoSettingsService", void 0);
__decorate([
    mutation()
], EditorService.prototype, "SET_CURSOR", null);
__decorate([
    mutation()
], EditorService.prototype, "SET_CHANGING_POSITION_IN_PROGRESS", null);
//# sourceMappingURL=editor.js.map