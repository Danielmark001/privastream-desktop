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
let PollService = class PollService extends WidgetSettingsService {
    getApiSettings() {
        return {
            type: WidgetType.Poll,
            url: WidgetDefinitions[WidgetType.Poll].url(this.getHost(), this.getWidgetToken()),
            previewUrl: `https://${this.getHost()}/widgets/poll/${this.getWidgetToken()}?simulate=1`,
            dataFetchUrl: `https://${this.getHost()}/api/v5/slobs/widget/polls`,
            settingsSaveUrl: `https://${this.getHost()}/api/v5/slobs/widget/polls`,
            settingsUpdateEvent: 'pollSettingsUpdate',
            customCodeAllowed: true,
            customFieldsAllowed: true,
            hasTestButtons: true,
        };
    }
    getMetadata() {
        return formMetadata({
            pollType: metadata.list({
                title: $t('Poll Type'),
                options: [
                    { title: 'Cloudbot', value: 'cloudbot' },
                    { title: 'Twitch', value: 'twitch' },
                ],
            }),
            showOnClosed: metadata.bool({
                title: $t('Show Closed Poll'),
                tooltip: $t('Show/hide poll widget on closed poll'),
            }),
            backgroundPrimary: metadata.color({ title: $t('Primary Background Color') }),
            backgroundSecondary: metadata.color({ title: $t('Secondary Background Color') }),
            fadeTime: metadata.slider({
                title: $t('Fade Time'),
                min: 0,
                max: 60,
                tooltip: $t('Hide wigdet after X seconds of event'),
            }),
            font: metadata.fontFamily({ title: $t('Font') }),
            fontPrimary: metadata.color({ title: $t('Header Text Color') }),
            fontSecondary: metadata.color({ title: $t('Option Text Color') }),
            titleSize: metadata.slider({ title: $t('Title Font Size'), min: 12, max: 48, interval: 2 }),
            optionSize: metadata.slider({ title: $t('Option Font Size'), min: 12, max: 48, interval: 2 }),
            titleWeight: metadata.slider({
                title: $t('Title Font Weight'),
                min: 300,
                max: 900,
                interval: 100,
            }),
            optionWeight: metadata.slider({
                title: $t('Option Font Weight'),
                min: 300,
                max: 900,
                interval: 100,
            }),
            thinBar: metadata.bool({ title: $t('Thin Bar'), tooltip: $t('Display thin/thick Bar') }),
            barBackground: metadata.color({ title: $t('Bar Background Color') }),
            barColor: metadata.color({ title: $t('Bar Color') }),
        });
    }
};
PollService.initialState = WIDGET_INITIAL_STATE;
PollService = __decorate([
    InheritMutations()
], PollService);
export { PollService };
//# sourceMappingURL=poll.js.map