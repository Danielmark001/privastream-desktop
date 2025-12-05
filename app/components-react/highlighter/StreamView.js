import { useVuex } from 'components-react/hooks';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Services } from 'components-react/service-provider';
import styles from './StreamView.m.less';
import cx from 'classnames';
import { EHighlighterView, } from 'services/highlighter/models/highlighter.models';
import isEqual from 'lodash/isEqual';
import { Modal, Button, Alert } from 'antd';
import { SUPPORTED_FILE_TYPES } from 'services/highlighter/constants';
import Scrollable from 'components-react/shared/Scrollable';
import { $t } from 'services/i18n';
import StreamCard from './StreamCard';
import path from 'path';
import moment from 'moment';
import { ImportStreamModal } from './ImportStream';
import SupportedGames from './supportedGames/SupportedGames';
export default function StreamView({ emitSetView }) {
    const { HighlighterService, HotkeysService, UsageStatisticsService } = Services;
    const v = useVuex(() => ({
        error: HighlighterService.views.error,
        uploadInfo: HighlighterService.views.uploadInfo,
        highlighterVersion: HighlighterService.views.highlighterVersion,
        tempRecordingInfoPath: HighlighterService.views.tempRecordingInfo.recordingPath,
    }));
    useEffect(() => {
        const recordingInfo = Object.assign({}, HighlighterService.views.tempRecordingInfo);
        HighlighterService.setTempRecordingInfo({});
        if (recordingInfo.recordingPath && recordingInfo.source) {
            setShowModal({
                type: 'upload',
                path: recordingInfo.recordingPath,
                streamInfo: recordingInfo.streamInfo,
                openedFrom: recordingInfo.source,
            });
        }
    }, [v.tempRecordingInfoPath]);
    const highlightedStreamsAmount = useVuex(() => {
        return HighlighterService.views.highlightedStreams.length;
    });
    const highlightedStreams = useMemo(() => {
        return HighlighterService.views.highlightedStreams
            .map(stream => {
            return { id: stream.id, date: stream.date, game: stream.game };
        })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [highlightedStreamsAmount]);
    const currentAiDetectionState = useRef();
    const aiDetectionInProgress = useVuex(() => {
        const newDetectionInProgress = HighlighterService.views.highlightedStreams.some(stream => stream.state.type === 'detection-in-progress');
        if (currentAiDetectionState.current === undefined ||
            !isEqual(currentAiDetectionState.current, newDetectionInProgress)) {
            currentAiDetectionState.current = newDetectionInProgress;
        }
        return currentAiDetectionState.current;
    });
    const [showModal, rawSetShowModal] = useState(null);
    function setShowModal(modal) {
        rawSetShowModal(modal);
    }
    function closeModal() {
        if (v.uploadInfo.some(u => u.uploading))
            return;
        setShowModal(null);
        if (v.error)
            HighlighterService.actions.dismissError();
    }
    function onDrop(e) {
        var _a;
        if (v.highlighterVersion === '')
            return;
        const extensions = SUPPORTED_FILE_TYPES.map(e => `.${e}`);
        const files = [];
        let fi = e.dataTransfer.files.length;
        while (fi--) {
            const file = (_a = e.dataTransfer.files.item(fi)) === null || _a === void 0 ? void 0 : _a.path;
            if (file)
                files.push(file);
        }
        const filtered = files.filter(f => extensions.includes(path.parse(f).ext));
        if (filtered.length && !aiDetectionInProgress) {
            setShowModal({ type: 'upload', path: filtered[0], openedFrom: 'manual-import' });
        }
        e.preventDefault();
        e.stopPropagation();
    }
    return (React.createElement("div", { className: cx(styles.streamViewWrapper, showModal && styles.importModalRoot, styles.streamCardModalRoot), onDrop: event => onDrop(event) },
        React.createElement("div", { style: { display: 'flex', padding: 20 } },
            React.createElement("div", { style: { flexGrow: 1 } },
                React.createElement("h1", { style: { margin: 0 } }, $t('My Stream Highlights'))),
            React.createElement("div", { style: { display: 'flex', gap: '16px' } },
                v.highlighterVersion !== '' && (React.createElement("div", { className: styles.uploadWrapper, style: {
                        opacity: aiDetectionInProgress ? '0.7' : '1',
                        cursor: aiDetectionInProgress ? 'not-allowed' : 'pointer',
                    }, onClick: () => !aiDetectionInProgress &&
                        setShowModal({ type: 'upload', openedFrom: 'manual-import' }) },
                    React.createElement("div", { onClick: e => e.stopPropagation() },
                        React.createElement(SupportedGames, { emitClick: game => {
                                !aiDetectionInProgress &&
                                    setShowModal({ type: 'upload', game, openedFrom: 'manual-import' });
                            } })),
                    $t('Select your game recording'),
                    React.createElement(Button, { disabled: aiDetectionInProgress === true }, $t('Import')))),
                React.createElement(Button, { onClick: () => emitSetView({ view: EHighlighterView.SETTINGS }) }, $t('Settings')))),
        React.createElement(Scrollable, { style: { flexGrow: 1, padding: '20px 0 20px 20px' } }, highlightedStreams.length === 0 ? (React.createElement(React.Fragment, null, "No highlight clips created from streams")) : (Object.entries(groupStreamsByTimePeriod(highlightedStreams)).map(([period, streams]) => streams.length > 0 && (React.createElement(React.Fragment, { key: period },
            React.createElement("div", { className: styles.periodDivider }, period),
            React.createElement("div", { className: styles.streamcardsWrapper }, streams.map(stream => (React.createElement(StreamCard, { key: stream.id, streamId: stream.id, emitSetView: data => emitSetView(data) }))))))))),
        React.createElement(Modal, { getContainer: `.${styles.importModalRoot}`, onCancel: () => {
                var _a;
                if ((showModal === null || showModal === void 0 ? void 0 : showModal.type) === 'upload') {
                    UsageStatisticsService.recordAnalyticsEvent('AIHighlighter', {
                        type: 'DetectionModalCanceled',
                        openedFrom: showModal.openedFrom,
                        streamId: (_a = showModal.streamInfo) === null || _a === void 0 ? void 0 : _a.id,
                    });
                }
                closeModal();
            }, footer: null, width: 'fit-content', closable: false, visible: !!showModal, destroyOnClose: true, keyboard: false },
            !!v.error && React.createElement(Alert, { message: v.error, type: "error", showIcon: true }),
            (showModal === null || showModal === void 0 ? void 0 : showModal.type) === 'upload' && v.highlighterVersion !== '' && (React.createElement(ImportStreamModal, { close: closeModal, videoPath: showModal.path, selectedGame: showModal.game, streamInfo: showModal.streamInfo, openedFrom: showModal.openedFrom })))));
}
export function groupStreamsByTimePeriod(streams) {
    const now = moment();
    const groups = {
        Today: [],
        Yesterday: [],
        'This week': [],
        'Last week': [],
        'This month': [],
        'Last month': [],
    };
    const monthGroups = {};
    streams.forEach(stream => {
        const streamDate = moment(stream.date);
        if (streamDate.isSame(now, 'day')) {
            groups['Today'].push(stream);
        }
        else if (streamDate.isSame(now.clone().subtract(1, 'day'), 'day')) {
            groups['Yesterday'].push(stream);
        }
        else if (streamDate.isSame(now, 'week')) {
            groups['This week'].push(stream);
        }
        else if (streamDate.isSame(now.clone().subtract(1, 'week'), 'week')) {
            groups['Last week'].push(stream);
        }
        else if (streamDate.isSame(now, 'month')) {
            groups['This month'].push(stream);
        }
        else if (streamDate.isSame(now.clone().subtract(1, 'month'), 'month')) {
            groups['Last month'].push(stream);
        }
        else {
            const monthKey = streamDate.format('MMMM YYYY');
            if (!monthGroups[monthKey]) {
                monthGroups[monthKey] = [];
            }
            monthGroups[monthKey].push(stream);
        }
    });
    return Object.assign(Object.assign({}, groups), monthGroups);
}
//# sourceMappingURL=StreamView.js.map