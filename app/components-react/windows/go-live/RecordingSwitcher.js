import React from 'react';
import styles from './RecordingSwitcher.m.less';
import { Services } from 'components-react/service-provider';
import { $t } from 'services/i18n';
import { useVuex } from 'components-react/hooks';
import { useGoLiveSettings } from './useGoLiveSettings';
import Tooltip from 'components-react/shared/Tooltip';
import { SwitchInput } from 'components-react/shared/inputs';
import { RadioInput } from 'components-react/shared/inputs/RadioInput';
import cx from 'classnames';
import { EAvailableFeatures } from 'services/incremental-rollout';
export default function RecordingSwitcher(p) {
    const { recording, toggleRecordingDisplay } = useGoLiveSettings();
    const canRecordVertical = Services.IncrementalRolloutService.views.featureIsEnabled(EAvailableFeatures.dualOutputRecording);
    const v = useVuex(() => ({
        isDualOutputMode: Services.DualOutputService.views.dualOutputMode,
        recordWhenStreaming: Services.StreamSettingsService.views.settings.recordWhenStreaming,
        useAiHighlighter: Services.HighlighterService.views.useAiHighlighter,
    }));
    const recordWhenStartStream = v.recordWhenStreaming || v.useAiHighlighter;
    return (React.createElement("div", { style: p === null || p === void 0 ? void 0 : p.style, className: cx(p === null || p === void 0 ? void 0 : p.className, styles.recordingSwitcher) },
        React.createElement(Tooltip, { title: $t('AI Highlighter is enabled. Recording will start when stream starts.'), disabled: !v.useAiHighlighter, placement: "topRight", lightShadow: true, className: styles.recordingTooltip },
            React.createElement(SwitchInput, { name: "recording-toggle", value: recordWhenStartStream, onChange: val => {
                    Services.SettingsService.actions.setSettingValue('General', 'RecordWhenStreaming', val);
                }, uncontrolled: true, style: { marginRight: '10px' }, label: v.isDualOutputMode ? $t('Record Stream in') : $t('Record Stream'), layout: "horizontal", checkmark: true, disabled: v.useAiHighlighter }),
            v.isDualOutputMode && canRecordVertical && (React.createElement(React.Fragment, null,
                React.createElement(RadioInput, { name: "recording-display", value: recording[0], options: [
                        { value: 'horizontal', label: $t('Horizontal'), icon: 'icon-desktop' },
                        { value: 'vertical', label: $t('Vertical'), icon: 'icon-phone-case' },
                    ], onChange: (display) => toggleRecordingDisplay(display, true), icons: true, className: styles.recordingDisplay, disabled: v.useAiHighlighter }),
                $t('format'))),
            v.useAiHighlighter && React.createElement("i", { className: cx(styles.info, 'icon-information') }))));
}
//# sourceMappingURL=RecordingSwitcher.js.map