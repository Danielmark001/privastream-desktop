var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component } from 'vue-property-decorator';
import styles from './ImageUploaderInput.m.less';
import { BaseInput } from './BaseInput';
import { $t } from 'services/i18n';
import { createProps } from 'components/tsx-component';
import Utils from '../../../services/utils';
class Props {
    constructor() {
        this.value = '';
        this.metadata = null;
    }
}
let ImageUploaderInput = class ImageUploaderInput extends BaseInput {
    constructor() {
        super(...arguments);
        this.errorMessage = '';
    }
    get imageUrl() {
        return this.hasNonDefaultValue ? this.value : this.options.defaultUrl;
    }
    get hasNonDefaultValue() {
        return this.value && this.value !== 'default';
    }
    onFileChangeHandler(ev) {
        const files = ev.currentTarget.files;
        if (!(files === null || files === void 0 ? void 0 : files.length))
            return;
        const fr = new FileReader();
        const file = files[0];
        this.errorMessage = '';
        if (file.size > this.options.maxFileSize) {
            this.errorMessage =
                $t('Maximum file size reached ') +
                    Utils.getReadableFileSizeString(this.options.maxFileSize);
            this.emitInput('');
            return;
        }
        fr.readAsDataURL(file);
        fr.addEventListener('load', () => {
            this.emitInput(fr.result);
        });
    }
    clearImage() {
        this.emitInput('default');
    }
    render() {
        return (React.createElement("div", { "data-role": "input", "data-type": "imageUploader", "data-name": this.options.name, class: styles.imageUploader },
            this.imageUrl && React.createElement("img", { src: this.imageUrl, alt: "", class: styles.image }),
            !this.hasNonDefaultValue && (React.createElement("div", { class: styles.footer },
                this.errorMessage && React.createElement("span", { class: "input-error" }, this.errorMessage),
                !this.errorMessage && React.createElement("span", null, $t('Select image')))),
            React.createElement("label", { class: styles.fileLabel },
                React.createElement("input", { type: "file", onchange: (ev) => this.onFileChangeHandler(ev), accept: ".jpg, .png, .jpeg" })),
            this.hasNonDefaultValue && (React.createElement("div", { class: styles.footer },
                React.createElement("span", { onclick: () => this.clearImage() }, $t('Clear'))))));
    }
};
ImageUploaderInput = __decorate([
    Component({ props: createProps(Props) })
], ImageUploaderInput);
export default ImageUploaderInput;
//# sourceMappingURL=ImageUloaderInput.js.map