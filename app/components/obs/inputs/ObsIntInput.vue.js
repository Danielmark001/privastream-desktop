var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import { ObsInput } from './ObsInput';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
let ObsIntInput = class ObsIntInput extends ObsInput {
    get metadata() {
        return {
            type: 'number',
            name: this.value.name,
            min: this.value.minVal,
            max: this.value.maxVal,
            disabled: this.value.enabled === false,
            isInteger: true,
            fullWidth: true,
            title: this.value.showDescription !== false ? this.value.description : null,
        };
    }
    updateValue(value) {
        let formattedValue = value;
        if (this.value.type === 'OBS_PROPERTY_UINT' && formattedValue < 0) {
            formattedValue = 0;
        }
        this.emitInput(Object.assign(Object.assign({}, this.value), { value: formattedValue }));
    }
};
__decorate([
    Prop()
], ObsIntInput.prototype, "value", void 0);
ObsIntInput = __decorate([
    Component({ components: { HFormGroup } })
], ObsIntInput);
ObsIntInput.obsType = ['OBS_PROPERTY_INT', 'OBS_PROPERTY_UINT'];
export default ObsIntInput;
//# sourceMappingURL=ObsIntInput.vue.js.map