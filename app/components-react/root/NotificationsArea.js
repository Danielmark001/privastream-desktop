import React, { useState, useEffect, useRef } from 'react';
import { useModule } from 'slap';
import { Badge, message, Tooltip } from 'antd';
import moment from 'moment';
import cx from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import { Services } from '../service-provider';
import { ENotificationType } from 'services/notifications';
import { $t } from 'services/i18n';
import styles from './NotificationsArea.m.less';
const notificationAudio = require('../../../media/sound/ding.wav');
class NotificationsModule {
    constructor() {
        this.currentNotif = null;
        this.notifQueue = cloneDeep(Services.NotificationsService.state.notifications);
        this.audio = new Audio(notificationAudio);
        this.readyToPlay = false;
    }
    setReadyToPlay() {
        if (this.readyToPlay)
            return;
        this.readyToPlay = true;
        this.playNext();
    }
    addNotif(notif) {
        if (this.currentNotif || !this.readyToPlay) {
            this.notifQueue.push(notif);
        }
        else {
            this.playNotif(notif);
        }
    }
    playNotif(notif) {
        if (!this.settings.enabled)
            return;
        if (notif.unread === false) {
            return;
        }
        this.currentNotif = notif;
        if (this.settings.playSound)
            this.audio.play();
        message
            .info({
            content: React.createElement(MessageNode, { notif: notif }),
            duration: notif.lifeTime === -1 ? 0 : notif.lifeTime / 1000,
            key: `${notif.message}${notif.date}`,
            onClick: () => this.clickNotif(),
            className: cx(styles.notification, {
                [styles.info]: notif.type === 'INFO',
                [styles.warning]: notif.type === 'WARNING',
                [styles.success]: notif.type === 'SUCCESS',
                [styles.hasAction]: notif.action,
            }),
        })
            .then(() => this.playNext());
    }
    playNext() {
        if (this.currentNotif) {
            message.destroy();
        }
        if (this.notifQueue.length > 0) {
            this.playNotif(this.notifQueue.shift());
        }
        else {
            this.currentNotif = null;
        }
    }
    clearQueueOfRead(ids) {
        this.notifQueue = this.notifQueue.filter(notif => !ids.includes(notif.id));
        if (this.currentNotif && ids.includes(this.currentNotif.id))
            this.playNext();
    }
    get unreadWarnings() {
        return Services.NotificationsService.views.getUnread(ENotificationType.WARNING);
    }
    get unreadNotifs() {
        return Services.NotificationsService.views.getUnread();
    }
    get settings() {
        return Services.NotificationsService.state.settings;
    }
    get platform() {
        var _a;
        return (_a = Services.UserService.views.platform) === null || _a === void 0 ? void 0 : _a.type;
    }
    get ytDisabled() {
        var _a;
        return (((_a = Services.UserService.views.platform) === null || _a === void 0 ? void 0 : _a.type) === 'youtube' &&
            !Services.YoutubeService.state.liveStreamingEnabled);
    }
    openYoutubeEnable() {
        Services.YoutubeService.actions.openYoutubeEnable();
    }
    confirmYoutubeEnabled() {
        if (this.platform === 'youtube') {
            Services.YoutubeService.actions.prepopulateInfo();
        }
    }
    clickNotif() {
        if (!this.currentNotif)
            return;
        if (this.currentNotif.action) {
            Services.NotificationsService.actions.applyAction(this.currentNotif.id);
            Services.NotificationsService.actions.markAsRead(this.currentNotif.id);
        }
        else {
            Services.NotificationsService.actions.showNotifications();
        }
        this.playNext();
    }
}
export default function NotificationsArea() {
    const { NotificationsService } = Services;
    const { unreadWarnings, unreadNotifs, settings, ytDisabled, addNotif, clearQueueOfRead, setReadyToPlay, } = useModule(NotificationsModule);
    const notificationsContainer = useRef(null);
    const [showExtendedNotifications, setShowExtendedNotifications] = useState(false);
    const showNotificationsTooltip = $t('Click to open your Notifications window');
    const showUnreadNotificationsTooltip = $t('Click to read your unread Notifications');
    useEffect(() => {
        const notifPushedSub = NotificationsService.notificationPushed.subscribe(addNotif);
        const notifReadSub = NotificationsService.notificationRead.subscribe(clearQueueOfRead);
        const resizeInterval = window.setInterval(() => {
            var _a, _b;
            if (!notificationsContainer.current || ytDisabled)
                return;
            if (((_a = notificationsContainer.current) === null || _a === void 0 ? void 0 : _a.offsetWidth) >= 150 === showExtendedNotifications)
                return;
            setShowExtendedNotifications(((_b = notificationsContainer.current) === null || _b === void 0 ? void 0 : _b.offsetWidth) >= 150);
        }, 1000);
        return () => {
            notifPushedSub.unsubscribe();
            notifReadSub.unsubscribe();
            clearInterval(resizeInterval);
        };
    }, []);
    useEffect(() => {
        message.config({
            getContainer: () => notificationsContainer.current,
            maxCount: 1,
        });
        setReadyToPlay();
    }, []);
    function showNotifications() {
        NotificationsService.actions.showNotifications();
    }
    if (!settings.enabled)
        return React.createElement(React.Fragment, null);
    return (React.createElement("div", { className: cx(styles.notificationsArea, 'flex--grow') },
        unreadWarnings.length > 0 && (React.createElement(Tooltip, { placement: "right", title: showUnreadNotificationsTooltip },
            React.createElement("div", { className: cx(styles.notificationsCounter, styles.notificationsCounterWarning), onClick: showNotifications },
                React.createElement(Badge, { dot: unreadWarnings.length > 0, color: "red" },
                    React.createElement("i", { className: "fa fa-exclamation-triangle" }),
                    unreadWarnings.length)))),
        unreadWarnings.length < 1 && (React.createElement(Tooltip, { placement: "right", title: showNotificationsTooltip },
            React.createElement("div", { className: styles.notificationsCounter, onClick: showNotifications },
                React.createElement(Badge, { dot: unreadNotifs.length > 0 },
                    React.createElement("i", { className: "icon-notifications" }))))),
        React.createElement("div", { className: cx(styles.notificationsContainer, 'flex--grow', {
                [styles.hideNotifs]: !showExtendedNotifications,
            }), ref: notificationsContainer }, ytDisabled && React.createElement(YTError, null))));
}
function MessageNode(p) {
    function fromNow(time) {
        return moment(time).fromNow();
    }
    return (React.createElement(React.Fragment, null,
        p.notif.message,
        " ",
        p.notif.showTime && React.createElement("span", null,
            " ",
            fromNow(p.notif.date))));
}
function YTError() {
    const { confirmYoutubeEnabled, openYoutubeEnable } = useModule(NotificationsModule);
    return (React.createElement("div", { className: cx('ant-message-notice', styles.notification, styles.warning, styles.ytError) },
        React.createElement("i", { className: "fa fa-exclamation-triangle" }),
        React.createElement("span", null, $t('YouTube account not enabled for live streaming')),
        React.createElement("button", { className: cx('button', styles.alertButton), onClick: openYoutubeEnable }, $t('Fix')),
        React.createElement("button", { className: cx('button', styles.alertButton), onClick: confirmYoutubeEnabled }, $t("I'm set up"))));
}
//# sourceMappingURL=NotificationsArea.js.map