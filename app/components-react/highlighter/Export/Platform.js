var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Button, Collapse } from 'antd';
import { useVuex } from 'components-react/hooks';
import { useController } from 'components-react/hooks/zustand';
import React, { useEffect, useState } from 'react';
import { $t } from 'services/i18n';
import { ExportModalCtx } from './ExportModal';
import StorageUpload from './StorageUpload';
import YoutubeUpload from './YoutubeUpload';
import { Services } from 'components-react/service-provider';
import styles from './ExportModal.m.less';
import VideoPreview from './VideoPreview';
import { formatSecondsToHMS } from '../ClipPreview';
import { $i } from 'services/utils';
import * as remote from '@electron/remote';
import { EUploadPlatform } from 'services/highlighter/models/highlighter.models';
export default function PlatformSelect({ onClose, videoName, streamId, }) {
    const { store, exportInfo, clearUpload, getStreamTitle, getClips, getDuration } = useController(ExportModalCtx);
    const { UserService, HighlighterService } = Services;
    const { isYoutubeLinked } = useVuex(() => {
        var _a;
        return ({
            isYoutubeLinked: !!((_a = UserService.state.auth) === null || _a === void 0 ? void 0 : _a.platforms.youtube),
        });
    });
    const [platform, setPlatform] = useState(() => (isYoutubeLinked ? 'youtube' : 'crossclip'));
    const clipsAmount = getClips(streamId).length;
    const clipsDuration = formatSecondsToHMS(getDuration(streamId));
    function handlePlatformSelect(val) {
        return __awaiter(this, void 0, void 0, function* () {
            if (platform === 'youtube')
                yield clearUpload();
            setPlatform(val);
        });
    }
    useEffect(() => {
        HighlighterService.clearUpload();
        return () => {
            HighlighterService.clearUpload();
        };
    }, []);
    const items = [
        {
            key: '1',
            label: 'Youtube',
            children: React.createElement(YoutubeUpload, { defaultTitle: videoName, close: onClose, streamId: streamId }),
        },
    ];
    function openInFolder() {
        remote.shell.showItemInFolder(exportInfo.file);
    }
    return (React.createElement("div", { className: styles.modalWrapper },
        React.createElement("div", { style: { display: 'flex', justifyContent: 'space-between' } },
            React.createElement("h2", { style: { fontWeight: 600, margin: 0 } }, $t('Publish to')),
            ' ',
            React.createElement("div", null,
                React.createElement(Button, { type: "text", onClick: onClose },
                    React.createElement("i", { className: "icon-close", style: { margin: 0 } })))),
        React.createElement("div", { style: { display: 'flex', gap: '16px', cursor: 'pointer' }, onClick: openInFolder },
            React.createElement("h2", { className: styles.customInput, style: { width: 'fit-content', whiteSpace: 'nowrap' } }, videoName),
            React.createElement("p", { style: { width: 'fit-content', whiteSpace: 'nowrap' } },
                clipsDuration,
                " | ",
                clipsAmount,
                " clips")),
        React.createElement("div", { className: styles.publishWrapper },
            React.createElement("div", { className: styles.videoWrapper },
                React.createElement(VideoPreview, null)),
            React.createElement("div", { style: {
                    width: '100%',
                    height: '100%',
                    overflowY: 'scroll',
                    paddingRight: '8px',
                } },
                React.createElement(Collapse, { expandIconPosition: "right", defaultActiveKey: ['1'], bordered: false, style: { width: '424px', height: '424px' } }, items.map((item) => (React.createElement(Collapse.Panel, { key: item.key, header: item.label, style: {
                        marginBottom: '12px',
                        borderStyle: 'solid',
                        borderWidth: '1px',
                        borderColor: '#ffffff10',
                        borderRadius: '8px',
                        backgroundColor: '#232d3530',
                    } }, item.children)))))),
        React.createElement("div", { className: styles.bottomRow },
            React.createElement(Button, { style: { height: '100%', borderRadius: '8px' }, onClick: openInFolder }, $t('Open file location')),
            React.createElement(BottomRowButton, { colorRGB: "255, 80, 164", icon: "crossclip.png", description: $t('Manually create vertical version for social media'), buttonText: $t('Edit in Cross Clip'), platform: EUploadPlatform.CROSSCLIP }),
            React.createElement(BottomRowButton, { colorRGB: "255, 81, 81", icon: "video-editor.png", description: $t('Full fletched video editing, collaboration and more'), buttonText: $t('Edit in Video Editor'), platform: EUploadPlatform.VIDEOEDITOR }),
            React.createElement(BottomRowButton, { colorRGB: "94, 229, 124", icon: "podcast-editor.png", description: $t('Subtitles, transcripts, translations and more'), buttonText: $t('Edit in Podcast Editor'), platform: EUploadPlatform.TYPESTUDIO }))));
}
function BottomRowButton({ colorRGB, icon, buttonText, description, platform, }) {
    const { HighlighterService } = Services;
    const { currentUploadInfo, otherUploadInfo } = useVuex(() => ({
        currentUploadInfo: HighlighterService.getUploadInfo(HighlighterService.views.uploadInfo, platform),
        otherUploadInfo: HighlighterService.views.uploadInfo
            .filter(info => info.platform !== platform)
            .some(info => info.uploading),
    }));
    return (React.createElement("div", { className: styles.bottomRowButton, style: {
            '--color-rgb': colorRGB,
            pointerEvents: otherUploadInfo ? 'none' : 'auto',
            opacity: otherUploadInfo ? '0.6' : '1',
        } },
        React.createElement("img", { style: { width: '24px', height: '24px' }, src: $i(`images/products/${icon}`) }),
        !(currentUploadInfo === null || currentUploadInfo === void 0 ? void 0 : currentUploadInfo.uploading) && (React.createElement(React.Fragment, null,
            React.createElement("p", null, description))),
        React.createElement(StorageUpload, { onClose: () => { }, platform: platform })));
}
//# sourceMappingURL=Platform.js.map