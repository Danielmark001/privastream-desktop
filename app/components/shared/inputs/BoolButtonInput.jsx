var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import cx from 'classnames';
import { BaseInput } from './BaseInput';
import styles from './BoolButtonInput.m.less';
let BoolInput = class BoolInput extends BaseInput {
    handleClick(e) {
        if (this.options.disabled)
            return;
        this.emitInput(!this.value, e);
    }
    render() {
        var _a;
        let customStyles = Object.assign({}, this.checkboxStyles);
        if (this.value) {
            customStyles = Object.assign(Object.assign({}, customStyles), this.checkboxActiveStyles);
        }
        return (<div class={cx('input-wrapper', { disabled: this.options.disabled })} data-role="input" data-type="toggle" data-value={!!this.value} data-name={this.options.name}>
        <div class={cx(styles.boolButton, { [styles.active]: !!this.value })} style={customStyles} onClick={() => this.handleClick()}>
          {(_a = this.options.title) !== null && _a !== void 0 ? _a : (this.value && <i class="fa fa-check"></i>)}
        </div>
        {this.options.tooltip && (<i style="margin-left: 8px" class="icon-question icon-btn" v-tooltip={this.options.tooltip}/>)}
      </div>);
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
__decorate([
    Prop({
        default: () => {
            return {};
        },
    })
], BoolInput.prototype, "checkboxStyles", void 0);
__decorate([
    Prop({
        default: () => {
            return {};
        },
    })
], BoolInput.prototype, "checkboxActiveStyles", void 0);
BoolInput = __decorate([
    Component({})
], BoolInput);
export default BoolInput;
//# sourceMappingURL=BoolButtonInput.jsx.map