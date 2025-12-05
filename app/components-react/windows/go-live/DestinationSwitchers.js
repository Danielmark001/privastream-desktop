import React, { useRef, useMemo } from 'react';
import { getPlatformService, platformLabels } from '../../../services/platforms';
import cx from 'classnames';
import { $t } from '../../../services/i18n';
import styles from './DestinationSwitchers.m.less';
import { Services } from '../../service-provider';
import { SwitchInput } from '../../shared/inputs';
import PlatformLogo from '../../shared/PlatformLogo';
import { useDebounce } from '../../hooks';
import { useGoLiveSettings } from './useGoLiveSettings';
import DisplaySelector from 'components-react/shared/DisplaySelector';
import ConnectButton from 'components-react/shared/ConnectButton';
import { message } from 'antd';
export function DestinationSwitchers() {
    const { linkedPlatforms, enabledPlatforms, unlinkedPlatforms, customDestinations, enabledDestinations, switchPlatforms, switchCustomDestination, isPlatformLinked, isPrimaryPlatform, isRestreamEnabled, isDualOutputMode, isPrime, alwaysEnabledPlatforms, alwaysShownPlatforms, } = useGoLiveSettings();
    const enabledPlatformsRef = useRef(enabledPlatforms);
    enabledPlatformsRef.current = enabledPlatforms;
    const enabledDestRef = useRef(enabledDestinations);
    enabledDestRef.current = enabledDestinations;
    const platforms = useMemo(() => {
        const unlinkedAlwaysShownPlatforms = alwaysShownPlatforms.filter(platform => !isPlatformLinked(platform));
        return unlinkedAlwaysShownPlatforms.length
            ? linkedPlatforms.concat(unlinkedAlwaysShownPlatforms)
            : linkedPlatforms;
    }, [linkedPlatforms, enabledPlatformsRef.current, isDualOutputMode, isPrime]);
    const disableCustomDestinationSwitchers = !isRestreamEnabled &&
        !isDualOutputMode &&
        !isEnabled('tiktok') &&
        enabledPlatformsRef.current.length > 1;
    const disableNonUltraSwitchers = isDualOutputMode &&
        !isPrime &&
        enabledPlatformsRef.current.length + enabledDestRef.current.length >= 2;
    const emitSwitch = useDebounce(500, (ind, enabled) => {
        if (ind !== undefined && enabled !== undefined) {
            switchCustomDestination(ind, enabled);
        }
        else {
            switchPlatforms(enabledPlatformsRef.current);
        }
    });
    function isEnabled(target) {
        if (typeof target === 'number') {
            return enabledDestRef.current.includes(target);
        }
        else {
            return enabledPlatformsRef.current.includes(target);
        }
    }
    function togglePlatform(platform, enabled) {
        if (!isPrime) {
            if (isDualOutputMode) {
                if (enabledPlatformsRef.current.length + enabledDestRef.current.length <= 2) {
                    enabledPlatformsRef.current.push(platform);
                }
                else {
                    enabledPlatformsRef.current = enabledPlatformsRef.current.filter(p => p !== platform);
                }
            }
            else {
                if (enabled && alwaysEnabledPlatforms.includes(platform)) {
                    enabledPlatformsRef.current.push(platform);
                }
                else if (enabled) {
                    enabledPlatformsRef.current = enabledPlatformsRef.current.filter(p => alwaysEnabledPlatforms.includes(p));
                    enabledPlatformsRef.current.push(platform);
                }
                else {
                    enabledPlatformsRef.current = enabledPlatformsRef.current.filter(p => p !== platform);
                }
            }
            if (!enabledPlatformsRef.current.length) {
                enabledPlatformsRef.current.push(platform);
            }
            emitSwitch();
            return;
        }
        if (!isRestreamEnabled && !alwaysEnabledPlatforms.includes(platform)) {
            enabledPlatformsRef.current = [];
        }
        else {
            enabledPlatformsRef.current = enabledPlatformsRef.current.filter(p => p !== platform);
        }
        if (enabled) {
            enabledPlatformsRef.current.push(platform);
        }
        if (!enabledPlatformsRef.current.length) {
            enabledPlatformsRef.current.push(platform);
        }
        emitSwitch();
    }
    function toggleDestination(index, enabled) {
        if (isDualOutputMode && !isPrime) {
            if (enabledPlatformsRef.current.length + enabledDestRef.current.length < 2) {
                enabledDestRef.current.push(index);
            }
            else {
                enabledDestRef.current = enabledDestRef.current.filter((dest, i) => i !== index);
            }
            emitSwitch(index, enabled);
            return;
        }
        enabledDestRef.current = enabledDestRef.current.filter((dest, i) => i !== index);
        if (enabled) {
            enabledDestRef.current.push(index);
        }
        emitSwitch(index, enabled);
    }
    return (React.createElement("div", { className: cx(styles.switchWrapper, styles.columnPadding) },
        platforms.map((platform, ind) => (React.createElement(DestinationSwitcher, { key: platform, destination: platform, enabled: isPrime || isDualOutputMode
                ? isEnabled(platform)
                : isEnabled(platform) && (isPrimaryPlatform(platform) || platform === 'tiktok'), onChange: enabled => togglePlatform(platform, enabled), switchDisabled: !isEnabled(platform) && disableNonUltraSwitchers, isDualOutputMode: isDualOutputMode, index: ind }))), customDestinations === null || customDestinations === void 0 ? void 0 :
        customDestinations.map((dest, ind) => (React.createElement(DestinationSwitcher, { key: ind, destination: dest, enabled: dest.enabled && !disableCustomDestinationSwitchers, onChange: enabled => toggleDestination(ind, enabled), switchDisabled: disableCustomDestinationSwitchers || (!dest.enabled && disableNonUltraSwitchers), isDualOutputMode: isDualOutputMode, index: ind }))),
        unlinkedPlatforms.map((platform, ind) => (React.createElement(DestinationSwitcher, { key: platform, destination: platform, enabled: false, onChange: () => { }, switchDisabled: true, isDualOutputMode: isDualOutputMode, isUnlinked: true, index: ind })))));
}
const DestinationSwitcher = React.forwardRef((p, ref) => {
    const switchInputRef = useRef(null);
    const containerRef = useRef(null);
    const platform = typeof p.destination === 'string' ? p.destination : null;
    const disabled = p === null || p === void 0 ? void 0 : p.switchDisabled;
    const label = platform
        ? $t('Toggle %{platform}', { platform: platformLabels(platform) })
        : $t('Toggle Destination');
    function onClickHandler(ev) {
        var _a;
        if (disabled) {
            if (!Services.UserService.state.isPrime) {
                message.info({
                    key: 'switcher-info-alert',
                    content: (React.createElement("div", { className: styles.alertContent },
                        React.createElement("div", null, $t("You've selected the two streaming destinations. Disable a destination to enable a different one. \nYou can always upgrade to Ultra for multistreaming.")),
                        React.createElement("i", { className: "icon-close" }))),
                    className: styles.infoAlert,
                    onClick: () => message.destroy('switcher-info-alert'),
                });
            }
            return;
        }
        const enable = !p.enabled;
        p.onChange(enable);
        (_a = switchInputRef.current) === null || _a === void 0 ? void 0 : _a.click();
    }
    const { title, description, Controller, Logo } = (() => {
        var _a, _b;
        const { UserService } = Services;
        if (platform) {
            const service = getPlatformService(platform);
            const platformAuthData = (_a = UserService.state.auth) === null || _a === void 0 ? void 0 : _a.platforms[platform];
            const username = (_b = platformAuthData === null || platformAuthData === void 0 ? void 0 : platformAuthData.username) !== null && _b !== void 0 ? _b : '';
            return {
                title: service.displayName,
                description: username,
                Logo: () => (React.createElement(PlatformLogo, { platform: platform, className: cx(styles[`platform-logo-${platform}`]) })),
                Controller: () => (React.createElement(SwitchInput, { inputRef: switchInputRef, value: p.enabled, name: platform, disabled: disabled, uncontrolled: true, label: label, nolabel: true, className: "platform-switch", color: "secondary", size: "default", skipWrapperAttrs: true })),
            };
        }
        else {
            const destination = p.destination;
            const name = `destination${p === null || p === void 0 ? void 0 : p.index}`;
            return {
                title: destination.name,
                description: destination.url,
                Logo: () => React.createElement("i", { className: cx(styles.destinationLogo, 'fa fa-globe') }),
                Controller: () => (React.createElement(SwitchInput, { inputRef: switchInputRef, value: p.enabled, name: name, disabled: disabled, uncontrolled: true, label: label, nolabel: true, className: "destination-switch", color: "secondary", size: "default", skipWrapperAttrs: true })),
            };
        }
    })();
    return (React.createElement("div", { ref: containerRef, className: cx('single-output-card', styles.platformSwitcher, {
            [styles.platformDisabled]: !p.enabled && !(p === null || p === void 0 ? void 0 : p.isUnlinked),
            [styles.platformEnabled]: p.enabled,
        }), onClick: onClickHandler },
        React.createElement("div", { className: cx(styles.colInput) },
            React.createElement(Controller, null)),
        React.createElement("div", { className: cx('logo', styles.platformLogo) },
            React.createElement(Logo, null)),
        React.createElement("div", { className: styles.colAccount },
            React.createElement("div", { className: styles.platformName }, title),
            React.createElement("div", { className: styles.platformHandle }, description)),
        p.isDualOutputMode && !(p === null || p === void 0 ? void 0 : p.isUnlinked) && (React.createElement("div", { className: styles.displaySelectorWrapper, onClick: e => e.stopPropagation() },
            React.createElement(DisplaySelector, { title: title, nolabel: true, className: styles.dualOutputDisplaySelector, platform: platform, index: p.index }))),
        (p === null || p === void 0 ? void 0 : p.isUnlinked) && platform && (React.createElement(ConnectButton, { platform: platform, className: styles.connectButton }))));
});
//# sourceMappingURL=DestinationSwitchers.js.map