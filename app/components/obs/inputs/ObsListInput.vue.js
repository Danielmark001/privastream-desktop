var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import { ObsInput } from './ObsInput';
import { ListInput } from 'components/shared/inputs/inputs';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { $t } from 'services/i18n';
let ObsListInput = class ObsListInput extends ObsInput {
    onInputHandler(value) {
        this.emitInput(Object.assign(Object.assign({}, this.value), { value }));
    }
    onSearchChange(value) {
        this.$emit('search-change', value);
    }
    get metadata() {
        return {
            loading: this.loading,
            disabled: this.value.enabled === false,
            placeholder: this.placeholder,
            allowEmpty: false,
            internalSearch: this.internalSearch,
            name: this.value.name,
            title: this.value.description,
            options: this.value.options.map(opt => {
                if (opt.value === 0 && opt.description === '') {
                    return { title: $t('Select Option'), value: 0 };
                }
                return { title: opt.description, value: opt.value };
            }),
        };
    }
};
__decorate([
    Prop()
], ObsListInput.prototype, "value", void 0);
__decorate([
    Prop({ default: true })
], ObsListInput.prototype, "allowEmpty", void 0);
__decorate([
    Prop({ default: true })
], ObsListInput.prototype, "internalSearch", void 0);
__decorate([
    Prop({ default: 'Select Option' })
], ObsListInput.prototype, "placeholder", void 0);
__decorate([
    Prop({ default: false })
], ObsListInput.prototype, "loading", void 0);
ObsListInput = __decorate([
    Component({
        components: { HFormGroup, ListInput },
    })
], ObsListInput);
ObsListInput.obsType = 'OBS_PROPERTY_LIST';
export default ObsListInput;
//# sourceMappingURL=ObsListInput.vue.js.map