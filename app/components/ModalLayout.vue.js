var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import TsxComponent from 'components/tsx-component';
import { OS, getOS } from 'util/operating-systems';
import Scrollable from 'components/shared/Scrollable';
let ModalLayout = class ModalLayout extends TsxComponent {
    constructor() {
        super(...arguments);
        this.contentStyle = {};
        this.fixedStyle = {};
        this.theme = 'night-theme';
    }
    created() {
        this.unbind = this.customizationService.state.bindProps(this, {
            theme: 'theme',
        });
        const contentStyle = {
            padding: '16px',
        };
        Object.assign(contentStyle, this.contentStyles);
        const fixedStyle = {
            height: `${this.fixedSectionHeight || 0}px`,
        };
        this.contentStyle = contentStyle;
        this.fixedStyle = fixedStyle;
    }
    destroyed() {
        this.unbind();
    }
    get wrapperClassNames() {
        return {
            [this.theme]: true,
            'has-titlebar': this.hasTitleBar,
            'modal-layout-mac': getOS() === OS.Mac,
        };
    }
    cancel() {
        if (this.cancelHandler) {
            this.cancelHandler();
        }
        else {
            this.windowsService.closeChildWindow();
        }
    }
    done() {
        if (this.doneHandler) {
            this.doneHandler();
        }
        else {
            this.windowsService.closeChildWindow();
        }
    }
    get loading() {
        return this.appService.state.loading;
    }
};
__decorate([
    Inject()
], ModalLayout.prototype, "customizationService", void 0);
__decorate([
    Inject()
], ModalLayout.prototype, "windowsService", void 0);
__decorate([
    Inject()
], ModalLayout.prototype, "appService", void 0);
__decorate([
    Prop({ default: true })
], ModalLayout.prototype, "showControls", void 0);
__decorate([
    Prop({ default: true })
], ModalLayout.prototype, "showCancel", void 0);
__decorate([
    Prop({ default: true })
], ModalLayout.prototype, "showDone", void 0);
__decorate([
    Prop({ default: false })
], ModalLayout.prototype, "disableDone", void 0);
__decorate([
    Prop({ default: false })
], ModalLayout.prototype, "containsTabs", void 0);
__decorate([
    Prop()
], ModalLayout.prototype, "doneHandler", void 0);
__decorate([
    Prop()
], ModalLayout.prototype, "cancelHandler", void 0);
__decorate([
    Prop()
], ModalLayout.prototype, "contentStyles", void 0);
__decorate([
    Prop()
], ModalLayout.prototype, "fixedSectionHeight", void 0);
__decorate([
    Prop({ default: false })
], ModalLayout.prototype, "customControls", void 0);
__decorate([
    Prop({ default: true })
], ModalLayout.prototype, "hasTitleBar", void 0);
ModalLayout = __decorate([
    Component({ components: { Scrollable } })
], ModalLayout);
export default ModalLayout;
//# sourceMappingURL=ModalLayout.vue.js.map