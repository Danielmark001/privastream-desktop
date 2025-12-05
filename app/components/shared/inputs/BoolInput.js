var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import cx from 'classnames';
import { BaseInput } from './BaseInput';
let BoolInput = class BoolInput extends BaseInput {
    handleClick(e) {
        this.emitInput(!this.value, e);
    }
    render() {
        return (React.createElement("div", { class: cx('input-wrapper', { disabled: this.options.disabled }), "data-role": "input", "data-type": "bool", "data-name": this.options.name },
            React.createElement("div", { class: "checkbox", onClick: this.handleClick },
                React.createElement("input", { type: "checkbox", checked: this.value, disabled: this.options.disabled }),
                React.createElement("label", null, this.options.title || '\u00A0'),
                this.options.tooltip && (React.createElement("i", { style: "margin-left: 8px", class: "icon-question icon-btn", "v-tooltip": this.options.tooltip })))));
    }
};
__decorate([
    Prop()
], BoolInput.prototype, "value", void 0);
__decorate([
    Prop()
], BoolInput.prototype, "title", void 0);
__decorate([
    Prop()
], BoolInput.prototype, "metadata", void 0);
BoolInput = __decorate([
    Component({})
], BoolInput);
export default BoolInput;
//# sourceMappingURL=BoolInput.js.map