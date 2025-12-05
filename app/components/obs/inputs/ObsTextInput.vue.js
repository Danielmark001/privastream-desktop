var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import { ObsInput } from './ObsInput';
import { TextInput, TextAreaInput } from 'components/shared/inputs/inputs';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
let ObsTextInput = class ObsTextInput extends ObsInput {
    get metadata() {
        return {
            name: this.value.name,
            masked: this.value.masked,
            disabled: this.value.enabled === false,
            rows: 4,
            fullWidth: true,
            emitOnChange: this.value.name === 'url',
        };
    }
    onInputHandler(value) {
        this.emitInput(Object.assign(Object.assign({}, this.value), { value }));
    }
};
__decorate([
    Prop()
], ObsTextInput.prototype, "value", void 0);
ObsTextInput = __decorate([
    Component({
        components: { TextInput, TextAreaInput, HFormGroup },
    })
], ObsTextInput);
ObsTextInput.obsType = ['OBS_PROPERTY_EDIT_TEXT', 'OBS_PROPERTY_TEXT'];
export default ObsTextInput;
//# sourceMappingURL=ObsTextInput.vue.js.map