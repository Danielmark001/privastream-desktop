var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
let TextAreaInput = class TextAreaInput extends BaseInput {
    getValidations() {
        return Object.assign(Object.assign({}, super.getValidations()), { min: this.options.min, max: this.options.max });
    }
    handleInput(event) {
        const val = this.options.blockReturn
            ? event.target.value.replace(/(\r\n|\r|\n)/g, '')
            : event.target.value;
        this.emitInput(val);
    }
    handleEnter(ev) {
        if (this.options.blockReturn)
            ev.preventDefault();
    }
};
__decorate([
    Prop()
], TextAreaInput.prototype, "value", void 0);
__decorate([
    Prop({ default: () => ({}) })
], TextAreaInput.prototype, "metadata", void 0);
__decorate([
    Prop()
], TextAreaInput.prototype, "title", void 0);
TextAreaInput = __decorate([
    Component({})
], TextAreaInput);
export default TextAreaInput;
//# sourceMappingURL=TextAreaInput.vue.js.map