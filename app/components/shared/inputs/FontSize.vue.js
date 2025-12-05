var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import SliderInput from './SliderInput.vue';
import { metadata } from 'components/shared/inputs';
let FontSize = class FontSize extends BaseInput {
    constructor() {
        super(...arguments);
        this.sliderOptions = metadata.slider(Object.assign({ min: 8, max: 144 }, this.options));
    }
    get sliderValue() {
        return parseInt(this.value, 10);
    }
    updateValue(value) {
        this.emitInput(value.toString());
    }
};
__decorate([
    Prop()
], FontSize.prototype, "value", void 0);
__decorate([
    Prop()
], FontSize.prototype, "metadata", void 0);
__decorate([
    Prop()
], FontSize.prototype, "title", void 0);
FontSize = __decorate([
    Component({
        components: {
            SliderInput,
        },
    })
], FontSize);
export default FontSize;
//# sourceMappingURL=FontSize.vue.js.map