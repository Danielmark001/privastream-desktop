var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
import GenericForm from 'components/obs/inputs/GenericForm';
import ModalLayout from 'components/ModalLayout.vue';
import Tabs from 'components/Tabs.vue';
import { Display, TestWidgets } from 'components/shared/ReactComponentList';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { NumberInput, ToggleInput } from 'components/shared/inputs/inputs';
import cloneDeep from 'lodash/cloneDeep';
import CustomFieldsEditor from 'components/widgets/CustomFieldsEditor.vue';
import CodeEditor from 'components/widgets/CodeEditor.vue';
import TsxComponent, { createProps } from 'components/tsx-component';
import Scrollable from 'components/shared/Scrollable';
import { EAvailableFeatures } from '../../services/incremental-rollout';
import { onUnload } from 'util/unload';
class WidgetEditorProps {
    constructor() {
        this.isAlertBox = false;
        this.selectedId = null;
        this.selectedAlert = null;
        this.slots = null;
        this.navItems = null;
    }
}
let WidgetEditor = class WidgetEditor extends TsxComponent {
    constructor() {
        super(...arguments);
        this.sourceId = this.windowsService.getChildWindowOptions().queryParams.sourceId;
        this.widget = this.widgetsService.getWidgetSource(this.sourceId);
        this.apiSettings = this.widget.getSettingsService().getApiSettings();
        this.properties = [];
        this.codeTabs = [
            { value: 'HTML', name: $t('HTML') },
            { value: 'CSS', name: $t('CSS') },
            { value: 'JS', name: $t('JS') },
        ];
        this.currentTopTab = 'editor';
        this.currentCodeTab = 'HTML';
        this.currentSetting = null;
        this.settingsState = this.widget.getSettingsService().state;
        this.animating = false;
        this.canShowEditor = false;
    }
    get loaded() {
        return !!this.settingsState.data;
    }
    get loadingFailed() {
        return !this.loaded && this.settingsState.loadingState === 'fail';
    }
    get wData() {
        if (!this.settingsState.data)
            return null;
        return cloneDeep(this.settingsState.data);
    }
    get selectedVariation() {
        if (!this.props.selectedAlert ||
            !this.props.selectedId ||
            this.props.selectedAlert === 'general') {
            return;
        }
        return this.wData.settings[this.props.selectedAlert].variations.find((variation) => variation.id === this.props.selectedId);
    }
    get customCodeIsEnabled() {
        if (this.selectedVariation) {
            return this.selectedVariation.settings.customHtmlEnabled;
        }
        return this.wData && this.wData.settings.custom_enabled;
    }
    get isSaving() {
        return this.settingsState.pendingRequests > 0;
    }
    mounted() {
        const source = this.widget.getSource();
        this.currentSetting = this.props.navItems[0].value;
        this.properties = source ? source.getPropertiesFormData() : [];
        this.widget.createPreviewSource();
        this.cancelUnload = onUnload(() => this.widget.destroyPreviewSource());
        if (this.apiSettings.customFieldsAllowed) {
            this.codeTabs.push({ value: 'customFields', name: $t('Custom Fields') });
        }
    }
    destroyed() {
        this.widget.destroyPreviewSource();
        this.cancelUnload();
    }
    get windowTitle() {
        const source = this.widget.getSource();
        return $t('Settings for %{sourceName}', { sourceName: source.name });
    }
    get sourceProperties() {
        return this.properties.slice(4);
    }
    get topProperties() {
        return this.properties.slice(1, 4);
    }
    createProjector() {
        this.projectorService.createProjector(0, this.widget.previewSourceId);
    }
    retryDataFetch() {
        const service = this.widget.getSettingsService();
        service.fetchData();
    }
    onPropsInputHandler(properties, changedIndex) {
        const source = this.widget.getSource();
        source.setPropertiesFormData([properties[changedIndex]]);
        this.properties = this.widget.getSource().getPropertiesFormData();
    }
    get topTabs() {
        const firstTab = [{ value: 'editor', name: $t('Widget Editor') }];
        if (this.props.selectedAlert === 'general') {
            return firstTab;
        }
        return this.apiSettings.customCodeAllowed
            ? firstTab.concat([{ value: 'code', name: $t('HTML CSS') }])
            : firstTab;
    }
    get shouldShowAlertboxSwitcher() {
        return (this.props.isAlertBox &&
            this.incrementalRolloutService.views.featureIsEnabled(EAvailableFeatures.reactWidgets));
    }
    updateTopTab(value) {
        if (value === this.currentTopTab)
            return;
        this.animating = true;
        this.currentTopTab = value;
        setTimeout(() => {
            this.animating = false;
            this.canShowEditor = true;
        }, 600);
    }
    updateCodeTab(value) {
        this.currentCodeTab = value;
    }
    updateCurrentSetting(value) {
        this.currentSetting = value;
    }
    autoselectCurrentSetting() {
        this.currentSetting = this.props.navItems[0].value;
    }
    toggleCustomCode(enabled) {
        this.widget
            .getSettingsService()
            .toggleCustomCode(enabled, this.wData.settings, this.selectedVariation);
    }
    switchToNewAlertboxUI() {
        this.customizationService.actions.setSettings({ legacyAlertbox: false });
        this.sourcesService.actions.showSourceProperties(this.widget.sourceId);
    }
};
__decorate([
    Inject()
], WidgetEditor.prototype, "widgetsService", void 0);
__decorate([
    Inject()
], WidgetEditor.prototype, "windowsService", void 0);
__decorate([
    Inject()
], WidgetEditor.prototype, "customizationService", void 0);
__decorate([
    Inject()
], WidgetEditor.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], WidgetEditor.prototype, "projectorService", void 0);
__decorate([
    Inject()
], WidgetEditor.prototype, "incrementalRolloutService", void 0);
__decorate([
    Watch('selectedAlert')
], WidgetEditor.prototype, "autoselectCurrentSetting", null);
WidgetEditor = __decorate([
    Component({
        components: {
            ModalLayout,
            Tabs,
            ToggleInput,
            NumberInput,
            GenericForm,
            VFormGroup,
            TestWidgets,
            Display,
            CustomFieldsEditor,
            CodeEditor,
            Scrollable,
        },
        props: createProps(WidgetEditorProps),
    })
], WidgetEditor);
export default WidgetEditor;
//# sourceMappingURL=WidgetEditor.vue.js.map