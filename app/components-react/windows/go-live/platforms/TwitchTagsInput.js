import { TagsInput } from '../../../shared/inputs';
import { Tag } from 'antd';
import { Services } from '../../../service-provider';
import React from 'react';
import { $t } from '../../../../services/i18n';
import { useVuex } from 'components-react/hooks';
export function TwitchTagsInput(p) {
    const { TwitchService, OnboardingService, WindowsService } = Services;
    const { tags, hasTagsScope } = useVuex(() => ({
        tags: TwitchService.state.settings.tags,
        hasTagsScope: TwitchService.state.hasUpdateTagsPermission,
    }));
    function reauth() {
        OnboardingService.actions.start({ isLogin: true });
        WindowsService.closeChildWindow();
    }
    if (!hasTagsScope) {
        return (React.createElement("a", { onClick: () => reauth(), style: { marginBottom: '8px', display: 'block' } }, $t('You need to re-login to access Twitch tags')));
    }
    function specialCharacterValidator(rule, values, callback) {
        if (values.some(tag => !/^[\p{L}\p{N}\p{M}]+$/u.test(tag))) {
            callback($t('Do not include special characters or spaces in your tag'));
        }
        else {
            callback();
        }
    }
    return (React.createElement(TagsInput, { name: "twitchTags", label: p.label, value: tags, max: 10, mode: "tags", onChange: values => p.onChange && p.onChange(values), tagRender: (tagProps, tag) => (React.createElement(Tag, Object.assign({}, tagProps, { color: "#9146FF" }), tag.label)), rules: [{ validator: specialCharacterValidator }], placeholder: $t('For example: "Speedrunning" or "FirstPlaythrough"'), tokenSeparators: [' ', ','], dropdownStyle: { display: 'none' }, layout: p.layout, size: "large" }));
}
//# sourceMappingURL=TwitchTagsInput.js.map