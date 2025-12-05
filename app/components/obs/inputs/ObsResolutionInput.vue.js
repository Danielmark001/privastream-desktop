var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import { ObsInput } from './ObsInput';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { BoolInput, ListInput, NumberInput } from 'components/shared/inputs/inputs';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { $t } from 'services/i18n';
import { formMetadata, metadata } from '../../shared/inputs';
let ObsResolutionInput = class ObsResolutionInput extends ObsInput {
    constructor() {
        super(...arguments);
        this.customMode = false;
        this.customWidth = 0;
        this.customHeight = 0;
        this.customFieldsMetadata = formMetadata({
            width: metadata.number({ title: $t('Width'), min: 8, max: 32 * 1024 }),
            height: metadata.number({ title: $t('Height'), min: 8, max: 32 * 1024 }),
        });
    }
    switchToCustomMode() {
        this.customMode = true;
        const res = this.parseResolution(this.value.value);
        this.customWidth = res.width;
        this.customHeight = res.height;
    }
    applyCustomRes() {
        this.customMode = false;
        const width = Math.max(this.customWidth, 1);
        const height = Math.max(this.customHeight, 1);
        const value = `${width}x${height}`;
        this.emitInput(Object.assign(Object.assign({}, this.value), { value }));
    }
    onSelectHandler(value) {
        this.emitInput(Object.assign(Object.assign({}, this.value), { value }));
    }
    get metadata() {
        const options = this.value.options.map(opt => ({ title: opt.description, value: opt.value }));
        return {
            disabled: this.value.enabled === false,
            options,
            allowEmpty: this.allowEmpty,
            placeholder: this.placeholder,
            name: this.value.name,
            allowCustom: true,
        };
    }
    parseResolution(resStr) {
        const match = resStr.match(/\d+/g) || [];
        const width = Number(match[0] || 400);
        const height = Number(match[1] || 400);
        return { width, height };
    }
};
__decorate([
    Prop()
], ObsResolutionInput.prototype, "value", void 0);
__decorate([
    Prop({ default: () => $t('Select Option') })
], ObsResolutionInput.prototype, "placeholder", void 0);
__decorate([
    Prop({ default: false })
], ObsResolutionInput.prototype, "allowEmpty", void 0);
ObsResolutionInput = __decorate([
    Component({
        components: { HFormGroup, VFormGroup, ListInput, BoolInput, NumberInput },
    })
], ObsResolutionInput);
ObsResolutionInput.obsType = 'OBS_INPUT_RESOLUTION_LIST';
export default ObsResolutionInput;
//# sourceMappingURL=ObsResolutionInput.vue.js.map