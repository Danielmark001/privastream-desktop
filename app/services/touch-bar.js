var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Service, Inject } from 'services/core';
import { EStreamingState } from 'services/streaming';
import Utils from './utils';
import { E_AUDIO_CHANNELS } from 'services/audio';
import { getSharedResource } from 'util/get-shared-resource';
import { EStreamQuality } from './performance';
import * as remote from '@electron/remote';
const TB = remote.TouchBar;
export class TouchBarService extends Service {
    constructor() {
        super(...arguments);
        this.micUnmutedIcon = remote.nativeImage.createFromNamedImage('NSTouchBarAudioInputTemplate', [
            0,
            0,
            1,
        ]);
        this.micMutedIcon = remote.nativeImage.createFromNamedImage('NSTouchBarAudioInputMuteTemplate', [
            0,
            0,
            1,
        ]);
    }
    init() {
        this.setupGoLive();
        this.setupMicPopover();
        this.setupPerformance();
        this.setupUndo();
        this.mainTb = new TB({
            items: [
                this.perfPopover,
                this.micPopover,
                this.undoButton,
                this.redoButton,
                this.goLiveButton,
                this.liveTimer,
            ],
        });
        this.blankTb = new TB({ items: [] });
        this.setTb();
        this.navigationService.navigated.subscribe(() => this.setTb());
        this.appService.loadingChanged.subscribe(() => this.setTb());
    }
    setTb() {
        if (this.navigationService.state.currentPage === 'Onboarding' ||
            this.appService.state.loading) {
            Utils.getMainWindow().setTouchBar(this.blankTb);
            Utils.getChildWindow().setTouchBar(this.blankTb);
        }
        else {
            Utils.getMainWindow().setTouchBar(this.mainTb);
            Utils.getChildWindow().setTouchBar(this.mainTb);
        }
    }
    setupGoLive() {
        this.goLiveButton = new TB.TouchBarButton({
            label: 'Go Live',
            backgroundColor: '#80F5D2',
            click: () => {
                this.streamingService.toggleStreaming();
            },
        });
        this.streamingService.streamingStatusChange.subscribe(status => {
            if (status === EStreamingState.Starting) {
                this.goLiveButton.label = 'Starting...';
                this.goLiveButton.backgroundColor = '#F85640';
            }
            else if (status === EStreamingState.Reconnecting) {
                this.goLiveButton.label = 'Reconnecting...';
                this.goLiveButton.backgroundColor = '#F85640';
            }
            else if (status === EStreamingState.Offline) {
                this.goLiveButton.label = 'Go Live';
                this.goLiveButton.backgroundColor = '#80F5D2';
            }
            else if (status === EStreamingState.Ending) {
                this.goLiveButton.label = 'Ending...';
                this.goLiveButton.backgroundColor = '#F85640';
            }
            else if (status === EStreamingState.Live) {
                this.goLiveButton.label = 'End Stream';
                this.goLiveButton.backgroundColor = '#F85640';
            }
        });
        this.liveTimer = new TB.TouchBarLabel({
            label: '',
        });
        window.setInterval(() => {
            if (this.streamingService.state.streamingStatus === EStreamingState.Live) {
                this.liveTimer.label = this.streamingService.formattedDurationInCurrentStreamingState;
            }
            else {
                this.liveTimer.label = '';
            }
        }, 500);
    }
    setupMicPopover() {
        let source = this.sourcesService.views.getSourceByChannel(E_AUDIO_CHANNELS.INPUT_1);
        this.sourcesService.sourceAdded.subscribe(s => {
            if (s.channel === E_AUDIO_CHANNELS.INPUT_1) {
                source = this.sourcesService.views.getSource(s.sourceId);
                this.updateMicValues(source);
            }
        });
        this.sourcesService.sourceUpdated.subscribe(s => {
            if (!source)
                return;
            if (s.sourceId === source.sourceId) {
                this.updateMicValues(source);
            }
        });
        this.audioService.audioSourceUpdated.subscribe(s => {
            if (!source)
                return;
            if (s.sourceId === source.sourceId) {
                this.updateMicValues(source);
            }
        });
        this.sourcesService.sourceRemoved.subscribe(s => {
            if (!source)
                return;
            if (s.sourceId === source.sourceId)
                source = null;
        });
        this.micMute = new TB.TouchBarButton({
            icon: this.micMutedIcon,
            click: () => {
                if (!source)
                    return;
                this.editorCommandsService.executeCommand('MuteSourceCommand', source.sourceId, !source.muted);
            },
        });
        this.micSlider = new TB.TouchBarSlider({
            label: 'Mic/Aux',
            value: 0,
            minValue: 0,
            maxValue: 1000,
            change: deflection => {
                if (!source)
                    return;
                this.editorCommandsService.executeCommand('SetDeflectionCommand', source.sourceId, deflection / 1000);
            },
        });
        this.micBar = new TB({ items: [this.micSlider, this.micMute] });
        this.micPopover = new TB.TouchBarPopover({
            items: this.micBar,
            icon: remote.nativeImage.createFromNamedImage('NSTouchBarAudioInputTemplate', [0, 0, 1]),
        });
        if (source)
            this.updateMicValues(source);
    }
    updateMicValues(source) {
        this.micSlider.label = source.name;
        this.micSlider.value =
            this.audioService.views.getSource(source.sourceId).fader.deflection * 1000;
        source.muted
            ? (this.micMute.icon = this.micMutedIcon)
            : (this.micMute.icon = this.micUnmutedIcon);
    }
    setupPerformance() {
        this.cpuLabel = new TB.TouchBarLabel({ label: '' });
        this.fpsLabel = new TB.TouchBarLabel({ label: '' });
        this.dfLabel = new TB.TouchBarLabel({ label: '' });
        this.brLabel = new TB.TouchBarLabel({ label: '' });
        this.perfBar = new TB({
            items: [
                this.cpuLabel,
                new TB.TouchBarSpacer({ size: 'small' }),
                this.fpsLabel,
                new TB.TouchBarSpacer({ size: 'small' }),
                this.dfLabel,
                new TB.TouchBarSpacer({ size: 'small' }),
                this.brLabel,
            ],
        });
        const poorIcon = remote.nativeImage.createFromPath(getSharedResource('touchbar-icons/stats-red.png'));
        const fairIcon = remote.nativeImage.createFromPath(getSharedResource('touchbar-icons/stats-yellow.png'));
        const goodIcon = remote.nativeImage.createFromPath(getSharedResource('touchbar-icons/stats-green.png'));
        this.perfPopover = new TB.TouchBarPopover({ items: this.perfBar, icon: goodIcon });
        let status = this.performanceService.views.streamQuality;
        setInterval(() => {
            if (status !== this.performanceService.views.streamQuality) {
                status = this.performanceService.views.streamQuality;
                if (status === EStreamQuality.POOR) {
                    this.perfPopover.icon = poorIcon;
                }
                else if (status === EStreamQuality.FAIR) {
                    this.perfPopover.icon = fairIcon;
                }
                else {
                    this.perfPopover.icon = goodIcon;
                }
            }
            this.cpuLabel.label = `CPU: ${this.performanceService.state.CPU.toFixed(1)}%`;
            this.fpsLabel.label = `FPS: ${this.performanceService.state.frameRate.toFixed(2)}`;
            this.dfLabel.label = `Dropped Frames: ${this.performanceService.state.numberDroppedFrames.toFixed(0)}`;
            this.brLabel.label = `Bitrate: ${this.performanceService.state.streamingBandwidth.toFixed(0)} kbps`;
        }, 2000);
    }
    setupUndo() {
        this.undoButton = new TB.TouchBarButton({
            icon: remote.nativeImage.createFromPath(getSharedResource('touchbar-icons/undo.png')),
            click: () => this.editorCommandsService.undo(),
        });
        this.redoButton = new TB.TouchBarButton({
            icon: remote.nativeImage.createFromPath(getSharedResource('touchbar-icons/redo.png')),
            click: () => this.editorCommandsService.redo(),
        });
    }
}
__decorate([
    Inject()
], TouchBarService.prototype, "streamingService", void 0);
__decorate([
    Inject()
], TouchBarService.prototype, "navigationService", void 0);
__decorate([
    Inject()
], TouchBarService.prototype, "appService", void 0);
__decorate([
    Inject()
], TouchBarService.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], TouchBarService.prototype, "editorCommandsService", void 0);
__decorate([
    Inject()
], TouchBarService.prototype, "audioService", void 0);
__decorate([
    Inject()
], TouchBarService.prototype, "performanceService", void 0);
//# sourceMappingURL=touch-bar.js.map