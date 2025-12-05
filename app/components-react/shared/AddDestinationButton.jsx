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
    return (<ButtonGroup className={cx(styles.addDestinationGroup, {
            [styles.ultraBtnGroup]: type === 'ultra',
            [styles.infoBannerGroup]: type === 'banner',
            [styles.smallBtnGroup]: type === 'small',
        })} align="center" direction="vertical" size="middle" style={p === null || p === void 0 ? void 0 : p.style}>
      {type === 'default' && (<DefaultAddDestinationButton className={p === null || p === void 0 ? void 0 : p.className} onClick={(_b = p === null || p === void 0 ? void 0 : p.onClick) !== null && _b !== void 0 ? _b : addDestination}/>)}

      {type === 'ultra' && (<UltraAddDestinationButton className={p === null || p === void 0 ? void 0 : p.className} isDualOutputMode={isDualOutputMode} onClick={(_c = p === null || p === void 0 ? void 0 : p.onClick) !== null && _c !== void 0 ? _c : addDestination}/>)}

      {type === 'small' && (<SmallAddDestinationButton className={p === null || p === void 0 ? void 0 : p.className} onClick={(_d = p === null || p === void 0 ? void 0 : p.onClick) !== null && _d !== void 0 ? _d : addDestination}/>)}

      {type === 'banner' && (<AddDestinationBanner className={p === null || p === void 0 ? void 0 : p.className} onClick={(_e = p === null || p === void 0 ? void 0 : p.onClick) !== null && _e !== void 0 ? _e : addDestination}/>)}
    </ButtonGroup>);
}
function DefaultAddDestinationButton(p) {
    return (<Button data-name="default-add-destination" className={cx(styles.addDestinationBtn, styles.defaultOutputBtn, p.className)} onClick={p.onClick} block>
      <PlusIcon style={{ paddingLeft: '17px', fontSize: '24px' }}/>
      <span style={{ flex: 1 }}>{$t('Add Destination')}</span>
    </Button>);
}
function SmallAddDestinationButton(p) {
    return (<Button data-name="default-add-destination" className={cx(styles.addDestinationBtn, styles.smallBtn, p.className)} onClick={p.onClick} block>
      <PlusIcon style={{ paddingLeft: '17px', fontSize: '24px' }}/>
      <span style={{ flex: 1 }}>{$t('Add Destination')}</span>
    </Button>);
}
function UltraAddDestinationButton(p) {
    return (<ButtonHighlighted data-name="ultra-add-destination" faded className={cx(styles.addDestinationBtn, styles.ultraBtn, { [styles.dualOutputUltraBtn]: p.isDualOutputMode }, p.className)} onClick={p.onClick}>
      <div className={styles.btnText}>
        <i className={cx('icon-add', styles.addDestinationIcon)}/>
        {$t('Add Destination with Ultra')}
      </div>
      <UltraIcon type="night" className={styles.ultraIcon}/>
    </ButtonHighlighted>);
}
function AddDestinationBanner(p) {
    const isDarkTheme = useRealmObject(Services.CustomizationService.state).isDarkTheme;
    const text = $t('You can stream to any 2 destinations for free with Dual Output. Multistream and switch seamlessly between streams with Ultra');
    return (<ButtonHighlighted faded className={cx(styles.infoBanner, { [styles.night]: isDarkTheme }, p === null || p === void 0 ? void 0 : p.className)} onClick={p.onClick}>
      <UltraIcon type="badge" className={styles.ultraIcon}/>
      <div className={styles.bannerText}>{text}</div>
    </ButtonHighlighted>);
}
//# sourceMappingURL=AddDestinationButton.jsx.map