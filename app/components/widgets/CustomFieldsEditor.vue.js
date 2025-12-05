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
import Vue from 'vue';
import cloneDeep from 'lodash/cloneDeep';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { CodeInput } from 'components/shared/inputs/inputs';
import { Inject } from '../../services/core/injector';
import { $t } from 'services/i18n/index';
import { inputComponents, metadata } from 'components/shared/inputs';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { debounce } from 'lodash-decorators';
import Scrollable from 'components/shared/Scrollable';
import * as remote from '@electron/remote';
const { ToggleInput } = inputComponents;
const DEFAULT_CUSTOM_FIELDS = {
    customField1: {
        label: 'Color Picker Example',
        type: 'colorpicker',
        value: '#000EF0',
    },
    customField2: {
        label: 'Slider Example',
        type: 'slider',
        value: 100,
        max: 200,
        min: 100,
        steps: 4,
    },
    customField3: {
        label: 'Textfield Example',
        type: 'textfield',
        value: 'Hi There',
    },
    customField4: {
        label: 'Font Picker Example',
        type: 'fontpicker',
        value: 'Open Sans',
    },
    customField5: {
        label: 'Dropdown Example',
        type: 'dropdown',
        options: {
            optionA: 'Option A',
            optionB: 'Option B',
            optionC: 'Option C',
        },
        value: 'optionB',
    },
    customField6: {
        label: 'Image Input Example',
        type: 'image-input',
        value: null,
    },
    customField7: {
        label: 'Sound Input Example',
        type: 'sound-input',
        value: null,
    },
};
let CustomFieldsEditor = class CustomFieldsEditor extends Vue {
    constructor() {
        super(...arguments);
        this.customFields = null;
        this.editorInputValue = null;
        this.isEditMode = false;
        this.isLoading = false;
    }
    onDataChangeHandler() {
        return __awaiter(this, void 0, void 0, function* () {
            this.save();
        });
    }
    created() {
        this.customFields = this.selectedVariation
            ? this.selectedVariation.settings.customJson
            :
                this.value.settings['custom_json'];
        this.editorInputValue = this.selectedVariation
            ? this.selectedVariation.settings.customJson
            :
                this.value.settings['custom_json'];
        this.settingsService = this.widgetsService.getWidgetSettingsService(this.value.type);
    }
    get selectedVariation() {
        if (!this.metadata.selectedAlert || !this.metadata.selectedId)
            return;
        return this.value.settings[this.metadata.selectedAlert].variations.find((variation) => variation.id === this.metadata.selectedId);
    }
    get inputsData() {
        const fields = this.customFields;
        return Object.keys(fields).map(fieldName => {
            const field = fields[fieldName];
            const inputValue = field.value;
            let inputMetadata;
            switch (field.type) {
                case 'colorpicker':
                    inputMetadata = metadata.color({ title: field.label });
                    break;
                case 'slider':
                    inputMetadata = metadata.slider({
                        title: field.label,
                        max: field.max,
                        min: field.min,
                        interval: field.steps,
                    });
                    break;
                case 'textfield':
                    inputMetadata = metadata.text({ title: field.label });
                    break;
                case 'dropdown':
                    inputMetadata = metadata.list({
                        title: field.label,
                        options: Object.keys(field.options).map(key => ({
                            value: key,
                            title: field.options[key],
                        })),
                    });
                    break;
                case 'sound-input':
                    inputMetadata = metadata.sound({
                        title: field.label,
                    });
                    break;
                case 'image-input':
                    inputMetadata = metadata.mediaGallery({
                        title: field.label,
                    });
                    break;
                default:
                    inputMetadata = null;
                    break;
            }
            return { fieldName, value: inputValue, metadata: inputMetadata };
        });
    }
    setCustomJson(newData) {
        if (this.selectedVariation) {
            const newVariation = newData.settings[this.metadata.selectedAlert].variations.find((variation) => variation.id === this.metadata.selectedId);
            newVariation.settings.customJson = this.customFields;
        }
        else {
            newData.settings['custom_json'] = this.customFields;
        }
        return newData;
    }
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            this.isLoading = true;
            let newData = cloneDeep(this.value);
            newData = this.setCustomJson(newData);
            try {
                yield this.settingsService.saveSettings(newData.settings);
            }
            catch (e) {
                this.onFailHandler($t('Save failed, something went wrong.'));
                this.isLoading = false;
                return;
            }
            this.isLoading = false;
        });
    }
    showJsonEditor() {
        this.isEditMode = true;
        this.editorInputValue = JSON.stringify(this.customFields, null, 2);
    }
    closeJsonEditor(needSave = false) {
        if (!needSave) {
            this.isEditMode = false;
            return;
        }
        let newCustomFields;
        try {
            newCustomFields = JSON.parse(this.editorInputValue);
        }
        catch (e) {
            remote.dialog.showErrorBox($t('Error'), $t('Invalid JSON'));
            return;
        }
        this.customFields = newCustomFields;
        this.isEditMode = false;
    }
    addDefaultFields() {
        this.customFields = cloneDeep(DEFAULT_CUSTOM_FIELDS);
    }
    removeFields() {
        this.customFields = null;
        this.isEditMode = false;
    }
    emitInput(newValue) {
        this.$emit('input', newValue);
        this.editorInputValue = newValue.settings['custom_json'];
    }
    onFailHandler(msg) {
        this.$toasted.show(msg, {
            position: 'bottom-center',
            className: 'toast-alert',
            duration: 3000,
            singleton: true,
        });
    }
};
__decorate([
    Inject()
], CustomFieldsEditor.prototype, "widgetsService", void 0);
__decorate([
    Prop()
], CustomFieldsEditor.prototype, "value", void 0);
__decorate([
    Prop()
], CustomFieldsEditor.prototype, "metadata", void 0);
__decorate([
    debounce(1000),
    Watch('customFields', { deep: true })
], CustomFieldsEditor.prototype, "onDataChangeHandler", null);
CustomFieldsEditor = __decorate([
    Component({
        components: {
            CodeInput,
            ToggleInput,
            HFormGroup,
            Scrollable,
        },
    })
], CustomFieldsEditor);
export default CustomFieldsEditor;
//# sourceMappingURL=CustomFieldsEditor.vue.js.map