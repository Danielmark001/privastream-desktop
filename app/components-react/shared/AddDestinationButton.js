import React from 'react';
import { $t } from 'services/i18n';
import { Services } from 'components-react/service-provider';
import { useGoLiveSettings } from 'components-react/windows/go-live/useGoLiveSettings';
import { Button } from 'antd';
import { ButtonGroup } from 'components-react/shared/ButtonGroup';
import UltraIcon from './UltraIcon';
import ButtonHighlighted from './ButtonHighlighted';
import { PlusOutlined } from '@ant-design/icons';
import styles from './AddDestinationButton.m.less';
import cx from 'classnames';
import { useRealmObject } from 'components-react/hooks/realm';
const PlusIcon = PlusOutlined;
export default function AddDestinationButton(p) {
    var _a, _b, _c, _d, _e;
    const { addDestination, btnType, isDualOutputMode } = useGoLiveSettings().extend(module => {
        const { RestreamService, SettingsService, MagicLinkService } = Services;
        return {
            addDestination() {
                if (module.isPrime) {
                    SettingsService.actions.showSettings('Stream');
                }
                else if (module.isDualOutputMode) {
                    MagicLinkService.linkToPrime('slobs-dual-output', 'DualOutput');
                }
                else {
                    MagicLinkService.linkToPrime('slobs-single-output');
                }
            },
            get canAddDestinations() {
                const linkedPlatforms = module.state.linkedPlatforms;
                const customDestinations = module.state.customDestinations;
                return linkedPlatforms.length + customDestinations.length < 8;
            },
            get btnType() {
                if (!RestreamService.state.grandfathered && !module.isPrime)
                    return 'ultra';
                return 'default';
            },
        };
    });
    const type = (_a = p === null || p === void 0 ? void 0 : p.type) !== null && _a !== void 0 ? _a : btnType;
    return (React.createElement(ButtonGroup, { className: cx(styles.addDestinationGroup, {
            [styles.ultraBtnGroup]: type === 'ultra',
            [styles.infoBannerGroup]: type === 'banner',
            [styles.smallBtnGroup]: type === 'small',
        }), align: "center", direction: "vertical", size: "middle", style: p === null || p === void 0 ? void 0 : p.style },
        type === 'default' && (React.createElement(DefaultAddDestinationButton, { className: p === null || p === void 0 ? void 0 : p.className, onClick: (_b = p === null || p === void 0 ? void 0 : p.onClick) !== null && _b !== void 0 ? _b : addDestination })),
        type === 'ultra' && (React.createElement(UltraAddDestinationButton, { className: p === null || p === void 0 ? void 0 : p.className, isDualOutputMode: isDualOutputMode, onClick: (_c = p === null || p === void 0 ? void 0 : p.onClick) !== null && _c !== void 0 ? _c : addDestination })),
        type === 'small' && (React.createElement(SmallAddDestinationButton, { className: p === null || p === void 0 ? void 0 : p.className, onClick: (_d = p === null || p === void 0 ? void 0 : p.onClick) !== null && _d !== void 0 ? _d : addDestination })),
        type === 'banner' && (React.createElement(AddDestinationBanner, { className: p === null || p === void 0 ? void 0 : p.className, onClick: (_e = p === null || p === void 0 ? void 0 : p.onClick) !== null && _e !== void 0 ? _e : addDestination }))));
}
function DefaultAddDestinationButton(p) {
    return (React.createElement(Button, { "data-name": "default-add-destination", className: cx(styles.addDestinationBtn, styles.defaultOutputBtn, p.className), onClick: p.onClick, block: true },
        React.createElement(PlusIcon, { style: { paddingLeft: '17px', fontSize: '24px' } }),
        React.createElement("span", { style: { flex: 1 } }, $t('Add Destination'))));
}
function SmallAddDestinationButton(p) {
    return (React.createElement(Button, { "data-name": "default-add-destination", className: cx(styles.addDestinationBtn, styles.smallBtn, p.className), onClick: p.onClick, block: true },
        React.createElement(PlusIcon, { style: { paddingLeft: '17px', fontSize: '24px' } }),
        React.createElement("span", { style: { flex: 1 } }, $t('Add Destination'))));
}
function UltraAddDestinationButton(p) {
    return (React.createElement(ButtonHighlighted, { "data-name": "ultra-add-destination", faded: true, className: cx(styles.addDestinationBtn, styles.ultraBtn, { [styles.dualOutputUltraBtn]: p.isDualOutputMode }, p.className), onClick: p.onClick },
        React.createElement("div", { className: styles.btnText },
            React.createElement("i", { className: cx('icon-add', styles.addDestinationIcon) }),
            $t('Add Destination with Ultra')),
        React.createElement(UltraIcon, { type: "night", className: styles.ultraIcon })));
}
function AddDestinationBanner(p) {
    const isDarkTheme = useRealmObject(Services.CustomizationService.state).isDarkTheme;
    const text = $t('You can stream to any 2 destinations for free with Dual Output. Multistream and switch seamlessly between streams with Ultra');
    return (React.createElement(ButtonHighlighted, { faded: true, className: cx(styles.infoBanner, { [styles.night]: isDarkTheme }, p === null || p === void 0 ? void 0 : p.className), onClick: p.onClick },
        React.createElement(UltraIcon, { type: "badge", className: styles.ultraIcon }),
        React.createElement("div", { className: styles.bannerText }, text)));
}
//# sourceMappingURL=AddDestinationButton.js.map