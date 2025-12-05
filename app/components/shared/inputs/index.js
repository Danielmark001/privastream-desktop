import * as inputs from './inputs';
import { Validator } from 'vee-validate';
import { $t } from 'services/i18n';
import cloneDeep from 'lodash/cloneDeep';
export const inputComponents = inputs;
export var EInputType;
(function (EInputType) {
    EInputType["bool"] = "bool";
    EInputType["number"] = "number";
    EInputType["text"] = "text";
    EInputType["date"] = "date";
    EInputType["slider"] = "slider";
    EInputType["color"] = "color";
    EInputType["list"] = "list";
    EInputType["textArea"] = "textArea";
    EInputType["fontSize"] = "fontSize";
    EInputType["fontFamily"] = "fontFamily";
    EInputType["code"] = "code";
    EInputType["file"] = "file";
    EInputType["timer"] = "timer";
    EInputType["toggle"] = "toggle";
    EInputType["mediaGallery"] = "mediaGallery";
    EInputType["sound"] = "sound";
    EInputType["imageUploader"] = "imageUploader";
})(EInputType || (EInputType = {}));
export class InputMetadata {
    constructor() {
        this.timer = (options) => (Object.assign({ type: EInputType.timer }, options));
        this.bool = (options) => (Object.assign({ type: EInputType.bool }, options));
        this.number = (options) => (Object.assign({ type: EInputType.number }, options));
        this.text = (options) => (Object.assign({ type: EInputType.text }, options));
        this.date = (options) => (Object.assign({ type: EInputType.date }, options));
        this.color = (options) => (Object.assign({ type: EInputType.color }, options));
        this.slider = (options) => (Object.assign({ type: EInputType.slider }, options));
        this.textArea = (options) => (Object.assign({ type: EInputType.textArea }, options));
        this.fontSize = (options) => (Object.assign({ type: EInputType.fontSize }, options));
        this.fontFamily = (options) => (Object.assign({ type: EInputType.fontFamily }, options));
        this.code = (options) => (Object.assign({ type: EInputType.code }, options));
        this.file = (options) => (Object.assign({ type: EInputType.file }, options));
        this.toggle = (options) => (Object.assign({ type: EInputType.toggle }, options));
        this.mediaGallery = (options) => (Object.assign({ type: EInputType.mediaGallery }, options));
        this.sound = (options) => (Object.assign({ type: EInputType.sound }, options));
        this.imageUploader = (options) => (Object.assign({ type: EInputType.imageUploader }, options));
    }
    list(options) {
        return Object.assign({ type: EInputType.list }, options);
    }
}
export const metadata = new InputMetadata();
export function formMetadata(inputsMetadata) {
    const formMetadata = cloneDeep(inputsMetadata);
    Object.keys(inputsMetadata).forEach(key => {
        if (formMetadata[key]['name'])
            return;
        formMetadata[key]['name'] = key;
    });
    return formMetadata;
}
const validationMessages = {
    en: {
        messages: {
            required: () => $t('The field is required'),
            min_value: (fieldName, params) => $t('The field value must be %{value} or larger', { value: params[0] }),
            max_value: (fieldName, params) => $t('The field value must be %{value} or less', { value: params[0] }),
            date_format: (fieldName, params) => $t('The date must be in %{format} format', { format: params[0] }),
            alpha_num: () => $t('This field may only contain alphabetic characters or numbers'),
            min: (fieldName, params) => $t('This field must be at least %{value} characters.', { value: params[0] }),
            max: (fieldName, params) => $t('This field may not be greater than %{value} characters.', { value: params[0] }),
        },
    },
};
Validator.localize(validationMessages);
//# sourceMappingURL=index.js.map