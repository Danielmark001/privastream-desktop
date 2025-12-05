var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { WidgetDefinitions, WidgetSettingsService, WidgetType, } from 'services/widgets';
import { metadata } from 'components/widgets/inputs/index';
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { InheritMutations } from 'services/core/stateful-service';
import { $t } from 'services/i18n';
let EventListService = class EventListService extends WidgetSettingsService {
    getApiSettings() {
        return {
            type: WidgetType.EventList,
            url: WidgetDefinitions[WidgetType.EventList].url(this.getHost(), this.getWidgetToken()),
            previewUrl: `https://${this.getHost()}/widgets/event-list/v1/${this.getWidgetToken()}?simulate=1`,
            dataFetchUrl: `https://${this.getHost()}/api/v5/slobs/widget/eventlist`,
            settingsSaveUrl: `https://${this.getHost()}/api/v5/slobs/widget/eventlist`,
            settingsUpdateEvent: 'eventListSettingsUpdate',
            customCodeAllowed: true,
            customFieldsAllowed: true,
            testers: ['Follow', 'Subscription', 'Donation', 'Bits'],
        };
    }
    getMetadata() {
        return {
            theme: metadata.list({
                options: [
                    { title: 'Clean', value: 'standard' },
                    { title: 'Boxed', value: 'boxed' },
                    { title: 'Twitch', value: 'twitch' },
                    { title: 'Old School', value: 'oldschool' },
                    { title: 'Chunky', value: 'chunky' },
                ],
            }),
            message_hide_delay: metadata.slider({
                min: 0,
                max: 200,
            }),
        };
    }
    eventsByPlatform() {
        const platform = this.userService.platform.type;
        return {
            twitch: [
                { key: 'show_follows', title: $t('Follows') },
                { key: 'show_subscriptions', title: $t('Subscriptions') },
                { key: 'show_resubs', title: $t('Show Resubs') },
                { key: 'show_sub_tiers', title: $t('Show Sub Tiers') },
                { key: 'show_bits', title: $t('Bits') },
                { key: 'show_raids', title: $t('Raids') },
            ],
            facebook: [
                { key: 'show_follows', title: $t('Follows') },
                { key: 'show_stars', title: $t('Stars') },
                { key: 'show_supports', title: $t('Supporters') },
                { key: 'show_likes', title: $t('Likes') },
                { key: 'show_shares', title: $t('Shares') },
            ],
            youtube: [
                { key: 'show_subscribers', title: $t('Subscriptions') },
                { key: 'show_sponsors', title: $t('Members') },
                { key: 'show_fanfundings', title: $t('Super Chats') },
            ],
            trovo: [
                { key: 'show_follows', title: $t('Follows') },
                { key: 'show_raids', title: $t('Raids') },
                { key: 'show_subscriptions', title: $t('Subscriptions') },
                { key: 'show_resubs', title: $t('Show Resubs') },
                { key: 'show_sub_gifts', title: $t('Show Gift Subs') },
                { key: 'show_sub_tiers', title: $t('Show Sub Tiers') },
            ],
        }[platform];
    }
    minsByPlatform() {
        const platform = this.userService.platform.type;
        return {
            twitch: [
                {
                    key: 'bits_minimum',
                    title: $t('Min. Bits'),
                    tooltip: $t('The smallest amount of bits a cheer must have for an event to be shown.' +
                        ' Setting this to 0 will make every cheer trigger an event.'),
                },
            ],
        }[platform];
    }
    patchBeforeSend(data) {
        return Object.assign({}, data);
    }
};
EventListService.initialState = WIDGET_INITIAL_STATE;
EventListService = __decorate([
    InheritMutations()
], EventListService);
export { EventListService };
//# sourceMappingURL=event-list.js.map