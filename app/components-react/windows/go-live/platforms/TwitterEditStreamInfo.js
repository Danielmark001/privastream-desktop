import React from 'react';
import PlatformSettingsLayout from './PlatformSettingsLayout';
import { ETwitterChatType, } from '../../../../services/platforms/twitter';
import { ListInput, createBinding } from '../../../shared/inputs';
import Form from '../../../shared/inputs/Form';
import { CommonPlatformFields } from '../CommonPlatformFields';
import { $t } from 'services/i18n';
export function TwitterEditStreamInfo(p) {
    const twSettings = p.value;
    function updateSettings(patch) {
        p.onChange(Object.assign(Object.assign({}, twSettings), patch));
    }
    const bind = createBinding(twSettings, updatedSettings => updateSettings(updatedSettings));
    return (React.createElement(Form, { name: "twitter-settings" },
        React.createElement(PlatformSettingsLayout, { layoutMode: p.layoutMode, commonFields: React.createElement(CommonPlatformFields, { key: "common", platform: "twitter", layoutMode: p.layoutMode, value: twSettings, onChange: updateSettings, layout: p.layout }), requiredFields: React.createElement("div", { key: "required" },
                React.createElement(ListInput, Object.assign({}, bind.chatType, { label: $t('X (Twitter) Chat Type'), options: [
                        {
                            value: ETwitterChatType.Off,
                            label: $t('Disabled'),
                            description: $t('Chat will be disabled'),
                        },
                        {
                            value: ETwitterChatType.Everyone,
                            label: $t('Everyone'),
                            description: $t('All viewers will be able to chat'),
                        },
                        {
                            value: ETwitterChatType.VerifiedOnly,
                            label: $t('Verified Only'),
                            description: $t('Only verified viewers will be able to chat'),
                        },
                        {
                            value: ETwitterChatType.FollowedOnly,
                            label: $t('Followed Only'),
                            description: $t('Only accounts you follow will be able to chat'),
                        },
                        {
                            value: ETwitterChatType.SubscribersOnly,
                            label: $t('Subscriber Only'),
                            description: $t('Only viewers that subscribe to you will be able to chat'),
                        },
                    ], layout: p.layout, size: "large" }))) })));
}
//# sourceMappingURL=TwitterEditStreamInfo.js.map