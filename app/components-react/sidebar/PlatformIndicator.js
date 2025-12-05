import React from 'react';
import cx from 'classnames';
import { $t } from 'services/i18n';
import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import styles from './PlatformIndicator.m.less';
export default function PlatformIndicator({ platform }) {
    const { StreamSettingsService, RestreamService } = Services;
    const restreamEnabled = RestreamService.views.canEnableRestream;
    const { platforms, customDestinations } = useVuex(() => {
        var _a, _b;
        return ({
            platforms: (_a = StreamSettingsService.views.settings.goLiveSettings) === null || _a === void 0 ? void 0 : _a.platforms,
            customDestinations: (_b = StreamSettingsService.views.settings.goLiveSettings) === null || _b === void 0 ? void 0 : _b.customDestinations,
        });
    });
    const enabledPlatformsTuple = platforms
        ? Object.entries(platforms).filter(([_, p]) => p.enabled)
        : [];
    const hasMultiplePlatforms = enabledPlatformsTuple.length > 1;
    const hasCustomDestinations = (customDestinations === null || customDestinations === void 0 ? void 0 : customDestinations.some(d => d.enabled)) || false;
    if (hasMultiplePlatforms || hasCustomDestinations) {
        return (React.createElement(MultiPlatformIndicator, { hasCustomDestinations: hasCustomDestinations, enabledPlatforms: enabledPlatformsTuple }));
    }
    return React.createElement(SinglePlatformIndicator, { platform: platform });
}
const SinglePlatformIndicator = ({ platform }) => {
    var _a;
    const username = (platform === null || platform === void 0 ? void 0 : platform.type) === 'instagram' ? undefined : platform === null || platform === void 0 ? void 0 : platform.username;
    return (React.createElement(React.Fragment, null,
        platform && (React.createElement(PlatformLogo, { platform: platform === null || platform === void 0 ? void 0 : platform.type, className: cx(styles.platformLogo, styles[`platform-logo-${(_a = platform === null || platform === void 0 ? void 0 : platform.type) !== null && _a !== void 0 ? _a : 'default'}`]) })),
        React.createElement("span", { className: styles.username }, username || $t('Log Out')),
        React.createElement("i", { className: cx('icon-logout', styles.loginArrow) })));
};
const MultiPlatformIndicator = ({ hasCustomDestinations, enabledPlatforms, }) => {
    const displayedDestinations = (hasCustomDestinations ? 1 : 0) + enabledPlatforms.length;
    const platformsToDisplay = enabledPlatforms.slice(0, 6 - (hasCustomDestinations ? 1 : 0));
    return (React.createElement("div", { style: {
            display: 'flex',
            flexDirection: 'row',
            flex: 1,
            justifyContent: 'space-between',
            alignItems: 'center',
        } },
        React.createElement("div", { className: styles.platformIcons },
            platformsToDisplay.map(([platform, _]) => (React.createElement(PlatformLogo, { key: platform, platform: platform, className: cx(styles.platformLogo, styles[`platform-logo-${platform}`]) }))),
            hasCustomDestinations && React.createElement("i", { className: "fa fa-globe" })),
        displayedDestinations < 4 && (React.createElement("div", { className: styles.username, style: { flex: 1 } }, $t('Logged In'))),
        React.createElement("i", { className: cx('icon-logout', styles.loginArrow) })));
};
//# sourceMappingURL=PlatformIndicator.js.map