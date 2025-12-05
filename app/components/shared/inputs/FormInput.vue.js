var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import * as sharedInputComponents from 'components/shared/inputs/inputs';
import * as widgetInputComponents from 'components/widgets/inputs/inputs';
import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
let FormInput = class FormInput extends BaseInput {
    get componentName() {
        const type = this.options.type;
        return type.charAt(0).toUpperCase() + type.slice(1) + 'Input';
    }
    getOptions() {
        const options = super.getOptions();
        options.type = this.type || options.type;
        options.title = this.title || options.title;
        return options;
    }
};
__decorate([
    Prop()
], FormInput.prototype, "type", void 0);
__decorate([
    Prop()
], FormInput.prototype, "value", void 0);
__decorate([
    Prop({ default: () => ({}) })
], FormInput.prototype, "metadata", void 0);
__decorate([
    Prop()
], FormInput.prototype, "title", void 0);
FormInput = __decorate([
    Component({
        components: Object.assign(Object.assign({}, sharedInputComponents), widgetInputComponents),
    })
], FormInput);
export default FormInput;
//# sourceMappingURL=FormInput.vue.js.map