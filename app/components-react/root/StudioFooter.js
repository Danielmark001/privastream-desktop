var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useState, useEffect } from 'react';
import cx from 'classnames';
import { EStreamQuality } from '../../services/performance';
import { EStreamingState, EReplayBufferState, ERecordingState } from '../../services/streaming';
import { Services } from '../service-provider';
import { $t } from '../../services/i18n';
import { useDebounce, useVuex } from '../hooks';
import styles from './StudioFooter.m.less';
import PerformanceMetrics from '../shared/PerformanceMetrics';
import TestWidgets from './TestWidgets';
import StartStreamingButton from './StartStreamingButton';
import NotificationsArea from './NotificationsArea';
import { Tooltip } from 'antd';
import { confirmAsync } from 'components-react/modals';
export default function StudioFooterComponent() {
    const { StreamingService, WindowsService, UsageStatisticsService, NavigationService, RecordingModeService, PerformanceService, SettingsService, UserService, } = Services;
    const { streamingStatus, isLoggedIn, canSchedule, streamQuality, replayBufferOffline, replayBufferStopping, replayBufferSaving, recordingModeEnabled, replayBufferEnabled, } = useVuex(() => ({
        streamingStatus: StreamingService.views.streamingStatus,
        isLoggedIn: UserService.views.isLoggedIn,
        canSchedule: StreamingService.views.supports('stream-schedule') &&
            !RecordingModeService.views.isRecordingModeEnabled,
        streamQuality: PerformanceService.views.streamQuality,
        replayBufferOffline: StreamingService.state.replayBufferStatus === EReplayBufferState.Offline,
        replayBufferStopping: StreamingService.state.replayBufferStatus === EReplayBufferState.Stopping,
        replayBufferSaving: StreamingService.state.replayBufferStatus === EReplayBufferState.Saving,
        recordingModeEnabled: RecordingModeService.views.isRecordingModeEnabled,
        replayBufferEnabled: SettingsService.views.values.Output.RecRB,
    }));
    function performanceIconClassName() {
        if (!streamingStatus || streamingStatus === EStreamingState.Offline) {
            return '';
        }
        if (streamingStatus === EStreamingState.Reconnecting || streamQuality === EStreamQuality.POOR) {
            return 'warning';
        }
        if (streamQuality === EStreamQuality.FAIR) {
            return 'info';
        }
        return 'success';
    }
    function openScheduleStream() {
        NavigationService.actions.navigate('StreamScheduler');
    }
    function openMetricsWindow() {
        WindowsService.actions.showWindow({
            componentName: 'AdvancedStatistics',
            title: $t('Performance Metrics'),
            size: { width: 700, height: 550 },
            resizable: true,
            maximizable: false,
            minWidth: 500,
            minHeight: 400,
        });
        UsageStatisticsService.actions.recordFeatureUsage('PerformanceStatistics');
    }
    function toggleReplayBuffer() {
        if (StreamingService.state.replayBufferStatus === EReplayBufferState.Offline) {
            StreamingService.actions.startReplayBuffer();
        }
        else {
            StreamingService.actions.stopReplayBuffer();
        }
    }
    function saveReplay() {
        if (replayBufferSaving || replayBufferStopping)
            return;
        StreamingService.actions.saveReplay();
    }
    function showRecordingModeDisableModal() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield confirmAsync({
                title: $t('Enable Live Streaming?'),
                content: (React.createElement("p", null, $t('Streamlabs is currently in recording mode, which hides live streaming features. Would you like to enable live streaming features? You can disable them again in General settings.'))),
                okText: $t('Enable Streaming'),
            });
            if (result) {
                RecordingModeService.actions.setRecordingMode(false);
            }
        });
    }
    return (React.createElement("div", { className: cx('footer', styles.footer) },
        React.createElement("div", { className: cx('flex flex--center flex--grow flex--justify-start', styles.footerLeft) },
            React.createElement(Tooltip, { placement: "left", title: $t('Open Performance Window') },
                React.createElement("i", { className: cx('icon-leaderboard-4', 'metrics-icon', styles.metricsIcon, performanceIconClassName()), onClick: openMetricsWindow })),
            React.createElement(PerformanceMetrics, { mode: "limited", className: "performance-metrics" }),
            React.createElement(NotificationsArea, null)),
        React.createElement("div", { className: styles.navRight },
            React.createElement("div", { className: styles.navItem }, isLoggedIn && React.createElement(TestWidgets, null)),
            recordingModeEnabled && (React.createElement("button", { className: "button button--trans", onClick: showRecordingModeDisableModal }, $t('Looking to stream?'))),
            !recordingModeEnabled && React.createElement(RecordingButton, null),
            replayBufferEnabled && replayBufferOffline && (React.createElement("div", { className: styles.navItem },
                React.createElement(Tooltip, { placement: "left", title: $t('Start Replay Buffer') },
                    React.createElement("button", { className: "circle-button", onClick: toggleReplayBuffer },
                        React.createElement("i", { className: "icon-replay-buffer" }))))),
            !replayBufferOffline && (React.createElement("div", { className: cx(styles.navItem, styles.replayButtonGroup) },
                React.createElement(Tooltip, { placement: "left", title: $t('Stop') },
                    React.createElement("button", { className: cx('circle-button', styles.leftReplay, 'button--soft-warning'), onClick: toggleReplayBuffer }, replayBufferStopping ? (React.createElement("i", { className: "fa fa-spinner fa-pulse" })) : (React.createElement("i", { className: "fa fa-stop" })))),
                React.createElement(Tooltip, { placement: "right", title: $t('Save Replay') },
                    React.createElement("button", { className: cx('circle-button', styles.rightReplay), onClick: saveReplay }, replayBufferSaving ? (React.createElement("i", { className: "fa fa-spinner fa-pulse" })) : (React.createElement("i", { className: "icon-save" })))))),
            canSchedule && (React.createElement("div", { className: styles.navItem },
                React.createElement(Tooltip, { placement: "left", title: $t('Schedule Stream') },
                    React.createElement("button", { className: "circle-button", onClick: openScheduleStream },
                        React.createElement("i", { className: "icon-date" }))))),
            !recordingModeEnabled && (React.createElement("div", { className: styles.navItem },
                React.createElement(StartStreamingButton, null))),
            recordingModeEnabled && React.createElement(RecordingButton, null))));
}
function RecordingButton() {
    const { StreamingService } = Services;
    const { isRecording, recordingStatus } = useVuex(() => ({
        isRecording: StreamingService.views.isRecording,
        recordingStatus: StreamingService.state.recordingStatus,
    }));
    function toggleRecording() {
        StreamingService.actions.toggleRecording();
    }
    return (React.createElement(React.Fragment, null,
        React.createElement(RecordingTimer, null),
        React.createElement("div", { className: styles.navItem },
            React.createElement(Tooltip, { placement: "left", title: isRecording ? $t('Stop Recording') : $t('Start Recording') },
                React.createElement("button", { className: cx(styles.recordButton, 'record-button', { active: isRecording }), onClick: useDebounce(200, toggleRecording) },
                    React.createElement("span", null, recordingStatus === ERecordingState.Stopping ? (React.createElement("i", { className: "fa fa-spinner fa-pulse" })) : (React.createElement(React.Fragment, null, "REC"))))))));
}
function RecordingTimer() {
    const { StreamingService } = Services;
    const [recordingTime, setRecordingTime] = useState('');
    const { isRecording } = useVuex(() => ({
        isRecording: StreamingService.views.isRecording,
    }));
    useEffect(() => {
        let recordingTimeout;
        if (isRecording) {
            recordingTimeout = window.setTimeout(() => {
                setRecordingTime(StreamingService.formattedDurationInCurrentRecordingState);
            }, 1000);
        }
        else if (recordingTime) {
            setRecordingTime('');
        }
        return () => clearTimeout(recordingTimeout);
    }, [isRecording, recordingTime]);
    if (!isRecording)
        return React.createElement(React.Fragment, null);
    return React.createElement("div", { className: cx(styles.navItem, styles.recordTime) }, recordingTime);
}
//# sourceMappingURL=StudioFooter.js.map