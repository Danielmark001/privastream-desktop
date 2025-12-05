import React, { useEffect } from 'react';
import { shell } from '@electron/remote';
import styles from './StreamShiftToggle.m.less';
import Tooltip from 'components-react/shared/Tooltip';
import { CheckboxInput } from 'components-react/shared/inputs';
import cx from 'classnames';
import { $t } from 'services/i18n';
import { useGoLiveSettings } from 'components-react/windows/go-live/useGoLiveSettings';
import UltraIcon from './UltraIcon';
import { Services } from '../service-provider';
import Badge from 'components-react/shared/DismissableBadge';
export default function StreamShiftToggle(p) {
    const { isPrime, isStreamShiftMode, setStreamShift } = useGoLiveSettings();
    useEffect(() => {
        if (!isPrime && isStreamShiftMode) {
            setStreamShift(false);
        }
    }, [isPrime, isStreamShiftMode]);
    const label = $t('Stream Shift');
    function handleTooltipClick() {
        shell.openExternal('https://streamlabs.com/content-hub/post/how-to-use-streamlabs-stream-shift');
    }
    return (React.createElement("div", { className: styles.streamShiftWrapper },
        React.createElement("div", { className: cx(p === null || p === void 0 ? void 0 : p.className, styles.streamShiftToggle), style: p === null || p === void 0 ? void 0 : p.style },
            React.createElement(CheckboxInput, { className: p === null || p === void 0 ? void 0 : p.checkboxClassname, label: !isPrime ? (React.createElement("div", { className: styles.labelUltraBadge, onClick: () => {
                        Services.MagicLinkService.actions.linkToPrime('slobs-streamswitcher', 'StreamShift');
                    } },
                    React.createElement(UltraIcon, { type: "badge", style: { marginRight: '5px' } }),
                    label)) : (React.createElement(React.Fragment, null, label)), value: isStreamShiftMode, onChange: (status) => {
                    setStreamShift(status);
                    Services.UsageStatisticsService.actions.recordAnalyticsEvent('StreamShift', {
                        toggle: status,
                    });
                }, disabled: p === null || p === void 0 ? void 0 : p.disabled }),
            React.createElement(Tooltip, { title: React.createElement("span", { onClick: handleTooltipClick },
                    $t('Stay uninterrupted by switching between devices mid stream. Works between Desktop and Mobile App.'),
                    React.createElement("a", { style: { marginLeft: 4 } }, $t('Learn More'))), placement: "top", lightShadow: true, disabled: p === null || p === void 0 ? void 0 : p.disabled },
                React.createElement("i", { className: "icon-information", style: { marginLeft: '10px' } }))),
        React.createElement(Badge, { className: styles.betaBadge, content: 'Beta' })));
}
//# sourceMappingURL=StreamShiftToggle.js.map