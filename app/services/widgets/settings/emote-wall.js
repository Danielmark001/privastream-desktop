var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { WidgetDefinitions, WidgetSettingsService, WidgetType, } from 'services/widgets';
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { InheritMutations } from 'services/core/stateful-service';
import { formMetadata, metadata } from 'components/shared/inputs';
import { $t } from 'services/i18n';
let EmoteWallService = class EmoteWallService extends WidgetSettingsService {
    getApiSettings() {
        return {
            type: WidgetType.EmoteWall,
            url: WidgetDefinitions[WidgetType.EmoteWall].url(this.getHost(), this.getWidgetToken()),
            previewUrl: `https://${this.getHost()}/widgets/emote-wall?token=${this.getWidgetToken()}&simulate=1`,
            dataFetchUrl: `https://${this.getHost()}/api/v5/slobs/widget/emote-wall`,
            settingsSaveUrl: `https://${this.getHost()}/api/v5/slobs/widget/emote-wall`,
            settingsUpdateEvent: 'emoteWallSettingsUpdate',
            customCodeAllowed: false,
            customFieldsAllowed: false,
            hasTestButtons: true,
        };
    }
    getMetadata() {
        return formMetadata({
            enabled: metadata.toggle({ title: $t('Enabled') }),
            duration: metadata.slider({ title: $t('Duration'), min: 1, max: 60 }),
            scale: metadata.slider({ title: $t('Emote Scale'), min: 1, max: 10 }),
            comboRequired: metadata.toggle({ title: $t('Combo Required') }),
            comboCount: metadata.slider({ title: $t('Combo Count'), min: 2, max: 100 }),
            comboTimeframe: metadata.slider({ title: $t('Combo Timeframe'), min: 1, max: 60 }),
            ignoreDuplicates: metadata.toggle({ title: $t('Ignore Duplicates') }),
        });
    }
    patchAfterFetch(data) {
        data.settings.combo_timeframe = data.settings.combo_timeframe / 1000;
        data.settings.emote_animation_duration = data.settings.emote_animation_duration / 1000;
        return data;
    }
    patchBeforeSend(settings) {
        settings.combo_timeframe = settings.combo_timeframe * 1000;
        settings.emote_animation_duration = settings.emote_animation_duration * 1000;
        return settings;
    }
};
EmoteWallService.initialState = WIDGET_INITIAL_STATE;
EmoteWallService = __decorate([
    InheritMutations()
], EmoteWallService);
export { EmoteWallService };
//# sourceMappingURL=emote-wall.js.map