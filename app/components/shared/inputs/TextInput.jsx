var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import cx from 'classnames';
import styles from './TextInput.m.less';
import { BaseInput } from './BaseInput';
import { $t } from 'services/i18n';
let TextInput = class TextInput extends BaseInput {
    constructor() {
        super(...arguments);
        this.textVisible = !this.metadata.masked;
    }
    toggleVisible() {
        this.textVisible = !this.textVisible;
    }
    getValidations() {
        return Object.assign(Object.assign({}, super.getValidations()), { date_format: this.options.dateFormat, max: this.options.max, min: this.options.min, alpha_num: this.options.alphaNum });
    }
    get toggleVisibleButton() {
        return (this.metadata.masked && (<button class={cx('button', styles.buttonInput, 'button--default')} onClick={this.toggleVisible}>
          {this.textVisible ? $t('Hide') : $t('Show')}
        </button>));
    }
    handleInput(value) {
        if (!this.metadata.emitOnChange)
            this.emitInput(value);
    }
    handleChange(value) {
        if (this.metadata.emitOnChange)
            this.emitInput(value);
    }
    render() {
        return (<span class={cx(styles.textInput, {
                [styles.fullWidth]: this.metadata.fullWidth,
                [styles.disabled]: this.metadata.disabled,
            })} data-role="input" data-type="text" data-name={this.options.name} data-title={this.options.title}>
        {this.options.icon && <i class={`fa fa-${this.options.icon}`}/>}
        <input type={this.textVisible ? 'text' : 'password'} placeholder={this.options.placeholder} value={this.value} onInput={(e) => this.handleInput(e.target.value)} onChange={(e) => this.handleChange(e.target.value)} name={this.options.uuid} v-validate={this.validate} disabled={this.options.disabled} onFocus={() => this.$emit('focus')} onBlur={() => this.$emit('blur')}/>
        {this.toggleVisibleButton}
        {this.$slots.default}
      </span>);
    }
};
__decorate([
    Prop()
], TextInput.prototype, "value", void 0);
__decorate([
    Prop({ default: () => ({}) })
], TextInput.prototype, "metadata", void 0);
__decorate([
    Prop()
], TextInput.prototype, "title", void 0);
TextInput = __decorate([
    Component({})
], TextInput);
export default TextInput;
//# sourceMappingURL=TextInput.jsx.map