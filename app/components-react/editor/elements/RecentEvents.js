import React, { useEffect, useState } from 'react';
import { useVuex } from 'components-react/hooks';
import cx from 'classnames';
import moment from 'moment';
import { $t } from 'services/i18n';
import styles from './RecentEvents.m.less';
import Scrollable from 'components-react/shared/Scrollable';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import { Services } from 'components-react/service-provider';
import { Tooltip } from 'antd';
export default function RecentEvents(p) {
    const { RecentEventsService } = Services;
    const { recentEvents } = useVuex(() => ({
        recentEvents: RecentEventsService.state.recentEvents,
    }));
    return (React.createElement("div", { className: styles.container },
        !p.isOverlay && React.createElement(Toolbar, null),
        React.createElement(Scrollable, { className: cx(styles.eventContainer, p.isOverlay ? styles.overlay : '') },
            recentEvents.length !== 0 &&
                recentEvents.map(event => React.createElement(EventCell, { key: event.uuid, event: event })),
            recentEvents.length === 0 && (React.createElement("div", { className: styles.empty }, $t('There are no events to display'))))));
}
function Toolbar() {
    const { RecentEventsService, UserService, SpinWheelService } = Services;
    const { muted, enableChatNotifs, queuePaused, mediaShareEnabled, safeModeEnabled, spinWheelExists, } = useVuex(() => ({
        muted: RecentEventsService.state.muted,
        enableChatNotifs: RecentEventsService.state.enableChatNotifs,
        queuePaused: RecentEventsService.state.queuePaused,
        safeModeEnabled: RecentEventsService.state.safeMode.enabled,
        mediaShareEnabled: RecentEventsService.state.mediaShareEnabled,
        spinWheelExists: RecentEventsService.views.spinWheelExists,
    }));
    const pauseTooltip = queuePaused ? $t('Unpause Alert Queue') : $t('Pause Alert Queue');
    return (React.createElement("div", { className: styles.topBar },
        React.createElement("h2", { className: "studio-controls__label" }, $t('Mini Feed')),
        spinWheelExists && (React.createElement(Tooltip, { title: $t('Spin Wheel'), placement: "bottom" },
            React.createElement("i", { className: "fas fa-chart-pie action-icon", onClick: () => SpinWheelService.actions.spinWheel() }))),
        UserService.views.isTwitchAuthed && (React.createElement(Tooltip, { title: $t('Safe Mode'), placement: "bottom" },
            React.createElement("i", { className: cx('fa fa-shield-alt action-icon', {
                    [styles.teal]: safeModeEnabled,
                }), onClick: () => RecentEventsService.actions.showSafeModeWindow() }))),
        React.createElement(Tooltip, { title: $t('Popout Event Filtering Options'), placement: "bottom" },
            React.createElement("i", { className: "icon-filter action-icon", onClick: () => RecentEventsService.actions.showFilterMenu() })),
        mediaShareEnabled && (React.createElement(Tooltip, { title: $t('Popout Media Share Controls'), placement: "bottom" },
            React.createElement("i", { className: "icon-music action-icon", onClick: () => RecentEventsService.actions.openRecentEventsWindow(true) }))),
        React.createElement(Tooltip, { title: pauseTooltip, placement: "left" },
            React.createElement("i", { className: `${queuePaused ? 'icon-media-share-2' : 'icon-pause'} action-icon`, onClick: () => RecentEventsService.actions.toggleQueue() })),
        React.createElement(Tooltip, { title: $t('Skip Alert'), placement: "left" },
            React.createElement("i", { className: "icon-skip action-icon", onClick: () => RecentEventsService.actions.skipAlert() })),
        React.createElement(Tooltip, { title: enableChatNotifs
                ? $t('Disable Chat Box Notifications')
                : $t('Enable Chat Box Notifications'), placement: "left" },
            React.createElement("i", { className: cx('action-icon', {
                    'icon-notifications': enableChatNotifs,
                    'icon-notifications-off': !enableChatNotifs,
                }), onClick: () => RecentEventsService.actions.toggleMuteChatNotifs() })),
        React.createElement(Tooltip, { title: $t('Mute Event Sounds'), placement: "left" },
            React.createElement("i", { className: cx('action-icon', {
                    [styles.red]: muted,
                    fa: !muted,
                    'fa-volume-up': !muted,
                    'icon-mute': muted,
                }), onClick: () => RecentEventsService.actions.toggleMuteEvents() }))));
}
function EventCell(p) {
    var _a;
    const { RecentEventsService } = Services;
    const [timestamp, setTimestamp] = useState('');
    useEffect(() => {
        updateTimestamp();
        const timestampInterval = window.setInterval(() => {
            updateTimestamp();
        }, 60 * 1000);
        return () => {
            if (timestampInterval)
                clearInterval(timestampInterval);
        };
    }, []);
    function platformIcon() {
        const platform = p.event.platform;
        return {
            twitch_account: React.createElement(PlatformLogo, { platform: "twitch" }),
            youtube_account: React.createElement(PlatformLogo, { platform: "youtube", size: 16 }),
            facebook_account: React.createElement(PlatformLogo, { platform: "facebook" }),
            trovo_account: React.createElement(PlatformLogo, { platform: "trovo", size: 16 }),
            streamlabs: React.createElement(PlatformLogo, { platform: "streamlabs", size: 16 }),
            streamlabscharity: React.createElement(PlatformLogo, { platform: "streamlabs", size: 16 }),
        }[platform];
    }
    function updateTimestamp() {
        setTimestamp(moment.utc(createdAt()).fromNow(true));
    }
    function createdAt() {
        if (p.event.iso8601Created) {
            return moment(p.event.iso8601Created);
        }
        return moment.utc(p.event.created_at);
    }
    function getName(event) {
        if (event.gifter)
            return event.gifter;
        if (event.from)
            return event.from;
        return event.name;
    }
    function classForType(event) {
        if ((event.type === 'sticker' || event.type === 'effect') && event.currency) {
            return event.currency;
        }
        if (event.type === 'superchat' || event.formatted_amount || event.formattedAmount) {
            return 'donation';
        }
        return event.type;
    }
    function amountString(event) {
        if (event.formattedAmount)
            return event.formattedAmount;
        if (event.formatted_amount)
            return event.formatted_amount;
        if (event.type === 'superchat')
            return event.displayString;
        if (event.type === 'sticker' || event.type === 'effect') {
            return `${event.amount} ${event.currency}`;
        }
        return `${event.amount} ${event.type}`;
    }
    return (React.createElement("div", { className: cx(styles.cell, p.event.read ? styles.cellRead : ''), onClick: () => RecentEventsService.actions.readAlert(p.event) },
        React.createElement("span", { className: styles.timestamp }, timestamp),
        platformIcon(),
        React.createElement("span", { className: styles.name }, getName(p.event)),
        React.createElement("span", { className: styles.message }, RecentEventsService.views.getEventString(p.event)),
        p.event.gifter && (React.createElement("span", { className: cx(styles.name, styles.message) }, p.event.from ? p.event.from : p.event.name)),
        p.event.amount && (React.createElement("span", { className: styles[classForType(p.event)] }, amountString(p.event))),
        (p.event.comment || p.event.message) && (React.createElement("span", { className: styles.whisper }, (_a = p.event.comment) !== null && _a !== void 0 ? _a : p.event.message)),
        React.createElement("i", { className: "icon-repeat action-icon", onClick: (event) => {
                event.stopPropagation();
                RecentEventsService.actions.repeatAlert(p.event);
            }, "v-tooltip": { content: $t('Repeat Alert'), placement: 'left' } })));
}
//# sourceMappingURL=RecentEvents.js.map