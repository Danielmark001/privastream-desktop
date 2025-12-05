var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useState, useEffect, useMemo } from 'react';
import { Services } from 'components-react/service-provider';
import { FileInput } from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
import path from 'path';
import { Button, Progress, Alert, Dropdown } from 'antd';
import { RadioInput } from 'components-react/shared/inputs/RadioInput';
import { confirmAsync } from 'components-react/modals';
import { $t } from 'services/i18n';
import { initStore, useController } from '../../hooks/zustand';
import { EOrientation } from 'services/highlighter/models/ai-highlighter.models';
import { fileExists } from 'services/highlighter/file-utils';
import { SCRUB_WIDTH } from 'services/highlighter/constants';
import styles from './ExportModal.m.less';
import { getCombinedClipsDuration } from '../utils';
import { formatSecondsToHMS } from '../ClipPreview';
import PlatformSelect from './Platform';
import cx from 'classnames';
import { getVideoResolution } from 'services/highlighter/cut-highlight-clips';
const settings = [
    { name: 'Standard', fps: 30, resolution: 1080, preset: 'medium' },
    { name: 'Best', fps: 60, resolution: 1080, preset: 'slow' },
    { name: 'Fast', fps: 30, resolution: 720, preset: 'fast' },
    { name: 'Custom', fps: 30, resolution: 720, preset: 'medium' },
];
class ExportController {
    constructor() {
        this.store = initStore({ videoName: 'My Video' });
    }
    get service() {
        return Services.HighlighterService;
    }
    get exportInfo() {
        return this.service.views.exportInfo;
    }
    getStreamTitle(streamId) {
        var _a;
        return (((_a = this.service.views.highlightedStreams.find(stream => stream.id === streamId)) === null || _a === void 0 ? void 0 : _a.title) ||
            'My Video');
    }
    getClips(streamId) {
        return this.service.getClips(this.service.views.clips, streamId).filter(clip => clip.enabled);
    }
    getDuration(streamId) {
        return getCombinedClipsDuration(this.getClips(streamId));
    }
    getClipResolution(streamId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const firstClipPath = (_a = this.getClips(streamId).find(clip => clip.enabled)) === null || _a === void 0 ? void 0 : _a.path;
            if (!firstClipPath) {
                return undefined;
            }
            return yield getVideoResolution(firstClipPath);
        });
    }
    dismissError() {
        return this.service.actions.dismissError();
    }
    resetExportedState() {
        return this.service.actions.resetExportedState();
    }
    setResolution(value) {
        this.service.actions.setResolution(parseInt(value, 10));
    }
    setFps(value) {
        this.service.actions.setFps(parseInt(value, 10));
    }
    setPreset(value) {
        this.service.actions.setPreset(value);
    }
    setExport(exportFile) {
        this.service.actions.setExportFile(exportFile);
    }
    exportCurrentFile(streamId, orientation = EOrientation.HORIZONTAL) {
        this.service.actions.export(false, streamId, orientation);
    }
    cancelExport() {
        this.service.actions.cancelExport();
    }
    clearUpload() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.service.actions.return.clearUpload();
        });
    }
    fileExists(exportFile) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield fileExists(exportFile);
        });
    }
}
export const ExportModalCtx = React.createContext(null);
export default function ExportModalProvider({ close, streamId, }) {
    const controller = useMemo(() => new ExportController(), []);
    return (React.createElement(ExportModalCtx.Provider, { value: controller },
        React.createElement(ExportModal, { close: close, streamId: streamId })));
}
function ExportModal({ close, streamId }) {
    const { exportInfo, dismissError, resetExportedState, getStreamTitle } = useController(ExportModalCtx);
    const [videoName, setVideoName] = useState(getStreamTitle(streamId) + ' - highlights');
    const unmount = () => {
        dismissError();
        resetExportedState();
    };
    useEffect(() => unmount, []);
    if (!exportInfo.exported || exportInfo.exporting || exportInfo.error) {
        return (React.createElement(ExportFlow, { isExporting: exportInfo.exporting, close: close, streamId: streamId, videoName: videoName, onVideoNameChange: setVideoName }));
    }
    return React.createElement(PlatformSelect, { onClose: close, videoName: videoName, streamId: streamId });
}
function ExportFlow({ close, isExporting, streamId, videoName, onVideoNameChange, }) {
    const { UsageStatisticsService, HighlighterService } = Services;
    const { exportInfo, cancelExport, dismissError, setResolution, setFps, setPreset, fileExists, setExport, exportCurrentFile, getStreamTitle, getClips, getDuration, getClipResolution, } = useController(ExportModalCtx);
    const [currentFormat, setCurrentFormat] = useState(EOrientation.HORIZONTAL);
    const { amount, duration, thumbnail } = useMemo(() => {
        var _a;
        const clips = getClips(streamId);
        return {
            amount: clips.length,
            duration: formatSecondsToHMS(getCombinedClipsDuration(clips)),
            thumbnail: (_a = clips.find(clip => clip.enabled)) === null || _a === void 0 ? void 0 : _a.scrubSprite,
        };
    }, [streamId]);
    function settingMatcher(initialSetting) {
        const matchingSetting = settings.find(setting => setting.fps === initialSetting.fps &&
            setting.resolution === initialSetting.resolution &&
            setting.preset === initialSetting.preset);
        if (matchingSetting) {
            return matchingSetting;
        }
        return {
            name: 'Custom',
            fps: initialSetting.fps,
            resolution: initialSetting.resolution,
            preset: initialSetting.preset,
        };
    }
    const [currentSetting, setSetting] = useState(null);
    const [isLoadingResolution, setIsLoadingResolution] = useState(true);
    function initializeSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const resolution = yield getClipResolution(streamId);
                let setting;
                if ((resolution === null || resolution === void 0 ? void 0 : resolution.height) === 720 && exportInfo.resolution !== 720) {
                    setting = settings.find(s => s.resolution === 720) || settings[settings.length - 1];
                }
                else if ((resolution === null || resolution === void 0 ? void 0 : resolution.height) === 1080 && exportInfo.resolution !== 1080) {
                    setting = settings.find(s => s.resolution === 1080) || settings[settings.length - 1];
                }
                else {
                    setting = settingMatcher({
                        name: 'from default',
                        fps: exportInfo.fps,
                        resolution: exportInfo.resolution,
                        preset: exportInfo.preset,
                    });
                }
                setSetting(setting);
                setFps(setting.fps.toString());
                setResolution(setting.resolution.toString());
                setPreset(setting.preset);
            }
            catch (error) {
                console.error('Failed to detect clip resolution, setting default. Error: ', error);
                setSetting(settingMatcher({
                    name: 'from default',
                    fps: exportInfo.fps,
                    resolution: exportInfo.resolution,
                    preset: exportInfo.preset,
                }));
            }
            finally {
                setIsLoadingResolution(false);
            }
        });
    }
    useEffect(() => {
        setIsLoadingResolution(true);
        initializeSettings();
    }, [streamId]);
    const [exportFile, setExportFile] = useState(getExportFileFromVideoName(videoName));
    function getExportFileFromVideoName(videoName) {
        const parsed = path.parse(exportInfo.file);
        const sanitized = videoName.replace(/[/\\?%*:|"<>\.,;=#]/g, '');
        return path.join(parsed.dir, `${sanitized}${parsed.ext}`);
    }
    function getVideoNameFromExportFile(exportFile) {
        return path.parse(exportFile).name;
    }
    function startExport(orientation) {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield fileExists(exportFile)) {
                if (!(yield confirmAsync({
                    title: $t('Overwite File?'),
                    content: $t('%{filename} already exists. Would you like to overwrite it?', {
                        filename: path.basename(exportFile),
                    }),
                    okText: $t('Overwrite'),
                }))) {
                    return;
                }
            }
            UsageStatisticsService.actions.recordFeatureUsage('HighlighterExport');
            setExport(exportFile);
            exportCurrentFile(streamId, orientation);
            const streamInfo = HighlighterService.views.highlightedStreams.find(stream => stream.id === streamId);
            if (streamInfo && !streamInfo.feedbackLeft) {
                streamInfo.feedbackLeft = true;
                HighlighterService.updateStream(streamInfo);
                const clips = getClips(streamId);
                UsageStatisticsService.recordAnalyticsEvent('AIHighlighter', {
                    type: 'ThumbsUp',
                    streamId: streamInfo === null || streamInfo === void 0 ? void 0 : streamInfo.id,
                    game: streamInfo === null || streamInfo === void 0 ? void 0 : streamInfo.game,
                    clips: clips === null || clips === void 0 ? void 0 : clips.length,
                });
            }
        });
    }
    return (React.createElement(Form, null,
        React.createElement("div", { className: styles.exportWrapper },
            React.createElement("div", { style: { display: 'flex', justifyContent: 'space-between' } },
                React.createElement("h2", { style: { fontWeight: 600, margin: 0 } }, $t('Export')),
                ' ',
                React.createElement("div", null,
                    React.createElement(Button, { type: "text", onClick: close },
                        React.createElement("i", { className: "icon-close", style: { margin: 0 } })))),
            React.createElement("div", { style: { display: 'flex', gap: '16px' } },
                React.createElement("div", { className: styles.settingsAndProgress },
                    React.createElement("div", { className: cx(styles.pathWrapper, isExporting && styles.isDisabled) },
                        React.createElement("h2", { style: { margin: '0px' } },
                            React.createElement("input", { id: "videoName", type: "text", className: styles.customInput, value: videoName, onChange: e => {
                                    const name = e.target.value;
                                    onVideoNameChange(name);
                                    setExportFile(getExportFileFromVideoName(name));
                                } })),
                        React.createElement(FileInput, { label: $t('Export Location'), name: "exportLocation", save: true, filters: [{ name: $t('MP4 Video File'), extensions: ['mp4'] }], value: exportFile, onChange: file => {
                                setExportFile(file);
                                onVideoNameChange(getVideoNameFromExportFile(file));
                            }, buttonContent: React.createElement("i", { className: "icon-edit" }) })),
                    React.createElement("div", { className: cx(styles.thumbnail, isExporting && styles.thumbnailInProgress), style: currentFormat === EOrientation.HORIZONTAL
                            ? { aspectRatio: '16/9' }
                            : { aspectRatio: '9/16' } },
                        isExporting && (React.createElement("div", { className: styles.progressItem },
                            React.createElement("h1", null,
                                Math.round((exportInfo.currentFrame / exportInfo.totalFrames) * 100) || 0,
                                "%"),
                            React.createElement("p", null, exportInfo.cancelRequested ? (React.createElement("span", null, $t('Canceling...'))) : (React.createElement("span", null, $t('Exporting video...')))),
                            React.createElement(Progress, { style: { width: '100%' }, percent: Math.round((exportInfo.currentFrame / exportInfo.totalFrames) * 100), trailColor: "var(--section)", status: exportInfo.cancelRequested ? 'exception' : 'normal', showInfo: false }))),
                        React.createElement("img", { src: thumbnail, style: currentFormat === EOrientation.HORIZONTAL
                                ? { objectPosition: 'left' }
                                : { objectPosition: `-${(SCRUB_WIDTH * 1.32) / 3 + 4}px` } })),
                    React.createElement("div", { className: styles.clipInfoWrapper },
                        React.createElement("div", { className: cx(isExporting && styles.isDisabled), style: {
                                display: 'flex',
                                justifyContent: 'space-between',
                            } },
                            React.createElement("p", { style: {
                                    margin: 0,
                                    marginLeft: '8px',
                                } },
                                duration,
                                " | ",
                                $t('%{clipsAmount} clips', { clipsAmount: amount }))),
                        React.createElement(OrientationToggle, { initialState: currentFormat, disabled: isExporting, emitState: format => setCurrentFormat(format) })),
                    React.createElement("div", { style: {
                            display: 'flex',
                            justifyContent: 'space-between',
                        } }, isLoadingResolution ? (React.createElement("div", { className: styles.innerDropdownWrapper },
                        React.createElement("div", { className: styles.dropdownText }, "Loading settings..."),
                        React.createElement("i", { className: "icon-down" }))) : (React.createElement(CustomDropdownWrapper, { initialSetting: currentSetting, disabled: isExporting || isLoadingResolution, emitSettings: setting => {
                            setSetting(setting);
                            if (setting.name !== 'Custom') {
                                setFps(setting.fps.toString());
                                setResolution(setting.resolution.toString());
                                setPreset(setting.preset);
                            }
                        } }))),
                    (currentSetting === null || currentSetting === void 0 ? void 0 : currentSetting.name) === 'Custom' && (React.createElement("div", { className: `${styles.customSection} ${isExporting ? styles.isDisabled : ''}` },
                        React.createElement("div", { className: styles.customItemWrapper },
                            React.createElement("p", null, $t('Resolution')),
                            React.createElement(RadioInput, { label: $t('Resolution'), value: exportInfo.resolution.toString(), options: [
                                    { value: '720', label: '720p' },
                                    { value: '1080', label: '1080p' },
                                ], onChange: setResolution, buttons: true })),
                        React.createElement("div", { className: styles.customItemWrapper },
                            React.createElement("p", null, $t('Frame Rate')),
                            React.createElement(RadioInput, { label: $t('Frame Rate'), value: exportInfo.fps.toString(), options: [
                                    { value: '30', label: '30 FPS' },
                                    { value: '60', label: '60 FPS' },
                                ], onChange: setFps, buttons: true })),
                        React.createElement("div", { className: styles.customItemWrapper },
                            React.createElement("p", null, $t('File Size')),
                            React.createElement(RadioInput, { label: $t('File Size'), value: exportInfo.preset, options: [
                                    { value: 'fast', label: $t('Faster Export') },
                                    { value: 'medium', label: $t('Balanced') },
                                    { value: 'slow', label: $t('Smaller File') },
                                ], onChange: setPreset, buttons: true })))),
                    exportInfo.error && (React.createElement(Alert, { message: exportInfo.error, type: "error", closable: true, showIcon: true, afterClose: dismissError })),
                    React.createElement("div", { style: { textAlign: 'right' } }, isExporting ? (React.createElement("button", { className: "button button--soft-warning", onClick: cancelExport, style: { width: '100%' }, disabled: exportInfo.cancelRequested }, $t('Cancel'))) : (React.createElement(Button, { type: "primary", style: { width: '100%' }, onClick: () => startExport(currentFormat) }, currentFormat === EOrientation.HORIZONTAL
                        ? $t('Export Horizontal')
                        : $t('Export Vertical'))))),
                ' '))));
}
function CustomDropdownWrapper({ initialSetting, disabled, emitSettings, }) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentSetting, setSetting] = useState(initialSetting);
    return (React.createElement("div", { style: { width: '100%' }, className: `${disabled ? styles.isDisabled : ''}` },
        React.createElement(Dropdown, { overlay: React.createElement("div", { className: styles.innerItemWrapper }, settings.map(setting => {
                return (React.createElement("div", { className: `${styles.innerDropdownItem} ${setting.name === currentSetting.name ? styles.active : ''}`, onClick: () => {
                        setSetting(setting);
                        emitSettings(setting);
                        setIsOpen(false);
                    }, key: setting.name },
                    React.createElement("div", { className: styles.dropdownText },
                        setting.name,
                        ' ',
                        setting.name !== 'Custom' && (React.createElement(React.Fragment, null,
                            React.createElement("p", null,
                                setting.fps,
                                "fps"),
                            " ",
                            React.createElement("p", null,
                                setting.resolution,
                                "p"))))));
            })), trigger: ['click'], visible: isOpen, onVisibleChange: setIsOpen, placement: "bottomLeft" },
            React.createElement("div", { className: styles.innerDropdownWrapper, onClick: () => setIsOpen(!isOpen) },
                React.createElement("div", { className: styles.dropdownText },
                    currentSetting.name,
                    ' ',
                    currentSetting.name !== 'Custom' && (React.createElement(React.Fragment, null,
                        React.createElement("p", null,
                            currentSetting.fps,
                            "fps"),
                        " ",
                        React.createElement("p", null,
                            currentSetting.resolution,
                            "p")))),
                React.createElement("i", { className: "icon-down" })))));
}
function OrientationToggle({ initialState, disabled, emitState, }) {
    const [currentFormat, setCurrentFormat] = useState(initialState);
    function setFormat(format) {
        setCurrentFormat(format);
        emitState(format);
    }
    return (React.createElement("div", { className: `${styles.orientationToggle} ${disabled ? styles.isDisabled : ''}` },
        React.createElement("div", { className: `${styles.orientationButton} ${currentFormat === EOrientation.VERTICAL ? styles.active : ''}`, onClick: () => setFormat(EOrientation.VERTICAL) },
            React.createElement("div", { className: styles.verticalIcon })),
        React.createElement("div", { className: `${styles.orientationButton} ${currentFormat === EOrientation.HORIZONTAL ? styles.active : ''}`, onClick: () => setFormat(EOrientation.HORIZONTAL) },
            React.createElement("div", { className: styles.horizontalIcon }))));
}
//# sourceMappingURL=ExportModal.js.map