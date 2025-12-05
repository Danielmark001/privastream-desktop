var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import ListInput from 'components/shared/inputs/ListInput.vue';
import { BaseInput } from 'components/shared/inputs/BaseInput';
import { $t } from 'services/i18n';
let FrequencyInput = class FrequencyInput extends BaseInput {
    constructor() {
        super(...arguments);
        this.listOptions = [
            { title: $t('Very Rarely'), value: '1' },
            { title: $t('Rarely'), value: '2' },
            { title: $t('As Default'), value: '3' },
            { title: $t('Frequently'), value: '4' },
            { title: $t('Very Frequently'), value: '5' },
        ];
    }
    get listInputMetadata() {
        return Object.assign(Object.assign({}, this.options), { options: this.listOptions });
    }
};
__decorate([
    Prop()
], FrequencyInput.prototype, "value", void 0);
__decorate([
    Prop()
], FrequencyInput.prototype, "metadata", void 0);
__decorate([
    Prop()
], FrequencyInput.prototype, "title", void 0);
FrequencyInput = __decorate([
    Component({
        components: { ListInput },
    })
], FrequencyInput);
export default FrequencyInput;
//# sourceMappingURL=FrequencyInput.vue.js.map