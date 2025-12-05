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
import { Component, Prop } from 'vue-property-decorator';
import { BoolInput, CodeInput } from 'components/shared/inputs/inputs';
import { Inject } from '../../services/core/injector';
import { $t } from 'services/i18n/index';
import { debounce } from 'lodash-decorators';
import Scrollable from 'components/shared/Scrollable';
let CodeEditor = class CodeEditor extends Vue {
    constructor() {
        super(...arguments);
        this.editorInputValue = this.value.settings[`custom_${this.metadata.type}`] ||
            this.selectedVariation.settings[this.alertBoxValue];
        this.serverInputValue = this.editorInputValue;
        this.isLoading = false;
    }
    created() {
        this.settingsService = this.widgetsService.getWidgetSettingsService(this.value.type);
    }
    destroyed() {
        this.save();
    }
    get alertBoxValue() {
        const capitalizedType = this.metadata.type.charAt(0).toUpperCase() + this.metadata.type.slice(1);
        return `custom${capitalizedType}`;
    }
    get hasChanges() {
        return this.serverInputValue !== this.editorInputValue;
    }
    get canSave() {
        return this.hasChanges && !this.isLoading;
    }
    get selectedVariation() {
        if (!this.metadata.selectedAlert || !this.metadata.selectedId)
            return;
        return this.value.settings[this.metadata.selectedAlert].variations.find((variation) => variation.id === this.metadata.selectedId);
    }
    setCustomCode(newData) {
        const type = this.metadata.type;
        if (this.selectedVariation) {
            const newVariation = newData.settings[this.metadata.selectedAlert].variations.find((variation) => variation.id === this.metadata.selectedId);
            newVariation.settings[this.alertBoxValue] = this.editorInputValue;
        }
        else {
            newData.settings[`custom_${type}`] = this.editorInputValue;
        }
        return newData;
    }
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.canSave)
                return;
            this.isLoading = true;
            let newData = cloneDeep(this.value);
            newData = this.setCustomCode(newData);
            try {
                yield this.settingsService.saveSettings(newData.settings);
            }
            catch (e) {
                this.onFailHandler($t('Save failed, something went wrong.'));
                this.isLoading = false;
                return;
            }
            this.serverInputValue = this.editorInputValue;
            this.isLoading = false;
        });
    }
    restoreDefaults() {
        const type = this.metadata.type;
        if (this.value.custom_defaults) {
            this.editorInputValue = this.value.custom_defaults[type];
        }
        else {
            this.onFailHandler($t('This widget does not have defaults.'));
        }
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
], CodeEditor.prototype, "widgetsService", void 0);
__decorate([
    Prop()
], CodeEditor.prototype, "metadata", void 0);
__decorate([
    Prop()
], CodeEditor.prototype, "value", void 0);
__decorate([
    debounce(2000)
], CodeEditor.prototype, "save", null);
CodeEditor = __decorate([
    Component({
        components: {
            CodeInput,
            BoolInput,
            Scrollable,
        },
    })
], CodeEditor);
export default CodeEditor;
//# sourceMappingURL=CodeEditor.vue.js.map