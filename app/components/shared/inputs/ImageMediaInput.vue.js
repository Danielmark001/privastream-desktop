var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { MediaGalleryInput } from './inputs';
let ImageMediaInput = class ImageMediaInput extends BaseInput {
    get imageMetadata() {
        return Object.assign(Object.assign({}, this.metadata), { imageOnly: true });
    }
};
__decorate([
    Prop({ default: '' })
], ImageMediaInput.prototype, "value", void 0);
__decorate([
    Prop({ default: {} })
], ImageMediaInput.prototype, "metadata", void 0);
__decorate([
    Prop()
], ImageMediaInput.prototype, "title", void 0);
ImageMediaInput = __decorate([
    Component({
        components: { MediaGalleryInput },
    })
], ImageMediaInput);
export default ImageMediaInput;
//# sourceMappingURL=ImageMediaInput.vue.js.map