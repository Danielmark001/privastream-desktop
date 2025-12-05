var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from 'components/shared/inputs/BaseInput';
import ImagePickerInput from '../../shared/inputs/ImagePickerInput.vue';
let ImageLayoutInput = class ImageLayoutInput extends BaseInput {
    constructor() {
        super(...arguments);
        this.layoutOptions = [
            { description: require('../../../../media/images/layout-image-side.png'), value: 'side' },
            { description: require('../../../../media/images/layout-image-above.png'), value: 'above' },
        ];
    }
    get meta() {
        return Object.assign({ options: this.layoutOptions }, this.metadata);
    }
};
__decorate([
    Prop()
], ImageLayoutInput.prototype, "value", void 0);
__decorate([
    Prop()
], ImageLayoutInput.prototype, "title", void 0);
__decorate([
    Prop()
], ImageLayoutInput.prototype, "metadata", void 0);
ImageLayoutInput = __decorate([
    Component({
        components: { ImagePickerInput },
    })
], ImageLayoutInput);
export default ImageLayoutInput;
//# sourceMappingURL=ImageLayoutInput.vue.js.map