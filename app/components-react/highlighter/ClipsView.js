var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useCallback, useEffect, useState } from 'react';
import * as remote from '@electron/remote';
import { Services } from 'components-react/service-provider';
import styles from './ClipsView.m.less';
import { EHighlighterView, } from 'services/highlighter/models/highlighter.models';
import ClipPreview, { formatSecondsToHMS } from 'components-react/highlighter/ClipPreview';
import { ReactSortable } from 'react-sortablejs';
import Scrollable from 'components-react/shared/Scrollable';
import { EditingControls } from './EditingControls';
import { aiFilterClips, getCombinedClipsDuration, sortClipsByOrder, useOptimizedHover, } from './utils';
import ClipsViewModal from './ClipsViewModal';
import { useVuex } from 'components-react/hooks';
import { Button, Tooltip } from 'antd';
import { SUPPORTED_FILE_TYPES } from 'services/highlighter/constants';
import { $t } from 'services/i18n';
import path from 'path';
import HighlightGenerator from './HighlightGenerator';
export default function ClipsView({ props, emitSetView, }) {
    const { HighlighterService, UsageStatisticsService, IncrementalRolloutService } = Services;
    const aiHighlighterFeatureEnabled = HighlighterService.aiHighlighterFeatureEnabled;
    const clipsAmount = useVuex(() => HighlighterService.views.clips.length);
    const [clips, setClips] = useState({ ordered: [], orderedFiltered: [] });
    const game = HighlighterService.getGameByStreamId(props.id);
    const [activeFilter, setActiveFilter] = useState('all');
    const [clipsLoaded, setClipsLoaded] = useState(false);
    const loadClips = useCallback((id) => __awaiter(this, void 0, void 0, function* () {
        yield HighlighterService.actions.return.loadClips(id);
        setClipsLoaded(true);
    }), []);
    const getClips = useCallback(() => {
        return HighlighterService.getClips(HighlighterService.views.clips, props.id);
    }, [props.id]);
    useEffect(() => {
        setClipsLoaded(false);
        setClips(sortAndFilterClips(getClips(), props.id, activeFilter));
        loadClips(props.id);
    }, [props.id, clipsAmount]);
    useEffect(() => {
        setClips(sortAndFilterClips(getClips(), props.id, activeFilter));
    }, [activeFilter]);
    useEffect(() => UsageStatisticsService.actions.recordFeatureUsage('Highlighter'), []);
    const [modal, setModal] = useState(null);
    function setClipOrder(listClips, streamId) {
        const newOrderOfSomeItems = listClips.map(c => c.id);
        const allItemArray = clips.ordered.map(c => c.id);
        const newClipArray = createFinalSortedArray(newOrderOfSomeItems, allItemArray);
        const oldClipArray = clips.ordered.map(c => c.id);
        if (JSON.stringify(newClipArray) === JSON.stringify(oldClipArray)) {
            return;
        }
        else {
            if (streamId) {
                newClipArray.forEach((clipId, index) => {
                    var _a;
                    const existingClip = HighlighterService.views.clipsDictionary[clipId];
                    let updatedStreamInfo;
                    if (existingClip) {
                        updatedStreamInfo = Object.assign(Object.assign({}, existingClip.streamInfo), { [streamId]: Object.assign(Object.assign({}, (_a = existingClip.streamInfo) === null || _a === void 0 ? void 0 : _a[streamId]), { orderPosition: index }) });
                    }
                    HighlighterService.actions.UPDATE_CLIP({
                        path: clipId,
                        streamInfo: updatedStreamInfo,
                    });
                });
            }
            else {
                newClipArray.forEach((clip, index) => {
                    const clipPath = clip;
                    HighlighterService.actions.UPDATE_CLIP({
                        path: clipPath,
                        globalOrderPosition: index,
                    });
                });
            }
            const updatedClips = newClipArray.map(clipId => HighlighterService.views.clipsDictionary[clipId]);
            setClips({
                ordered: newClipArray.map(clipPath => ({ id: clipPath })),
                orderedFiltered: filterClipsBySource(updatedClips, activeFilter).map(clip => ({
                    id: clip.path,
                })),
            });
            return;
        }
    }
    function onDrop(e, streamId) {
        var _a;
        const extensions = SUPPORTED_FILE_TYPES.map(e => `.${e}`);
        const files = [];
        let fi = e.dataTransfer.files.length;
        while (fi--) {
            const file = (_a = e.dataTransfer.files.item(fi)) === null || _a === void 0 ? void 0 : _a.path;
            if (file)
                files.push(file);
        }
        const filtered = files.filter(f => extensions.includes(path.parse(f).ext));
        if (filtered.length) {
            HighlighterService.actions.addClips(filtered.map(path => ({ path })), streamId, 'Manual');
        }
        e.preventDefault();
        e.stopPropagation();
    }
    const containerRef = useOptimizedHover();
    function shareFeedback() {
        remote.shell.openExternal('https://support.streamlabs.com/hc/en-us/requests/new?ticket_form_id=31967205905051');
    }
    function getClipsView(streamId, sortedList, sortedFilteredList) {
        var _a;
        return (React.createElement("div", { ref: containerRef, className: styles.clipsViewRoot, onDrop: event => onDrop(event, streamId) },
            React.createElement("div", { className: styles.container },
                React.createElement("div", { style: { display: 'flex', width: '100%', justifyContent: 'space-between' } },
                    React.createElement("header", { className: styles.header },
                        React.createElement("button", { className: styles.backButton, onClick: () => emitSetView(streamId
                                ? { view: EHighlighterView.STREAM }
                                : { view: EHighlighterView.SETTINGS }) },
                            React.createElement("i", { className: "icon-back" })),
                        React.createElement("h1", { className: styles.title, onClick: () => emitSetView(streamId
                                ? { view: EHighlighterView.STREAM }
                                : { view: EHighlighterView.SETTINGS }) }, (_a = props.streamTitle) !== null && _a !== void 0 ? _a : $t('All highlight clips'))),
                    React.createElement("div", { style: { padding: '20px', display: 'flex', gap: '8px' } },
                        React.createElement(Button, { type: "text", icon: React.createElement("i", { className: "icon-community", style: { marginRight: 8 } }), onClick: shareFeedback }, $t('Share feedback')),
                        React.createElement(PreviewExportButton, { streamId: streamId, setModal: setModal }))),
                sortedList.length === 0 ? (React.createElement("div", { style: { padding: '20px' } },
                    $t('No clips found'),
                    React.createElement("br", null),
                    React.createElement("div", null,
                        React.createElement(AddClip, { streamId: props.id, addedClips: () => {
                                setClips(sortAndFilterClips(getClips(), props.id, activeFilter));
                            } })))) : (React.createElement(React.Fragment, null, clipsLoaded ? (React.createElement(React.Fragment, null,
                    React.createElement("div", { className: styles.clipsControls },
                        React.createElement(AddClip, { streamId: props.id, addedClips: () => {
                                setClips(sortAndFilterClips(getClips(), props.id, activeFilter));
                            } }),
                        streamId &&
                            aiHighlighterFeatureEnabled &&
                            HighlighterService.getClips(HighlighterService.views.clips, props.id)
                                .filter(clip => clip.source === 'AiClip')
                                .every(clip => { var _a; return (_a = clip.aiInfo.metadata) === null || _a === void 0 ? void 0 : _a.round; }) && (React.createElement(HighlightGenerator, { emitSetFilter: filterOptions => {
                                const clips = HighlighterService.getClips(HighlighterService.views.clips, props.id);
                                const filteredClips = aiFilterClips(clips, streamId, filterOptions);
                                const filteredClipPaths = new Set(filteredClips.map(c => c.path));
                                clips.forEach(clip => {
                                    const shouldBeEnabled = filteredClipPaths.has(clip.path);
                                    const isEnabled = clip.enabled;
                                    if (shouldBeEnabled && !isEnabled) {
                                        HighlighterService.enableClip(clip.path, true);
                                    }
                                    else if (!shouldBeEnabled && isEnabled) {
                                        HighlighterService.disableClip(clip.path);
                                    }
                                });
                            }, combinedClipsDuration: getCombinedClipsDuration(getClips()), roundDetails: HighlighterService.getRoundDetails(getClips()), game: game }))),
                    React.createElement(Scrollable, { className: styles.clipsContainer },
                        React.createElement(ReactSortable, { list: sortedFilteredList, setList: clips => setClipOrder(clips, props.id), animation: 200, filter: ".sortable-ignore", onMove: e => {
                                return e.related.className.indexOf('sortable-ignore') === -1;
                            } }, sortedFilteredList.map(({ id }) => {
                            const clip = HighlighterService.views.clipsDictionary[id];
                            return (React.createElement("div", { key: clip.path, "data-clip-id": id, className: styles.clipItem },
                                React.createElement(ClipPreview, { clipId: id, emitShowTrim: () => {
                                        setModal({ modal: 'trim', inspectedPathId: id });
                                    }, emitShowRemove: () => {
                                        setModal({ modal: 'remove', inspectedPathId: id });
                                    }, emitOpenFileInLocation: () => {
                                        remote.shell.showItemInFolder(clip.path);
                                    }, streamId: streamId, game: game })));
                        }))))) : (React.createElement(ClipsLoadingView, { streamId: props.id }))))),
            React.createElement(EditingControls, { emitSetShowModal: (modal) => {
                    setModal({ modal });
                } }),
            React.createElement(ClipsViewModal, { streamId: props.id, modal: modal, onClose: () => setModal(null), deleteClip: (clipIds, streamId) => setClips(sortAndFilterClips(HighlighterService.getClips(HighlighterService.views.clips, props.id).filter(clip => !clipIds.includes(clip.path)), streamId, 'all')) })));
    }
    return getClipsView(props.id, clips.ordered.map(clip => ({ id: clip.id })), clips.orderedFiltered.map(clip => ({ id: clip.id })));
}
function VideoDuration({ streamId }) {
    const { HighlighterService } = Services;
    const clips = useVuex(() => HighlighterService.getClips(HighlighterService.views.clips, streamId));
    const totalDuration = clips
        .filter(clip => clip.enabled)
        .reduce((acc, clip) => acc + clip.duration - clip.startTrim - clip.endTrim, 0);
    return React.createElement("span", null, formatSecondsToHMS(totalDuration));
}
function AddClip({ streamId, addedClips, }) {
    const { HighlighterService } = Services;
    function openClips() {
        return __awaiter(this, void 0, void 0, function* () {
            const selections = yield remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
                properties: ['openFile', 'multiSelections'],
                filters: [{ name: $t('Video Files'), extensions: SUPPORTED_FILE_TYPES }],
            });
            if (selections && selections.filePaths) {
                yield HighlighterService.actions.return.addClips(selections.filePaths.map(path => ({ path })), streamId, 'Manual');
                yield HighlighterService.actions.return.loadClips(streamId);
                addedClips();
            }
        });
    }
    return (React.createElement(Button, { size: "middle", onClick: () => openClips(), style: { display: 'flex', gap: '8px', alignItems: 'center' } },
        React.createElement("i", { className: "icon-add-circle  " }),
        $t('Add Clip')));
}
function ClipsLoadingView({ streamId }) {
    const { HighlighterService } = Services;
    const clips = useVuex(() => HighlighterService.getClips(HighlighterService.views.clips, streamId));
    return (React.createElement("div", { className: styles.clipLoadingIndicator },
        React.createElement("h2", null, $t('Loading')),
        React.createElement("p", null,
            clips.filter(clip => clip.loaded).length,
            "/",
            clips.length,
            " Clips")));
}
export function clipsToStringArray(clips) {
    return clips.map(c => ({ id: c.path }));
}
export function createFinalSortedArray(newOrderOfSomeItems, allItemArray) {
    const finalArray = new Array(allItemArray.length).fill(null);
    const itemsNotInNewOrder = allItemArray.filter(item => !newOrderOfSomeItems.includes(item));
    itemsNotInNewOrder.forEach(item => {
        const index = allItemArray.indexOf(item);
        finalArray[index] = item;
    });
    let newOrderIndex = 0;
    for (let i = 0; i < finalArray.length; i++) {
        if (finalArray[i] === null) {
            finalArray[i] = newOrderOfSomeItems[newOrderIndex];
            newOrderIndex++;
        }
    }
    return finalArray.filter((item) => item !== null);
}
export function filterClipsBySource(clips, filter) {
    return clips.filter(clip => {
        switch (filter) {
            case 'ai':
                return clip.source === 'AiClip';
            case 'manual':
                return clip.source === 'Manual' || clip.source === 'ReplayBuffer';
            case 'all':
            default:
                return true;
        }
    });
}
export function sortAndFilterClips(clips, streamId, filter) {
    const orderedClips = sortClipsByOrder(clips, streamId);
    const filteredClips = filterClipsBySource(orderedClips, filter);
    const ordered = orderedClips.map(clip => ({ id: clip.path }));
    const orderedFiltered = filteredClips.map(clip => ({
        id: clip.path,
    }));
    return { ordered, orderedFiltered };
}
function PreviewExportButton({ streamId, setModal, }) {
    var _a;
    const { HighlighterService } = Services;
    const clips = useVuex(() => HighlighterService.getClips(HighlighterService.views.clips, streamId));
    const stream = useVuex(() => streamId ? HighlighterService.views.highlightedStreamsDictionary[streamId] : null);
    const hasClipsToExport = clips.some(clip => clip.enabled);
    const hasHighlights = (_a = (stream && stream.highlights && stream.highlights.length > 0)) !== null && _a !== void 0 ? _a : false;
    return (React.createElement(React.Fragment, null,
        hasHighlights && (React.createElement(Tooltip, { title: $t('Export detectected timecodes as markers for editing software'), placement: "bottom" },
            React.createElement(Button, { disabled: !hasHighlights, onClick: () => setModal({ modal: 'exportMarkers' }) }, $t('Export Markers')))),
        React.createElement(Tooltip, { title: !hasClipsToExport ? $t('Select at least one clip to preview your video') : null, placement: "bottom" },
            React.createElement(Button, { disabled: !hasClipsToExport, onClick: () => setModal({ modal: 'preview' }) }, $t('Preview'))),
        React.createElement(Tooltip, { title: !hasClipsToExport ? $t('Select at least one clip to export your video') : null, placement: "bottom" },
            React.createElement(Button, { disabled: !hasClipsToExport, type: "primary", onClick: () => setModal({ modal: 'export' }) }, $t('Export')))));
}
//# sourceMappingURL=ClipsView.js.map