var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ExclamationCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import * as remote from '@electron/remote';
import { Alert, Button, Modal, Tabs, Tooltip } from 'antd';
import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
import Display from 'components-react/shared/Display';
import UltraIcon from 'components-react/shared/UltraIcon';
import { CheckboxInput, ListInput, SliderInput, TextInput } from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { EDismissable } from 'services/dismissables';
import { $t } from 'services/i18n';
import { byOS, OS } from 'util/operating-systems';
import { confirmAsync } from 'components-react/modals';
import { EAvailableFeatures } from 'services/incremental-rollout';
import { initStore, useController } from '../hooks/zustand';
const GuestCamCtx = React.createContext(null);
class GuestCamController {
    constructor() {
        this.GuestCamService = Services.GuestCamService;
        this.SourcesService = Services.SourcesService;
        this.ScenesService = Services.ScenesService;
        this.AudioService = Services.AudioService;
        this.EditorCommandsService = Services.EditorCommandsService;
        this.DismissablesService = Services.DismissablesService;
        this.UserService = Services.UserService;
        this.IncrementalRolloutService = Services.IncrementalRolloutService;
        this.store = initStore({
            regeneratingLink: false,
            hideDisplay: false,
        });
    }
    get joinAsGuest() {
        return !!this.GuestCamService.state.joinAsGuestHash;
    }
    get hostName() {
        return this.GuestCamService.state.hostName;
    }
    get maxGuests() {
        return this.GuestCamService.state.maxGuests;
    }
    get shouldShowPrimeUpgrade() {
        return (this.maxGuests === 2 &&
            !this.UserService.views.isPrime &&
            !this.IncrementalRolloutService.views.featureIsEnabled(EAvailableFeatures.guestCamBeta));
    }
    get showFirstTimeModal() {
        return this.DismissablesService.views.shouldShow(EDismissable.GuestCamFirstTimeModal);
    }
    get inviteUrl() {
        return this.GuestCamService.views.inviteUrl;
    }
    get produceOk() {
        return this.GuestCamService.state.produceOk;
    }
    get videoProducerSourceId() {
        return this.GuestCamService.views.videoSourceId;
    }
    get audioProducerSourceId() {
        return this.GuestCamService.views.audioSourceId;
    }
    get screenshareProducerSourceId() {
        return this.GuestCamService.views.screenshareSourceId;
    }
    get loggedIn() {
        return this.UserService.views.isLoggedIn;
    }
    get videoProducerSourceOptions() {
        const videoSourceType = byOS({ [OS.Windows]: 'dshow_input', [OS.Mac]: 'av_capture_input' });
        return this.SourcesService.views.getSourcesByType(videoSourceType).map(s => ({
            label: s.name,
            value: s.sourceId,
        }));
    }
    get audioProducerSourceOptions() {
        const audioSourceType = byOS({
            [OS.Windows]: 'wasapi_input_capture',
            [OS.Mac]: 'coreaudio_input_capture',
        });
        return this.SourcesService.views.getSourcesByType(audioSourceType).map(s => ({
            label: s.name,
            value: s.sourceId,
        }));
    }
    get screenshareProducerSourceOptions() {
        const noSources = { label: $t('None'), value: '' };
        const scene = this.ScenesService.views.getScene(this.ScenesService.state.activeSceneId);
        if (!scene) {
            return [noSources];
        }
        const activeSceneSources = scene.getNestedSources().filter(sceneItem => sceneItem.video);
        return [
            noSources,
            ...activeSceneSources.map(s => ({
                label: s.name,
                value: s.sourceId,
            })),
        ];
    }
    get videoProducerSource() {
        return this.GuestCamService.views.videoSource;
    }
    get audioProducerSource() {
        return this.GuestCamService.views.audioSource;
    }
    get screenshareProducerSource() {
        return this.GuestCamService.views.screenshareSource;
    }
    get availableSources() {
        const list = this.GuestCamService.views.sources.map(source => {
            const existingGuest = this.GuestCamService.views.getGuestBySourceId(source.sourceId);
            const name = existingGuest
                ? `${source.name} <${existingGuest.remoteProducer.name}>`
                : source.name;
            return {
                label: name,
                value: source.sourceId,
            };
        });
        list.unshift({ label: $t('Unassigned'), value: null });
        return list;
    }
    get guests() {
        return [...this.GuestCamService.state.guests];
    }
    get uniqueGuests() {
        const socketIds = {};
        return this.GuestCamService.state.guests.filter(g => {
            if (!socketIds[g.remoteProducer.socketId]) {
                socketIds[g.remoteProducer.socketId] = true;
                return true;
            }
            else {
                return false;
            }
        });
    }
    get sourceExists() {
        return !!this.GuestCamService.views.sourceId;
    }
    getBindingsForGuest(streamId) {
        const guest = this.GuestCamService.views.getGuestByStreamId(streamId);
        if (!(guest === null || guest === void 0 ? void 0 : guest.sourceId))
            return;
        const source = this.SourcesService.views.getSource(guest.sourceId);
        if (!source)
            return;
        const volume = this.AudioService.views.getSource(source.sourceId).fader.deflection;
        const setVolume = (val) => {
            this.EditorCommandsService.actions.executeCommand('SetDeflectionCommand', source.sourceId, val);
        };
        const visible = !source.forceHidden;
        const setVisible = () => {
            this.GuestCamService.actions.setVisibility(source.sourceId, !visible);
        };
        const disconnect = () => {
            this.GuestCamService.actions.disconnectGuest(streamId, true);
        };
        const sourceId = source.sourceId;
        const markAsRead = () => {
            this.GuestCamService.actions.markGuestAsRead(streamId);
        };
        return {
            volume,
            setVolume,
            visible,
            setVisible,
            disconnect,
            sourceId,
            markAsRead,
        };
    }
    regenerateLink() {
        this.store.setState(s => {
            s.regeneratingLink = true;
        });
        this.GuestCamService.actions.return.regenerateInviteLink().finally(() => this.store.setState(s => {
            s.regeneratingLink = false;
        }));
    }
    truncateName(name, length = 10) {
        if (name.length > length) {
            return `${name.substring(0, length)}...`;
        }
        return name;
    }
    addNewSource(streamId) {
        this.SourcesService.actions.showAddSource('mediasoupconnector', { guestCamStreamId: streamId });
    }
    disconnectFromHost() {
        this.GuestCamService.actions.disconnectFromHost();
    }
}
export default function GuestCamProperties() {
    const controller = useMemo(() => new GuestCamController(), []);
    return (React.createElement(GuestCamCtx.Provider, { value: controller },
        React.createElement(GuestCamPropertiesModal, null)));
}
function GuestCamPropertiesModal() {
    const { GuestCamService, SourcesService, WindowsService, EditorCommandsService, DismissablesService, MagicLinkService, } = Services;
    const defaultTab = useMemo(() => {
        const openedSourceId = WindowsService.getChildWindowQueryParams().sourceId;
        const guest = GuestCamService.views.getGuestBySourceId(openedSourceId);
        if (!guest)
            return 'settings';
        return guest.remoteProducer.streamId;
    }, []);
    const controller = useController(GuestCamCtx);
    const { regenerateLink, truncateName, disconnectFromHost } = controller;
    const regeneratingLink = controller.store.useState(s => s.regeneratingLink);
    const { guests, uniqueGuests, maxGuests, shouldShowPrimeUpgrade, joinAsGuest, hostName, showFirstTimeModal, inviteUrl, videoProducerSource, videoProducerSourceId, videoProducerSourceOptions, audioProducerSource, audioProducerSourceId, audioProducerSourceOptions, screenshareProducerSourceId, screenshareProducerSourceOptions, sourceExists, produceOk, loggedIn, } = useVuex(() => ({
        guests: controller.guests,
        uniqueGuests: controller.uniqueGuests,
        maxGuests: controller.maxGuests,
        shouldShowPrimeUpgrade: controller.shouldShowPrimeUpgrade,
        joinAsGuest: controller.joinAsGuest,
        hostName: controller.hostName,
        showFirstTimeModal: controller.showFirstTimeModal,
        inviteUrl: controller.inviteUrl,
        videoProducerSource: controller.videoProducerSource,
        videoProducerSourceId: controller.videoProducerSourceId,
        videoProducerSourceOptions: controller.videoProducerSourceOptions,
        audioProducerSource: controller.audioProducerSource,
        audioProducerSourceId: controller.audioProducerSourceId,
        audioProducerSourceOptions: controller.audioProducerSourceOptions,
        screenshareProducerSourceId: controller.screenshareProducerSourceId,
        screenshareProducerSourceOptions: controller.screenshareProducerSourceOptions,
        sourceExists: controller.sourceExists,
        produceOk: controller.produceOk,
        loggedIn: controller.loggedIn,
    }));
    function getModalContent() {
        if (showFirstTimeModal) {
            return React.createElement(FirstTimeModalContent, null);
        }
        else if (!sourceExists) {
            return React.createElement(MissingSourceModalContent, null);
        }
        else if (joinAsGuest) {
            return React.createElement(JoinAsGuestModalContent, null);
        }
        else {
            return React.createElement(EveryTimeModalContent, null);
        }
    }
    function getModalButtonText() {
        if (showFirstTimeModal) {
            return $t('Get Started');
        }
        else if (!sourceExists) {
            return $t('Add Source');
        }
        else {
            return $t('Start Collab Cam');
        }
    }
    function getGuestLabel(guest) {
        const name = truncateName(guest.remoteProducer.name);
        const icon = guest.remoteProducer.type === 'screenshare' ? 'fa-desktop' : 'fa-user';
        return (React.createElement("span", null,
            React.createElement("i", { className: `fa ${icon}`, style: { marginRight: 8 } }),
            name));
    }
    if (!loggedIn) {
        return (React.createElement(ModalLayout, null,
            React.createElement(Alert, { type: "error", showIcon: true, closable: false, message: React.createElement("div", null, $t('You must be logged in to use Collab Cam.')) })));
    }
    return (React.createElement(ModalLayout, { scrollable: true },
        React.createElement(Tabs, { destroyInactiveTabPane: true, defaultActiveKey: defaultTab },
            React.createElement(Tabs.TabPane, { tab: $t('Settings'), key: "settings" },
                React.createElement(Form, { layout: "inline" },
                    joinAsGuest ? (React.createElement("div", { style: { height: 32, margin: '10px 0 10px' } },
                        React.createElement("div", null,
                            React.createElement("b", null, $t('Connected To Host:')),
                            ' ',
                            React.createElement("span", { style: { color: 'var(--title)' } }, hostName),
                            React.createElement(Tooltip, { title: $t("You are connected as a guest using someone else's invite link. To leave, click the Disconnect button.") },
                                React.createElement(QuestionCircleOutlined, { style: { marginLeft: 6 } })),
                            React.createElement("button", { style: { marginLeft: 10 }, className: "button button--soft-warning", onClick: disconnectFromHost }, $t('Disconnect'))))) : (React.createElement("div", { style: { display: 'flex', width: '100%', margin: '10px 0' } },
                        React.createElement(TextInput, { readOnly: true, value: inviteUrl, label: $t('Invite URL'), style: { flexGrow: 1 }, addonAfter: React.createElement(Tooltip, { trigger: "click", title: $t('Copied!') },
                                React.createElement(Button, { onClick: () => remote.clipboard.writeText(inviteUrl) }, $t('Copy'))) }),
                        React.createElement(Button, { disabled: regeneratingLink, onClick: regenerateLink, style: { width: 180 } },
                            $t('Generate a new link'),
                            regeneratingLink && (React.createElement("i", { className: "fa fa-spinner fa-pulse", style: { marginLeft: 8 } }))))),
                    !joinAsGuest && (React.createElement("div", { style: { margin: '10px 0 0', width: '100%' } },
                        React.createElement("span", null, $t('Guests')),
                        React.createElement("span", { style: {
                                marginLeft: 8,
                                background: 'var(--section-alt)',
                                padding: 5,
                                borderRadius: 6,
                            } },
                            uniqueGuests.length,
                            " / ",
                            maxGuests - 1),
                        shouldShowPrimeUpgrade && (React.createElement("span", { style: { marginLeft: 8, cursor: 'pointer' }, onClick: () => MagicLinkService.actions.linkToPrime('desktop-collab-cam') },
                            React.createElement(UltraIcon, { style: {
                                    display: 'inline-block',
                                    height: '12px',
                                    width: '12px',
                                } }),
                            React.createElement("b", { style: { marginLeft: 5 } }, $t('Upgrade for more Guests')))))),
                    React.createElement("h2", { style: { marginTop: 20 } }, $t('The webcam and microphone source you select below will be broadcast to your guests.')),
                    React.createElement("div", { style: {
                            display: 'flex',
                            width: '100%',
                            margin: '10px 0',
                            justifyContent: 'space-between',
                        } },
                        React.createElement(ListInput, { label: $t('Webcam Source'), options: videoProducerSourceOptions, value: videoProducerSourceId, onChange: s => GuestCamService.actions.setVideoSource(s), style: { width: '48%', margin: 0 } }),
                        React.createElement(ListInput, { label: $t('Microphone Source'), options: audioProducerSourceOptions, value: audioProducerSourceId, onChange: s => GuestCamService.actions.setAudioSource(s), style: { width: '48%', margin: 0 } })),
                    React.createElement("div", { style: {
                            display: 'flex',
                            width: '100%',
                            margin: '10px 0',
                        } },
                        React.createElement(ListInput, { label: $t('Share Video Source (Optional)'), options: screenshareProducerSourceOptions, value: screenshareProducerSourceId, onChange: s => GuestCamService.actions.setScreenshareSource(s), style: { width: '48%', margin: 0 } }),
                        screenshareProducerSourceId && (React.createElement("button", { className: "button button--soft-warning", onClick: () => GuestCamService.actions.setScreenshareSource(''), style: { marginLeft: 30 } }, $t('Stop Sharing'))))),
                (!videoProducerSource || !audioProducerSource) && (React.createElement(Alert, { type: "error", showIcon: true, closable: false, message: React.createElement("div", { style: { color: 'var(--paragraph)' } },
                        !videoProducerSource && (React.createElement("div", null, $t('No webcam source is selected. Your guest will not be able to see you.'))),
                        !audioProducerSource && (React.createElement("div", null, $t('No microphone source is selected. Your guest will not be able to hear you.')))) }))),
            guests.map(guest => {
                return (React.createElement(Tabs.TabPane, { tab: getGuestLabel(guest), key: guest.remoteProducer.streamId },
                    React.createElement(GuestPane, { guest: guest })));
            })),
        React.createElement(Modal, { visible: !produceOk, getContainer: false, closable: false, okText: getModalButtonText(), onOk: () => {
                if (sourceExists) {
                    GuestCamService.actions.setProduceOk();
                }
                else if (!showFirstTimeModal) {
                    SourcesService.actions.showAddSource('mediasoupconnector');
                }
                DismissablesService.actions.dismiss(EDismissable.GuestCamFirstTimeModal);
            }, onCancel: () => WindowsService.actions.closeChildWindow() }, getModalContent())));
}
function GuestSourceSelector(p) {
    const controller = useController(GuestCamCtx);
    const { getBindingsForGuest, store } = controller;
    const availableSources = useVuex(() => controller.availableSources);
    const bindings = useVuex(() => getBindingsForGuest(p.guest.remoteProducer.streamId));
    const sourceId = bindings ? bindings.sourceId : null;
    const { GuestCamService, SourcesService } = Services;
    const setHideDisplay = useCallback((isHidden) => {
        store.setState(s => {
            s.hideDisplay = isHidden;
        });
    }, []);
    function setSourceId(sourceId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!sourceId) {
                setHideDisplay(true);
                const confirmed = yield confirmAsync($t('Are you sure you want to unassign %{guestName} from the source?', {
                    guestName: p.guest.remoteProducer.name,
                }));
                setHideDisplay(false);
                if (!confirmed)
                    return;
                GuestCamService.actions.setGuestSource(p.guest.remoteProducer.streamId, null);
                return;
            }
            const existingGuest = GuestCamService.views.getGuestBySourceId(sourceId);
            if (existingGuest) {
                const source = SourcesService.views.getSource(sourceId);
                setHideDisplay(true);
                const confirmed = yield confirmAsync($t('The source %{sourceName} is already occupied by %{guestName}. If you continue, %{guestName} will be unassigned.', { sourceName: source.name, guestName: existingGuest.remoteProducer.name }));
                setHideDisplay(false);
                if (!confirmed)
                    return;
            }
            GuestCamService.actions.setGuestSource(p.guest.remoteProducer.streamId, sourceId);
        });
    }
    return (React.createElement(ListInput, { options: availableSources, value: sourceId, label: $t('Assign to Source'), listHeight: 120, onChange: setSourceId, style: p.style }));
}
function DisconnectModal(p) {
    const [regen, setRegen] = useState(true);
    return (React.createElement(React.Fragment, null,
        React.createElement("p", null, $t('If you want to prevent this guest from rejoining, you should also regenerate your invite link.')),
        React.createElement(Form, null,
            React.createElement(CheckboxInput, { label: $t('Regenerate Link'), value: regen, onChange: (val) => {
                    setRegen(val);
                    p.setCheckboxVal(val);
                } }))));
}
function GuestPane(p) {
    const { getBindingsForGuest, addNewSource, regenerateLink, store } = useController(GuestCamCtx);
    const setHideDisplay = useCallback((isHidden) => {
        store.setState(s => {
            s.hideDisplay = isHidden;
        });
    }, []);
    const bindings = useVuex(() => getBindingsForGuest(p.guest.remoteProducer.streamId));
    useEffect(() => {
        if (bindings)
            bindings.markAsRead();
    }, []);
    if (!bindings) {
        return (React.createElement("div", null,
            React.createElement("h2", null, $t('This guest is not assigned to a source')),
            React.createElement(Form, { layout: "inline" },
                React.createElement(GuestSourceSelector, { guest: p.guest, style: { width: 400 } }),
                React.createElement(Button, { onClick: () => addNewSource(p.guest.remoteProducer.streamId) }, $t('Add New Source')))));
    }
    const { visible, setVisible, volume, setVolume, disconnect } = bindings;
    function onDisconnectClick() {
        return __awaiter(this, void 0, void 0, function* () {
            let regen = true;
            setHideDisplay(true);
            const confirmed = yield confirmAsync({
                title: $t('Are you sure you want to disconnect %{guestName}?', {
                    guestName: p.guest.remoteProducer.name,
                }),
                content: React.createElement(DisconnectModal, { setCheckboxVal: val => (regen = val) }),
            });
            setHideDisplay(false);
            if (!confirmed)
                return;
            if (regen) {
                regenerateLink();
            }
            disconnect();
        });
    }
    return (React.createElement("div", { style: {
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--section-alt)',
            borderRadius: 8,
        } },
        React.createElement(GuestDisplay, { guest: p.guest }),
        React.createElement("div", { style: { flexGrow: 1, padding: 20 } },
            React.createElement(Form, { layout: "inline" },
                React.createElement("div", { style: { display: 'flex', flexDirection: 'row', width: '100%' } },
                    React.createElement("div", { style: { width: 400, margin: '0 20px 20px' } },
                        React.createElement(GuestSourceSelector, { guest: p.guest })),
                    React.createElement("div", { style: { flexGrow: 1, margin: '0 20px 20px' } },
                        React.createElement(SliderInput, { label: $t('Volume'), value: volume, onChange: setVolume, min: 0, max: 1, debounce: 500, step: 0.01, tipFormatter: v => `${(v * 100).toFixed(0)}%`, tooltipPlacement: "bottom", style: { width: '100%' } }))),
                React.createElement("div", { style: { width: '100%', marginLeft: 20 } },
                    React.createElement("div", { style: {
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            margin: '20px 0',
                        } },
                        React.createElement(Button, { onClick: setVisible, style: { width: 160, marginRight: 40 }, type: !visible ? 'primary' : 'default' }, visible ? $t('Hide on Stream') : $t('Show on Stream')),
                        React.createElement("button", { className: "button button--soft-warning", style: { width: 160 }, onClick: onDisconnectClick }, $t('Disconnect'))))))));
}
function GuestDisplay(p) {
    const { produceOk, getBindingsForGuest, store } = useController(GuestCamCtx);
    const hideDisplay = store.useState(s => s.hideDisplay);
    const bindings = useVuex(() => getBindingsForGuest(p.guest.remoteProducer.streamId));
    if (!bindings)
        return React.createElement("div", null);
    const { sourceId } = bindings;
    return (React.createElement("div", { style: { background: 'var(--section)', borderRadius: '8px 8px 0 0', height: 280 } },
        React.createElement("div", { style: { margin: '0 10px', width: 'calc(100% - 20px)', height: '100%' } }, produceOk && !hideDisplay && React.createElement(Display, { sourceId: sourceId }))));
}
function EveryTimeModalContent() {
    return (React.createElement("h2", { style: { textAlign: 'center' } }, $t('Collab Cam is not yet sending your video and audio to guests. Start Collab Cam?')));
}
function FirstTimeModalContent() {
    return (React.createElement(React.Fragment, null,
        React.createElement("h2", null, $t('Welcome to Collab Cam')),
        React.createElement("h3", null, $t('Step 1')),
        React.createElement("p", null, $t("Copy and share a link with your guest. When they join, they'll be able to see and hear you.")),
        React.createElement("h3", null, $t('Step 2')),
        React.createElement("p", null, $t("Verify their identity in the preview area. When ready, add them to your stream by clicking 'Show on Stream'.")),
        React.createElement("h3", null, $t('Step 3')),
        React.createElement("p", null, $t('Enjoy your stream! Adjust their volume, create new links, and change your mic and camera from the properties window.')),
        React.createElement(Alert, { message: React.createElement("div", { style: { color: 'var(--info)' } },
                React.createElement(ExclamationCircleOutlined, { style: { color: 'var(--info)', marginRight: 8 } }),
                $t("Don't share your invite link with anyone you don't want on your stream. You can invalidate an old link by generating a new one. Do not show this window on stream.")), type: "info", closable: false, showIcon: false, banner: true }),
        React.createElement("a", { style: { display: 'inline-block', marginTop: 10 }, onClick: () => remote.shell.openExternal('https://streamlabs.com/collab-cam') }, $t('Learn More'))));
}
function JoinAsGuestModalContent() {
    const { GuestCamService } = Services;
    const { hostName } = useVuex(() => ({ hostName: GuestCamService.state.hostName }));
    return (React.createElement(React.Fragment, null,
        React.createElement("h2", null, $t("You're about to join %{name}", { name: hostName })),
        React.createElement("p", null, $t("%{name} has invited you to join their stream. When you're ready to join, click the button below.", { name: hostName }))));
}
function MissingSourceModalContent() {
    return (React.createElement(React.Fragment, null,
        React.createElement("h2", null, $t('Collab Cam requires a source')),
        React.createElement("p", null, $t('At least one Collab Cam source is required to use Collab Cam. Would you like to add one now?'))));
}
//# sourceMappingURL=GuestCamProperties.js.map