import React, { useEffect, useMemo, useState } from 'react';
import * as remote from '@electron/remote';
import cx from 'classnames';
import { Menu } from 'antd';
import pick from 'lodash/pick';
import { initStore, useController } from 'components-react/hooks/zustand';
import { EStreamingState } from 'services/streaming';
import { EAppPageSlot } from 'services/platform-apps';
import { getPlatformService } from 'services/platforms';
import { $t } from 'services/i18n';
import { Services } from '../service-provider';
import Chat from './Chat';
import styles from './LiveDock.m.less';
import Tooltip from 'components-react/shared/Tooltip';
import PlatformAppPageView from 'components-react/shared/PlatformAppPageView';
import { useVuex } from 'components-react/hooks';
import { useRealmObject } from 'components-react/hooks/realm';
import { $i } from 'services/utils';
import { ShareStreamLink } from './ShareStreamLink';
const LiveDockCtx = React.createContext(null);
class LiveDockController {
    constructor() {
        this.streamingService = Services.StreamingService;
        this.userService = Services.UserService;
        this.customizationService = Services.CustomizationService;
        this.platformAppsService = Services.PlatformAppsService;
        this.appService = Services.AppService;
        this.chatService = Services.ChatService;
        this.windowsService = Services.WindowsService;
        this.restreamService = Services.RestreamService;
        this.store = initStore({
            canAnimate: false,
            selectedChat: 'default',
        });
    }
    get applicationLoading() {
        return this.appService.state.loading;
    }
    get streamingStatus() {
        return this.streamingService.state.streamingStatus;
    }
    get isStreaming() {
        return this.streamingService.isStreaming;
    }
    get currentViewers() {
        return this.streamingService.views.viewerCount.toString();
    }
    get pageSlot() {
        return EAppPageSlot.Chat;
    }
    get canAnimate() {
        return this.store.canAnimate;
    }
    get selectedChat() {
        return this.store.selectedChat;
    }
    get liveText() {
        if (this.streamingStatus === EStreamingState.Live)
            return 'Live';
        if (this.streamingStatus === EStreamingState.Starting)
            return 'Starting';
        if (this.streamingStatus === EStreamingState.Ending)
            return 'Ending';
        if (this.streamingStatus === EStreamingState.Reconnecting)
            return 'Reconnecting';
        return 'Offline';
    }
    get platform() {
        var _a;
        return (_a = this.userService.platform) === null || _a === void 0 ? void 0 : _a.type;
    }
    get platformService() {
        if (!this.platform)
            return;
        return getPlatformService(this.platform);
    }
    get offlineImageSrc() {
        const mode = this.customizationService.isDarkTheme ? 'night' : 'day';
        return $i(`images/sleeping-kevin-${mode}.png`);
    }
    get hideStyleBlockers() {
        return this.windowsService.state.main.hideStyleBlockers;
    }
    get hasChatTabs() {
        return this.chatTabs.length > 1;
    }
    get defaultPlatformChatVisible() {
        return this.store.selectedChat === 'default';
    }
    get restreamChatUrl() {
        return this.restreamService.chatUrl;
    }
    get chatApps() {
        return this.platformAppsService.enabledApps.filter(app => {
            return !!app.manifest.pages.find(page => {
                return page.slot === EAppPageSlot.Chat;
            });
        });
    }
    get chatTabs() {
        if (!this.userService.state.auth)
            return [];
        const hasMultistreamChat = (this.restreamService.views.canEnableRestream &&
            this.streamingService.views.hasMultipleTargetsEnabled) ||
            this.hasDifferentDualOutputPlatforms;
        const tabs = [
            {
                name: getPlatformService(this.userService.state.auth.primaryPlatform).displayName,
                value: 'default',
            },
        ].concat(this.chatApps
            .filter(app => !app.poppedOutSlots.includes(this.pageSlot))
            .map(app => {
            return {
                name: app.manifest.name,
                value: app.id,
            };
        }));
        if (hasMultistreamChat) {
            tabs.push({
                name: $t('Multistream'),
                value: 'restream',
            });
        }
        return tabs;
    }
    get isRestreaming() {
        return (this.restreamService.shouldGoLiveWithRestream ||
            this.streamingService.views.isStreamShiftMultistream);
    }
    get hasDifferentDualOutputPlatforms() {
        const dualOutputPlatforms = this.streamingService.views.activeDisplayPlatforms;
        const uniquePlatforms = new Set();
        [...dualOutputPlatforms.horizontal, ...dualOutputPlatforms.vertical].forEach(platform => {
            uniquePlatforms.add(platform);
        });
        return uniquePlatforms.size > 1;
    }
    get isPopOutAllowed() {
        if (this.defaultPlatformChatVisible)
            return false;
        if (this.store.selectedChat === 'restream')
            return false;
        const chatPage = this.platformAppsService.views
            .getApp(this.store.selectedChat)
            .manifest.pages.find(page => page.slot === EAppPageSlot.Chat);
        if (!chatPage)
            return false;
        return chatPage.allowPopout == null ? true : chatPage.allowPopout;
    }
    get isTikTok() {
        var _a;
        return ((_a = this.userService.platform) === null || _a === void 0 ? void 0 : _a.type) === 'tiktok';
    }
    get canEditChannelInfo() {
        var _a;
        if (this.isPlatform('twitter') && !this.isRestreaming)
            return false;
        if (this.isPlatform('tiktok') && !this.isRestreaming)
            return false;
        return (this.streamingService.views.isMidStreamMode ||
            ((_a = this.userService.state.auth) === null || _a === void 0 ? void 0 : _a.primaryPlatform) === 'twitch');
    }
    getElapsedStreamTime() {
        return this.streamingService.formattedDurationInCurrentStreamingState;
    }
    isPlatform(platforms) {
        if (!this.platform)
            return false;
        if (Array.isArray(platforms))
            return platforms.includes(this.platform);
        return this.platform === platforms;
    }
    openPlatformStream() {
        var _a;
        const url = (_a = this.platformService) === null || _a === void 0 ? void 0 : _a.streamPageUrl;
        if (!url)
            return;
        remote.shell.openExternal(url);
    }
    openPlatformDash() {
        var _a;
        const url = (_a = this.platformService) === null || _a === void 0 ? void 0 : _a.dashboardUrl;
        if (!url)
            return;
        remote.shell.openExternal(url);
    }
    refreshChat() {
        if (this.store.selectedChat === 'default') {
            this.chatService.refreshChat();
            return;
        }
        if (this.store.selectedChat === 'restream') {
            this.restreamService.refreshChat();
            return;
        }
        this.platformAppsService.refreshApp(this.store.selectedChat);
    }
    popOut() {
        this.platformAppsService.popOutAppPage(this.store.selectedChat, this.pageSlot);
        this.store.setState(s => {
            s.selectedChat = 'default';
        });
    }
    setCollapsed(livedockCollapsed) {
        this.store.setState(s => {
            s.canAnimate = true;
        });
        this.windowsService.actions.updateStyleBlockers('main', true);
        this.customizationService.actions.setSettings({ livedockCollapsed });
        setTimeout(() => {
            this.store.setState(s => {
                s.canAnimate = false;
            });
            this.windowsService.actions.updateStyleBlockers('main', false);
        }, 300);
    }
    toggleViewerCount() {
        this.customizationService.actions.setHiddenViewerCount(!this.customizationService.state.hideViewerCount);
    }
    showEditStreamInfo() {
        this.streamingService.actions.showEditStream();
    }
    showMultistreamChatInfo() {
        this.chatService.actions.showMultistreamChatWindow();
    }
    hasLiveDockFeature(feature) {
        var _a;
        return (_a = this.platformService) === null || _a === void 0 ? void 0 : _a.hasLiveDockFeature(feature);
    }
}
export default function LiveDockWithContext() {
    const controller = useMemo(() => new LiveDockController(), []);
    return (React.createElement(LiveDockCtx.Provider, { value: controller },
        React.createElement(LiveDock, null)));
}
function LiveDock() {
    const ctrl = useController(LiveDockCtx);
    const [visibleChat, setVisibleChat] = useState('default');
    const [elapsedStreamTime, setElapsedStreamTime] = useState('');
    const { isPlatform, hasLiveDockFeature, isStreaming, isRestreaming, hasChatTabs, chatTabs, applicationLoading, hideStyleBlockers, currentViewers, pageSlot, liveText, streamingStatus, } = useVuex(() => pick(ctrl, [
        'isPlatform',
        'isStreaming',
        'isRestreaming',
        'hasChatTabs',
        'chatTabs',
        'applicationLoading',
        'hideStyleBlockers',
        'pageSlot',
        'currentViewers',
        'liveText',
        'hasLiveDockFeature',
        'streamingStatus',
    ]));
    const collapsed = useRealmObject(Services.CustomizationService.state).livedockCollapsed;
    const hideViewerCount = useRealmObject(Services.CustomizationService.state).hideViewerCount;
    const viewerCount = hideViewerCount ? $t('Viewers Hidden') : currentViewers;
    useEffect(() => {
        const elapsedInterval = window.setInterval(() => {
            if (streamingStatus === EStreamingState.Live) {
                setElapsedStreamTime(ctrl.getElapsedStreamTime());
            }
            else {
                setElapsedStreamTime('');
            }
        }, 200);
        return () => clearInterval(elapsedInterval);
    }, [streamingStatus]);
    useEffect(() => {
        if (isRestreaming && streamingStatus === EStreamingState.Starting) {
            Services.RestreamService.actions.refreshChat();
            return;
        }
        if (!isRestreaming && visibleChat === 'restream') {
            setVisibleChat('default');
            return;
        }
    }, [visibleChat, isRestreaming, streamingStatus]);
    function setChat(key) {
        ctrl.store.setState(s => {
            if (!ctrl.chatApps.find(app => app.id === key) && !['default', 'restream'].includes(key)) {
                s.selectedChat = 'default';
                setVisibleChat('default');
            }
            else {
                s.selectedChat = key;
                setVisibleChat(key);
            }
        });
    }
    const chat = useMemo(() => {
        const primaryChat = Services.UserService.state.auth.primaryPlatform;
        const showInstagramInfo = primaryChat === 'instagram';
        if (showInstagramInfo) {
            return React.createElement(React.Fragment, null);
        }
        return (React.createElement(Chat, { restream: isRestreaming && visibleChat === 'restream', key: visibleChat, visibleChat: visibleChat, setChat: setChat }));
    }, [Services.UserService.state.auth.primaryPlatform, visibleChat]);
    return (React.createElement("div", { className: styles.liveDock },
        React.createElement("div", { className: styles.liveDockExpandedContents },
            React.createElement("div", { className: styles.liveDockHeader },
                React.createElement("div", { className: "flex flex--center" },
                    React.createElement("div", { className: cx(styles.liveDockPulse, {
                            [styles.liveDockOffline]: !isStreaming,
                        }) }),
                    React.createElement("span", { className: styles.liveDockText }, liveText),
                    React.createElement("span", { className: styles.liveDockTimer }, elapsedStreamTime)),
                React.createElement("div", { className: styles.liveDockViewerCount },
                    React.createElement("i", { className: cx({
                            ['icon-view']: !hideViewerCount,
                            ['icon-hide']: hideViewerCount,
                        }), onClick: () => ctrl.toggleViewerCount() }),
                    React.createElement("span", { className: styles.liveDockViewerCountCount }, viewerCount),
                    Number(viewerCount) >= 0 && React.createElement("span", null, $t('viewers')))),
            React.createElement("div", { className: styles.liveDockInfo },
                React.createElement("div", { className: styles.liveDockPlatformTools },
                    ctrl.canEditChannelInfo && (React.createElement(Tooltip, { title: $t('Edit your stream title and description'), placement: "right", autoAdjustOverflow: false },
                        React.createElement("i", { onClick: () => ctrl.showEditStreamInfo(), className: "icon-edit" }))),
                    hasLiveDockFeature('view-stream') && isStreaming && (React.createElement(Tooltip, { title: $t('View your live stream in a web browser'), placement: "right", autoAdjustOverflow: false },
                        React.createElement("i", { onClick: () => ctrl.openPlatformStream(), className: "icon-studio" }))),
                    isStreaming && React.createElement(ShareStreamLink, null),
                    hasLiveDockFeature('dashboard') && isStreaming && (React.createElement(Tooltip, { title: $t('Go to Live Dashboard'), placement: "right", autoAdjustOverflow: false },
                        React.createElement("i", { onClick: () => ctrl.openPlatformDash(), className: "icon-settings" })))),
                React.createElement("div", { className: "flex" }, (hasLiveDockFeature('refresh-chat') ||
                    (hasLiveDockFeature('refresh-chat-streaming') && isStreaming) ||
                    (hasLiveDockFeature('refresh-chat-restreaming') && isRestreaming)) && (React.createElement("a", { onClick: () => ctrl.refreshChat() }, $t('Refresh Chat'))))),
            !hideStyleBlockers &&
                (hasLiveDockFeature('chat-offline') ||
                    (isStreaming && hasLiveDockFeature('chat-streaming'))) && (React.createElement("div", { className: styles.liveDockChat },
                hasChatTabs && React.createElement(ChatTabs, { visibleChat: visibleChat, setChat: setChat }),
                !applicationLoading && !collapsed && chat,
                !['default', 'restream'].includes(visibleChat) && (React.createElement(PlatformAppPageView, { className: styles.liveDockPlatformAppWebview, appId: visibleChat, pageSlot: pageSlot, key: visibleChat })))),
            !hideStyleBlockers &&
                (!ctrl.platform || (hasLiveDockFeature('chat-streaming') && !isStreaming)) && (React.createElement("div", { className: cx('flex flex--center flex--column', styles.liveDockChatOffline) },
                React.createElement("img", { className: styles.liveDockChatImgOffline, src: ctrl.offlineImageSrc }),
                React.createElement("span", null, $t('Your chat is currently offline')))))));
}
function ChatTabs(p) {
    const ctrl = useController(LiveDockCtx);
    return (React.createElement("div", { className: "flex" },
        React.createElement(Menu, { defaultSelectedKeys: [p.visibleChat], onClick: ev => p.setChat(ev.key), mode: "horizontal" }, ctrl.chatTabs.map(tab => (React.createElement(Menu.Item, { key: tab.value }, tab.name)))),
        React.createElement("div", { className: styles.liveDockChatTabsIcons },
            ctrl.isPopOutAllowed && (React.createElement(Tooltip, { title: $t('Pop out to new window'), placement: "topRight" },
                React.createElement("i", { className: cx(styles.liveDockChatTabsPopout, 'icon-pop-out-1'), onClick: () => ctrl.popOut() }))),
            React.createElement(Tooltip, { title: $t('You can now reply to Twitch, YouTube and Facebook messages in Multichat. Click to learn more.'), placement: "topRight", onClick: ctrl.showMultistreamChatInfo },
                React.createElement("i", { className: cx(styles.liveDockChatTabsInfo, 'icon-information') })))));
}
//# sourceMappingURL=LiveDock.js.map