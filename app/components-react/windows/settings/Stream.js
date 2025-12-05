var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useMemo, useState } from 'react';
import { $t } from '../../../services/i18n';
import { EStreamingState } from '../../../services/streaming';
import { EPlatformCallResult, externalAuthPlatforms, getPlatformService, } from '../../../services/platforms';
import cloneDeep from 'lodash/cloneDeep';
import namingHelpers from '../../../util/NamingHelpers';
import { Services } from '../../service-provider';
import { ObsGenericSettingsForm } from './ObsSettings';
import styles from './Stream.m.less';
import cx from 'classnames';
import { Button, message, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import PlatformLogo from '../../shared/PlatformLogo';
import { injectState, mutation, useModule } from 'slap';
import UltraIcon from 'components-react/shared/UltraIcon';
import ButtonHighlighted from 'components-react/shared/ButtonHighlighted';
import { useVuex } from 'components-react/hooks';
import Translate from 'components-react/shared/Translate';
import * as remote from '@electron/remote';
import { InstagramEditStreamInfo } from '../go-live/platforms/InstagramEditStreamInfo';
import { metadata } from 'components-react/shared/inputs/metadata';
import FormFactory from 'components-react/shared/inputs/FormFactory';
import { alertAsync } from '../../modals';
import { EAuthProcessState } from '../../../services/user';
import { useSubscription } from 'components-react/hooks/useSubscription';
const PlusIcon = PlusOutlined;
function censorWord(str) {
    if (str.length < 3)
        return str;
    return str[0] + '*'.repeat(str.length - 2) + str.slice(-1);
}
function censorEmail(str) {
    const parts = str.split('@');
    return censorWord(parts[0]) + '@' + censorWord(parts[1]);
}
class StreamSettingsModule {
    constructor() {
        this.state = injectState({
            editCustomDestMode: false,
            customDestForm: {
                name: '',
                url: '',
                streamKey: '',
                enabled: false,
            },
        });
    }
    get streamSettingsService() {
        return Services.StreamSettingsService;
    }
    get streamingService() {
        return Services.StreamingService;
    }
    get magicLinkService() {
        return Services.MagicLinkService;
    }
    editCustomDest(ind) {
        this.state.customDestForm = cloneDeep(this.customDestinations[ind]);
        this.state.editCustomDestMode = ind;
    }
    addCustomDest(linkToPrime = false) {
        if (linkToPrime) {
            this.magicLinkService.actions.linkToPrime('slobs-multistream');
            return;
        }
        const name = this.suggestCustomDestName();
        this.state.customDestForm = {
            name,
            streamKey: '',
            url: '',
            enabled: false,
        };
        this.state.editCustomDestMode = true;
    }
    removeCustomDest(ind) {
        const destinations = cloneDeep(this.customDestinations);
        destinations.splice(ind, 1);
        this.streamSettingsService.setGoLiveSettings({ customDestinations: destinations });
    }
    stopEditing() {
        this.state.editCustomDestMode = false;
    }
    updateCustomDestForm(updatedFields) {
        this.state.customDestForm = Object.assign(Object.assign({}, this.state.customDestForm), updatedFields);
    }
    fixUrl() {
        if (this.state.customDestForm.streamKey &&
            this.state.customDestForm.url.charAt(this.state.customDestForm.url.length - 1) !== '/') {
            this.state.customDestForm.url += '/';
        }
    }
    get formValues() {
        return {
            url: this.state.customDestForm.url,
            streamKey: this.state.customDestForm.streamKey || '',
            name: this.state.customDestForm.name,
        };
    }
    get streamingView() {
        return this.streamingService.views;
    }
    get customDestinations() {
        return this.streamingView.savedSettings.customDestinations;
    }
    saveCustomDest() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (!this.state.customDestForm.url.includes('?')) {
                this.fixUrl();
            }
            const destinations = cloneDeep(this.customDestinations);
            const isUpdateMode = typeof this.state.editCustomDestMode === 'number';
            if (isUpdateMode) {
                const ind = this.state.editCustomDestMode;
                const display = (_b = (_a = destinations[ind]) === null || _a === void 0 ? void 0 : _a.display) !== null && _b !== void 0 ? _b : 'horizontal';
                destinations.splice(ind, 1, Object.assign(Object.assign({}, this.state.customDestForm), { display }));
            }
            else {
                destinations.push(Object.assign(Object.assign({}, this.state.customDestForm), { display: 'horizontal' }));
            }
            this.streamSettingsService.setGoLiveSettings({ customDestinations: destinations });
            this.stopEditing();
        });
    }
    suggestCustomDestName() {
        const destinations = this.customDestinations;
        return namingHelpers.suggestName($t('Destination'), (name) => destinations.find(dest => dest.name === name));
    }
}
__decorate([
    mutation()
], StreamSettingsModule.prototype, "editCustomDest", null);
__decorate([
    mutation()
], StreamSettingsModule.prototype, "addCustomDest", null);
__decorate([
    mutation()
], StreamSettingsModule.prototype, "stopEditing", null);
__decorate([
    mutation()
], StreamSettingsModule.prototype, "updateCustomDestForm", null);
__decorate([
    mutation()
], StreamSettingsModule.prototype, "fixUrl", null);
function useStreamSettings() {
    return useModule(StreamSettingsModule);
}
export function StreamSettings() {
    const { StreamingService, StreamSettingsService, UserService, DualOutputService } = Services;
    const { canEditSettings, protectedModeEnabled, needToShowWarning, platforms, isPrime } = useVuex(() => ({
        canEditSettings: Services.StreamingService.state.streamingStatus === EStreamingState.Offline,
        protectedModeEnabled: Services.StreamSettingsService.protectedModeEnabled,
        needToShowWarning: UserService.isLoggedIn && !StreamSettingsService.protectedModeEnabled,
        platforms: StreamingService.views.allPlatforms,
        isPrime: UserService.views.isPrime,
    }));
    useSubscription(UserService.refreshedLinkedAccounts, (res) => {
        const doShowMessage = () => {
            message.config({
                duration: 6,
                maxCount: 1,
            });
            if (res.success) {
                message.success(res.message);
            }
            else {
                message.error(res.message);
            }
        };
        doShowMessage();
    });
    function disableProtectedMode() {
        StreamSettingsService.actions.setSettings({ protectedModeEnabled: false });
        if (DualOutputService.views.dualOutputMode) {
            DualOutputService.actions.setDualOutputModeIfPossible(false, true);
        }
    }
    function enableProtectedMode() {
        StreamSettingsService.actions.setSettings({
            protectedModeEnabled: true,
            key: '',
            streamType: 'rtmp_common',
        });
    }
    function openPlatformSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const link = yield Services.MagicLinkService.getDashboardMagicLink('settings/account-settings/platforms');
                remote.shell.openExternal(link);
            }
            catch (e) {
                console.error('Error generating platform settings magic link', e);
            }
        });
    }
    return (React.createElement("div", { className: styles.section },
        protectedModeEnabled && (React.createElement("div", { className: styles.protectedMode },
            React.createElement("h2", null, $t('Streamlabs ID')),
            React.createElement(SLIDBlock, null),
            React.createElement("div", { className: styles.streamHeaderWrapper },
                React.createElement("h2", { style: { flex: 1 } }, $t('Stream Destinations')),
                React.createElement("div", { className: styles.addMore, onClick: openPlatformSettings, style: { color: 'var(--primary)', fontSize: '15px' } },
                    React.createElement(PlusIcon, { style: { paddingRight: '5px', color: 'var(--primary)' } }),
                    $t('Add More'))),
            !isPrime && (React.createElement("div", { className: styles.ultraText },
                React.createElement(UltraIcon, { type: "badge", style: { marginRight: '5px' } }),
                React.createElement("div", { onClick: () => Services.MagicLinkService.linkToPrime('slobs-stream-settings') }, $t('Upgrade to Ultra to stream to multiple platforms simultaneously!')))),
            platforms.map(platform => (React.createElement(Platform, { key: platform, platform: platform }))),
            canEditSettings && (React.createElement("a", { className: styles.customDest, onClick: disableProtectedMode, style: { marginBottom: '10px' } }, $t('Stream to custom ingest'))),
            React.createElement(CustomDestinationList, null))),
        !canEditSettings && (React.createElement("div", { className: "section section--warning" }, $t("You can not change these settings when you're live"))),
        needToShowWarning && (React.createElement("div", { className: "section section--warning" },
            React.createElement("b", null,
                $t('Warning'),
                ": "),
            $t('Streaming to a custom ingest is advanced functionality. Some features may stop working as expected'),
            React.createElement("br", null),
            React.createElement("br", null),
            canEditSettings && (React.createElement("button", { className: "button button--warn", onClick: enableProtectedMode }, $t('Use recommended settings'))))),
        !protectedModeEnabled && canEditSettings && React.createElement(ObsGenericSettingsForm, { page: "Stream" })));
}
function SLIDBlock() {
    const { UserService, SettingsService } = Services;
    const { hasSLID, username } = useVuex(() => {
        var _a, _b;
        return ({
            hasSLID: UserService.views.hasSLID,
            username: (_b = (_a = UserService.views.auth) === null || _a === void 0 ? void 0 : _a.slid) === null || _b === void 0 ? void 0 : _b.username,
        });
    });
    function openPasswordLink() {
        remote.shell.openExternal('https://id.streamlabs.com/security/password?companyId=streamlabs');
    }
    function openTwoFactorLink() {
        remote.shell.openExternal('https://id.streamlabs.com/security/tfa?companyId=streamlabs');
    }
    function mergeSLID() {
        return __awaiter(this, void 0, void 0, function* () {
            const resp = yield UserService.actions.return.startSLMerge();
            if (resp !== EPlatformCallResult.Success)
                return;
            SettingsService.actions.showSettings('Stream');
        });
    }
    return (React.createElement("div", { className: cx('section flex', styles.targetCard, styles.section) },
        React.createElement(PlatformLogo, { className: styles.targetLogo, size: "medium", platform: "streamlabs" }),
        React.createElement("div", { className: styles.targetData }, hasSLID && username ? (React.createElement("b", null, censorEmail(username))) : (React.createElement(Translate, { message: $t('slidConnectMessage') }))),
        React.createElement("div", { style: { display: 'flex', justifyContent: 'flex-end' } }, hasSLID ? (React.createElement(React.Fragment, null,
            React.createElement("a", { style: { fontWeight: 400, marginRight: 10, textDecoration: 'underline' }, onClick: openPasswordLink }, $t('Update Password')),
            React.createElement("a", { style: { fontWeight: 400, textDecoration: 'underline' }, onClick: openTwoFactorLink }, $t('Update Two-factor Auth')))) : (React.createElement(Button, { type: "primary", onClick: mergeSLID }, $t('Setup'))))));
}
function Platform(p) {
    const platform = p.platform;
    const { UserService, StreamingService, InstagramService } = Services;
    const { isLoading, authInProgress, instagramSettings, canEditSettings } = useVuex(() => ({
        isLoading: UserService.state.authProcessState === EAuthProcessState.Loading,
        authInProgress: UserService.state.authProcessState === EAuthProcessState.InProgress,
        instagramSettings: InstagramService.state.settings,
        canEditSettings: StreamingService.state.streamingStatus === EStreamingState.Offline,
    }));
    const isMerged = StreamingService.views.isPlatformLinked(platform);
    const platformObj = UserService.state.auth.platforms[platform];
    const username = platformObj === null || platformObj === void 0 ? void 0 : platformObj.username;
    const platformName = useMemo(() => getPlatformService(platform).displayName, []);
    const isPrimary = StreamingService.views.isPrimaryPlatform(platform);
    const shouldShowPrimaryBtn = isPrimary;
    const shouldShowConnectBtn = !isMerged && canEditSettings;
    const shouldShowUnlinkBtn = !isPrimary && isMerged && canEditSettings;
    function platformUnlink(platform) {
        getPlatformService(platform).unlink();
    }
    function platformMergeInline(platform) {
        return __awaiter(this, void 0, void 0, function* () {
            const mode = externalAuthPlatforms.includes(platform) ? 'external' : 'internal';
            yield Services.UserService.actions.return.startAuth(platform, mode, true).then(res => {
                Services.WindowsService.actions.setWindowOnTop('child');
                if (res === EPlatformCallResult.Error) {
                    alertAsync($t('This account is already linked to another Streamlabs Account. Please use a different account.'));
                    return;
                }
                Services.StreamSettingsService.actions.setSettings({ protectedModeEnabled: true });
            });
        });
    }
    const isInstagram = platform === 'instagram';
    const [showInstagramFields, setShowInstagramFields] = useState(isInstagram && isMerged);
    const shouldShowUsername = !isInstagram;
    const usernameOrBlank = shouldShowUsername ? (React.createElement(React.Fragment, null,
        React.createElement("br", null),
        username,
        React.createElement("br", null))) : ('');
    const instagramConnect = () => __awaiter(this, void 0, void 0, function* () {
        const success = yield UserService.actions.return.startAuth(platform, 'internal', true);
        if (!success)
            return;
        setShowInstagramFields(true);
    });
    const instagramUnlink = () => {
        updateInstagramSettings({ title: '', streamKey: '', streamUrl: '' });
        setShowInstagramFields(false);
        platformUnlink(platform);
    };
    const ConnectButton = () => (React.createElement("span", null,
        React.createElement(Button, { onClick: isInstagram ? instagramConnect : () => platformMergeInline(platform), className: cx({ [styles.tiktokConnectBtn]: platform === 'tiktok' }), disabled: isLoading || authInProgress, style: {
                backgroundColor: `var(--${platform})`,
                borderColor: 'transparent',
                color: ['trovo', 'instagram', 'kick'].includes(platform) ? 'black' : 'inherit',
            } }, $t('Connect'))));
    const updateInstagramSettings = (newSettings) => {
        InstagramService.actions.updateSettings(newSettings);
    };
    const ExtraFieldsSection = () => {
        if (isInstagram && showInstagramFields) {
            return (React.createElement("div", { className: cx(styles.extraFieldsSection) },
                React.createElement(InstagramEditStreamInfo, { onChange: updateInstagramSettings, value: instagramSettings, layoutMode: "singlePlatform", isStreamSettingsWindow: true })));
        }
        return null;
    };
    return (React.createElement("div", { className: cx('section', styles.section) },
        React.createElement("div", { className: styles.targetCard },
            React.createElement(PlatformLogo, { className: cx(styles.targetLogo, {
                    [styles.youtube]: platform === 'youtube',
                    [styles.twitter]: platform === 'twitter',
                }), size: 36, platform: platform }),
            React.createElement("div", { className: styles.targetData },
                React.createElement("span", { className: styles.targetType }, platformName),
                isMerged ? (React.createElement("span", { className: styles.targetName }, usernameOrBlank)) : (React.createElement(React.Fragment, null,
                    React.createElement("br", null),
                    React.createElement("span", { className: styles.targetName, style: { opacity: '0.5' } }, $t('unlinked')),
                    React.createElement("br", null)))),
            React.createElement("div", { style: { marginLeft: 'auto' } },
                shouldShowConnectBtn && React.createElement(ConnectButton, null),
                shouldShowUnlinkBtn && (React.createElement(Button, { "data-name": `${platform}Unlink`, danger: true, onClick: () => (isInstagram ? instagramUnlink() : platformUnlink(platform)) }, $t('Unlink'))),
                shouldShowPrimaryBtn && (React.createElement(Tooltip, { title: $t('You cannot unlink the platform you used to sign in to Streamlabs Desktop. If you want to unlink this platform, please sign in with a different platform.') },
                    React.createElement(Button, { disabled: true, type: "primary" }, $t('Logged in')))))),
        React.createElement(ExtraFieldsSection, null)));
}
function CustomDestinationList() {
    const { customDestinations, editCustomDestMode, addCustomDest } = useStreamSettings();
    const { isPrime } = useVuex(() => ({
        isPrime: Services.UserService.isPrime,
    }));
    const destinations = customDestinations;
    const isEditMode = editCustomDestMode !== false;
    const shouldShowAddForm = editCustomDestMode === true;
    const canAddMoreDestinations = destinations.length < 5;
    const shouldShowPrimeLabel = !isPrime && destinations.length > 0;
    return (React.createElement("div", { className: styles.customDestinations },
        React.createElement("div", { className: styles.targetCardsWrapper }, destinations.map((dest, ind) => (React.createElement(CustomDestination, { key: ind, ind: ind, destination: dest })))),
        !isEditMode && canAddMoreDestinations && (React.createElement("a", { className: styles.addDestinationBtn, onClick: () => addCustomDest(shouldShowPrimeLabel) },
            React.createElement("i", { className: cx('fa fa-plus', styles.plus) }),
            React.createElement("span", null, $t('Add Destination')),
            shouldShowPrimeLabel ? (React.createElement(ButtonHighlighted, { onClick: () => addCustomDest(true), filled: true, text: $t('Ultra'), icon: React.createElement(UltraIcon, { type: "simple" }) })) : (React.createElement("div", { className: styles.ultra })))),
        !canAddMoreDestinations && React.createElement("p", null, $t('Maximum custom destinations has been added')),
        shouldShowAddForm && React.createElement(CustomDestForm, null)));
}
function CustomDestination(p) {
    const { editCustomDestMode, removeCustomDest, editCustomDest } = useStreamSettings();
    const isEditMode = editCustomDestMode === p.ind;
    return (React.createElement("div", { className: cx('section', 'flex--column', styles.section) },
        React.createElement("div", { className: styles.targetCard },
            React.createElement("i", { className: cx(styles.targetLogo, 'fa fa-globe') }),
            React.createElement("div", { className: cx({ [styles.targetData]: isEditMode }) },
                React.createElement("span", { className: styles.targetType }, p.destination.name),
                " ",
                React.createElement("br", null),
                React.createElement("span", { className: styles.targetName }, p.destination.url),
                React.createElement("br", null)),
            React.createElement("div", { style: { marginLeft: 'auto' } }, !isEditMode && (React.createElement("div", null,
                React.createElement("i", { className: cx('fa fa-trash', styles.actionIcon), onClick: () => removeCustomDest(p.ind) }),
                React.createElement("i", { className: cx('fa fa-pen', styles.actionIcon), onClick: () => editCustomDest(p.ind) }))))),
        isEditMode && React.createElement(CustomDestForm, null)));
}
function CustomDestForm() {
    const { saveCustomDest, stopEditing, formValues, updateCustomDestForm } = useStreamSettings();
    const urlValidator = {
        message: $t('Please connect platforms directly from Streamlabs Desktop instead of adding Streamlabs Multistream as a custom destination'),
        pattern: /^(?!.*streamlabs\.com).*/,
    };
    const meta = {
        name: metadata.text({ label: $t('Name'), required: true }),
        url: metadata.text({
            label: 'URL',
            rules: [urlValidator, { required: true }],
        }),
        streamKey: metadata.text({ label: $t('Stream Key'), isPassword: true }),
    };
    function editField(key) {
        return (value) => {
            console.log(key, value, /^(?!.*streamlabs\.com).*/.test(value));
            updateCustomDestForm({ [key]: value });
        };
    }
    return (React.createElement(FormFactory, { metadata: meta, values: formValues, name: "customDestForm", onChange: editField, onSubmit: saveCustomDest, onCancel: stopEditing }));
}
//# sourceMappingURL=Stream.js.map