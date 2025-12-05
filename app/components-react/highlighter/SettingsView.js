import React, { useEffect, useRef, useState } from 'react';
import { InfoCircleOutlined } from '@ant-design/icons';
import HotkeyBinding from 'components-react/shared/HotkeyBinding';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { Button } from 'antd';
import { SUPPORTED_FILE_TYPES } from 'services/highlighter/constants';
import { SliderInput, SwitchInput } from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
import Scrollable from 'components-react/shared/Scrollable';
import styles from './SettingsView.m.less';
import { $t } from 'services/i18n';
import { EHighlighterView } from 'services/highlighter/models/highlighter.models';
import SupportedGames from './supportedGames/SupportedGames';
export default function SettingsView({ emitSetView, close, }) {
    var _a;
    const { HotkeysService, SettingsService, StreamingService, HighlighterService, IncrementalRolloutService, } = Services;
    const aiHighlighterFeatureEnabled = HighlighterService.aiHighlighterFeatureEnabled;
    const [hotkey, setHotkey] = useState(null);
    const hotkeyRef = useRef(null);
    const v = useVuex(() => ({
        settingsValues: SettingsService.views.values,
        isStreaming: StreamingService.isStreaming,
        useAiHighlighter: HighlighterService.views.useAiHighlighter,
        highlighterVersion: HighlighterService.views.highlighterVersion,
    }));
    const correctlyConfigured = v.settingsValues.Output.RecRB &&
        v.settingsValues.General.ReplayBufferWhileStreaming &&
        !v.settingsValues.General.KeepReplayBufferStreamStops &&
        SUPPORTED_FILE_TYPES.includes(v.settingsValues.Output.RecFormat);
    function configure() {
        SettingsService.actions.setSettingsPatch({
            General: {
                ReplayBufferWhileStreaming: true,
                KeepReplayBufferStreamStops: false,
            },
            Output: {
                RecRB: true,
            },
        });
        if (!SUPPORTED_FILE_TYPES.includes(v.settingsValues.Output.RecFormat)) {
            SettingsService.actions.setSettingsPatch({ Output: { RecFormat: 'mp4' } });
        }
    }
    useEffect(() => {
        HotkeysService.actions.return.getGeneralHotkeyByName('SAVE_REPLAY').then(hotkey => {
            if (hotkey)
                setHotkey(hotkey);
        });
    }, []);
    useEffect(() => {
        if (!v.isStreaming) {
            HotkeysService.actions.unregisterAll();
            return () => {
                if (hotkeyRef.current) {
                    HotkeysService.actions.applyGeneralHotkey(hotkeyRef.current);
                }
                else {
                    HotkeysService.actions.bindHotkeys();
                }
            };
        }
    }, [v.isStreaming]);
    function completedStepHeading(title) {
        return (React.createElement("h3", null,
            React.createElement("span", { style: { lineHeight: '24px', verticalAlign: 'top' } }, title)));
    }
    function incompleteStepHeading(title) {
        return (React.createElement("h3", null,
            React.createElement(InfoCircleOutlined, { style: { color: 'var(--info)', fontSize: 24, marginRight: 8 } }),
            React.createElement("span", { style: { lineHeight: '24px', verticalAlign: 'top' } }, title)));
    }
    function setReplayTime(time) {
        SettingsService.actions.setSettingsPatch({ Output: { RecRBTime: time } });
    }
    function toggleUseAiHighlighter() {
        HighlighterService.actions.toggleAiHighlighter();
    }
    return (React.createElement("div", { className: styles.settingsViewRoot },
        React.createElement("div", { style: { display: 'flex', padding: 20 } },
            React.createElement("div", { style: { flexGrow: 1 } },
                React.createElement("h1", { style: { margin: 0 } }, $t('Highlighter')),
                React.createElement("p", null, $t('The highlighter allows you to clip the best moments from your livestream and edit them together into an exciting highlight video you can upload directly to YouTube.'))),
            React.createElement("div", { style: { display: 'flex', gap: '16px' } },
                aiHighlighterFeatureEnabled && (React.createElement(Button, { type: "primary", onClick: () => emitSetView({ view: EHighlighterView.STREAM }) }, $t('Stream Highlights'))),
                React.createElement(Button, { onClick: () => emitSetView({ view: EHighlighterView.CLIPS, id: undefined }) }, $t('All Clips')))),
        React.createElement(Scrollable, { style: { flexGrow: 1, padding: '20px 20px 20px 20px', width: '100%' } },
            React.createElement("div", { className: styles.innerScrollWrapper },
                React.createElement("div", { className: styles.cardWrapper },
                    aiHighlighterFeatureEnabled && (React.createElement("div", { className: styles.highlighterCard },
                        React.createElement("div", { className: styles.cardHeaderbarWrapper },
                            React.createElement("div", { className: styles.cardHeaderbar },
                                React.createElement("div", { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
                                    React.createElement("i", { style: { margin: 0, fontSize: '20px' }, className: "icon-highlighter" }),
                                    React.createElement("h3", { style: { margin: 0, fontSize: '20px' } },
                                        " ",
                                        $t('AI Highlighter')),
                                    React.createElement("p", { className: styles.headerbarTag }, $t('Beta'))),
                                React.createElement(SupportedGames, { gamesVisible: 6, emitClick: () => {
                                        if (v.highlighterVersion === '')
                                            return;
                                        emitSetView({ view: EHighlighterView.STREAM });
                                    } }))),
                        React.createElement("p", { style: { margin: 0 } },
                            $t('Automatically capture the best moments from your livestream and turn them into a highlight video.'),
                            ' ',
                            v.highlighterVersion !== '' && (React.createElement("span", null, $t('The AI Highlighter App can be managed in the Apps Manager tab or in Settings > Installed apps.')))),
                        v.highlighterVersion !== '' ? (React.createElement(SwitchInput, { style: { margin: 0, marginLeft: '-10px' }, size: "default", value: v.useAiHighlighter, onChange: toggleUseAiHighlighter })) : (React.createElement(Button, { style: { width: 'fit-content' }, type: "primary", onClick: () => {
                                HighlighterService.actions.installAiHighlighter(true, 'Highlighter-tab');
                            } }, $t('Install AI Highlighter App'))),
                        React.createElement("div", { className: styles.recommendedCorner }, $t('Recommended')))),
                    React.createElement("div", { className: styles.manualCard },
                        React.createElement("h3", { className: styles.cardHeaderTitle }, aiHighlighterFeatureEnabled
                            ? $t('Or, use the built-in manual highlighter')
                            : $t('Built-in manual highlighter')),
                        React.createElement("p", null, $t('Manually capture the best moments from your livestream with a hotkey command, and automatically turn them into a highlight video.')),
                        React.createElement("div", { style: { display: 'flex', gap: '16px' } },
                            !v.isStreaming && !correctlyConfigured && (React.createElement("div", { className: styles.settingSection },
                                correctlyConfigured
                                    ? completedStepHeading($t('Configure the replay buffer'))
                                    : incompleteStepHeading($t('Configure the replay buffer')),
                                correctlyConfigured ? (React.createElement("div", null, $t('The replay buffer is correctly configured'))) : (React.createElement(Button, { onClick: configure }, $t('Configure'))))),
                            v.isStreaming && (React.createElement("div", { className: styles.settingSection, style: { width: '100%' } },
                                React.createElement("p", null, $t('End your stream to change the Hotkey or the replay duration.')))),
                            !v.isStreaming && (React.createElement("div", { className: styles.settingSection },
                                (hotkey === null || hotkey === void 0 ? void 0 : hotkey.bindings.length)
                                    ? completedStepHeading($t('Set a hotkey to capture replays'))
                                    : incompleteStepHeading($t('Set a hotkey to capture replays')),
                                hotkey && (React.createElement(HotkeyBinding, { style: { width: 'calc(100% + 10px)', marginLeft: '-10px' }, showLabel: false, hotkey: hotkey, binding: (_a = hotkey.bindings[0]) !== null && _a !== void 0 ? _a : null, onBind: binding => {
                                        const newHotkey = Object.assign({}, hotkey);
                                        newHotkey.bindings.splice(0, 1, binding);
                                        setHotkey(newHotkey);
                                        hotkeyRef.current = newHotkey;
                                    } })))),
                            !v.isStreaming && (React.createElement("div", { className: styles.settingSection, style: { width: '100%' } },
                                completedStepHeading($t('Adjust replay duration')),
                                React.createElement(Form, { layout: "inline" },
                                    React.createElement(SliderInput, { style: { width: 'calc(100% + 14px)', marginLeft: '-10px' }, label: null, value: v.settingsValues.Output.RecRBTime, onChange: setReplayTime, min: 1, max: 120, step: 1, debounce: 200, hasNumberInput: false, tooltipPlacement: "top", tipFormatter: v => `${v}s` }))))))),
                React.createElement("div", { className: styles.image })))));
}
//# sourceMappingURL=SettingsView.js.map