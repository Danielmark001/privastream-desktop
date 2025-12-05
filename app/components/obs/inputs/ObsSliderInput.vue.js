var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import { ObsInput } from './ObsInput';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
let ObsSliderInput = class ObsSliderInput extends ObsInput {
    constructor() {
        super(...arguments);
        this.localValue = this.value.value;
    }
    get metadata() {
        return {
            type: 'slider',
            name: this.value.name,
            title: this.value.showDescription !== false ? this.value.description : undefined,
            disabled: this.value.enabled === false,
            max: this.value.maxVal,
            min: this.value.minVal,
            interval: this.value.stepVal,
            hasValueBox: true,
            usePercentages: this.value.usePercentages,
        };
    }
    updateValue(value) {
        this.localValue = value;
        this.emitValue(value);
    }
    emitValue(value) {
        this.emitInput(Object.assign(Object.assign({}, this.value), { value }));
    }
};
__decorate([
    Prop()
], ObsSliderInput.prototype, "value", void 0);
ObsSliderInput = __decorate([
    Component({
        components: { HFormGroup },
    })
], ObsSliderInput);
ObsSliderInput.obsType = 'OBS_PROPERTY_SLIDER';
export default ObsSliderInput;
//# sourceMappingURL=ObsSliderInput.vue.js.map