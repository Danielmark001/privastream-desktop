var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop, Watch } from 'vue-property-decorator';
import { ObsInput } from './ObsInput';
import { default as Utils } from 'services/utils';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { BoolButtonInput } from 'components/shared/inputs/inputs';
let ObsBitMaskInput = class ObsBitMaskInput extends ObsInput {
    constructor() {
        super(...arguments);
        this.flags = [];
    }
    mounted() {
        this.updateFlags();
    }
    updateFlags() {
        this.flags = Utils.numberToBinnaryArray(this.value.value, this.value.size).reverse();
    }
    onChangeHandler(index, state) {
        this.$set(this.flags, index, Number(state));
        const value = Utils.binnaryArrayToNumber(this.flags.reverse());
        this.emitInput(Object.assign(Object.assign({}, this.value), { value }));
    }
};
__decorate([
    Prop()
], ObsBitMaskInput.prototype, "value", void 0);
__decorate([
    Watch('value')
], ObsBitMaskInput.prototype, "updateFlags", null);
ObsBitMaskInput = __decorate([
    Component({ components: { HFormGroup, BoolButtonInput } })
], ObsBitMaskInput);
ObsBitMaskInput.obsType = 'OBS_PROPERTY_BITMASK';
export default ObsBitMaskInput;
//# sourceMappingURL=ObsBitMaskInput.vue.js.map