var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import cx from 'classnames';
import { EStreamingState } from 'services/streaming';
import { EGlobalSyncStatus } from 'services/media-backup';
import { $t } from 'services/i18n';
import { useVuex } from '../hooks';
import { Services } from '../service-provider';
import * as remote from '@electron/remote';
import { promptAction } from 'components-react/modals';
export default function StartStreamingButton(p) {
    const { StreamingService, StreamSettingsService, UserService, CustomizationService, MediaBackupService, SourcesService, RestreamService, UsageStatisticsService, } = Services;
    const { streamingStatus, delayEnabled, delaySeconds, streamShiftStatus, isDualOutputMode, isLoggedIn, isPrime, primaryPlatform, isMultiplatformMode, updateStreamInfoOnLive, } = useVuex(() => {
        var _a;
        return ({
            streamingStatus: StreamingService.state.streamingStatus,
            delayEnabled: StreamingService.views.delayEnabled,
            delaySeconds: StreamingService.views.delaySeconds,
            streamShiftStatus: RestreamService.state.streamShiftStatus,
            isDualOutputMode: StreamingService.views.isDualOutputMode,
            isLoggedIn: UserService.isLoggedIn,
            isPrime: UserService.state.isPrime,
            primaryPlatform: (_a = UserService.state.auth) === null || _a === void 0 ? void 0 : _a.primaryPlatform,
            isMultiplatformMode: StreamingService.views.isMultiplatformMode,
            updateStreamInfoOnLive: CustomizationService.state.updateStreamInfoOnLive,
        });
    });
    const [delaySecondsRemaining, setDelayTick] = useState(delaySeconds);
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        setDelayTick(delaySeconds);
    }, [streamingStatus]);
    useEffect(() => {
        if (delayEnabled &&
            delaySecondsRemaining > 0 &&
            (streamingStatus === EStreamingState.Starting || streamingStatus === EStreamingState.Ending)) {
            const interval = window.setTimeout(() => {
                setDelayTick(delaySecondsRemaining - 1);
            }, 1000);
            return () => {
                clearTimeout(interval);
            };
        }
    }, [delaySecondsRemaining, streamingStatus, delayEnabled]);
    useEffect(() => {
        if (!isDualOutputMode && isPrime && streamingStatus === EStreamingState.Offline) {
            fetchStreamShiftStatus();
        }
        const streamShiftEvent = StreamingService.streamShiftEvent.subscribe((event) => {
            const { streamShiftStreamId } = RestreamService.state;
            console.debug('Event ID: ' + event.data.identifier, '\n Stream ID: ' + streamShiftStreamId);
            const isFromOtherDevice = streamShiftStreamId && event.data.identifier !== streamShiftStreamId;
            const isMobileRemote = isFromOtherDevice ? /[A-Z]/.test(event.data.identifier) : false;
            const remoteDeviceType = isMobileRemote ? 'mobile' : 'desktop';
            const switchType = `desktop-${remoteDeviceType}`;
            if (event.type === 'streamSwitchRequest') {
                if (!isFromOtherDevice) {
                    RestreamService.actions.confirmStreamShift('approved');
                }
                else {
                    UsageStatisticsService.recordAnalyticsEvent('StreamShift', {
                        stream: switchType,
                        action: 'request',
                    });
                }
            }
            if (event.type === 'switchActionComplete') {
                if (isFromOtherDevice) {
                    Services.RestreamService.actions.endStreamShiftStream(event.data.identifier);
                    UsageStatisticsService.recordAnalyticsEvent('StreamShift', {
                        stream: switchType,
                        action: 'complete',
                    });
                }
                const message = isFromOtherDevice
                    ? $t('Your stream has been successfully switched to Streamlabs Desktop. Enjoy your stream!')
                    : $t('Your stream has been switched to Streamlabs Desktop from another device. Enjoy your stream!');
                promptAction({
                    title: $t('Stream successfully switched'),
                    message,
                    btnText: $t('Close'),
                    btnType: 'default',
                    cancelBtnPosition: 'none',
                });
            }
        });
        return () => {
            streamShiftEvent.unsubscribe();
        };
    }, []);
    const toggleStreaming = useCallback(() => __awaiter(this, void 0, void 0, function* () {
        if (StreamingService.isStreaming) {
            StreamingService.toggleStreaming();
        }
        else {
            if (MediaBackupService.views.globalSyncStatus === EGlobalSyncStatus.Syncing) {
                const goLive = yield remote.dialog
                    .showMessageBox(remote.getCurrentWindow(), {
                    title: $t('Cloud Backup'),
                    type: 'warning',
                    message: $t('Your media files are currently being synced with the cloud. ') +
                        $t('It is recommended that you wait until this finishes before going live.'),
                    buttons: [$t('Wait'), $t('Go Live Anyway')],
                })
                    .then(({ response }) => !!response);
                if (!goLive)
                    return;
            }
            const needToShowNoSourcesWarning = StreamSettingsService.settings.warnNoVideoSources &&
                SourcesService.views.getSources().filter(source => source.type !== 'scene' && source.video)
                    .length === 0;
            if (needToShowNoSourcesWarning) {
                const goLive = yield remote.dialog
                    .showMessageBox(remote.getCurrentWindow(), {
                    title: $t('No Sources'),
                    type: 'warning',
                    message: $t("It looks like you haven't added any video sources yet, so you will only be outputting a black screen.") +
                        ' ' +
                        $t('Are you sure you want to do this?') +
                        '\n\n' +
                        $t('You can add sources by clicking the + icon near the Sources box at any time'),
                    buttons: [$t('Cancel'), $t('Go Live Anyway')],
                })
                    .then(({ response }) => !!response);
                if (!goLive)
                    return;
            }
            if (isLoggedIn && isPrime) {
                setIsLoading(true);
                const isLive = yield fetchStreamShiftStatus();
                setIsLoading(false);
                const message = isDualOutputMode
                    ? $t('A stream on another device has been detected. Would you like to switch your stream to Streamlabs Desktop? If you do not wish to continue this stream, please end it from the current streaming source. Dual Output will be disabled since not supported in this mode. If you\'re sure you\'re not live and it has been incorrectly detected, choose "Force Start" below.')
                    : $t('A stream on another device has been detected. Would you like to switch your stream to Streamlabs Desktop? If you do not wish to continue this stream, please end it from the current streaming source. If you\'re sure you\'re not live and it has been incorrectly detected, choose "Force Start" below.');
                if (isLive) {
                    const { streamShiftForceGoLive } = RestreamService.state;
                    let shouldForceGoLive = streamShiftForceGoLive;
                    yield promptAction({
                        title: $t('Another stream detected'),
                        message,
                        btnText: $t('Switch to Streamlabs Desktop'),
                        fn: startStreamShift,
                        cancelBtnText: $t('Cancel'),
                        cancelBtnPosition: 'left',
                        secondaryActionText: $t('Force Start'),
                        secondaryActionFn: () => __awaiter(this, void 0, void 0, function* () {
                            RestreamService.actions.return.forceStreamShiftGoLive(true);
                            shouldForceGoLive = true;
                        }),
                    });
                    if (!shouldForceGoLive) {
                        return;
                    }
                }
            }
            if (shouldShowGoLiveWindow()) {
                if (!StreamingService.views.hasPendingChecks()) {
                    StreamingService.actions.resetInfo();
                }
                StreamingService.actions.showGoLiveWindow();
            }
            else {
                StreamingService.actions.goLive();
            }
        }
    }), []);
    const getIsRedButton = streamingStatus !== EStreamingState.Offline && streamShiftStatus !== 'pending';
    const isDisabled = p.disabled ||
        (streamingStatus === EStreamingState.Starting && delaySecondsRemaining === 0) ||
        (streamingStatus === EStreamingState.Ending && delaySecondsRemaining === 0);
    const fetchStreamShiftStatus = useCallback(() => __awaiter(this, void 0, void 0, function* () {
        try {
            const isLive = yield RestreamService.checkIsLive();
            return isLive;
        }
        catch (e) {
            console.error('Error checking stream shift status', e);
            setIsLoading(false);
            return false;
        }
    }), []);
    const startStreamShift = useCallback(() => {
        if (isDualOutputMode) {
            Services.DualOutputService.actions.toggleDisplay(false, 'vertical');
        }
        StreamingService.actions.goLive();
    }, [isDualOutputMode]);
    const shouldShowGoLiveWindow = useCallback(() => {
        var _a, _b, _c;
        if (!UserService.isLoggedIn)
            return false;
        const primaryPlatform = (_a = UserService.state.auth) === null || _a === void 0 ? void 0 : _a.primaryPlatform;
        const updateStreamInfoOnLive = CustomizationService.state.updateStreamInfoOnLive;
        if (!primaryPlatform)
            return false;
        if (StreamingService.views.isDualOutputMode) {
            return true;
        }
        if (!!((_b = UserService.state.auth) === null || _b === void 0 ? void 0 : _b.platforms) &&
            StreamingService.views.isMultiplatformMode &&
            Object.keys((_c = UserService.state.auth) === null || _c === void 0 ? void 0 : _c.platforms).length > 1) {
            return true;
        }
        if (primaryPlatform === 'twitch') {
            return StreamingService.views.isMultiplatformMode || updateStreamInfoOnLive;
        }
        else {
            return (StreamSettingsService.state.protectedModeEnabled &&
                StreamSettingsService.isSafeToModifyStreamKey());
        }
    }, [primaryPlatform, isMultiplatformMode, updateStreamInfoOnLive]);
    return (<button style={{ minWidth: '130px' }} className={cx('button button--action', { 'button--soft-warning': getIsRedButton })} disabled={isDisabled} onClick={toggleStreaming} data-name="StartStreamingButton">
      {isLoading ? (<i className="fa fa-spinner fa-pulse"/>) : (<StreamButtonLabel streamingStatus={streamingStatus} delayEnabled={delayEnabled} delaySecondsRemaining={delaySecondsRemaining} streamShiftStatus={streamShiftStatus}/>)}
    </button>);
}
function StreamButtonLabel(p) {
    const label = useMemo(() => {
        if (p.streamShiftStatus === 'pending') {
            return $t('Claim Stream');
        }
        switch (p.streamingStatus) {
            case EStreamingState.Live:
                return $t('End Stream');
            case EStreamingState.Starting:
                return p.delayEnabled ? `Starting ${p.delaySecondsRemaining}s` : $t('Starting');
            case EStreamingState.Ending:
                return p.delayEnabled ? `Discard ${p.delaySecondsRemaining}s` : $t('Ending');
            case EStreamingState.Reconnecting:
                return $t('Reconnecting');
            case EStreamingState.Offline:
            default:
                return $t('Go Live');
        }
    }, [p.streamShiftStatus, p.streamingStatus, p.delayEnabled, p.delaySecondsRemaining]);
    return <>{label}</>;
}
//# sourceMappingURL=StartStreamingButton.jsx.map