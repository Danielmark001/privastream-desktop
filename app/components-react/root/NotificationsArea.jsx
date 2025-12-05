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
            content: <MessageNode notif={notif}/>,
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
        return <></>;
    return (<div className={cx(styles.notificationsArea, 'flex--grow')}>
      {unreadWarnings.length > 0 && (<Tooltip placement="right" title={showUnreadNotificationsTooltip}>
          <div className={cx(styles.notificationsCounter, styles.notificationsCounterWarning)} onClick={showNotifications}>
            <Badge dot={unreadWarnings.length > 0} color="red">
              <i className="fa fa-exclamation-triangle"/>
              {unreadWarnings.length}
            </Badge>
          </div>
        </Tooltip>)}
      {unreadWarnings.length < 1 && (<Tooltip placement="right" title={showNotificationsTooltip}>
          <div className={styles.notificationsCounter} onClick={showNotifications}>
            <Badge dot={unreadNotifs.length > 0}>
              <i className="icon-notifications"/>
            </Badge>
          </div>
        </Tooltip>)}
      <div className={cx(styles.notificationsContainer, 'flex--grow', {
            [styles.hideNotifs]: !showExtendedNotifications,
        })} ref={notificationsContainer}>
        {ytDisabled && <YTError />}
      </div>
    </div>);
}
function MessageNode(p) {
    function fromNow(time) {
        return moment(time).fromNow();
    }
    return (<>
      {p.notif.message} {p.notif.showTime && <span> {fromNow(p.notif.date)}</span>}
    </>);
}
function YTError() {
    const { confirmYoutubeEnabled, openYoutubeEnable } = useModule(NotificationsModule);
    return (<div className={cx('ant-message-notice', styles.notification, styles.warning, styles.ytError)}>
      <i className="fa fa-exclamation-triangle"/>
      <span>{$t('YouTube account not enabled for live streaming')}</span>
      <button className={cx('button', styles.alertButton)} onClick={openYoutubeEnable}>
        {$t('Fix')}
      </button>
      <button className={cx('button', styles.alertButton)} onClick={confirmYoutubeEnabled}>
        {$t("I'm set up")}
      </button>
    </div>);
}
//# sourceMappingURL=NotificationsArea.jsx.map