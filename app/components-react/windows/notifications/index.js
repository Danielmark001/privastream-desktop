import React from 'react';
import { Services } from 'components-react/service-provider';
import { Tabs } from 'antd';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import News from './News';
import Notifications from './Notifications';
import { $t } from 'services/i18n';
export default function NotificationsAndNews() {
    const tabNames = {
        news: $t('News'),
        notifications: $t('Notifications'),
    };
    return (React.createElement(ModalLayout, { hideFooter: true },
        React.createElement(Tabs, { defaultActiveKey: Services.NotificationsService.views.getUnread().length > 0
                ? tabNames.notifications.toLowerCase()
                : tabNames.news.toLowerCase(), style: { height: 'calc(100vh - 50px)' } },
            React.createElement(Tabs.TabPane, { tab: tabNames.news, key: tabNames.news.toLowerCase(), style: { height: 'calc(100vh - 50px)' } },
                React.createElement(News, null)),
            React.createElement(Tabs.TabPane, { tab: tabNames.notifications, key: tabNames.notifications.toLowerCase(), style: { height: 'calc(100vh - 50px)' } },
                React.createElement(Notifications, null)))));
}
//# sourceMappingURL=index.js.map