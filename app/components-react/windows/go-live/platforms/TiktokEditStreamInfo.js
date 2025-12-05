import React from 'react';
import Form from '../../../shared/inputs/Form';
import { $t } from '../../../../services/i18n';
import { Services } from '../../../service-provider';
import { Button, Tooltip } from 'antd';
import InputWrapper from '../../../shared/inputs/InputWrapper';
import PlatformSettingsLayout from './PlatformSettingsLayout';
import * as remote from '@electron/remote';
import { CommonPlatformFields } from '../CommonPlatformFields';
import { RadioInput, TextInput, createBinding } from 'components-react/shared/inputs';
import InfoBanner from 'components-react/shared/InfoBanner';
import GameSelector from '../GameSelector';
import { EDismissable } from 'services/dismissables';
import styles from './TikTokEditStreamInfo.m.less';
import cx from 'classnames';
export function TikTokEditStreamInfo(p) {
    const { TikTokService } = Services;
    const ttSettings = p.value;
    const approved = TikTokService.scope === 'approved';
    const denied = TikTokService.scope === 'denied';
    const controls = TikTokService.audienceControls;
    function updateSettings(patch) {
        p.onChange(Object.assign(Object.assign({}, ttSettings), patch));
    }
    const bind = createBinding(ttSettings, updatedSettings => updateSettings(updatedSettings));
    return (React.createElement(Form, { name: "tiktok-settings" },
        React.createElement(PlatformSettingsLayout, { layoutMode: p.layoutMode, commonFields: React.createElement(CommonPlatformFields, { key: "common", platform: "tiktok", layoutMode: p.layoutMode, value: ttSettings, onChange: updateSettings, layout: p.layout }), requiredFields: React.createElement("div", { key: "empty-tiktok" }) }),
        approved && (React.createElement(GameSelector, Object.assign({ key: "optional", platform: 'tiktok' }, bind.game, { layout: p.layout }))),
        approved && !controls.disable && (React.createElement(RadioInput, Object.assign({ key: "audience-ctrl", options: controls.types, defaultValue: controls.audienceType, value: controls.audienceType, label: $t('TikTok Audience'), direction: "horizontal", colon: true }, bind.audienceType, { layout: p.layout }))),
        !approved && React.createElement(TikTokEnterCredentialsFormInfo, Object.assign({}, p, { denied: denied }))));
}
export function TikTokEnterCredentialsFormInfo(p) {
    const bind = createBinding(p.value, updatedSettings => p.onChange(Object.assign(Object.assign({}, p.value), updatedSettings)));
    return (React.createElement(React.Fragment, null,
        React.createElement(TextInput, Object.assign({ label: React.createElement(Tooltip, { title: $t('Generate with "Locate my Stream Key"'), placement: "right" },
                $t('TikTok Server URL'),
                React.createElement("i", { className: "icon-information", style: { marginLeft: '5px' } })), required: true }, bind.serverUrl, { layout: p.layout, size: "large" })),
        React.createElement(TextInput, Object.assign({ label: React.createElement(Tooltip, { title: $t('Generate with "Locate my Stream Key"'), placement: "right" },
                $t('TikTok Stream Key'),
                React.createElement("i", { className: "icon-information", style: { marginLeft: '5px' } })), required: true }, bind.streamKey, { layout: p.layout, size: "large" })),
        React.createElement(InputWrapper, { extra: React.createElement("div", { style: { display: 'flex', flexDirection: 'column' }, className: "input-extra" }, p.denied ? React.createElement(TikTokDenied, null) : React.createElement(TikTokInfo, null)), layout: p.layout, className: cx({ [styles.hideLabel]: p.layout === 'vertical' }) },
            React.createElement(TikTokButtons, { denied: p.denied }))));
}
function TikTokDenied() {
    return (React.createElement(InfoBanner, { id: "tiktok-denied", message: $t('TikTok Live Access not granted. Click here to learn more.'), type: "info", onClick: () => {
            openConfirmation();
            Services.UsageStatisticsService.recordAnalyticsEvent('TikTokApplyPrompt', {
                component: 'NotGrantedBannerDismissed',
            });
        }, dismissableKey: EDismissable.TikTokRejected }));
}
function TikTokInfo() {
    return (React.createElement(React.Fragment, null,
        React.createElement("a", { id: "tiktok-faq", onClick: () => openInfoPage() }, $t('Go live to TikTok with a single click. Click here to learn more.')),
        React.createElement(InfoBanner, { id: "tiktok-info", message: $t("Approvals are solely at TikTok's discretion."), type: "info", style: { marginTop: '5px', marginBottom: '5px' } })));
}
function TikTokButtons(p) {
    const status = Services.TikTokService.promptApply ? 'prompted' : 'not-prompted';
    const component = Services.TikTokService.promptReapply ? 'ReapplyButton' : 'ApplyButton';
    const text = Services.TikTokService.promptReapply
        ? $t('Reapply for TikTok Live Permission')
        : $t('Apply for TikTok Live Permission');
    const data = {
        component,
        status: !p.denied ? status : undefined,
    };
    return (React.createElement(React.Fragment, null,
        React.createElement(Button, { id: "tiktok-locate-key", onClick: openProducer, style: { marginBottom: '10px', width: '100%' } }, $t('Locate my Stream Key')),
        React.createElement(Button, { id: "tiktok-application", onClick: () => {
                Services.UsageStatisticsService.recordAnalyticsEvent('TikTokApplyPrompt', data);
                openApplicationInfoPage();
            }, style: {
                width: '100%',
                marginBottom: '10px',
                background: 'var(--tiktok-btn)',
                color: 'var(--black)',
            } }, text)));
}
function openInfoPage() {
    remote.shell.openExternal(Services.TikTokService.infoUrl);
}
function openApplicationInfoPage() {
    remote.shell.openExternal(Services.TikTokService.applicationUrl);
}
function openProducer() {
    remote.shell.openExternal(Services.TikTokService.legacyDashboardUrl);
}
function openConfirmation() {
    remote.shell.openExternal(Services.TikTokService.confirmationUrl);
}
//# sourceMappingURL=TiktokEditStreamInfo.js.map