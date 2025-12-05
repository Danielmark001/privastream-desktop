import React from 'react';
import styles from './GoLive.m.less';
import Scrollable from 'components-react/shared/Scrollable';
import { Services } from 'components-react/service-provider';
import { useGoLiveSettings } from './useGoLiveSettings';
import { $t } from 'services/i18n';
import { Row, Col } from 'antd';
import { Section } from './Section';
import PlatformSettings from './PlatformSettings';
import TwitterInput from './Twitter';
import OptimizedProfileSwitcher from './OptimizedProfileSwitcher';
import Spinner from 'components-react/shared/Spinner';
import GoLiveError from './GoLiveError';
import PrimaryChatSwitcher from './PrimaryChatSwitcher';
import ColorSpaceWarnings from './ColorSpaceWarnings';
import DualOutputToggle from 'components-react/shared/DualOutputToggle';
import { DestinationSwitchers } from './DestinationSwitchers';
import AddDestinationButton from 'components-react/shared/AddDestinationButton';
import cx from 'classnames';
import StreamShiftToggle from 'components-react/shared/StreamShiftToggle';
import { CaretDownOutlined } from '@ant-design/icons';
import Tooltip from 'components-react/shared/Tooltip';
export default function GoLiveSettings() {
    const { isAdvancedMode, protectedModeEnabled, error, isLoading, isDualOutputMode, canAddDestinations, canUseOptimizedProfile, showTweet, hasMultiplePlatforms, hasMultiplePlatformsLinked, enabledPlatforms, primaryChat, recommendedColorSpaceWarnings, isPrime, isStreamShiftMode, isStreamShiftDisabled, isDualOutputSwitchDisabled, setPrimaryChat, } = useGoLiveSettings().extend(module => {
        var _a;
        const { UserService, VideoEncodingOptimizationService, SettingsService, IncrementalRolloutService, } = Services;
        return {
            get canAddDestinations() {
                const linkedPlatforms = module.state.linkedPlatforms;
                const customDestinations = module.state.customDestinations;
                return linkedPlatforms.length + customDestinations.length < 8;
            },
            showSelector: !UserService.views.isPrime && module.isDualOutputMode,
            hasMultiplePlatformsLinked: module.state.linkedPlatforms.length > 1,
            isPrime: UserService.views.isPrime,
            showTweet: ((_a = UserService.views.auth) === null || _a === void 0 ? void 0 : _a.primaryPlatform) !== 'twitter',
            isStreamShiftDisabled: module.isDualOutputMode,
            isDualOutputSwitchDisabled: module.isStreamShiftMode && !module.isDualOutputMode,
            addDestination() {
                SettingsService.actions.showSettings('Stream');
            },
            canUseOptimizedProfile: !module.isDualOutputMode
                ? VideoEncodingOptimizationService.state.canSeeOptimizedProfile ||
                    VideoEncodingOptimizationService.state.useOptimizedProfile
                : false,
        };
    });
    const shouldShowSettings = !error && !isLoading;
    const shouldShowLeftCol = isDualOutputMode ? true : protectedModeEnabled;
    const shouldShowAddDestButton = canAddDestinations;
    const shouldShowPrimaryChatSwitcher = hasMultiplePlatforms || (isDualOutputMode && hasMultiplePlatformsLinked);
    const headerText = isDualOutputMode ? $t('Destinations & Outputs:') : $t('Destinations:');
    const height = isPrime ? '61%' : '50%';
    const featureCheckboxWidth = isPrime ? 140 : 155;
    return (React.createElement(Row, { gutter: 16, className: styles.settingsRow },
        shouldShowLeftCol && (React.createElement(Col, { span: 9, className: styles.leftColumn },
            !isPrime && React.createElement(AddDestinationButton, { type: "banner", className: styles.addDestination }),
            React.createElement("div", { className: styles.columnHeader, style: { paddingTop: '15px' } }, headerText),
            React.createElement(Scrollable, { style: { height } },
                React.createElement(DestinationSwitchers, null)),
            shouldShowAddDestButton && (React.createElement(AddDestinationButton, { type: "small", className: styles.columnPadding, onClick: () => Services.SettingsService.actions.showSettings('Stream') })),
            React.createElement("div", { className: styles.leftFooter },
                React.createElement(PrimaryChatSwitcher, { className: cx(styles.primaryChat, {
                        [styles.disabled]: !shouldShowPrimaryChatSwitcher,
                    }), enabledPlatforms: enabledPlatforms, onSetPrimaryChat: setPrimaryChat, primaryChat: primaryChat, suffixIcon: React.createElement(CaretDownOutlined, null), layout: "horizontal", logo: false, border: false, disabled: !shouldShowPrimaryChatSwitcher }),
                React.createElement("div", { className: cx(styles.toggleWrapper, { [styles.shiftEnabled]: isStreamShiftMode }) },
                    React.createElement(Tooltip, { title: $t('Dual Output cannot be used with Stream Shift'), placement: "top", lightShadow: true, disabled: isDualOutputSwitchDisabled || !isPrime },
                        React.createElement(DualOutputToggle, { className: styles.featureToggle, checkboxClassname: styles.featureCheckbox, style: { paddingBottom: '10px', width: featureCheckboxWidth }, disabled: isStreamShiftMode, tooltipDisabled: isStreamShiftMode, label: $t('Dual Output'), type: "single", lightShadow: true })),
                    React.createElement(Tooltip, { title: isPrime
                            ? $t('Stream Shift cannot be used with Dual Output')
                            : $t('Upgrade to Ultra to switch streams between devices.'), placement: "top", lightShadow: true, disabled: isPrime && !isStreamShiftDisabled },
                        React.createElement(StreamShiftToggle, { className: styles.featureToggle, checkboxClassname: styles.featureCheckbox, style: { width: featureCheckboxWidth }, disabled: isStreamShiftDisabled || !isPrime })))))),
        React.createElement(Col, { span: shouldShowLeftCol ? 15 : 24, className: cx(styles.rightColumn, !shouldShowLeftCol && styles.destinationMode) },
            React.createElement(Spinner, { visible: isLoading, relative: true }),
            React.createElement(GoLiveError, null),
            shouldShowSettings && (React.createElement(React.Fragment, null,
                React.createElement(Scrollable, { style: { height: '92%' }, snapToWindowEdge: true },
                    recommendedColorSpaceWarnings && (React.createElement(ColorSpaceWarnings, { warnings: recommendedColorSpaceWarnings })),
                    React.createElement(PlatformSettings, null),
                    isAdvancedMode && React.createElement("div", { className: styles.spacer }),
                    !!canUseOptimizedProfile && (React.createElement(Section, { isSimpleMode: !isAdvancedMode, title: $t('Extras') },
                        React.createElement(OptimizedProfileSwitcher, null))),
                    React.createElement("div", { className: styles.spacer })),
                showTweet && React.createElement(TwitterInput, null))))));
}
//# sourceMappingURL=GoLiveSettings.js.map