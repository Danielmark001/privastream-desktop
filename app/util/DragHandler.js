var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Inject } from 'services/core/injector';
import { ScalableRectangle } from 'util/ScalableRectangle';
import { byOS, OS } from './operating-systems';
export class DragHandler {
    constructor(startEvent, options) {
        this.mouseOffset = { x: 0, y: 0 };
        this.snapEnabled = this.settingsService.views.values.General.SnappingEnabled;
        this.renderedSnapDistance = this.settingsService.views.values.General.SnapDistance;
        this.screenSnapping = this.settingsService.views.values.General.ScreenSnapping;
        this.sourceSnapping = this.settingsService.views.values.General.SourceSnapping;
        this.centerSnapping = this.settingsService.views.values.General.CenterSnapping;
        const baseRes = this.videoSettingsService.baseResolutions[startEvent.display];
        this.baseWidth = baseRes.baseWidth;
        this.baseHeight = baseRes.baseHeight;
        this.displaySize = options.displaySize;
        this.displayOffset = options.displayOffset;
        this.scaleFactor = byOS({
            [OS.Windows]: this.windowsService.state.main.scaleFactor,
            [OS.Mac]: 1,
        });
        this.snapDistance =
            (this.renderedSnapDistance * this.scaleFactor * this.baseWidth) / this.displaySize.x;
        const lastDragged = this.selectionService.views.globalSelection.getLastSelected();
        if (lastDragged.isItem()) {
            if (startEvent.display !== lastDragged.display) {
                const dualOutputNodeId = this.dualOutputService.views.getDualOutputNodeId(lastDragged.id);
                if (dualOutputNodeId) {
                    const dualOutputNode = this.selectionService.views.globalSelection
                        .getItems()
                        .find(item => item.id === dualOutputNodeId);
                    this.draggedSource = dualOutputNode !== null && dualOutputNode !== void 0 ? dualOutputNode : lastDragged;
                }
                else {
                    this.draggedSource = lastDragged;
                }
            }
            else {
                this.draggedSource = lastDragged;
            }
        }
        this.otherSources = this.selectionService.views.globalSelection
            .clone()
            .invert()
            .getItems()
            .filter(item => item.isVisualSource);
        const rect = new ScalableRectangle(this.draggedSource.rectangle);
        rect.normalize();
        const pos = this.mousePositionInCanvasSpace(startEvent);
        this.mouseOffset.x = pos.x - rect.x;
        this.mouseOffset.y = pos.y - rect.y;
        this.targetEdges = this.generateTargetEdges();
    }
    move(event) {
        const rect = new ScalableRectangle(this.draggedSource.rectangle);
        const denormalize = rect.normalize();
        const mousePos = this.mousePositionInCanvasSpace(event);
        rect.x = mousePos.x - this.mouseOffset.x;
        rect.y = mousePos.y - this.mouseOffset.y;
        if (this.dualOutputService.views.dualOutputMode) {
            rect.normalize();
            const dragBoundaries = {
                left: -rect.scaledWidth - this.displayOffset.x,
                top: -rect.scaledHeight - this.displayOffset.y,
                right: this.baseWidth + this.displayOffset.x,
                bottom: this.baseHeight + this.displayOffset.y,
            };
            if (rect.x < 0 && rect.x <= dragBoundaries.left) {
                rect.x = dragBoundaries.left + 0.5;
                return true;
            }
            else if (rect.y < 0 && rect.y <= dragBoundaries.top) {
                rect.y = dragBoundaries.top + 0.5;
                return true;
            }
            else if (rect.x >= dragBoundaries.right) {
                rect.x = dragBoundaries.right - 0.5;
                return true;
            }
            else if (rect.y >= dragBoundaries.bottom) {
                rect.y = dragBoundaries.bottom - 0.5;
                return true;
            }
        }
        if (this.snapEnabled && !event.ctrlKey) {
            const sourceEdges = this.generateSourceEdges(rect);
            const leftDistance = this.getNearestEdgeDistance(sourceEdges.left, this.targetEdges.left);
            const rightDistance = this.getNearestEdgeDistance(sourceEdges.right, this.targetEdges.right);
            const topDistance = this.getNearestEdgeDistance(sourceEdges.top, this.targetEdges.top);
            const bottomDistance = this.getNearestEdgeDistance(sourceEdges.bottom, this.targetEdges.bottom);
            let snapDistanceX = 0;
            let snapDistanceY = 0;
            if (Math.abs(leftDistance) <= Math.abs(rightDistance)) {
                if (Math.abs(leftDistance) < this.snapDistance)
                    snapDistanceX = leftDistance;
            }
            else {
                if (Math.abs(rightDistance) < this.snapDistance)
                    snapDistanceX = rightDistance;
            }
            if (Math.abs(topDistance) <= Math.abs(bottomDistance)) {
                if (Math.abs(topDistance) < this.snapDistance)
                    snapDistanceY = topDistance;
            }
            else {
                if (Math.abs(bottomDistance) < this.snapDistance)
                    snapDistanceY = bottomDistance;
            }
            rect.x += snapDistanceX;
            rect.y += snapDistanceY;
        }
        denormalize();
        const deltaX = rect.x - this.draggedSource.transform.position.x;
        const deltaY = rect.y - this.draggedSource.transform.position.y;
        this.editorCommandsService.executeCommand('MoveItemsCommand', this.selectionService.views.globalSelection, { x: deltaX, y: deltaY }, event.display);
        return false;
    }
    mousePositionInCanvasSpace(event) {
        return this.pageSpaceToCanvasSpace({
            x: event.pageX - this.displayOffset.x,
            y: event.pageY - this.displayOffset.y,
        }, event.display);
    }
    pageSpaceToCanvasSpace(vec, display = 'horizontal') {
        const baseWidth = this.videoSettingsService.baseResolutions[display].baseWidth;
        const baseHeight = this.videoSettingsService.baseResolutions[display].baseHeight;
        return {
            x: (vec.x * this.scaleFactor * baseWidth) / this.displaySize.x,
            y: (vec.y * this.scaleFactor * baseHeight) / this.displaySize.y,
        };
    }
    edgesOverlap(a, b) {
        if (a.offset + a.length < b.offset) {
            return false;
        }
        if (b.offset + b.length < a.offset) {
            return false;
        }
        return true;
    }
    getNearestEdgeDistance(sourceEdge, targetEdges) {
        let minDistance = Infinity;
        targetEdges.forEach(targetEdge => {
            if (!this.edgesOverlap(targetEdge, sourceEdge))
                return;
            const distance = targetEdge.depth - sourceEdge.depth;
            if (Math.abs(distance) < Math.abs(minDistance)) {
                minDistance = distance;
            }
        });
        return minDistance;
    }
    generateTargetEdges() {
        const targetEdges = {
            left: [],
            top: [],
            right: [],
            bottom: [],
        };
        if (this.screenSnapping) {
            targetEdges.left.push({
                depth: 0,
                offset: 0,
                length: this.baseHeight,
            });
            targetEdges.top.push({
                depth: 0,
                offset: 0,
                length: this.baseWidth,
            });
            targetEdges.right.push({
                depth: this.baseWidth,
                offset: 0,
                length: this.baseHeight,
            });
            targetEdges.bottom.push({
                depth: this.baseHeight,
                offset: 0,
                length: this.baseWidth,
            });
        }
        if (this.sourceSnapping) {
            this.otherSources.forEach(source => {
                const edges = this.generateSourceEdges(new ScalableRectangle(source.rectangle));
                targetEdges.left.push(edges.right);
                targetEdges.top.push(edges.bottom);
                targetEdges.right.push(edges.left);
                targetEdges.bottom.push(edges.top);
            });
        }
        return targetEdges;
    }
    generateSourceEdges(source) {
        const rect = new ScalableRectangle({
            x: source.x,
            y: source.y,
            width: source.width,
            height: source.height,
            scaleX: source.scaleX,
            scaleY: source.scaleY,
            crop: source.crop,
            rotation: source.rotation,
        });
        rect.normalize();
        return {
            left: {
                depth: rect.x,
                offset: rect.y,
                length: rect.scaledHeight,
            },
            top: {
                depth: rect.y,
                offset: rect.x,
                length: rect.scaledWidth,
            },
            right: {
                depth: rect.x + rect.scaledWidth,
                offset: rect.y,
                length: rect.scaledHeight,
            },
            bottom: {
                depth: rect.y + rect.scaledHeight,
                offset: rect.x,
                length: rect.scaledWidth,
            },
        };
    }
}
__decorate([
    Inject()
], DragHandler.prototype, "settingsService", void 0);
__decorate([
    Inject()
], DragHandler.prototype, "videoSettingsService", void 0);
__decorate([
    Inject()
], DragHandler.prototype, "windowsService", void 0);
__decorate([
    Inject()
], DragHandler.prototype, "selectionService", void 0);
__decorate([
    Inject()
], DragHandler.prototype, "editorCommandsService", void 0);
__decorate([
    Inject()
], DragHandler.prototype, "dualOutputService", void 0);
//# sourceMappingURL=DragHandler.js.map