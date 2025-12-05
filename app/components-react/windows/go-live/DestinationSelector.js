import React, { useMemo } from 'react';
import { $t } from 'services/i18n';
import { platformLabels } from 'services/platforms';
import { useGoLiveSettings } from './useGoLiveSettings';
import { Select } from 'antd';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import { Services } from 'components-react/service-provider';
import styles from './GoLive.m.less';
import cx from 'classnames';
const { Option } = Select;
export default function DestinationSelector(p) {
    const { linkedPlatforms, shouldAddTikTok, enabledPlatforms, customDestinations, isDualOutputMode, isEnabled, } = useGoLiveSettings().extend(module => {
        return {
            get shouldAddTikTok() {
                return !module.isPlatformLinked('tiktok') && !module.isDualOutputMode;
            },
        };
    });
    function showStreamSettings() {
        Services.SettingsService.actions.showSettings('Stream');
    }
    const platformTargets = shouldAddTikTok ? ['tiktok'] : linkedPlatforms;
    const options = useMemo(() => {
        const platforms = platformTargets
            .filter((platform) => !isEnabled(platform))
            .map((platform) => ({
            value: platform,
            label: (React.createElement(React.Fragment, null,
                React.createElement(PlatformLogo, { platform: platform, className: styles.selectorIcon, fontIcon: ['tiktok', 'trovo'].includes(platform) ? platform : undefined }),
                platformLabels(platform))),
        }));
        const destinations = customDestinations
            .filter(destination => !destination.enabled)
            .map((destination) => ({
            value: destination.name,
            label: (React.createElement(React.Fragment, null,
                React.createElement("i", { className: cx(styles.selectorIcon, 'fa fa-globe') }),
                destination.name)),
        }));
        return platforms.concat(destinations);
    }, [linkedPlatforms, enabledPlatforms, customDestinations]);
    const defaultLabel = [
        {
            value: 'default',
            label: (React.createElement("div", null,
                React.createElement("i", { className: cx('icon-add', styles.icon) }),
                'Add Destination')),
        },
    ];
    return (React.createElement(Select, { "data-test": "destination-selector", defaultValue: defaultLabel[0], className: cx(styles.platformsSelector, { [styles.dualOutputSelector]: isDualOutputMode }), onChange: (option) => {
            if (option.value === 'add' ||
                (option.value === 'tiktok' && !isEnabled('tiktok') && !isDualOutputMode)) {
                showStreamSettings();
            }
            else {
                if (linkedPlatforms.includes(option.value)) {
                    p.showSwitcher(option.value);
                    p.togglePlatform(option.value);
                }
                else {
                    customDestinations.forEach((destination, index) => {
                        if (destination.name === option.value) {
                            p === null || p === void 0 ? void 0 : p.switchDestination(index);
                        }
                    });
                }
            }
        }, labelInValue: true, value: defaultLabel[0], size: "large" },
        options.map((option) => {
            var _a;
            return (React.createElement(Option, { key: option.value, value: (_a = option.value) !== null && _a !== void 0 ? _a : '' }, option.label));
        }),
        React.createElement(Option, { key: "add", value: "add", className: styles.optionBtn },
            React.createElement("i", { className: cx('icon-add-circle', styles.selectorIcon) }),
            $t('Other'))));
}
//# sourceMappingURL=DestinationSelector.js.map