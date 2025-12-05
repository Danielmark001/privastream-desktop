var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { WidgetModule } from './useWidget';
import { message } from 'antd';
import Utils from '../../../services/utils';
import { Services } from '../../service-provider';
import { DEFAULT_CUSTOM_FIELDS } from './CustomFields';
import { getDefined } from '../../../util/properties-type-guards';
import { injectChild, injectState, injectWatch, mutation, useModule } from 'slap';
class CodeEditorModule {
    constructor(widgetParams) {
        this.widgetParams = widgetParams;
        this.tabs = [
            { label: 'Custom Fields', key: 'json' },
            { label: 'HTML', key: 'html' },
            { label: 'CSS', key: 'css' },
            { label: 'JS', key: 'js' },
        ];
        this.state = injectState({
            selectedTab: 'json',
            canSave: false,
            isLoading: true,
            customCode: {
                custom_enabled: true,
                custom_json: '',
                custom_html: '',
                custom_css: '',
                custom_js: '',
            },
        });
        this.widgetModule = injectChild(WidgetModule, this.widgetParams);
        this.watchWidgetModule = injectWatch(() => this.widgetModule.state.isLoading, () => this.reset());
    }
    saveCode() {
        if (!this.hasValidJson) {
            message.error('Invalid JSON');
            return;
        }
        const newCustomCode = this.state.customCode;
        const custom_json = newCustomCode.custom_json && JSON.parse(newCustomCode.custom_json);
        this.widgetModule.updateCustomCode(Object.assign(Object.assign({}, newCustomCode), { custom_json }));
        this.disableSave();
        Utils.sleep(1000).then(() => Services.WidgetsService.actions.invalidateSettingsWindow());
    }
    get code() {
        const { customCode, selectedTab } = this.state;
        return customCode[`custom_${selectedTab}`];
    }
    get hasValidJson() {
        const json = this.state.customCode.custom_json;
        if (!json)
            return true;
        try {
            JSON.parse(json);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    setCode(code) {
        this.state.customCode[`custom_${this.state.selectedTab}`] = code;
        this.state.canSave = true;
    }
    close() {
        Services.WindowsService.actions.closeOneOffWindow(Utils.getWindowId());
    }
    reset() {
        const customCode = getDefined(this.widgetModule.customCode);
        this.state.update(Object.assign(Object.assign({}, this.state.getters), { isLoading: false, customCode: Object.assign(Object.assign({}, customCode), { custom_json: customCode.custom_json ? JSON.stringify(customCode.custom_json, null, 2) : '' }), canSave: false }));
    }
    selectTab(tab) {
        this.state.selectedTab = tab;
    }
    disableSave() {
        this.state.canSave = false;
    }
    addCustomFields() {
        this.setCode(JSON.stringify(DEFAULT_CUSTOM_FIELDS, null, 2));
    }
    removeCustomFields() {
        this.setCode('');
    }
}
__decorate([
    mutation()
], CodeEditorModule.prototype, "setCode", null);
__decorate([
    mutation()
], CodeEditorModule.prototype, "reset", null);
__decorate([
    mutation()
], CodeEditorModule.prototype, "selectTab", null);
__decorate([
    mutation()
], CodeEditorModule.prototype, "disableSave", null);
__decorate([
    mutation()
], CodeEditorModule.prototype, "addCustomFields", null);
__decorate([
    mutation()
], CodeEditorModule.prototype, "removeCustomFields", null);
export function useCodeEditor(widgetParams) {
    const params = widgetParams ? [widgetParams] : false;
    return useModule(CodeEditorModule, params);
}
//# sourceMappingURL=useCodeEditor.jsx.map