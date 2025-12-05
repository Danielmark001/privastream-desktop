import { $t } from '../../../services/i18n';
import React, { useMemo } from 'react';
import { CheckboxInput, InputComponent, TextAreaInput, TextInput, } from '../../shared/inputs';
import { assertIsDefined } from '../../../util/properties-type-guards';
import InputWrapper from '../../shared/inputs/InputWrapper';
import Animate from 'rc-animate';
import { Services } from '../../service-provider';
import { Tooltip } from 'antd';
export const CommonPlatformFields = InputComponent((rawProps) => {
    const defaultProps = { layoutMode: 'singlePlatform' };
    const p = Object.assign(Object.assign({}, defaultProps), rawProps);
    const { HighlighterService } = Services;
    function updatePlatform(patch) {
        const platformSettings = p.value;
        p.onChange(Object.assign(Object.assign({}, platformSettings), patch));
    }
    function toggleUseCustom() {
        assertIsDefined(p.platform);
        const isEnabled = p.value.useCustomFields;
        updatePlatform({ useCustomFields: !isEnabled });
    }
    function updateCommonField(fieldName, value) {
        updatePlatform({ [fieldName]: value });
    }
    const view = Services.StreamingService.views;
    const hasCustomCheckbox = p.layoutMode === 'multiplatformAdvanced';
    const fieldsAreVisible = !hasCustomCheckbox || p.value.useCustomFields;
    const descriptionIsRequired = typeof p.descriptionIsRequired === 'boolean'
        ? p.descriptionIsRequired
        : p.platform === 'facebook';
    const hasDescription = p.platform
        ? view.supports('description', [p.platform])
        : view.supports('description');
    const fields = p.value;
    const title = hasDescription
        ? $t('Use different title and description')
        : $t('Use different title');
    let maxCharacters = 120;
    const enabledPlatforms = view.enabledPlatforms;
    if (enabledPlatforms.includes('youtube')) {
        maxCharacters = 100;
    }
    else if (enabledPlatforms.includes('twitch')) {
        maxCharacters = 140;
    }
    if (!enabledPlatforms.includes('twitch') && HighlighterService.views.useAiHighlighter) {
        HighlighterService.actions.setAiHighlighter(false);
    }
    const titleTooltip = useMemo(() => {
        if (enabledPlatforms.includes('tiktok')) {
            return $t('Only 32 characters of your title will display on TikTok');
        }
        return undefined;
    }, [enabledPlatforms]);
    return (React.createElement("div", null,
        hasCustomCheckbox && (React.createElement(InputWrapper, { layout: p.layout },
            React.createElement(CheckboxInput, { name: "customEnabled", value: p.value.useCustomFields, onChange: toggleUseCustom, label: title }))),
        React.createElement(Animate, { transitionName: "slidedown" }, fieldsAreVisible && (React.createElement("div", null,
            React.createElement(TextInput, { value: fields['title'], name: "title", onChange: val => updateCommonField('title', val), label: titleTooltip ? (React.createElement(Tooltip, { title: titleTooltip, placement: "right" },
                    $t('Title'),
                    React.createElement("i", { className: "icon-information", style: { marginLeft: '5px' } }))) : ($t('Title')), required: true, max: maxCharacters, layout: p.layout, size: "large" }),
            hasDescription && (React.createElement(TextAreaInput, { value: fields['description'], onChange: val => updateCommonField('description', val), name: "description", label: $t('Description'), required: descriptionIsRequired, layout: p.layout })))))));
});
//# sourceMappingURL=CommonPlatformFields.js.map