var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ObsInput } from './ObsInput';
import { Component, Prop } from 'vue-property-decorator';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { $t } from 'services/i18n';
let ObsFontSizeSelector = class ObsFontSizeSelector extends ObsInput {
    setFontSizePreset(size) {
        this.emitInput(size);
    }
    get metadata() {
        return {
            type: 'slider',
            data: this.fontSizePresets,
            piecewise: true,
            piecewiseLabel: true,
            max: 288,
            min: 9,
            title: $t('Font Size'),
        };
    }
    get fontSizePresets() {
        return [9, 10, 11, 12, 13, 14, 18, 24, 36, 48, 64, 72, 96, 144, 256, 288];
    }
};
__decorate([
    Prop()
], ObsFontSizeSelector.prototype, "value", void 0);
ObsFontSizeSelector = __decorate([
    Component({ components: { HFormGroup } })
], ObsFontSizeSelector);
export default ObsFontSizeSelector;
//# sourceMappingURL=ObsFontSizeSelector.vue.js.map