var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as remote from '@electron/remote';
import React, { useEffect, useState, useRef } from 'react';
import shuffle from 'lodash/shuffle';
import { Button, Modal } from 'antd';
import Form, { useForm } from '../../shared/inputs/Form';
import { $t } from '../../../services/i18n';
import styles from './Grow.m.less';
import { useVuex } from '../../hooks';
import { Services } from '../../service-provider';
import Util from '../../../services/utils';
import Scrollable from 'components-react/shared/Scrollable';
import { GoalCard, PlatformCard, UniversityCard, ContentHubCard } from './Cards';
import { TextInput, NumberInput, ListInput } from 'components-react/shared/inputs';
export default function Grow() {
    const { GrowService, UserService } = Services;
    const v = useVuex(() => ({
        goals: GrowService.views.goals,
        platformsToMap: GrowService.views.platformsToMap,
        progress: GrowService.views.universityProgress,
        analytics: GrowService.views.analytics,
        isTwitchAuthed: UserService.views.isTwitchAuthed,
    }));
    useEffect(fetchApiData, []);
    function fetchApiData() {
        GrowService.actions.fetchGoals();
        GrowService.actions.fetchAnalytics();
        GrowService.actions.fetchUniversityProgress();
        GrowService.actions.fetchPlatformFollowers();
    }
    return (React.createElement("div", { className: styles.goalTabContainer },
        React.createElement(Scrollable, { className: styles.goalTabContent, isResizable: false, style: { width: '100%' } },
            React.createElement(MyGoals, { goals: v.goals }),
            React.createElement(MyCommunity, { platforms: v.platformsToMap }),
            v.isTwitchAuthed && React.createElement(StreamPulse, { analytics: v.analytics }),
            React.createElement(ResourceFooter, { universityProgress: v.progress })),
        React.createElement(GrowthTips, null)));
}
function MyGoals(p) {
    const { GrowService } = Services;
    const [showGoalModal, setShowGoalModal] = useState(false);
    const mappedGoals = Object.values(p.goals);
    const shuffledGoalOptions = useRef(shuffle(GrowService.views.goalOptions));
    const appendedOptions = shuffledGoalOptions.current
        .filter(goal => !p.goals[goal.type])
        .slice(0, 4 - mappedGoals.length);
    return (React.createElement("div", { className: styles.myGoals },
        React.createElement("h2", null, $t('My Goals')),
        React.createElement(Button, { onClick: () => setShowGoalModal(true), className: styles.addGoalButton }, $t('Add Goal')),
        React.createElement("div", { className: styles.goalsContainer },
            mappedGoals.map(goal => (React.createElement(GoalCard, { goal: goal, key: goal.type }))),
            appendedOptions.map(goal => (React.createElement(GoalCard, { goal: goal, key: goal.type, showGoalModal: () => setShowGoalModal(true) })))),
        React.createElement(AddGoalModal, { visible: showGoalModal, setShowGoalModal: setShowGoalModal, goals: p.goals })));
}
function AddGoalModal(p) {
    const { GrowService, UsageStatisticsService } = Services;
    const [goalTotal, setGoalTotal] = useState(10);
    const [goalTitle, setGoalTitle] = useState('');
    const [goalType, setGoalType] = useState('custom');
    const form = useForm();
    useEffect(() => {
        const goalOption = GrowService.views.goalOptions.find(goal => goal.type === goalType);
        if (goalOption && goalOption.type !== 'custom') {
            setGoalTitle(goalOption.title);
            setGoalTotal(goalOption.total);
        }
    }, [goalType]);
    function addGoal() {
        var _a;
        UsageStatisticsService.recordFeatureUsage('GrowTabGoal');
        const image = ((_a = GrowService.views.goalOptions.find(goal => goal.type === goalType)) === null || _a === void 0 ? void 0 : _a.image) || '';
        GrowService.actions.addGoal({ title: goalTitle, total: goalTotal, type: goalType, image });
        setGoalTitle('');
        setGoalTotal(10);
        p.setShowGoalModal(false);
    }
    function uniqueGoalValidator(rule, value, callback) {
        if (value !== 'custom' && p.goals[value]) {
            callback($t('There is already a goal of this type'));
        }
        else {
            callback();
        }
    }
    const goalTypes = GrowService.views.goalOptions.map(option => ({
        value: option.type,
        label: option.title,
    }));
    return (React.createElement(Modal, { visible: p.visible, getContainer: `.${styles.goalTabContainer}`, onOk: form.submit, onCancel: () => p.setShowGoalModal(false), title: $t('Add Goal') },
        React.createElement(Form, { form: form, onFinish: addGoal },
            React.createElement(ListInput, { label: $t('Goal Type'), options: goalTypes, value: goalType, defaultValue: "custom", onChange: setGoalType, rules: [{ validator: uniqueGoalValidator }] }),
            goalType === 'custom' && (React.createElement(TextInput, { label: $t('Goal Title'), value: goalTitle, onChange: setGoalTitle, uncontrolled: false, placeholder: 'My Goal', rules: [{ max: 50 }], required: true })),
            goalType === 'custom' && (React.createElement(NumberInput, { label: $t('Goal Total'), value: goalTotal, onChange: setGoalTotal, defaultValue: 10, uncontrolled: false, rules: [{ min: 1, max: 50 }], required: true })))));
}
function MyCommunity(p) {
    const { UserService, StreamingService } = Services;
    const totalFollowing = p.platforms
        .filter(Util.propertyExists('followers'))
        .reduce((count, current) => count + current.followers, 0);
    const reachableFollowing = p.platforms
        .filter(Util.propertyExists('followers'))
        .filter(platform => StreamingService.views.checkEnabled(platform.icon))
        .reduce((count, current) => count + current.followers, 0);
    return (React.createElement("div", { className: styles.myCommunity },
        React.createElement("h2", null, $t('Community Reach: %{reachableFollowing}/%{totalFollowing} followers', {
            reachableFollowing,
            totalFollowing,
        })),
        React.createElement("span", null, totalFollowing === 0
            ? $t('You do not currently have any followers. Multistreaming to multiple platforms is a great way to increase followers.')
            : $t('You can reach %{percentage}% of your community across all platforms. Multistream to more platforms to increase this number', {
                percentage: Math.floor(reachableFollowing / totalFollowing) === 0
                    ? 'less than 1'
                    : `${Math.floor((reachableFollowing / totalFollowing) * 100)}`,
            })),
        React.createElement("div", { className: styles.communityContainer }, p.platforms.map(platform => (React.createElement(PlatformCard, { platform: platform, key: platform.icon }))))));
}
const STATS_TO_MAP = () => [
    { title: $t('Average View Time'), value: 'avg_view_times', icon: 'icon-time' },
    { title: $t('Unique Viewers'), value: 'viewers', icon: 'icon-team-2' },
    { title: $t('Chatters'), value: 'chatters', icon: 'icon-user' },
    { title: $t('Chats'), value: 'chats', icon: 'icon-chat-box' },
];
function StreamPulse(p) {
    const stats = p.analytics.stats || {};
    return (React.createElement("div", { className: styles.streamPulse },
        React.createElement("h2", null, $t('Stream Pulse')),
        React.createElement("span", null, $t('Track your growth by taking a look at the past month of your stream (data provided from Twitch)')),
        React.createElement("div", { className: styles.streamPulseContainer }, STATS_TO_MAP().map(stat => (React.createElement("div", { className: styles.card, key: stat.value },
            React.createElement("i", { className: stat.icon }),
            React.createElement("span", { className: styles.title }, stat.title),
            React.createElement("span", { className: styles.stat }, stats[stat.value])))))));
}
function ResourceFooter(p) {
    return (React.createElement("div", { className: styles.streamerResources },
        React.createElement("h2", null, $t('Streamer Resources')),
        React.createElement("span", null, $t('')),
        React.createElement("div", { className: styles.resourcesContainer },
            React.createElement(UniversityCard, { progress: p.universityProgress }),
            React.createElement(ContentHubCard, null))));
}
function GrowthTips() {
    const { MagicLinkService, NavigationService, GrowService } = Services;
    const tips = useRef(shuffle(GrowService.views.tips));
    function followLink(url) {
        return __awaiter(this, void 0, void 0, function* () {
            if (url === 'theme-library')
                return NavigationService.navigate('BrowseOverlays');
            if (/https/.test(url)) {
                remote.shell.openExternal(url);
            }
            else {
                try {
                    const link = yield MagicLinkService.getDashboardMagicLink(url, 'slobs-grow-tab');
                    remote.shell.openExternal(link);
                }
                catch (e) {
                    console.error('Error generating dashboard magic link', e);
                }
            }
        });
    }
    return (React.createElement("div", { className: styles.growthTipsContainer },
        React.createElement("h2", null, $t('Growth Tips')),
        React.createElement(Scrollable, { isResizable: false, style: { height: '100%' } }, tips.current.map(tip => (React.createElement("div", { className: styles.card, key: tip.title },
            React.createElement("i", { className: tip.icon }),
            React.createElement("strong", null, tip.title),
            React.createElement("p", null, tip.description),
            tip.link && React.createElement(Button, { onClick: () => followLink(tip.link) }, tip.cta)))))));
}
//# sourceMappingURL=Grow.js.map