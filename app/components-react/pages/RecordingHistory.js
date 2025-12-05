var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useEffect, useMemo } from 'react';
import cx from 'classnames';
import * as remote from '@electron/remote';
import { Tooltip } from 'antd';
import { $t } from 'services/i18n';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import styles from './RecordingHistory.m.less';
import AutoProgressBar from 'components-react/shared/AutoProgressBar';
import { GetSLID } from 'components-react/highlighter/Export/StorageUpload';
import { ENotificationType } from 'services/notifications';
import Scrollable from 'components-react/shared/Scrollable';
import { Services } from '../service-provider';
import { initStore, useController } from '../hooks/zustand';
import { useVuex } from '../hooks';
import Translate from 'components-react/shared/Translate';
import uuid from 'uuid/v4';
import { EMenuItemKey } from 'services/side-nav';
import { $i } from 'services/utils';
import { EAiDetectionState, EGame } from 'services/highlighter/models/ai-highlighter.models';
import { EHighlighterView, } from 'services/highlighter/models/highlighter.models';
const RecordingHistoryCtx = React.createContext(null);
class RecordingHistoryController {
    constructor() {
        this.RecordingModeService = Services.RecordingModeService;
        this.UserService = Services.UserService;
        this.SharedStorageService = Services.SharedStorageService;
        this.NotificationsService = Services.NotificationsService;
        this.HighlighterService = Services.HighlighterService;
        this.NavigationService = Services.NavigationService;
        this.IncrementalRolloutService = Services.IncrementalRolloutService;
        this.store = initStore({
            showSLIDModal: false,
            showEditModal: false,
            fileEdited: null,
        });
    }
    get recordings() {
        return this.RecordingModeService.views.sortedRecordings;
    }
    get hasYoutube() {
        return this.UserService.views.linkedPlatforms.includes('youtube');
    }
    get hasSLID() {
        var _a, _b;
        return !!((_b = (_a = this.UserService.views.auth) === null || _a === void 0 ? void 0 : _a.slid) === null || _b === void 0 ? void 0 : _b.id);
    }
    get uploadInfo() {
        return this.RecordingModeService.state.uploadInfo;
    }
    get aiDetectionInProgress() {
        return this.HighlighterService.views.highlightedStreams.some(stream => stream.state.type === EAiDetectionState.IN_PROGRESS);
    }
    get highlighterVersion() {
        return this.HighlighterService.views.highlighterVersion;
    }
    get uploadOptions() {
        const opts = [
            {
                label: `${$t('Get highlights')}`,
                value: 'highlighter',
                icon: 'icon-highlighter',
            },
            {
                label: $t('Edit'),
                value: 'edit',
                icon: 'icon-trim',
            },
            {
                label: '',
                value: 'remove',
                icon: 'icon-trash',
            },
        ];
        if (this.hasYoutube) {
            opts.unshift({
                label: $t('Upload'),
                value: 'youtube',
                icon: 'icon-youtube',
            });
        }
        return opts;
    }
    get editOptions() {
        return [
            {
                value: 'videoeditor',
                label: 'Video Editor',
                description: $t('Edit video professionally from your browser with Video Editor'),
                src: 'video-editor.png',
            },
            {
                value: 'crossclip',
                label: 'Cross Clip',
                description: $t('Turn your videos into mobile-friendly short-form TikToks, Reels, and Shorts with Cross Clip'),
                src: 'crossclip.png',
            },
            {
                value: 'typestudio',
                label: 'Podcast Edtior',
                description: $t('Polish your videos with text-based and AI powered Podcast Editor'),
                src: 'podcast-editor.png',
            },
        ];
    }
    postError(message) {
        this.NotificationsService.actions.push({
            message,
            type: ENotificationType.WARNING,
            lifeTime: 5000,
        });
    }
    handleSelect(recording, platform) {
        if (this.uploadInfo.uploading) {
            this.postError($t('Upload already in progress'));
            return;
        }
        if (platform === 'highlighter') {
            if (this.aiDetectionInProgress)
                return;
            const tempRecordingInfo = {
                recordingPath: recording.filename,
                streamInfo: { id: 'rec_' + uuid(), game: EGame.UNSET },
                source: 'recordings-tab',
            };
            this.HighlighterService.setTempRecordingInfo(tempRecordingInfo);
            this.NavigationService.actions.navigate('Highlighter', {
                view: EHighlighterView.STREAM,
            }, EMenuItemKey.Highlighter);
            return;
        }
        if (platform === 'youtube')
            return this.uploadToYoutube(recording.filename);
        if (platform === 'remove')
            return this.removeEntry(recording.timestamp);
        if (this.hasSLID) {
            this.store.setState(s => {
                s.showEditModal = true;
                s.fileEdited = recording;
            });
        }
        else {
            this.store.setState(s => {
                s.showSLIDModal = true;
            });
        }
    }
    formattedTimestamp(timestamp) {
        return this.RecordingModeService.views.formattedTimestamp(timestamp);
    }
    uploadToYoutube(filename) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = yield this.RecordingModeService.actions.return.uploadToYoutube(filename);
            if (!id)
                return;
            remote.shell.openExternal(`https://youtube.com/watch?v=${id}`);
        });
    }
    uploadToStorage(filename, platform) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = yield this.RecordingModeService.actions.return.uploadToStorage(filename, platform);
            if (!id)
                return;
            remote.shell.openExternal(this.SharedStorageService.views.getPlatformLink(platform, id));
        });
    }
    removeEntry(timestamp) {
        this.RecordingModeService.actions.removeRecordingEntry(timestamp);
    }
    showFile(filename) {
        remote.shell.showItemInFolder(filename);
    }
    cancelUpload() {
        this.RecordingModeService.actions.cancelUpload();
    }
}
export default function RecordingHistoryPage(p) {
    const controller = useMemo(() => new RecordingHistoryController(), []);
    return (React.createElement(RecordingHistoryCtx.Provider, { value: controller },
        React.createElement(RecordingHistory, { className: p.className })));
}
export function RecordingHistory(p) {
    const controller = useController(RecordingHistoryCtx);
    const { formattedTimestamp, showFile, handleSelect, postError } = controller;
    const aiHighlighterFeatureEnabled = Services.HighlighterService.aiHighlighterFeatureEnabled;
    const { uploadInfo, uploadOptions, recordings, hasSLID, aiDetectionInProgress, highlighterVersion, } = useVuex(() => ({
        recordings: controller.recordings,
        aiDetectionInProgress: controller.aiDetectionInProgress,
        uploadOptions: controller.uploadOptions,
        uploadInfo: controller.uploadInfo,
        hasSLID: controller.hasSLID,
        highlighterVersion: controller.highlighterVersion,
    }));
    useEffect(() => {
        let isMounted = true;
        if (uploadInfo.error &&
            typeof uploadInfo.error === 'string' &&
            !/TypeError/.test(uploadInfo.error)) {
            if (isMounted) {
                postError(uploadInfo.error);
            }
        }
        return () => {
            isMounted = false;
        };
    }, [uploadInfo.error]);
    function openMarkersSettings() {
        Services.SettingsService.actions.showSettings('Hotkeys');
    }
    function UploadActions(p) {
        return (React.createElement("span", { className: styles.actionGroup }, uploadOptions
            .map(option => {
            if (option.value === 'highlighter' &&
                (!aiHighlighterFeatureEnabled || highlighterVersion === '')) {
                return null;
            }
            return (React.createElement("span", { className: styles.action, key: option.value, style: {
                    color: `var(--${option.value === 'edit' ? 'teal' : 'title'})`,
                    opacity: option.value === 'highlighter' && aiDetectionInProgress ? 0.3 : 1,
                    cursor: option.value === 'highlighter' && aiDetectionInProgress
                        ? 'not-allowed'
                        : 'pointer',
                }, onClick: () => handleSelect(p.recording, option.value) },
                React.createElement("i", { className: option.icon }),
                "\u00A0",
                React.createElement("span", null, option.label)));
        })
            .filter(Boolean)));
    }
    return (React.createElement("div", { className: cx(styles.container, p.className) },
        React.createElement("h1", null, $t('Recordings')),
        React.createElement("div", { style: { marginBottom: 24, display: 'flex', flexDirection: 'column' } },
            $t('Record your screen with Streamlabs Desktop. Once recording is complete, it will be displayed here. Access your files or edit further with Streamlabs tools.'),
            React.createElement(Translate, { message: "<color>Pro tip:</color> set Markers in Hotkeys settings to timestamp your recordings. <link>Set up here</link>" },
                React.createElement("span", { slot: "color", className: styles.tipHighlight }),
                React.createElement("a", { slot: "link", onClick: openMarkersSettings, className: styles.tipLink }))),
        React.createElement("div", { className: styles.recordingsContainer, id: "recordingHistory" },
            React.createElement(Scrollable, { style: { height: '100%' } }, recordings.map(recording => (React.createElement("div", { className: styles.recording, key: recording.timestamp },
                React.createElement("span", { style: { marginRight: '8px' } }, formattedTimestamp(recording.timestamp)),
                React.createElement(Tooltip, { title: $t('Show in folder') },
                    React.createElement("span", { "data-test": "filename", onClick: () => showFile(recording.filename), className: styles.filename }, recording.filename)),
                uploadOptions.length > 0 && React.createElement(UploadActions, { recording: recording })))))),
        React.createElement(ExportModal, null),
        React.createElement(EditModal, null),
        !hasSLID && React.createElement(SLIDModal, null)));
}
function EditModal() {
    const { store, editOptions, uploadToStorage } = useController(RecordingHistoryCtx);
    const showEditModal = store.useState(s => s.showEditModal);
    const recording = store.useState(s => s.fileEdited);
    function close() {
        store.setState(s => {
            s.showEditModal = false;
            s.fileEdited = null;
        });
    }
    function editFile(platform) {
        if (!recording)
            throw new Error('File not found');
        uploadToStorage(recording.filename, platform);
        close();
    }
    if (!showEditModal)
        return React.createElement(React.Fragment, null);
    return (React.createElement("div", { className: styles.modalBackdrop },
        React.createElement(ModalLayout, { hideFooter: true, wrapperStyle: {
                width: '750px',
                height: '320px',
            }, bodyStyle: {
                width: '100%',
                background: 'var(--section)',
                position: 'relative',
            } },
            React.createElement(React.Fragment, null,
                React.createElement("h2", null, $t('Choose how to edit your recording')),
                React.createElement("i", { className: cx('icon-close', styles.closeIcon), onClick: close }),
                React.createElement("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-around' } }, editOptions.map(editOpt => (React.createElement("div", { className: styles.editCell, key: editOpt.value, onClick: () => editFile(editOpt.value) },
                    React.createElement("img", { src: $i(`images/products/${editOpt.src}`) }),
                    React.createElement("span", { className: styles.editTitle }, editOpt.label),
                    React.createElement("span", null, editOpt.description)))))))));
}
function SLIDModal() {
    const { store } = useController(RecordingHistoryCtx);
    const showSLIDModal = store.useState(s => s.showSLIDModal);
    if (!showSLIDModal)
        return React.createElement(React.Fragment, null);
    function loginSuccess() {
        store.setState({ showSLIDModal: false });
    }
    return (React.createElement("div", { className: styles.modalBackdrop },
        React.createElement(ModalLayout, { hideFooter: true, wrapperStyle: {
                width: '450px',
                height: '300px',
            }, bodyStyle: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
            } },
            React.createElement(GetSLID, { onLogin: loginSuccess }))));
}
function ExportModal() {
    const { uploadInfo, cancelUpload } = useController(RecordingHistoryCtx);
    const { uploadedBytes, totalBytes } = uploadInfo;
    if (!uploadedBytes || !totalBytes)
        return React.createElement(React.Fragment, null);
    return (React.createElement("div", { className: styles.modalBackdrop },
        React.createElement(ModalLayout, { hideFooter: true, wrapperStyle: {
                width: '300px',
                height: '100px',
            }, bodyStyle: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
            } },
            React.createElement(AutoProgressBar, { percent: uploadedBytes / totalBytes, timeTarget: 1000 * 60 }),
            React.createElement("button", { className: "button button--default", onClick: cancelUpload }, $t('Cancel')))));
}
//# sourceMappingURL=RecordingHistory.js.map