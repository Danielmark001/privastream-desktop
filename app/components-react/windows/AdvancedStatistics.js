import React, { useEffect } from 'react';
import cx from 'classnames';
import { Services } from '../service-provider';
import { useRenderInterval, useVuex } from '../hooks';
import { $t } from '../../services/i18n';
import styles from './AdvancedStatistics.m.less';
import { ModalLayout } from '../shared/ModalLayout';
import PerformanceMetrics from '../shared/PerformanceMetrics';
import { EStreamingState } from 'services/streaming';
import moment from 'moment';
import { EStreamQuality } from 'services/performance';
import { ENotificationSubType } from 'services/notifications';
import Scrollable from '../shared/Scrollable';
export default function AdvancedStatistics() {
    const { NotificationsService, PerformanceService, StreamingService, MediaBackupService, } = Services;
    const { notifications, streamingStatus, syncStatus, streamQuality } = useVuex(() => ({
        notifications: NotificationsService.views
            .getAll()
            .filter(notification => notification.subType !== ENotificationSubType.DEFAULT),
        streamQuality: PerformanceService.views.streamQuality,
        streamingStatus: StreamingService.views.streamingStatus,
        syncStatus: MediaBackupService.views.globalSyncStatus,
    }));
    useRenderInterval(() => { }, 60 * 1000);
    useEffect(() => {
        const notificationPushedSub = NotificationsService.notificationPushed.subscribe(notify => {
            onNotificationHandler(notify);
        });
        return () => {
            NotificationsService.actions.markAllAsRead();
            notificationPushedSub.unsubscribe();
        };
    }, []);
    function status() {
        if (streamingStatus === EStreamingState.Offline) {
            return {
                type: 'info',
                description: $t('Your stream is currently offline'),
            };
        }
        if (streamingStatus === EStreamingState.Reconnecting || streamQuality === EStreamQuality.POOR) {
            return {
                type: 'error',
                description: $t('Your stream is experiencing issues'),
                icon: 'fa fa-minus-circle',
            };
        }
        if (streamQuality === EStreamQuality.FAIR) {
            return {
                type: 'warning',
                description: $t('Your stream is experiencing minor issues'),
                icon: 'fa fa-exclamation-triangle',
            };
        }
        return {
            type: 'success',
            description: $t('Your stream quality is good'),
            icon: 'fa fa-check',
        };
    }
    function onNotificationHandler(notification) {
        var _a;
        if (notification.subType === ENotificationSubType.DEFAULT) {
            return;
        }
        if (((_a = notifications[0]) === null || _a === void 0 ? void 0 : _a.subType) === notification.subType)
            notifications.shift();
        notifications.unshift(notification);
    }
    function onNotificationClickHandler(id) {
        NotificationsService.applyAction(id);
    }
    return (React.createElement(ModalLayout, { hideFooter: true },
        React.createElement("div", { slot: "content", className: styles.container, "data-syncstatus": syncStatus },
            React.createElement(StatusBar, { status: status() }),
            React.createElement("div", null,
                React.createElement("h2", null, $t('Live Stats')),
                React.createElement("p", null, $t('Click on a stat to add it to your footer')),
                React.createElement("div", { className: styles.statsRow },
                    React.createElement(PerformanceMetrics, { mode: "full" }))),
            React.createElement(NotificationsArea, { notifications: notifications, onNotificationClickHandler: onNotificationClickHandler }))));
}
function StatusBar(p) {
    return (React.createElement("div", null,
        React.createElement("h2", null, "Status"),
        React.createElement("div", { className: cx(styles.status, p.status.type === 'error' ? styles.error : '', p.status.type === 'warning' ? styles.warning : '', p.status.type === 'success' ? styles.success : '') },
            p.status.icon && React.createElement("i", { className: p.status.icon }),
            React.createElement("span", null, p.status.description))));
}
function fromNow(time) {
    return moment(time).fromNow();
}
function NotificationsArea(p) {
    return (React.createElement("div", { className: styles.section, style: { height: '100%' } },
        React.createElement("h2", null, $t('Performance Notifications')),
        React.createElement(Scrollable, { className: styles.notificationContainer, style: { height: '100%', width: '100%' }, isResizable: false },
            p.notifications.map(notification => (React.createElement("div", { className: cx(styles.notification, styles.hasAction), "data-name": "notification", key: notification.id, onClick: () => {
                    p.onNotificationClickHandler(notification.id);
                } },
                React.createElement(IconForNotification, { notification: notification }),
                React.createElement("div", { className: "message" }, notification.message),
                React.createElement("div", { className: "date" }, fromNow(notification.date))))),
            p.notifications.length === 0 && (React.createElement("div", { className: styles.notificationEmpty },
                React.createElement("div", { className: "message" }, $t("You don't have any notifications"))))),
        React.createElement("p", { className: styles.description }, $t('When Streamlabs detects performance issues with your stream, such as dropped frames, lagged frames, or a stream disconnection, troubleshooting notifications will be sent to you here.'))));
}
function IconForNotification(p) {
    return (React.createElement("div", { className: "icon" },
        p.notification.subType === ENotificationSubType.DISCONNECTED && (React.createElement("i", { className: cx('icon-disconnected', styles.errorText) })),
        p.notification.subType === ENotificationSubType.SKIPPED && (React.createElement("i", { className: cx('icon-reset icon-skipped-frame', styles.warningText) })),
        p.notification.subType === ENotificationSubType.LAGGED && (React.createElement("i", { className: cx('icon-time', styles.warningText) })),
        p.notification.subType === ENotificationSubType.DROPPED && (React.createElement("i", { className: cx('icon-back-alt icon-down-arrow', styles.warningText) }))));
}
//# sourceMappingURL=AdvancedStatistics.js.map