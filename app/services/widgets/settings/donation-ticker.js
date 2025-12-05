var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { WidgetDefinitions, WidgetSettingsService, WidgetType, } from 'services/widgets';
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { InheritMutations } from 'services/core/stateful-service';
let DonationTickerService = class DonationTickerService extends WidgetSettingsService {
    getApiSettings() {
        return {
            type: WidgetType.DonationTicker,
            url: WidgetDefinitions[WidgetType.DonationTicker].url(this.getHost(), this.getWidgetToken()),
            previewUrl: `https://${this.getHost()}/widgets/donation-ticker?token=${this.getWidgetToken()}&simulate=1`,
            dataFetchUrl: `https://${this.getHost()}/api/v5/slobs/widget/ticker`,
            settingsSaveUrl: `https://${this.getHost()}/api/v5/slobs/widget/ticker`,
            settingsUpdateEvent: 'donationTickerSettingsUpdate',
            customCodeAllowed: true,
            customFieldsAllowed: true,
            hasTestButtons: true,
        };
    }
    patchAfterFetch(data) {
        data.settings.font_size = parseInt(data.settings.font_size, 10);
        data.settings.font_weight = parseInt(data.settings.font_weight, 10);
        return data;
    }
};
DonationTickerService.initialState = WIDGET_INITIAL_STATE;
DonationTickerService = __decorate([
    InheritMutations()
], DonationTickerService);
export { DonationTickerService };
//# sourceMappingURL=donation-ticker.js.map