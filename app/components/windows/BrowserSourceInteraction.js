var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import TsxComponent from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import ModalLayout from '../ModalLayout.vue';
import { Display } from 'components/shared/ReactComponentList';
import { Inject } from 'services';
import Utils from 'services/utils';
import { byOS, OS } from 'util/operating-systems';
let BrowserSourceInteraction = class BrowserSourceInteraction extends TsxComponent {
    constructor() {
        super(...arguments);
        this.currentRegion = { x: 0, y: 0, width: 1, height: 1 };
    }
    get sourceId() {
        const windowId = Utils.getCurrentUrlParams().windowId;
        return this.windowsService.getWindowOptions(windowId).sourceId;
    }
    get source() {
        return this.sourcesService.views.getSource(this.sourceId);
    }
    onOutputResize(region) {
        this.currentRegion = region;
        this.source.sendFocus(true);
    }
    eventLocationInSourceSpace(e) {
        const factor = byOS({ [OS.Windows]: this.windowsService.state.child.scaleFactor, [OS.Mac]: 1 });
        return {
            x: ((e.offsetX * factor - this.currentRegion.x) / this.currentRegion.width) *
                this.source.width,
            y: ((e.offsetY * factor - this.currentRegion.y) / this.currentRegion.height) *
                this.source.height,
        };
    }
    onWheel(e) {
        this.source.mouseWheel(this.eventLocationInSourceSpace(e), {
            x: e.deltaX,
            y: e.deltaY,
        });
    }
    onMousedown(e) {
        this.source.mouseClick(e.button, this.eventLocationInSourceSpace(e), false);
    }
    onMouseup(e) {
        this.source.mouseClick(e.button, this.eventLocationInSourceSpace(e), true);
    }
    onMousemove(e) {
        const pos = this.eventLocationInSourceSpace(e);
        if (pos.x < 0 || pos.y < 0)
            return;
        this.source.mouseMove(pos);
    }
    onKeydown(e) {
        if (this.isModifierPress(e))
            return;
        this.source.keyInput(e.key, e.keyCode, false, this.getModifiers(e));
    }
    onKeyup(e) {
        if (this.isModifierPress(e))
            return;
        this.source.keyInput(e.key, e.keyCode, true, this.getModifiers(e));
    }
    isModifierPress(event) {
        return (event.key === 'Control' ||
            event.key === 'Alt' ||
            event.key === 'Meta' ||
            event.key === 'Shift');
    }
    getModifiers(e) {
        return {
            alt: e.altKey,
            ctrl: e.ctrlKey,
            shift: e.shiftKey,
        };
    }
    mounted() {
        this.$refs.eventDiv.focus();
    }
    render() {
        return (React.createElement(ModalLayout, { showControls: false, contentStyles: { padding: '0px' } },
            React.createElement("div", { slot: "content", onWheel: this.onWheel, onMousedown: this.onMousedown, onMouseup: this.onMouseup, onMousemove: this.onMousemove, onKeydown: this.onKeydown, onKeyup: this.onKeyup, tabindex: "0", style: { outline: 'none', height: '100%' }, ref: "eventDiv" },
                React.createElement(Display, { componentProps: {
                        sourceId: this.sourceId,
                        onOutputResize: (rect) => this.onOutputResize(rect),
                    } }))));
    }
};
__decorate([
    Inject()
], BrowserSourceInteraction.prototype, "windowsService", void 0);
__decorate([
    Inject()
], BrowserSourceInteraction.prototype, "sourcesService", void 0);
BrowserSourceInteraction = __decorate([
    Component({})
], BrowserSourceInteraction);
export default BrowserSourceInteraction;
//# sourceMappingURL=BrowserSourceInteraction.js.map