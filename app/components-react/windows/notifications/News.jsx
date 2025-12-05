import React, { useEffect } from 'react';
import { shell } from 'electron';
import Scrollable from 'components-react/shared/Scrollable';
import { Services } from 'components-react/service-provider';
import styles from './News.m.less';
import { useRealmObject } from 'components-react/hooks/realm';
export default function News() {
    const { WindowsService, SettingsService, NavigationService, AnnouncementsService, UsageStatisticsService, } = Services;
    const newsItems = useRealmObject(AnnouncementsService.currentAnnouncements).news;
    useEffect(() => {
        AnnouncementsService.actions.getNews();
        return () => {
            AnnouncementsService.actions.seenNews();
        };
    }, []);
    function handleClick(item) {
        return () => {
            var _a;
            AnnouncementsService.actions.closeNews(item.id);
            if (item.linkTarget === 'slobs') {
                if (item.link === 'Settings') {
                    SettingsService.showSettings((_a = item.params) === null || _a === void 0 ? void 0 : _a.category);
                }
                else {
                    NavigationService.navigate(item.link, item.params);
                }
            }
            else {
                shell.openExternal(item.link);
            }
            if (item.closeOnLink)
                WindowsService.closeChildWindow();
        };
    }
    return (<Scrollable style={{ height: 'calc(93vh - 100px)' }} snapToWindowEdge>
      {newsItems.map(item => (<div className={styles.newsItemContainer} key={item.id}>
          <img className={styles.newsImage} src={item.thumbnail}/>
          <h4>{item.header}</h4>
          <span>{item.subHeader}</span>
          <button className="button button--action" onClick={handleClick(item)}>
            {item.linkTitle}
          </button>
        </div>))}
    </Scrollable>);
}
//# sourceMappingURL=News.jsx.map