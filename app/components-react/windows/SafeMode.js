import React from 'react';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import { $t } from 'services/i18n';
import Form from 'components-react/shared/inputs/Form';
import { CheckboxInput, NumberInput } from 'components-react/shared/inputs';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { Button, message } from 'antd';
import Translate from 'components-react/shared/Translate';
export default function SafeMode() {
    const { RecentEventsService, WindowsService } = Services;
    const v = useVuex(() => RecentEventsService.state.safeMode);
    function safeModeForm() {
        return (React.createElement(React.Fragment, null,
            React.createElement("h1", null, $t('Activate Safe Mode?')),
            React.createElement("h2", null, $t('Safe Mode prevents malicious users from sending harassment, hateful messages, and chat spam.')),
            React.createElement(Form, { layout: "vertical" },
                React.createElement("div", { className: "section" },
                    React.createElement("p", null, "Activating Safe Mode will:"),
                    React.createElement(CheckboxInput, { label: $t('Clear all recent events'), value: v.clearRecentEvents, onChange: val => RecentEventsService.actions.setSafeModeSettings({ clearRecentEvents: val }) }),
                    React.createElement(CheckboxInput, { label: $t('Clear currently queued follower/host/raid alerts'), value: v.clearQueuedAlerts, onChange: val => RecentEventsService.actions.setSafeModeSettings({ clearQueuedAlerts: val }) }),
                    React.createElement(CheckboxInput, { label: $t('Disable follower alerts'), value: v.disableFollowerAlerts, onChange: val => RecentEventsService.actions.setSafeModeSettings({ disableFollowerAlerts: val }) })),
                React.createElement("div", { className: "section" },
                    React.createElement("p", { style: { color: 'var(--red)' } }, "These options will only take effect if Cloudbot is running"),
                    React.createElement(CheckboxInput, { label: $t('Put chat in emote-only mode'), value: v.emoteOnly, onChange: val => RecentEventsService.actions.setSafeModeSettings({ emoteOnly: val }) }),
                    React.createElement(CheckboxInput, { label: $t('Put chat in follower-only mode'), value: v.followerOnly, onChange: val => RecentEventsService.actions.setSafeModeSettings({ followerOnly: val }) }),
                    React.createElement(CheckboxInput, { label: $t('Put chat in sub-only mode'), value: v.subOnly, onChange: val => RecentEventsService.actions.setSafeModeSettings({ subOnly: val }) }),
                    React.createElement(CheckboxInput, { label: $t('Disable chat alerts for followers'), value: v.disableChatAlerts, onChange: val => RecentEventsService.actions.setSafeModeSettings({ disableChatAlerts: val }) }),
                    React.createElement(CheckboxInput, { label: $t('Clear chat history'), value: v.clearChat, onChange: val => RecentEventsService.actions.setSafeModeSettings({ clearChat: val }) })),
                React.createElement("div", { className: "section" },
                    React.createElement(CheckboxInput, { label: $t('Automatically disable Safe Mode'), tooltip: $t('Safe Mode will automatically be disabled after this many minutes, or until you click the button again.'), value: v.enableTimer, onChange: val => RecentEventsService.actions.setSafeModeSettings({ enableTimer: val }) }),
                    v.enableTimer && (React.createElement("div", { style: { marginTop: 8 } },
                        React.createElement(Translate, { message: $t('Disable after <duration></duration> minutes'), renderSlots: {
                                duration: () => {
                                    return (React.createElement("span", { style: { margin: '0 8px' }, key: "duration" },
                                        React.createElement(NumberInput, { value: v.timeInMinutes, onInput: val => RecentEventsService.actions.setSafeModeSettings({
                                                timeInMinutes: val,
                                            }), min: 1, max: 200, uncontrolled: true, nowrap: true })));
                                },
                            } })))))));
    }
    function safeModeEnabled() {
        return (React.createElement("div", { style: { textAlign: 'center', marginTop: 60 } },
            React.createElement("h1", null, $t('Safe Mode is Enabled')),
            React.createElement("div", null,
                React.createElement("i", { className: "fa fa-shield-alt", style: { color: 'var(--teal)', fontSize: 200, marginTop: 30, marginBottom: 30 } })),
            React.createElement(Button, { type: "primary", danger: true, disabled: v.loading, onClick: () => {
                    RecentEventsService.actions.return
                        .disableSafeMode()
                        .then(() => WindowsService.actions.closeChildWindow())
                        .catch(() => message.error($t('Something went wrong disabling Safe Mode'), 5));
                } },
                v.loading && React.createElement("i", { className: "fa fa-pulse fa-spinner", style: { marginRight: 8 } }),
                $t('Disable Safe Mode'))));
    }
    let onOk;
    if (!v.enabled) {
        onOk = () => {
            RecentEventsService.actions.return
                .activateSafeMode()
                .then(() => WindowsService.actions.closeChildWindow())
                .catch(() => message.error($t('Something went wrong enabling Safe Mode'), 5));
        };
    }
    return (React.createElement(ModalLayout, { okText: $t('Activate'), onOk: onOk, confirmLoading: v.loading },
        v.enabled && safeModeEnabled(),
        !v.enabled && safeModeForm()));
}
//# sourceMappingURL=SafeMode.js.map