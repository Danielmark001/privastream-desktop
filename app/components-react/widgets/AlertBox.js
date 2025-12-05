import React, { useRef } from 'react';
import { CheckboxInput, MediaUrlInput, NumberInput, SliderInput, TextInput, AudioUrlInput, SwitchInput, FontFamilyInput, ColorInput, FontWeightInput, FontSizeInput, ListInput, } from '../shared/inputs';
import { $t } from '../../services/i18n';
import { Alert, Button, Collapse, Menu, Tooltip } from 'antd';
import Form from '../shared/inputs/Form';
import { WidgetLayout } from './common/WidgetLayout';
import { CaretRightOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useAlertBox } from './useAlertBox';
import { Services } from '../service-provider';
import { ButtonGroup } from '../shared/ButtonGroup';
import { LayoutInput } from './common/LayoutInput';
import InputWrapper from '../shared/inputs/InputWrapper';
import * as remote from '@electron/remote';
import { assertIsDefined } from '../../util/properties-type-guards';
import { useForceUpdate } from 'slap';
export function AlertBox() {
    const { layout } = useAlertBox();
    return (React.createElement(WidgetLayout, { layout: layout },
        React.createElement(TabsList, null),
        React.createElement(TabContent, null)));
}
function TabsList() {
    const { onMenuClickHandler, selectedTab } = useAlertBox();
    return (React.createElement(React.Fragment, null,
        React.createElement(Menu, { onClick: onMenuClickHandler, selectedKeys: [selectedTab], theme: 'dark' },
            React.createElement(Menu.Item, { key: 'general' }, $t('General Settings'))),
        React.createElement(AlertsList, null)));
}
function TabContent() {
    const { selectedTab } = useAlertBox();
    return selectedTab === 'general' ? (React.createElement(GeneralSettings, null)) : (React.createElement(VariationSettings, { type: selectedTab }));
}
function GeneralSettings() {
    const { bind, switchToLegacyAlertbox } = useAlertBox();
    function openAdvancedAlertTesting() {
        Services.MagicLinkService.actions.openAdvancedAlertTesting();
    }
    return (React.createElement(Form, { layout: 'horizontal' },
        React.createElement(SliderInput, Object.assign({ label: $t('Global Alert Delay') }, bind.alert_delay, { step: 1000, min: 0, max: 30000, tipFormatter: (ms) => `${ms / 1000}s`, debounce: 500 })),
        React.createElement(Info, { message: $t('Looking for the old AlertBox settings?'), onClick: switchToLegacyAlertbox }),
        React.createElement(AdvancedSettingsPanel, null)));
}
function AlertsList() {
    const { onMenuClickHandler, alerts, selectedTab, playAlert, setEnabled, enabledAlerts, openAlertInfo, } = useAlertBox();
    return (React.createElement(Menu, { onClick: onMenuClickHandler, selectedKeys: [selectedTab], theme: 'dark' }, alerts.map(alertEvent => (React.createElement(Menu.Item, { key: alertEvent.type },
        React.createElement(CheckboxInput, { value: enabledAlerts.includes(alertEvent.type), onChange: val => setEnabled(alertEvent.type, val), style: { display: 'inline-block' } }),
        alertEvent.name,
        alertEvent.tooltip && (React.createElement(Tooltip, { placement: "rightBottom", title: React.createElement("span", null,
                alertEvent.tooltip,
                alertEvent.tooltipLink && (React.createElement(ButtonGroup, null,
                    React.createElement(Button, { type: "link", onClick: () => openAlertInfo(alertEvent.type) }, $t('More Info'))))) },
            React.createElement(QuestionCircleOutlined, { style: { marginLeft: '7px' } }))),
        React.createElement(Tooltip, { title: $t('Play Alert'), placement: "left" },
            React.createElement(Button, { onClick: e => {
                    e.stopPropagation();
                    playAlert(alertEvent.type);
                }, type: 'text', style: { position: 'absolute', right: '16px', top: '8px' }, icon: React.createElement(CaretRightOutlined, { style: { fontSize: '36px', color: 'white' } }) })))))));
}
function VariationSettings(p) {
    let SettingsComponent;
    switch (p.type) {
        case 'donation':
            SettingsComponent = React.createElement(DonationSettings, null);
            break;
        case 'merch':
            SettingsComponent = React.createElement(MerchSettings, null);
            break;
        default:
            SettingsComponent = React.createElement(CommonAlertSettings, { type: p.type });
            break;
    }
    return (React.createElement(React.Fragment, null,
        SettingsComponent,
        React.createElement(AnimationSettingsPanel, null),
        React.createElement(FontSettingsPanel, null)));
}
function CommonAlertSettings(p) {
    const { createVariationBinding, isCustomCodeEnabled, selectedTab } = useAlertBox();
    const bind = createVariationBinding(p.type, 'default', useForceUpdate(), p.hiddenFields);
    const containerRef = useRef(null);
    const bindMinAmount = bind['alert_message_min_amount'].value !== undefined ? bind['alert_message_min_amount'] : null;
    return (React.createElement("div", { key: selectedTab, ref: containerRef },
        React.createElement(MediaUrlInput, Object.assign({}, bind.image_href)),
        !isCustomCodeEnabled && React.createElement(LayoutInput, Object.assign({}, bind.layout)),
        React.createElement(AudioUrlInput, Object.assign({}, bind.sound_href)),
        React.createElement(SliderInput, Object.assign({ debounce: 500 }, bind.sound_volume)),
        React.createElement(TextInput, Object.assign({}, bind.message_template)),
        isCustomCodeEnabled && React.createElement(SliderInput, Object.assign({}, bind.alert_duration)),
        bindMinAmount && React.createElement(NumberInput, Object.assign({}, bindMinAmount))));
}
function FontSettingsPanel() {
    const { createVariationBinding, selectedAlert, isCustomCodeEnabled } = useAlertBox();
    assertIsDefined(selectedAlert);
    const bind = createVariationBinding(selectedAlert, 'default', useForceUpdate());
    if (isCustomCodeEnabled)
        return React.createElement(React.Fragment, null);
    return (React.createElement(React.Fragment, null,
        React.createElement(Collapse, { bordered: false },
            React.createElement(Collapse.Panel, { header: $t('Font Settings'), key: 1 },
                React.createElement(FontFamilyInput, Object.assign({}, bind.font)),
                React.createElement(FontSizeInput, Object.assign({}, bind.font_size)),
                React.createElement(FontWeightInput, Object.assign({}, bind.font_weight)),
                React.createElement(ColorInput, Object.assign({}, bind.font_color)),
                React.createElement(ColorInput, Object.assign({}, bind.font_color2))))));
}
function AnimationSettingsPanel() {
    const { createVariationBinding, selectedAlert, isCustomCodeEnabled, animationOptions, } = useAlertBox();
    assertIsDefined(selectedAlert);
    const bind = createVariationBinding(selectedAlert, 'default', useForceUpdate());
    if (isCustomCodeEnabled)
        return React.createElement(React.Fragment, null);
    return (React.createElement(React.Fragment, null,
        React.createElement(Collapse, { bordered: false },
            React.createElement(Collapse.Panel, { header: $t('Animations'), key: 1 },
                React.createElement(SliderInput, Object.assign({}, bind.alert_duration)),
                React.createElement(ListInput, Object.assign({}, bind.show_animation, { options: animationOptions.show })),
                React.createElement(ListInput, Object.assign({}, bind.hide_animation, { options: animationOptions.hide })),
                React.createElement(SliderInput, Object.assign({}, bind.text_delay)),
                React.createElement(ListInput, Object.assign({}, bind.text_animation, { options: animationOptions.text }))))));
}
function DonationSettings() {
    const { createVariationBinding } = useAlertBox();
    const bind = createVariationBinding('donation', 'default', useForceUpdate());
    const { HostsService, UsageStatisticsService, MagicLinkService } = Services;
    const host = HostsService.streamlabs;
    function openDonationSettings() {
        MagicLinkService.actions.openDonationSettings();
    }
    function openTipPageSettings() {
        remote.shell.openExternal(`https://${host}/editor?ref=slobs`);
        UsageStatisticsService.actions.recordFeatureUsage('openDonationSettings');
    }
    return (React.createElement(React.Fragment, null,
        React.createElement(CommonAlertSettings, { type: "donation" }),
        React.createElement(Info, { message: $t('Need to set up tipping?'), onClick: openDonationSettings }),
        React.createElement(Info, { message: $t('Customize your tip page where viewers can send you donations'), onClick: openTipPageSettings })));
}
function MerchSettings() {
    const { createVariationBinding } = useAlertBox();
    const bind = createVariationBinding('merch', 'default', useForceUpdate());
    const hiddenFields = bind.use_custom_image.value ? [] : ['image_href'];
    return (React.createElement(React.Fragment, null,
        React.createElement(InputWrapper, null,
            React.createElement(CheckboxInput, Object.assign({}, bind.use_custom_image))),
        React.createElement(CommonAlertSettings, { type: "merch", hiddenFields: hiddenFields })));
}
function Info(p) {
    return (React.createElement(Alert, { message: React.createElement("span", null,
            p.message,
            React.createElement("a", { onClick: () => p.onClick() },
                " ",
                $t('Click here'))), type: "info", showIcon: true, style: { marginBottom: '16px' } }));
}
function AdvancedSettingsPanel() {
    const { bind, updateSettings } = useAlertBox();
    const isUnlimitedModerationDelay = bind.moderation_delay.value === -1;
    function switchUnlimitedModeration(enabled) {
        updateSettings({ moderation_delay: enabled ? -1 : 0 });
    }
    return (React.createElement(Collapse, { bordered: false, style: { marginBottom: '8px' } },
        React.createElement(Collapse.Panel, { header: $t('Advanced'), key: 1 },
            React.createElement(SwitchInput, Object.assign({}, bind.interrupt_mode)),
            bind.interrupt_mode.value && React.createElement(SliderInput, Object.assign({}, bind.interrupt_mode_delay, { debounce: 500 })),
            React.createElement(InputWrapper, { label: $t('Alert Moderation delay') },
                !isUnlimitedModerationDelay && (React.createElement(SliderInput, Object.assign({}, bind.moderation_delay, { min: 0, debounce: 500, nowrap: true }))),
                React.createElement(CheckboxInput, { label: $t('Use unlimited delay'), value: isUnlimitedModerationDelay, onChange: switchUnlimitedModeration, tooltip: $t('This applies to all alerts. If enabled all alerts need to be approved manually.') })))));
}
//# sourceMappingURL=AlertBox.js.map