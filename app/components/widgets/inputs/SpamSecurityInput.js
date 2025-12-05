var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import { Slider } from 'streamlabs-beaker';
import { BaseInput } from 'components/shared/inputs/BaseInput';
import { $t } from 'services/i18n';
let SpamSecurityInput = class SpamSecurityInput extends BaseInput {
    constructor() {
        super(...arguments);
        this.idxMod = this.metadata.indexModifier || 0;
        this.localValue = this.optionData[this.value - this.idxMod];
    }
    get optionData() {
        if (this.metadata.data)
            return this.metadata.data;
        return [$t('Off'), $t('Low'), $t('Medium'), $t('High'), $t('Very High')];
    }
    updateLocalValue(value) {
        this.localValue = value;
        this.emitInput(this.optionData.indexOf(value) + this.idxMod);
    }
    render() {
        return (React.createElement(Slider, { value: this.localValue, onInput: (value) => this.updateLocalValue(value), speed: 0, data: this.optionData }));
    }
};
__decorate([
    Prop()
], SpamSecurityInput.prototype, "value", void 0);
__decorate([
    Prop()
], SpamSecurityInput.prototype, "metadata", void 0);
__decorate([
    Prop()
], SpamSecurityInput.prototype, "title", void 0);
SpamSecurityInput = __decorate([
    Component({})
], SpamSecurityInput);
export default SpamSecurityInput;
//# sourceMappingURL=SpamSecurityInput.js.map