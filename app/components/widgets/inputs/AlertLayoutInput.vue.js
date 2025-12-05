var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { BaseInput } from 'components/shared/inputs/BaseInput';
import ImagePickerInput from '../../shared/inputs/ImagePickerInput.vue';
let AlertLayoutInput = class AlertLayoutInput extends BaseInput {
    get layoutOptions() {
        const nightMode = this.customizationService.isDarkTheme ? 'night' : 'day';
        return [
            {
                description: require(`../../../../media/images/alert-box/layout-bottom-${nightMode}.png`),
                value: 'above',
            },
            {
                description: require(`../../../../media/images/alert-box/layout-over-${nightMode}.png`),
                value: 'banner',
            },
            {
                description: require(`../../../../media/images/alert-box/layout-side-${nightMode}.png`),
                value: 'side',
            },
        ];
    }
    get meta() {
        return Object.assign({ options: this.layoutOptions }, this.metadata);
    }
};
__decorate([
    Inject()
], AlertLayoutInput.prototype, "customizationService", void 0);
__decorate([
    Prop()
], AlertLayoutInput.prototype, "value", void 0);
__decorate([
    Prop()
], AlertLayoutInput.prototype, "metadata", void 0);
__decorate([
    Prop()
], AlertLayoutInput.prototype, "title", void 0);
AlertLayoutInput = __decorate([
    Component({
        components: { ImagePickerInput },
    })
], AlertLayoutInput);
export default AlertLayoutInput;
//# sourceMappingURL=AlertLayoutInput.vue.js.map