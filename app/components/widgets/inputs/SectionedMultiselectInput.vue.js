var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from 'components/shared/inputs/BaseInput';
import { Multiselect } from 'vue-multiselect';
let SectionedMultiselectInput = class SectionedMultiselectInput extends BaseInput {
    get displayValue() {
        let val = null;
        this.options.options.forEach(category => {
            if (!val) {
                val = category.options.find((opt) => opt.value === this.value);
            }
        });
        return val;
    }
};
__decorate([
    Prop()
], SectionedMultiselectInput.prototype, "value", void 0);
__decorate([
    Prop()
], SectionedMultiselectInput.prototype, "metadata", void 0);
__decorate([
    Prop()
], SectionedMultiselectInput.prototype, "title", void 0);
SectionedMultiselectInput = __decorate([
    Component({
        components: { Multiselect },
    })
], SectionedMultiselectInput);
export default SectionedMultiselectInput;
//# sourceMappingURL=SectionedMultiselectInput.vue.js.map