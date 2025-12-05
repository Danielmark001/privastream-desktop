var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import { Multiselect } from 'vue-multiselect';
import { BaseInput } from './BaseInput';
import { Spinner } from 'streamlabs-beaker';
let ListInput = class ListInput extends BaseInput {
    get placeholder() {
        return this.options.placeholder || 'Select Option';
    }
    onInputHandler(option) {
        if (option) {
            this.emitInput(option.value);
        }
        else if (this.options.allowEmpty) {
            this.emitInput(null);
        }
        else {
            this.emitInput(this.value);
        }
    }
    getOptions() {
        const options = super.getOptions();
        return Object.assign(Object.assign({}, options), { internalSearch: options.internalSearch == null ? true : options.internalSearch, allowEmpty: !!options.allowEmpty });
    }
    getImage(option) {
        var _a;
        return ((_a = option.data) === null || _a === void 0 ? void 0 : _a.image) || '';
    }
    get iconSizeStyle() {
        const { width, height } = this.props.imageSize
            ? this.props.imageSize
            : { width: 15, height: 15 };
        return {
            width: `${width}px`,
            height: `${height}px`,
        };
    }
    get currentMultiselectValue() {
        const options = this.options.options;
        let option = options.find((opt) => this.value === opt.value);
        if (this.value && this.options.allowCustom) {
            option = { value: this.value, title: this.value };
            this.options.options.push(option);
        }
        if (option)
            return option;
        if (this.getOptions().allowEmpty)
            return null;
        return options[0];
    }
    get selectedOption() {
        return this.options.options.find(option => option.value === this.value);
    }
    onSearchChangeHandler(value) {
        this.$emit('search-change', value);
        this.$props.handleSearchChange && this.$props.handleSearchChange(value);
    }
};
__decorate([
    Prop()
], ListInput.prototype, "value", void 0);
__decorate([
    Prop()
], ListInput.prototype, "metadata", void 0);
__decorate([
    Prop()
], ListInput.prototype, "title", void 0);
__decorate([
    Prop()
], ListInput.prototype, "handleSearchChange", void 0);
__decorate([
    Prop()
], ListInput.prototype, "handleOpen", void 0);
__decorate([
    Prop()
], ListInput.prototype, "showImagePlaceholder", void 0);
__decorate([
    Prop()
], ListInput.prototype, "imageSize", void 0);
ListInput = __decorate([
    Component({
        components: { Multiselect, Spinner },
    })
], ListInput);
export default ListInput;
//# sourceMappingURL=ListInput.vue.js.map