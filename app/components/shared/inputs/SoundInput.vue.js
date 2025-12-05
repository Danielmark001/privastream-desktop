var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Component from 'vue-class-component';
import { Inject } from 'services/core/injector';
import { Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { TextInput } from './inputs';
let SoundInput = class SoundInput extends BaseInput {
    constructor() {
        super(...arguments);
        this.url = '';
        this.showUrlUpload = false;
    }
    get fileName() {
        if (!this.value)
            return null;
        return decodeURIComponent(this.value.split(/[\\/]/).pop());
    }
    updateValue() {
        return __awaiter(this, void 0, void 0, function* () {
            const selectedFile = yield this.mediaGalleryService.pickFile({ filter: 'audio' });
            this.emitInput(selectedFile.href);
        });
    }
    clearSound() {
        this.emitInput('');
    }
    previewSound() {
        if (this.value) {
            const audio = new Audio(this.value);
            audio.play();
        }
    }
    toggleUrlUpload() {
        this.showUrlUpload = !this.showUrlUpload;
    }
    uploadUrl() {
        this.emitInput(this.url);
        this.toggleUrlUpload();
    }
};
__decorate([
    Inject()
], SoundInput.prototype, "mediaGalleryService", void 0);
__decorate([
    Prop()
], SoundInput.prototype, "value", void 0);
__decorate([
    Prop()
], SoundInput.prototype, "title", void 0);
__decorate([
    Prop()
], SoundInput.prototype, "metadata", void 0);
SoundInput = __decorate([
    Component({
        components: { TextInput },
    })
], SoundInput);
export default SoundInput;
//# sourceMappingURL=SoundInput.vue.js.map