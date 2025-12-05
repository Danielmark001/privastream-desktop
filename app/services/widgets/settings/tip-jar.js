var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { WidgetDefinitions, WidgetSettingsService, WidgetType, } from 'services/widgets';
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { InheritMutations } from 'services/core/stateful-service';
let TipJarService = class TipJarService extends WidgetSettingsService {
    getApiSettings() {
        return {
            type: WidgetType.TipJar,
            url: WidgetDefinitions[WidgetType.TipJar].url(this.getHost(), this.getWidgetToken()),
            previewUrl: `https://${this.getHost()}/widgets/tip-jar/v1/${this.getWidgetToken()}?simulate=1`,
            dataFetchUrl: `https://${this.getHost()}/api/v5/slobs/widget/tipjar`,
            settingsSaveUrl: `https://${this.getHost()}/api/v5/slobs/widget/tipjar`,
            settingsUpdateEvent: 'tipJarSettingsUpdate',
            testers: ['Follow', 'Subscription', 'Donation', 'Bits'],
        };
    }
    patchAfterFetch(data) {
        data.settings.custom_enabled = data.settings.custom_html_enabled;
        data.settings.background_color = data.settings.background.color;
        return data;
    }
    patchBeforeSend(data) {
        data.custom_html_enabled = data.custom_enabled;
        data.background.color = data.background_color;
        return data;
    }
};
TipJarService.initialState = WIDGET_INITIAL_STATE;
TipJarService = __decorate([
    InheritMutations()
], TipJarService);
export { TipJarService };
//# sourceMappingURL=tip-jar.js.map