var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
let ImagePickerInput = class ImagePickerInput extends BaseInput {
};
__decorate([
    Prop({ default: '' })
], ImagePickerInput.prototype, "value", void 0);
__decorate([
    Prop({ default: {} })
], ImagePickerInput.prototype, "metadata", void 0);
__decorate([
    Prop()
], ImagePickerInput.prototype, "title", void 0);
ImagePickerInput = __decorate([
    Component({})
], ImagePickerInput);
export default ImagePickerInput;
//# sourceMappingURL=ImagePickerInput.vue.js.map