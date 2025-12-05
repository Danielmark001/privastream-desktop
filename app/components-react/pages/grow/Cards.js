import * as remote from '@electron/remote';
import React from 'react';
import cx from 'classnames';
import { Progress, Button } from 'antd';
import PlatformLogo from '../../shared/PlatformLogo';
import styles from './Grow.m.less';
import { Services } from '../../service-provider';
import { $t } from '../../../services/i18n';
const ONE_DAY = 1000 * 60 * 60 * 24;
export function GoalCard(p) {
    const { GrowService } = Services;
    const { title, image, type } = p.goal;
    const daysLeft = Math.round(GrowService.views.timeLeft(p.goal) / ONE_DAY);
    const goalFinished = GrowService.views.goalExpiredOrComplete(p.goal);
    const goalFinishedText = p.goal.progress === p.goal.total
        ? $t('This goal has been completed!')
        : $t('Time ran out for this goal. Try again or pick a new one!');
    function incrementCustomGoal() {
        GrowService.actions.incrementGoal(p.goal.type, 1);
    }
    function addGoal() {
        if (type === 'custom' && p.showGoalModal) {
            p.showGoalModal();
        }
        else {
            GrowService.actions.addGoal(p.goal);
        }
    }
    function removeGoal() {
        GrowService.actions.removeGoal(p.goal);
    }
    const manuallyProgressedGoal = image === '' ||
        !['stream_times_per_week', 'stream_hours_per_month', 'multistream_per_week'].includes(p.goal.type);
    return (React.createElement("div", { className: styles.card, key: type },
        React.createElement("strong", null, title),
        daysLeft !== Infinity && !goalFinished && (React.createElement("span", { className: styles.whisper }, $t('%{daysLeft} days left', { daysLeft }))),
        p.goal.progress != null && (React.createElement(Progress, { percent: Math.floor((p.goal.progress / p.goal.total) * 100), showInfo: false, steps: p.goal.total, strokeWidth: 16 })),
        p.goal.progress != null && manuallyProgressedGoal && !goalFinished ? (React.createElement(Button, { onClick: incrementCustomGoal, type: "primary" }, $t('Progress'))) : (React.createElement("img", { src: image })),
        goalFinished && React.createElement("span", null, goalFinishedText),
        p.goal.progress == null && React.createElement(Button, { onClick: addGoal }, $t('Add Goal')),
        p.goal.progress != null && (React.createElement("i", { onClick: removeGoal, className: cx('icon-close', styles.closeIcon) }))));
}
export function UniversityCard(p) {
    var _a, _b;
    let content = $t('Professional streamers are now able to earn large amounts of money while entertaining people and creating their own brand. But how does one become a professional streamer? Streamlabs University is our answer to this question. In this course, we’ll walk you through everything you need to know to become a successful streamer and turn your passion into a profession.');
    let buttonText = $t('Open Streamlabs University');
    let imageUrl = 'https://slobs-cdn.streamlabs.com/media/grow/streamlabs_university.png';
    function openLink() {
        var _a;
        const url = ((_a = p.progress.stopped_at) === null || _a === void 0 ? void 0 : _a.url) || 'https://streamlabs.com/university';
        remote.shell.openExternal(url);
    }
    if (p.progress.enrolled && ((_a = p.progress) === null || _a === void 0 ? void 0 : _a.total_progress) < 100 && p.progress.stopped_at) {
        content = React.createElement(UniversityProgress, { progress: p.progress });
        buttonText = $t('Continue Learning');
        imageUrl = p.progress.stopped_at.image;
    }
    else if (((_b = p.progress) === null || _b === void 0 ? void 0 : _b.total_progress) === 100) {
        content = $t('You have completed Streamlabs University!');
    }
    return (React.createElement("div", { className: styles.card, style: { minWidth: '580px' } },
        React.createElement("div", { className: styles.cardInner },
            React.createElement("h3", null, $t('Streamlabs University')),
            React.createElement("span", null, content),
            React.createElement(Button, { onClick: openLink }, buttonText)),
        React.createElement("img", { style: { borderRadius: '8px' }, src: imageUrl })));
}
function UniversityProgress(p) {
    var _a, _b;
    return (React.createElement("div", null,
        React.createElement("span", null,
            $t('You cleared %{totalProgress}% of all material. Keep it up!', {
                totalProgress: p.progress.total_progress,
            }),
            React.createElement(Progress, { percent: p.progress.total_progress, showInfo: false, style: { marginRight: '16px' } }),
            React.createElement("h3", null, (_a = p.progress.stopped_at) === null || _a === void 0 ? void 0 : _a.title),
            React.createElement("span", null, (_b = p.progress.stopped_at) === null || _b === void 0 ? void 0 : _b.description))));
}
export function ContentHubCard() {
    function openLink(youtube) {
        if (youtube) {
            return remote.shell.openExternal('https://www.youtube.com/playlist?list=PLNqq3_wAj1iBLgWoGw9MrM9_Ts0KewtMK');
        }
        remote.shell.openExternal('https://streamlabs.com/content-hub');
    }
    return (React.createElement("div", { className: styles.card, style: { minWidth: '580px' } },
        React.createElement("div", { className: styles.cardInner },
            React.createElement("h3", null, $t('Creator Resource Hub')),
            React.createElement("span", null, $t('The Ultimate Resource For Live Streamers; The Creator Resource Hub is your one-stop-shop for everything related to live streaming. There are dozens of different categories to choose from. Learn how to set up your live stream, find new features, and stay up-to-date on all of the tools you can use to enhance your stream.')),
            React.createElement("footer", null,
                React.createElement(Button, { onClick: () => openLink() }, $t('Open Resource Hub')),
                React.createElement(Button, { onClick: () => openLink(true) }, $t('Streamlabs on YouTube')))),
        React.createElement("img", { className: styles.cardImage, src: "https://slobs-cdn.streamlabs.com/media/grow/content_hub.png" })));
}
export function PlatformCard(p) {
    const { followers, icon } = p.platform;
    const { NavigationService } = Services;
    function platformMerge() {
        NavigationService.actions.navigate('PlatformMerge', { platform: icon });
    }
    const nameMap = {
        twitch: 'Twitch',
        facebook: 'Facebook',
        youtube: 'YouTube',
        trovo: 'Trovo',
    };
    return (React.createElement("div", { className: styles.card },
        React.createElement("div", { className: styles.cardHeader },
            React.createElement(PlatformLogo, { platform: icon, className: styles.cardIcon }),
            React.createElement("span", { className: cx(styles.title, styles[icon]) }, nameMap[icon])),
        followers != null ? (React.createElement("span", null, $t('%{followers} followers', { followers }))) : (React.createElement(Button, { onClick: platformMerge }, $t('Connect')))));
}
export function MultistreamCard() {
    const { MagicLinkService } = Services;
    function getPrime() {
        MagicLinkService.actions.linkToPrime('grow-community');
    }
    return (React.createElement("div", { className: cx(styles.card, styles.primeCard), onClick: getPrime },
        React.createElement("i", { className: "icon-prime" }),
        React.createElement("div", { className: styles.cardHeader },
            React.createElement("strong", null, $t('Reach more of your community with Streamlabs Multistreaming'))),
        React.createElement("span", null, $t('One of the best ways to reach a larger audience is to stream to multiple platforms')),
        React.createElement(Button, { type: "primary" }, $t('Start Multistreaming with Prime'))));
}
//# sourceMappingURL=Cards.js.map