import React from 'react';
import { useWidget, WidgetModule, settingsToGlobal } from './common/useWidget';
import { WidgetLayout } from './common/WidgetLayout';
import { $t } from '../../services/i18n';
import { metadata } from '../shared/inputs/metadata';
import FormFactory from 'components-react/shared/inputs/FormFactory';
import { inject } from 'slap';
import { RecentEventsService } from 'app-services';
export function ChatBox() {
    const { isLoading, settings, meta, updateSetting } = useChatBox();
    return (React.createElement(WidgetLayout, null, !isLoading && React.createElement(FormFactory, { metadata: meta, values: settings, onChange: updateSetting })));
}
export class ChatBoxModule extends WidgetModule {
    constructor() {
        super(...arguments);
        this.recentEventsService = inject(RecentEventsService);
    }
    get meta() {
        var _a;
        const result = {
            theme: metadata.list({
                label: $t('Theme'),
                options: [
                    { label: 'Clean', value: 'clean' },
                    { label: 'Boxed', value: 'boxed' },
                    { label: 'Twitch', value: 'twitch' },
                    { label: 'Old School', value: 'oldschool' },
                    { label: 'Chunky', value: 'chunky' },
                ],
            }),
            always_show_messages: metadata.switch({ label: $t('Always Show Messages') }),
            message_hide_delay: metadata.seconds({
                label: $t('Hide Delay'),
                min: 0,
                max: 200000,
            }),
            message_show_delay: metadata.seconds({
                label: $t('Chat Delay'),
                min: 0,
                max: 6000,
            }),
            disable_message_animations: metadata.switch({ label: $t('Disable Message Animations') }),
            show_platform_icons: metadata.switch({ label: $t('Show Platform Icons') }),
            show_badges: {
                type: 'checkboxGroup',
                label: $t('Badges'),
                children: {
                    show_moderator_icons: metadata.bool({ label: $t('Show Moderator Badges') }),
                    show_subscriber_icons: metadata.bool({ label: $t('Show Subscriber Badges') }),
                    show_turbo_icons: metadata.bool({ label: $t('Show Turbo Badges') }),
                    show_premium_icons: metadata.bool({ label: $t('Show Twitch Prime Badges') }),
                    show_bits_icons: metadata.bool({ label: $t('Show Bits Badges') }),
                    show_coin_icons: metadata.bool({ label: $t('Show Top Coin Holder Badges') }),
                },
            },
            show_emotes: {
                type: 'checkboxGroup',
                label: $t('Extra Emotes'),
                children: {
                    show_bttv_emotes: metadata.bool({ label: $t('Enable BetterTTV Emotes') }),
                    show_franker_emotes: metadata.bool({ label: $t('Enable FrankerFaceZ Emotes') }),
                    show_7tv_emotes: metadata.bool({ label: $t('Enable 7TV Emotes') }),
                },
            },
            text_color: metadata.color({
                label: $t('Text Color'),
                tooltip: $t('A hex code for the base text color.'),
            }),
            text_size: metadata.fontSize({ label: $t('Font Size'), min: 12, max: 80 }),
            background_color: metadata.color({
                label: $t('Background Color'),
                tooltip: $t('A hex code for the widget background. This is for preview purposes only. It will not be shown in your stream.'),
            }),
            hide_characters: {
                type: 'checkboxGroup',
                label: $t('Hide Characters'),
                children: {
                    hide_common_chat_bots: metadata.bool({ label: $t('Hide Common Chat Bots') }),
                    hide_commands: metadata.bool({ label: $t('Hide commands starting with `!`') }),
                },
            },
            muted_chatters: metadata.textarea({ label: $t('Muted Chatters') }),
        };
        if ((_a = this.config) === null || _a === void 0 ? void 0 : _a.useNewWidgetAPI) {
            return Object.assign(Object.assign({}, result), { alert_enabled: metadata.switch({
                    label: $t('Chat Notifications'),
                    tooltip: $t('Trigger a sound to notify you when there is new chat activity'),
                    onChange: (value) => this.handleMuteChatNotifs(value),
                }) });
        }
        return result;
    }
    handleMuteChatNotifs(val) {
        this.recentEventsService.actions.setMuteChatNotifs(val);
        this.updateSetting('alert_enabled')(val);
    }
    patchBeforeSend(settings) {
        const obj = Object.assign(Object.assign({}, settings), { message_hide_delay: Math.floor(settings.message_hide_delay / 1000), message_show_delay: Math.floor(settings.message_show_delay / 1000) });
        if (this.config.useNewWidgetAPI) {
            return settingsToGlobal(obj);
        }
        return obj;
    }
}
function useChatBox() {
    return useWidget();
}
//# sourceMappingURL=ChatBox.js.map