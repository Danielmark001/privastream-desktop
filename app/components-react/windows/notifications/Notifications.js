import React, { useEffect } from 'react';
import moment from 'moment';
import cx from 'classnames';
import { useRenderInterval, useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
import Scrollable from 'components-react/shared/Scrollable';
import { $t } from 'services/i18n';
import styles from './Notifications.m.less';
export default function Notifications() {
    const { NotificationsService } = Services;
    useRenderInterval(() => { }, 60 * 1000);
    useEffect(() => () => NotificationsService.actions.markAllAsRead(), []);
    const { notificationGroups, notificationsCount } = useVuex(() => ({
        notificationGroups: {
            unread: NotificationsService.views.getUnread(),
            read: NotificationsService.views.getRead(),
        },
        notificationsCount: NotificationsService.views.getAll().length,
    }));
    function onNotificationClickHandler(id) {
        NotificationsService.actions.applyAction(id);
    }
    function momentize(time) {
        return moment(time).fromNow();
    }
    return (React.createElement(Scrollable, { style: { height: 'calc(93vh - 100px)' } },
        !notificationsCount && React.createElement("h4", null, $t("You don't have any notifications")),
        Object.keys(notificationGroups).map((groupName) => (React.createElement("div", { key: groupName },
            notificationGroups[groupName].length > 0 && (React.createElement("h4", null, groupName === 'unread' ? $t('New Notifications') : $t('Log'))),
            notificationGroups[groupName].map((notify) => (React.createElement("div", { key: notify.id, onClick: () => onNotificationClickHandler(notify.id), className: cx(styles.notification, {
                    [styles.unread]: notify.unread,
                    [styles.hasAction]: notify.action,
                }), "data-name": notify.action && 'hasAction' },
                React.createElement("div", { className: "icon" },
                    notify.type === 'INFO' && React.createElement("span", { className: "fa fa-info-circle" }),
                    notify.type === 'WARNING' && React.createElement("span", { className: "fa fa-warning" })),
                React.createElement("div", { className: "message" }, notify.message),
                React.createElement("div", { className: styles.date }, momentize(notify.date))))))))));
}
//# sourceMappingURL=Notifications.js.map