var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { WidgetDefinitions, WidgetType } from 'services/widgets';
import { $t } from 'services/i18n';
import { metadata } from 'components/widgets/inputs/index';
import { InheritMutations } from 'services/core/stateful-service';
import { BaseGoalService } from './base-goal';
import { formMetadata } from 'components/shared/inputs';
let StreamBossService = class StreamBossService extends BaseGoalService {
    getApiSettings() {
        return {
            type: WidgetType.StreamBoss,
            url: WidgetDefinitions[WidgetType.StreamBoss].url(this.getHost(), this.getWidgetToken()),
            previewUrl: `https://${this.getHost()}/widgets/streamboss?token=${this.getWidgetToken()}`,
            settingsUpdateEvent: 'streambossSettingsUpdate',
            goalCreateEvent: 'newStreamboss',
            goalResetEvent: 'streambossEnd',
            dataFetchUrl: `https://${this.getHost()}/api/v5/slobs/widget/streamboss/settings`,
            settingsSaveUrl: `https://${this.getHost()}/api/v5/slobs/widget/streamboss/settings`,
            goalUrl: `https://${this.getHost()}/api/v5/slobs/widget/streamboss`,
            testers: ['Follow', 'Subscription', 'Donation', 'Bits'],
            customCodeAllowed: true,
            customFieldsAllowed: true,
        };
    }
    getMetadata() {
        return formMetadata({
            total_health: metadata.number({
                title: $t('Starting Health'),
                required: true,
                min: 0,
            }),
            mode: metadata.list({
                title: $t('Mode'),
                options: [
                    {
                        title: $t('Fixed'),
                        value: 'fixed',
                        description: $t('The boss will spawn with the set amount of health everytime.'),
                    },
                    {
                        title: $t('Incremental'),
                        value: 'incremental',
                        description: $t('The boss will have additional health each time he is defeated. The amount is set below.'),
                    },
                    {
                        title: $t('Overkill'),
                        value: 'overkill',
                        description: $t("The boss' health will change depending on how much damage is dealt on the killing blow. Excess damage multiplied by the multiplier will be the boss' new health. I.e. 150 damage with 100 health remaining and a set multiplier of 3 would result in the new boss having 150 health on spawn. \n Set your multiplier below."),
                    },
                ],
            }),
            incr_amount: metadata.number({ title: $t('Increment Amount'), isInteger: true }),
            overkill_multiplier: metadata.number({ title: $t('Overkill Multiplier'), isInteger: true }),
            overkill_min: metadata.number({ title: $t('Overkill Min Health'), isInteger: true }),
            fade_time: metadata.slider({
                title: $t('Fade Time (s)'),
                min: 0,
                max: 20,
                description: $t('Set to 0 to always appear on screen'),
            }),
            boss_heal: metadata.bool({
                title: $t('Damage From Boss Heals'),
            }),
            skin: metadata.list({
                title: $t('Theme'),
                options: [
                    { value: 'default', title: 'Default' },
                    { value: 'future', title: 'Future' },
                    { value: 'noimg', title: 'No Image' },
                    { value: 'pill', title: 'Slim' },
                    { value: 'future-curve', title: 'Curved' },
                ],
            }),
            kill_animation: metadata.animation({
                title: $t('Kill Animation'),
            }),
            bg_transparent: metadata.bool({
                title: $t('Transparent Background'),
            }),
            background_color: metadata.color({
                title: $t('Background Color'),
            }),
            text_color: metadata.color({
                title: $t('Text Color'),
            }),
            bar_text_color: metadata.color({
                title: $t('Health Text Color'),
            }),
            bar_color: metadata.color({
                title: $t('Health Bar Color'),
            }),
            bar_bg_color: metadata.color({
                title: $t('Health Bar Background Color'),
            }),
            font: metadata.fontFamily({
                title: $t('Font'),
            }),
        });
    }
    multipliersByPlatform() {
        const platform = this.userService.platform.type;
        return {
            twitch: [
                { key: 'bit_multiplier', title: $t('Damage Per Bit'), isInteger: true },
                { key: 'sub_multiplier', title: $t('Damage Per Subscriber'), isInteger: true },
                { key: 'follow_multiplier', title: $t('Damage Per Follower'), isInteger: true },
            ],
            facebook: [
                { key: 'follow_multiplier', title: $t('Damage Per Follower'), isInteger: true },
                { key: 'sub_multiplier', title: $t('Damage Per Subscriber'), isInteger: true },
            ],
            youtube: [
                { key: 'sub_multiplier', title: $t('Damage Per Membership'), isInteger: true },
                { key: 'superchat_multiplier', title: $t('Damage Per Superchat Dollar'), isInteger: true },
                { key: 'follow_multiplier', title: $t('Damage Per Subscriber'), isInteger: true },
            ],
            trovo: [
                { key: 'sub_multiplier', title: $t('Damage Per Subscriber'), isInteger: true },
                { key: 'follow_multiplier', title: $t('Damage Per Follower'), isInteger: true },
            ],
        }[platform];
    }
};
StreamBossService.initialState = WIDGET_INITIAL_STATE;
StreamBossService = __decorate([
    InheritMutations()
], StreamBossService);
export { StreamBossService };
//# sourceMappingURL=stream-boss.js.map