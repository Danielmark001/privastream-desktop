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
import { WidgetDefinitions, WidgetSettingsService, WidgetType, } from 'services/widgets';
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { InheritMutations } from 'services/core/stateful-service';
import { $t } from 'services/i18n';
import { formMetadata } from 'components/shared/inputs';
import { metadata } from 'components/widgets/inputs';
import uuid from 'uuid/v4';
import { authorizedHeaders, handleResponse } from 'util/requests';
let SpinWheelService = class SpinWheelService extends WidgetSettingsService {
    getApiSettings() {
        return {
            type: WidgetType.SpinWheel,
            url: WidgetDefinitions[WidgetType.SpinWheel].url(this.getHost(), this.getWidgetToken()),
            previewUrl: `https://${this.getHost()}/widgets/wheel?token=${this.getWidgetToken()}`,
            dataFetchUrl: `https://${this.getHost()}/api/v5/slobs/widget/wheel`,
            settingsSaveUrl: `https://${this.getHost()}/api/v5/slobs/widget/wheel`,
            settingsUpdateEvent: 'WheelSettingsUpdate',
            customCodeAllowed: true,
            customFieldsAllowed: true,
        };
    }
    getMetadata(categoryOptions) {
        return formMetadata({
            resultTemplate: metadata.textArea({ title: $t('Results Template') }),
            resultColor: metadata.color({ title: $t('Results Color') }),
            hideTimeout: metadata.slider({ title: $t('Hide Timeout'), min: 0, max: 15 }),
            rotationSpeed: metadata.slider({ title: $t('Rotation Speed'), min: 1, max: 50 }),
            slowRate: metadata.slider({ title: $t('Slowdown Rate'), min: 1, max: 10 }),
            sectionWeightList: metadata.numberList({ options: categoryOptions }),
            sectionWeightSlider: metadata.slider({ min: 1, max: 20 }),
            fontFamily: metadata.fontFamily({ title: $t('Font') }),
            fontSize: metadata.fontSize({ title: $t('Font Size') }),
            fontColor: metadata.color({ title: $t('Font Color') }),
            fontWeight: metadata.slider({ title: $t('Font Weight'), min: 300, max: 900, interval: 100 }),
            labelHeight: metadata.slider({ title: $t('Label Height'), min: 1, max: 30 }),
            labelWidth: metadata.slider({ title: $t('Label Width'), min: 0, max: 10 }),
            borderColor: metadata.color({ title: $t('Border Color') }),
            innerBorderWidth: metadata.slider({ title: $t('Inner Border Width'), min: 0, max: 10 }),
            outerBorderWidth: metadata.slider({ title: $t('Outer Border Width'), min: 0, max: 20 }),
            tickerUrl: metadata.mediaGallery({ title: $t('Ticker Image') }),
            tickerSize: metadata.slider({ title: $t('Ticker Size'), min: 1, max: 10 }),
            tickerTone: metadata.sound({ title: $t('Ticker Tone') }),
            centerEnabled: metadata.toggle({ title: $t('Center Image Enabled') }),
            centerDefault: metadata.mediaGallery({ title: $t('Center Image') }),
            centerSize: metadata.slider({ title: $t('Center Image Size'), min: 1, max: 10 }),
            centerBorderEnabled: metadata.toggle({ title: $t('Center Image Border Enabled') }),
            centerBorderColor: metadata.color({ title: $t('Center Image Border Color') }),
            centerBorderWidth: metadata.slider({
                title: $t('Center Image Border Width'),
                min: 1,
                max: 15,
            }),
        });
    }
    spinWheel() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `https://${this.getHost()}/api/v5/slobs/widget/wheel/spin/${this.getWidgetToken()}`;
            const headers = authorizedHeaders(this.userService.apiToken);
            const request = new Request(url, { headers, method: 'POST' });
            const response = yield fetch(request);
            return handleResponse(response);
        });
    }
    patchAfterFetch(data) {
        data.settings.categories = JSON.parse(data.settings.categories).map((category) => (Object.assign({ key: uuid() }, category)));
        data.settings.sections = JSON.parse(data.settings.sections).map((sect) => (Object.assign({ key: uuid() }, sect)));
        return data;
    }
    patchBeforeSend(settings) {
        const newSettings = Object.assign({}, settings);
        return newSettings;
    }
};
SpinWheelService.initialState = WIDGET_INITIAL_STATE;
SpinWheelService = __decorate([
    InheritMutations()
], SpinWheelService);
export { SpinWheelService };
//# sourceMappingURL=spin-wheel.js.map