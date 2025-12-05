var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import { ObsInput } from './ObsInput';
let ObsButtonInput = class ObsButtonInput extends ObsInput {
    handleClick() {
        this.emitInput(Object.assign(Object.assign({}, this.value), { value: true }));
    }
};
__decorate([
    Prop()
], ObsButtonInput.prototype, "value", void 0);
ObsButtonInput = __decorate([
    Component
], ObsButtonInput);
ObsButtonInput.obsType = 'OBS_PROPERTY_BUTTON';
export default ObsButtonInput;
//# sourceMappingURL=ObsButtonInput.vue.js.map