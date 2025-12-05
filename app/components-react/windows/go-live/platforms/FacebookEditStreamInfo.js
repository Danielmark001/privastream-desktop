var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import css from './FacebookEditStreamInfo.m.less';
import { CommonPlatformFields } from '../CommonPlatformFields';
import React from 'react';
import { inject, injectFormBinding, injectState, useModule } from 'slap';
import Form from '../../../shared/inputs/Form';
import { DismissablesService, EDismissable } from 'services/dismissables';
import { StreamingService } from 'services/streaming';
import { UserService } from 'services/user';
import { NavigationService } from 'services/navigation';
import { ListInput } from '../../../shared/inputs';
import GameSelector from '../GameSelector';
import { FacebookService, } from 'services/platforms/facebook';
import moment from 'moment';
import Translate from '../../../shared/Translate';
import MessageLayout from '../MessageLayout';
import PlatformSettingsLayout from './PlatformSettingsLayout';
import { assertIsDefined } from '../../../../util/properties-type-guards';
import * as remote from '@electron/remote';
import { $t } from 'services/i18n';
import { Services } from '../../../service-provider';
class FacebookEditStreamInfoModule {
    constructor() {
        this.fbService = inject(FacebookService);
        this.dismissables = inject(DismissablesService);
        this.streamingService = inject(StreamingService);
        this.state = injectState({
            pictures: {},
            scheduledVideos: [],
            scheduledVideosLoaded: false,
        });
        this.fbState = this.fbService.state;
        this.canStreamToTimeline = this.fbState.grantedPermissions.includes('publish_video');
        this.pages = this.fbState.facebookPages;
        this.groups = this.fbState.facebookGroups;
        this.isPrimary = this.streamingService.views.isPrimaryPlatform('facebook');
        this.isScheduleMode = false;
        this.bind = injectFormBinding(() => this.settings, newFbSettings => this.updateSettings(newFbSettings));
    }
    get settings() {
        return this.props.value;
    }
    setProps(props) {
        this.props = props;
        if (!this.state.scheduledVideosLoaded)
            this.loadScheduledBroadcasts();
        if (this.settings.pageId)
            this.loadPicture(this.settings.pageId);
        if (this.settings.groupId)
            this.loadPicture(this.settings.groupId);
    }
    updateSettings(patch) {
        this.props.onChange(Object.assign(Object.assign({}, this.settings), patch));
    }
    setPrivacy(privacy) {
        this.updateSettings({ privacy: { value: privacy } });
    }
    get layoutMode() {
        return this.props.layoutMode;
    }
    get layout() {
        return this.props.layout;
    }
    get isUpdateMode() {
        return this.props.isUpdateMode;
    }
    get shouldShowGamingWarning() {
        return this.pages.length && this.settings.game;
    }
    get shouldShowPermissionWarn() {
        return false;
    }
    get shouldShowDestinationType() {
        return !this.settings.liveVideoId;
    }
    get shouldShowGroups() {
        return (this.settings.destinationType === 'group' && !this.isUpdateMode && !this.settings.liveVideoId);
    }
    get shouldShowPages() {
        return (this.settings.destinationType === 'page' && !this.isUpdateMode && !this.settings.liveVideoId);
    }
    get shouldShowEvents() {
        return !this.isUpdateMode && !this.props.isScheduleMode;
    }
    get shouldShowGame() {
        return false;
    }
    get shouldShowPrivacy() {
        return this.settings.destinationType === 'me';
    }
    get shouldShowPrivacyWarn() {
        var _a, _b;
        const fbSettings = this.settings;
        return !!((!fbSettings.liveVideoId && ((_a = fbSettings.privacy) === null || _a === void 0 ? void 0 : _a.value) !== 'SELF') ||
            (fbSettings.liveVideoId && ((_b = fbSettings.privacy) === null || _b === void 0 ? void 0 : _b.value)));
    }
    getDestinationOptions() {
        const options = [
            {
                value: 'me',
                label: $t('Share to Your Timeline'),
                image: this.fbState.userAvatar,
            },
            {
                value: 'page',
                label: $t('Share to a Page You Manage'),
                image: 'https://slobs-cdn.streamlabs.com/media/fb-page.png',
            },
        ];
        return options;
    }
    getPrivacyOptions() {
        const options = [
            {
                value: 'EVERYONE',
                label: $t('Public'),
                image: 'https://slobs-cdn.streamlabs.com/media/fb_privacy_public.png',
            },
            {
                value: 'ALL_FRIENDS',
                label: $t('Friends'),
                image: 'https://slobs-cdn.streamlabs.com/media/fb_privacy_friends.png',
            },
            {
                value: 'SELF',
                label: $t('Only Me'),
                image: 'https://slobs-cdn.streamlabs.com/media/fb_privacy_noone.png',
            },
        ];
        if (this.settings.liveVideoId || this.isUpdateMode) {
            options.unshift({ value: '', label: $t('Do not change privacy settings') });
        }
        return options;
    }
    onEventChange(liveVideoId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!liveVideoId) {
                const { groupId, pageId } = this.fbState.settings;
                this.updateSettings({
                    liveVideoId,
                    pageId,
                    groupId,
                });
                return;
            }
            const liveVideo = this.state.scheduledVideos.find(vid => vid.id === liveVideoId);
            assertIsDefined(liveVideo);
            const newSettings = yield this.fbService.actions.return.fetchStartStreamOptionsForVideo(liveVideoId, liveVideo.destinationType, liveVideo.destinationId);
            this.updateSettings(newSettings);
        });
    }
    loadScheduledBroadcasts() {
        return __awaiter(this, void 0, void 0, function* () {
            let destinationId = this.fbService.views.getDestinationId(this.settings);
            if (!destinationId)
                return;
            const fbSettings = this.settings;
            const fbService = this.fbService;
            const destinationType = fbSettings.destinationType === 'group' ? 'me' : fbSettings.destinationType;
            if (destinationType === 'me')
                destinationId = 'me';
            const scheduledVideos = yield fbService.actions.return.fetchAllVideos(true);
            const selectedVideoId = fbSettings.liveVideoId;
            const shouldFetchSelectedVideo = selectedVideoId && !scheduledVideos.find(v => v.id === selectedVideoId);
            if (shouldFetchSelectedVideo) {
                assertIsDefined(selectedVideoId);
                const selectedVideo = yield fbService.actions.return.fetchVideo(selectedVideoId, destinationType, destinationId);
                scheduledVideos.push(selectedVideo);
            }
            this.state.update({
                scheduledVideos,
                scheduledVideosLoaded: true,
            });
        });
    }
    loadPictures(groupOrPage) {
        const ids = groupOrPage === 'group'
            ? this.fbState.facebookGroups.map(item => item.id)
            : this.fbState.facebookPages.map(item => item.id);
        ids.forEach(id => this.loadPicture(id));
    }
    loadPicture(objectId) {
        return __awaiter(this, void 0, void 0, function* () {
            const state = this.state;
            if (state.pictures[objectId])
                return state.pictures[objectId];
            const picture = yield this.fbService.actions.return.fetchPicture(objectId);
            state.setPictures(Object.assign(Object.assign({}, state.pictures), { [objectId]: picture }));
        });
    }
    verifyGroup() {
        remote.shell.openExternal(`https://www.facebook.com/groups/${this.settings.groupId}/edit`);
    }
}
export default function FacebookEditStreamInfo(p) {
    const { shouldShowPermissionWarn, setProps } = useModule(FacebookEditStreamInfoModule, true);
    setProps(p);
    return (React.createElement(Form, { name: "facebook-settings" },
        shouldShowPermissionWarn && React.createElement(PermissionsWarning, null),
        React.createElement(PlatformSettingsLayout, { layoutMode: p.layoutMode, commonFields: React.createElement(CommonFields, { key: "common" }), requiredFields: React.createElement(RequiredFields, { key: "required" }), optionalFields: React.createElement(OptionalFields, { key: "optional" }), essentialOptionalFields: React.createElement(Events, { key: "events" }) })));
}
function CommonFields() {
    const { settings, updateSettings, layoutMode, layout } = useFacebook();
    return (React.createElement(CommonPlatformFields, { key: "common", platform: "facebook", layoutMode: layoutMode, value: settings, onChange: updateSettings, layout: layout }));
}
function RequiredFields() {
    const { isUpdateMode, shouldShowDestinationType, bind, shouldShowPages, pages, groups, shouldShowGroups, pictures, layout, loadPictures, getDestinationOptions, verifyGroup, } = useFacebook();
    return (React.createElement("div", { key: "required" }, !isUpdateMode && (React.createElement(React.Fragment, null,
        shouldShowDestinationType && (React.createElement(ListInput, Object.assign({ label: $t('Facebook Destination') }, bind.destinationType, { hasImage: true, imageSize: { width: 35, height: 35 }, options: getDestinationOptions(), layout: layout, size: "large" }))),
        shouldShowPages && (React.createElement(ListInput, Object.assign({}, bind.pageId, { required: true, label: $t('Facebook Page'), hasImage: true, imageSize: { width: 44, height: 44 }, onDropdownVisibleChange: shown => shown && loadPictures('page'), options: pages.map(page => ({
                value: page.id,
                label: `${page.name} | ${page.category}`,
                image: pictures[page.id],
            })), layout: layout, size: "large" }))),
        shouldShowGroups && (React.createElement(React.Fragment, null,
            React.createElement(ListInput, Object.assign({}, bind.groupId, { required: true, label: $t('Facebook Group'), hasImage: true, imageSize: { width: 44, height: 44 }, options: groups.map(group => ({
                    value: group.id,
                    label: group.name,
                    image: pictures[group.id],
                })), defaultActiveFirstOption: true, onDropdownVisibleChange: () => loadPictures('group'), extra: React.createElement("p", null,
                    $t('Make sure the Streamlabs app is added to your Group.'),
                    React.createElement("a", { onClick: verifyGroup },
                        " ",
                        $t('Click here to verify.'))), layout: layout, size: "large" }))))))));
}
function OptionalFields() {
    var _a;
    const { shouldShowPrivacy, settings, setPrivacy, getPrivacyOptions, shouldShowPrivacyWarn, shouldShowGame, shouldShowGamingWarning, bind, fbService, layout, } = useFacebook();
    return (React.createElement("div", { key: "optional" },
        shouldShowPrivacy && (React.createElement(ListInput, { label: $t('Privacy'), value: (_a = settings.privacy) === null || _a === void 0 ? void 0 : _a.value, onChange: setPrivacy, hasImage: true, imageSize: { width: 24, height: 24 }, options: getPrivacyOptions(), className: css.privacySelector, extra: shouldShowPrivacyWarn && (React.createElement(Translate, { message: $t('FBPrivacyWarning') },
                React.createElement("a", { slot: "link", onClick: () => remote.shell.openExternal('https://www.facebook.com/settings?tab=business_tools') }))), layout: layout, size: "large" })),
        shouldShowGame && (React.createElement(GameSelector, Object.assign({}, bind.game, { platform: "facebook", extra: shouldShowGamingWarning && (React.createElement(Translate, { message: $t('facebookGamingWarning') },
                React.createElement("a", { slot: "createPageLink", onClick: () => fbService.actions.createFBPage() }))) })))));
}
function Events() {
    const { bind, shouldShowEvents, onEventChange, scheduledVideosLoaded, scheduledVideos, layout, } = useFacebook();
    return (React.createElement("div", { key: "events" }, shouldShowEvents && (React.createElement(ListInput, Object.assign({}, bind.liveVideoId, { onChange: onEventChange, label: $t('Scheduled Video'), loading: !scheduledVideosLoaded, allowClear: true, placeholder: $t('Not selected'), options: [
            ...scheduledVideos.map(v => {
                var _a;
                return ({
                    label: `${v.title} ${((_a = v.event_params) === null || _a === void 0 ? void 0 : _a.start_time)
                        ? moment(new Date(v.event_params.start_time * 1000)).calendar()
                        : ''}`,
                    value: v.id,
                });
            }),
        ], layout: layout, size: "large" })))));
}
function PermissionsWarning() {
    const { isPrimary, reLogin, dismissWarning, reconnectFB } = useFacebook().extend(module => ({
        user: inject(UserService),
        navigation: inject(NavigationService),
        windows: Services.WindowsService,
        reLogin() {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.user.actions.return.reLogin();
                module.streamingService.actions.showGoLiveWindow();
            });
        },
        dismissWarning() {
            module.dismissables.actions.dismiss(EDismissable.FacebookNeedPermissionsTip);
        },
        reconnectFB() {
            const platform = 'facebook';
            this.navigation.actions.navigate('PlatformMerge', { platform });
            this.windows.actions.closeChildWindow();
        },
    }));
    return (React.createElement(MessageLayout, { message: $t('You can stream to your timeline and groups now'), type: 'success' },
        isPrimary && (React.createElement("div", null,
            React.createElement("div", null, $t('Please log-out and log-in again to get these new features')),
            React.createElement("button", { className: "button button--facebook", onClick: reLogin }, $t('Re-login now')),
            React.createElement("button", { className: "button button--trans", onClick: dismissWarning }, $t('Do not show this message again')))),
        !isPrimary && (React.createElement("div", null,
            React.createElement("div", null, $t('Please reconnect Facebook to get these new features')),
            React.createElement("button", { className: "button button--facebook", onClick: reconnectFB }, $t('Reconnect now')),
            React.createElement("button", { className: "button button--trans", onClick: dismissWarning }, $t('Do not show this message again'))))));
}
function useFacebook() {
    return useModule(FacebookEditStreamInfoModule);
}
//# sourceMappingURL=FacebookEditStreamInfo.js.map