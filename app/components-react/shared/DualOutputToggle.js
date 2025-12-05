import React from 'react';
import { Services } from '../service-provider';
import { useVuex } from 'components-react/hooks';
import styles from './DualOutputToggle.m.less';
import { $t } from 'services/i18n';
import Tooltip from 'components-react/shared/Tooltip';
import { CheckboxInput } from 'components-react/shared/inputs';
import { alertAsync } from 'components-react/modals';
import cx from 'classnames';
export default function DualOutputToggle(p) {
    var _a, _b, _c;
    const { TransitionsService, DualOutputService, StreamingService, UsageStatisticsService, UserService, TikTokService, } = Services;
    const v = useVuex(() => ({
        dualOutputMode: DualOutputService.views.dualOutputMode,
        studioMode: TransitionsService.views.studioMode,
        selectiveRecording: StreamingService.state.selectiveRecording,
        isPrime: UserService.state.isPrime,
    }));
    const defaultLabel = v.dualOutputMode ? $t('Disable Dual Output') : $t('Enable Dual Output');
    const value = (_a = p === null || p === void 0 ? void 0 : p.value) !== null && _a !== void 0 ? _a : v.dualOutputMode;
    const placement = (_b = p === null || p === void 0 ? void 0 : p.placement) !== null && _b !== void 0 ? _b : 'bottom';
    function toggleDualOutput(val) {
        if ((p === null || p === void 0 ? void 0 : p.onChange) !== undefined) {
            p.onChange(val);
            return;
        }
        if (v.studioMode) {
            showStudioModeModal();
            return;
        }
        if (v.selectiveRecording) {
            showSelectiveRecordingModal();
            return;
        }
        DualOutputService.actions.setDualOutputModeIfPossible(!v.dualOutputMode, true, true);
        if (v.dualOutputMode) {
            UsageStatisticsService.recordFeatureUsage('DualOutput');
            UsageStatisticsService.recordAnalyticsEvent('DualOutput', {
                type: 'ToggleOnDualOutput',
                source: 'GoLiveWindow',
                isPrime: v.isPrime,
                platforms: StreamingService.views.linkedPlatforms,
                tiktokStatus: TikTokService.scope,
            });
        }
    }
    return (React.createElement("div", { className: cx(p === null || p === void 0 ? void 0 : p.className, styles.dualOutputToggle, {
            [styles.doTooltip]: p.type === 'dual',
            [styles.soTooltip]: p.type === 'single',
        }), style: p === null || p === void 0 ? void 0 : p.style },
        React.createElement(CheckboxInput, { id: "dual-output-checkbox", name: "dual-output-checkbox", "data-name": "dual-output-checkbox", label: (_c = p === null || p === void 0 ? void 0 : p.label) !== null && _c !== void 0 ? _c : defaultLabel, value: value, onChange: toggleDualOutput, className: cx(styles.doCheckbox, p === null || p === void 0 ? void 0 : p.checkboxClassname), disabled: p === null || p === void 0 ? void 0 : p.disabled }),
        React.createElement(Tooltip, { title: $t('Stream to horizontal and vertical platforms simultaneously. Recordings will be in horizontal only.'), className: styles.doTooltip, placement: placement, lightShadow: p === null || p === void 0 ? void 0 : p.lightShadow, disabled: p === null || p === void 0 ? void 0 : p.tooltipDisabled },
            React.createElement("i", { className: "icon-information" }))));
}
function showSelectiveRecordingModal() {
    alertAsync({
        type: 'confirm',
        title: $t('Selective Recording Enabled'),
        closable: true,
        content: (React.createElement("span", null, $t('Selective Recording only works with horizontal sources and disables editing the vertical output scene. Please disable Selective Recording to go live with Dual Output.'))),
        cancelText: $t('Close'),
        okText: $t('Disable'),
        okButtonProps: { type: 'primary' },
        onOk: () => {
            Services.StreamingService.actions.setSelectiveRecording(!Services.StreamingService.state.selectiveRecording);
        },
        cancelButtonProps: { style: { display: 'inline' } },
    });
}
function showStudioModeModal() {
    alertAsync({
        type: 'confirm',
        title: $t('Studio Mode Enabled'),
        closable: true,
        content: (React.createElement("span", null, $t('Cannot toggle Dual Output while in Studio Mode. Please disable Studio Mode to go live with Dual Output.'))),
        cancelText: $t('Close'),
        okText: $t('Disable'),
        okButtonProps: { type: 'primary' },
        onOk: () => {
            Services.TransitionsService.actions.disableStudioMode();
        },
        cancelButtonProps: { style: { display: 'inline' } },
    });
}
//# sourceMappingURL=DualOutputToggle.js.map