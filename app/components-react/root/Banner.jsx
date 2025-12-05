import React from 'react';
import * as remote from '@electron/remote';
import { Services } from 'components-react/service-provider';
import { $t } from 'services/i18n';
import styles from './Banner.m.less';
import { useRealmObject } from 'components-react/hooks/realm';
export default function Banner() {
    const { AnnouncementsService, SettingsService, NavigationService } = Services;
    const banner = useRealmObject(AnnouncementsService.currentAnnouncements).banner;
    if (!banner)
        return <></>;
    function handleClick() {
        var _a;
        if (banner.linkTarget === 'slobs') {
            if (banner.link === 'Settings') {
                SettingsService.actions.showSettings((_a = banner.params) === null || _a === void 0 ? void 0 : _a.category);
            }
            else {
                NavigationService.actions.navigate(banner.link, banner.params);
            }
        }
        else {
            remote.shell.openExternal(banner.link);
        }
        if (banner.closeOnLink)
            close('action');
    }
    function close(clickType) {
        AnnouncementsService.actions.closeBanner(clickType);
    }
    return (<div className={styles.bannerContainer}>
      {!!banner.thumbnail && <img src={banner.thumbnail}/>}
      <strong style={{ color: 'var(--title)' }}>{banner.header}</strong>
      <span>{banner.subHeader}</span>
      <span className={styles.link} onClick={handleClick}>
        {banner.linkTitle}
        <i className="fas fa-arrow-right"/>
      </span>
      <span className={styles.close} onClick={() => close('dismissal')}>
        {$t('Dismiss')}
      </span>
    </div>);
}
//# sourceMappingURL=Banner.jsx.map