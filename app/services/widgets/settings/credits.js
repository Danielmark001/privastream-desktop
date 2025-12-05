var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { WidgetDefinitions, WidgetSettingsService, WidgetType, } from 'services/widgets';
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { InheritMutations } from 'services/core/stateful-service';
import { authorizedHeaders } from 'util/requests';
import { formMetadata, metadata } from 'components/shared/inputs';
import { $t } from 'services/i18n';
const creditTokens = [
    '{total_donated_amount}',
    '{total_cheer_amount}',
    '{top_donor}',
    '{top_donated_amount}',
    '{top_cheer_donor}',
    '{username}',
    '{top_cheer_amount}',
    '{new_subscriber_count}',
    '{new_follower_count}',
];
let CreditsService = class CreditsService extends WidgetSettingsService {
    getApiSettings() {
        return {
            type: WidgetType.Credits,
            url: WidgetDefinitions[WidgetType.Credits].url(this.getHost(), this.getWidgetToken()),
            previewUrl: `https://${this.getHost()}/widgets/end-credits?token=${this.getWidgetToken()}&simulate=1`,
            dataFetchUrl: `https://${this.getHost()}/api/v5/slobs/widget/endcredits`,
            settingsSaveUrl: `https://${this.getHost()}/api/v5/slobs/widget/endcredits`,
            settingsUpdateEvent: 'endCreditsSettingsUpdate',
            customCodeAllowed: true,
            customFieldsAllowed: true,
        };
    }
    testRollCredits() {
        const headers = authorizedHeaders(this.userService.apiToken);
        const request = new Request(`https://${this.getHost()}/api/v5/slobs/widget/test/endcredits`, {
            headers,
        });
        return fetch(request);
    }
    getMetadata(themeOptions) {
        return formMetadata({
            title: metadata.text({ title: $t('Credit Title') }),
            subtitle: metadata.text({
                title: $t('Credit Subtitle'),
                tooltip: $t('When the credits roll, this will be the format of the subtitle. Available tokens: ') +
                    creditTokens.join(', '),
            }),
            theme: metadata.list({
                title: $t('Theme'),
                options: themeOptions,
            }),
            backgroundColor: metadata.color({ title: $t('Background Color') }),
            fontFamily: metadata.fontFamily({
                title: $t('Font'),
                tooltip: $t('The Google Font to use for the text. Visit http://google.com/fonts to find one! Popular Fonts include:' +
                    ' Open Sans, Roboto, Oswald, Lato, and Droid Sans.'),
            }),
            fontSize: metadata.fontSize({
                title: $t('Font Size'),
                min: 10,
                max: 100,
            }),
            fontColor: metadata.color({
                title: $t('Text Color'),
                tooltip: $t('A hex code for the base text color.'),
            }),
            delayTime: metadata.slider({
                title: $t('Delay Time'),
                tooltip: $t('Wait time before rerunning the credit reel.'),
                max: 10,
                interval: 1,
                min: 0,
            }),
            rollSpeed: metadata.slider({
                title: $t('Roll Speed'),
                tooltip: $t('Speed of the rolling credits.'),
                max: 5,
                interval: 1,
                min: 1,
            }),
            rollTime: metadata.slider({
                title: $t('Roll Time'),
                tooltip: $t('Duration of the rolling credits.'),
                max: 150,
                interval: 5,
                min: 15,
            }),
        });
    }
};
CreditsService.initialState = WIDGET_INITIAL_STATE;
CreditsService = __decorate([
    InheritMutations()
], CreditsService);
export { CreditsService };
//# sourceMappingURL=credits.js.map