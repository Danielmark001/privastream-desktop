import { CommonPlatformFields } from '../CommonPlatformFields';
import React from 'react';
import { $t } from '../../../../services/i18n';
import { TwitchTagsInput } from './TwitchTagsInput';
import GameSelector from '../GameSelector';
import Form from '../../../shared/inputs/Form';
import PlatformSettingsLayout from './PlatformSettingsLayout';
import { CheckboxInput, createBinding } from '../../../shared/inputs';
import InputWrapper from 'components-react/shared/inputs/InputWrapper';
import TwitchContentClassificationInput from './TwitchContentClassificationInput';
import AiHighlighterToggle from '../AiHighlighterToggle';
import { Services } from 'components-react/service-provider';
import Badge from 'components-react/shared/DismissableBadge';
import { EDismissable } from 'services/dismissables';
import styles from './TwitchEditStreamInfo.m.less';
import cx from 'classnames';
export function TwitchEditStreamInfo(p) {
    var _a;
    const twSettings = p.value;
    const aiHighlighterFeatureEnabled = Services.HighlighterService.aiHighlighterFeatureEnabled;
    function updateSettings(patch) {
        p.onChange(Object.assign(Object.assign({}, twSettings), patch));
    }
    const enhancedBroadcastingTooltipText = $t('Enhanced broadcasting automatically optimizes your settings to encode and send multiple video qualities to Twitch. Selecting this option will send basic information about your computer and software setup.');
    const bind = createBinding(twSettings, updatedSettings => updateSettings(updatedSettings));
    const optionalFields = (React.createElement("div", { key: "optional" },
        React.createElement(TwitchTagsInput, Object.assign({ label: $t('Twitch Tags') }, bind.tags, { layout: p.layout })),
        React.createElement(TwitchContentClassificationInput, Object.assign({}, bind.contentClassificationLabels, { layout: p.layout })),
        React.createElement(InputWrapper, { layout: p.layout, className: cx(styles.twitchCheckbox, { [styles.hideLabel]: p.layout === 'vertical' }) },
            React.createElement(CheckboxInput, Object.assign({ label: $t('Stream features branded content') }, bind.isBrandedContent))),
        p.enabledPlatformsCount === 1 && process.platform !== 'darwin' && (React.createElement(InputWrapper, { layout: p.layout, className: cx(styles.twitchCheckbox, { [styles.hideLabel]: p.layout === 'vertical' }) },
            React.createElement("div", null,
                React.createElement(CheckboxInput, Object.assign({ style: { display: 'inline-block' }, label: $t('Enhanced broadcasting'), tooltip: enhancedBroadcastingTooltipText }, bind.isEnhancedBroadcasting)),
                React.createElement(Badge, { style: { display: 'inline-block' }, dismissableKey: EDismissable.EnhancedBroadcasting, content: 'Beta' }))))));
    return (React.createElement(Form, { name: "twitch-settings" },
        React.createElement(PlatformSettingsLayout, { layoutMode: p.layoutMode, commonFields: React.createElement(CommonPlatformFields, { key: "common", platform: "twitch", layoutMode: p.layoutMode, value: twSettings, onChange: updateSettings, layout: p.layout }), requiredFields: React.createElement(React.Fragment, { key: "required-fields" },
                React.createElement(GameSelector, Object.assign({ key: "required", platform: 'twitch' }, bind.game, { layout: p.layout })),
                aiHighlighterFeatureEnabled && (React.createElement(AiHighlighterToggle, { key: "ai-toggle", game: (_a = bind.game) === null || _a === void 0 ? void 0 : _a.value, cardIsExpanded: false }))), optionalFields: optionalFields })));
}
//# sourceMappingURL=TwitchEditStreamInfo.js.map