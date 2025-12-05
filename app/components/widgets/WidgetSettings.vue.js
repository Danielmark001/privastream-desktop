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
import cloneDeep from 'lodash/cloneDeep';
import { Inject } from '../../services/core/injector';
import { $t } from 'services/i18n/index';
import { Component } from 'vue-property-decorator';
import { Debounce } from 'lodash-decorators';
import TsxComponent, { createProps } from 'components/tsx-component';
class WidgetSettingsProps {
    constructor() {
        this.goalType = '';
    }
}
let WidgetSettings = class WidgetSettings extends TsxComponent {
    constructor() {
        super(...arguments);
        this.sourceId = this.windowsService.getChildWindowOptions().queryParams.sourceId;
        this.widget = this.widgetsService.getWidgetSource(this.sourceId);
        this.wData = null;
        this.tab = 'settings';
        this.requestState = 'pending';
        this.fontFamilyTooltip = $t('The Google Font to use for the text. Visit http://google.com/fonts to find one! Popular Fonts include:' +
            ' Open Sans, Roboto, Oswald, Lato, and Droid Sans.');
        this.lastSuccessfullySavedWData = null;
        this.pendingRequests = 0;
    }
    get navItems() {
        return [];
    }
    get metadata() {
        return this.service.getMetadata();
    }
    created() {
        return __awaiter(this, void 0, void 0, function* () {
            this.service = this.widget.getSettingsService();
            try {
                this.wData = yield this.service.fetchData();
                this.lastSuccessfullySavedWData = cloneDeep(this.wData);
                this.requestState = 'success';
                this.afterFetch();
            }
            catch (e) {
                console.error('Something failed on widget settings fetch', e);
                this.requestState = 'fail';
            }
        });
    }
    mounted() {
        this.dataUpdatedSubscr = this.service.dataUpdated.subscribe(newData => {
            this.dataUpdatedHandler(newData);
        });
        this.sourceRemovedSub = this.sourcesService.sourceRemoved.subscribe(source => {
            if (source.sourceId === this.sourceId) {
                this.windowsService.actions.closeChildWindow();
            }
        });
    }
    get loaded() {
        return !!this.wData;
    }
    destroyed() {
        this.dataUpdatedSubscr.unsubscribe();
    }
    dataUpdatedHandler(data) {
        this.lastSuccessfullySavedWData = data;
        if (!this.pendingRequests) {
            this.wData = cloneDeep(this.lastSuccessfullySavedWData);
            this.widget.refresh();
        }
    }
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            this.pendingRequests++;
            try {
                yield this.service.saveSettings(this.wData.settings);
                this.requestState = 'success';
            }
            catch (e) {
                const errorMessage = e.message || $t('Save failed, something went wrong.');
                this.dataUpdatedHandler(this.lastSuccessfullySavedWData);
                this.requestState = 'fail';
                this.failHandler(errorMessage);
            }
            this.pendingRequests--;
        });
    }
    failHandler(msg) {
        this.$toasted.show(msg, {
            position: 'bottom-center',
            className: 'toast-alert',
            duration: 3000,
            singleton: true,
        });
    }
    afterFetch() {
    }
};
__decorate([
    Inject()
], WidgetSettings.prototype, "windowsService", void 0);
__decorate([
    Inject()
], WidgetSettings.prototype, "widgetsService", void 0);
__decorate([
    Inject()
], WidgetSettings.prototype, "sourcesService", void 0);
__decorate([
    Debounce(500)
], WidgetSettings.prototype, "save", null);
WidgetSettings = __decorate([
    Component({ props: createProps(WidgetSettingsProps) })
], WidgetSettings);
export default WidgetSettings;
//# sourceMappingURL=WidgetSettings.vue.js.map