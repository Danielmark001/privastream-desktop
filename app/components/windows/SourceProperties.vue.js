var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ModalLayout from 'components/ModalLayout.vue';
import { Display } from 'components/shared/ReactComponentList';
import GenericForm from 'components/obs/inputs/GenericForm';
import StreamlabelProperties from 'components/custom-source-properties/StreamlabelProperties';
import PlatformAppProperties from 'components/custom-source-properties/PlatformAppProperties.vue';
import { $t } from 'services/i18n';
import * as remote from '@electron/remote';
let SourceProperties = class SourceProperties extends Vue {
    constructor() {
        super(...arguments);
        this.sourceId = this.windowsService.getChildWindowQueryParams().sourceId;
        this.source = this.sourcesService.views.getSource(this.sourceId);
        this.properties = [];
        this.hasErrors = false;
    }
    mounted() {
        this.properties = this.source ? this.source.getPropertiesFormData() : [];
        this.sourceRemovedSub = this.sourcesService.sourceRemoved.subscribe(source => {
            if (source.sourceId === this.sourceId) {
                this.source = null;
                remote.getCurrentWindow().close();
            }
        });
        this.sourceUpdatedSub = this.sourcesService.sourceUpdated.subscribe(source => {
            if (source.sourceId === this.sourceId) {
                this.refresh();
            }
        });
    }
    destroyed() {
        this.sourceRemovedSub.unsubscribe();
        this.sourceUpdatedSub.unsubscribe();
    }
    get propertiesManagerUI() {
        if (this.source)
            return this.source.getPropertiesManagerUI();
    }
    onInputHandler(properties, changedIndex) {
        if (properties[changedIndex].name === 'video_config') {
            this.usageStatisticsService.actions.recordFeatureUsage('DShowConfigureVideo');
        }
        this.editorCommandsService.executeCommand('EditSourcePropertiesCommand', this.sourceId, [
            properties[changedIndex],
        ]);
    }
    refresh() {
        this.properties = this.source.getPropertiesFormData();
    }
    closeWindow() {
        this.windowsService.closeChildWindow();
    }
    done() {
        this.closeWindow();
    }
    cancel() {
        this.closeWindow();
    }
    get windowTitle() {
        const source = this.sourcesService.views.getSource(this.sourceId);
        return source ? $t('Properties for %{sourceName}', { sourceName: source.name }) : '';
    }
    onValidateHandler(errors) {
        this.hasErrors = !!errors.length;
    }
};
__decorate([
    Inject()
], SourceProperties.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], SourceProperties.prototype, "windowsService", void 0);
__decorate([
    Inject()
], SourceProperties.prototype, "customizationService", void 0);
__decorate([
    Inject()
], SourceProperties.prototype, "editorCommandsService", void 0);
__decorate([
    Inject()
], SourceProperties.prototype, "usageStatisticsService", void 0);
SourceProperties = __decorate([
    Component({
        components: {
            ModalLayout,
            Display,
            GenericForm,
            StreamlabelProperties,
            PlatformAppProperties,
        },
    })
], SourceProperties);
export default SourceProperties;
//# sourceMappingURL=SourceProperties.vue.js.map