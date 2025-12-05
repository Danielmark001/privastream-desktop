var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import { ObsInput } from './ObsInput';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { metadata } from 'components/shared/inputs';
import { BoolInput } from 'components/shared/inputs/inputs';
let ObsBoolInput = class ObsBoolInput extends ObsInput {
    get metadata() {
        return metadata.bool({
            title: this.value.showDescription !== false ? this.value.description : null,
            name: this.value.name,
            disabled: !this.value.enabled,
        });
    }
    handleClick() {
        if (!this.value.enabled)
            return;
        this.emitInput(Object.assign(Object.assign({}, this.value), { value: !this.value.value }));
    }
};
__decorate([
    Prop()
], ObsBoolInput.prototype, "value", void 0);
ObsBoolInput = __decorate([
    Component({
        components: { HFormGroup, BoolInput },
    })
], ObsBoolInput);
ObsBoolInput.obsType = 'OBS_PROPERTY_BOOL';
export default ObsBoolInput;
//# sourceMappingURL=ObsBoolInput.vue.js.map