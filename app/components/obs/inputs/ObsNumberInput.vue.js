var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import { ObsInput } from './ObsInput';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
let ObsNumberInput = class ObsNumberInput extends ObsInput {
    get metadata() {
        return {
            type: 'number',
            name: this.value.name,
            disabled: this.value.enabled === false,
            min: this.value.minVal,
            max: this.value.maxVal,
            title: this.value.description,
            fullWidth: true,
            required: true,
        };
    }
    updateValue(value) {
        this.emitInput(Object.assign(Object.assign({}, this.value), { value }));
    }
};
__decorate([
    Prop()
], ObsNumberInput.prototype, "value", void 0);
ObsNumberInput = __decorate([
    Component({
        components: { HFormGroup },
    })
], ObsNumberInput);
ObsNumberInput.obsType = ['OBS_PROPERTY_DOUBLE', 'OBS_PROPERTY_FLOAT'];
export default ObsNumberInput;
//# sourceMappingURL=ObsNumberInput.vue.js.map