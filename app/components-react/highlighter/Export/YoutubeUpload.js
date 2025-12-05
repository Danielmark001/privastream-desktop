import React, { useState, useEffect } from 'react';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { TextInput, TextAreaInput } from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
import { Button, Tooltip, Alert, Dropdown } from 'antd';
import electron from 'electron';
import { $t } from 'services/i18n';
import * as remote from '@electron/remote';
import UploadProgress from './UploadProgress';
import styles from './ExportModal.m.less';
import { EUploadPlatform } from 'services/highlighter/models/highlighter.models';
export default function YoutubeUpload(props) {
    var _a, _b, _c, _d;
    const [title, setTitle] = useState(props.defaultTitle);
    const streamId = props.streamId;
    const [description, setDescription] = useState('');
    const [privacy, setPrivacy] = useState('private');
    const [isOpen, setIsOpen] = useState(false);
    const [urlCopied, setUrlCopied] = useState(false);
    const { UserService, HighlighterService, NavigationService, UsageStatisticsService } = Services;
    const v = useVuex(() => {
        var _a;
        return ({
            youtubeLinked: !!((_a = UserService.state.auth) === null || _a === void 0 ? void 0 : _a.platforms.youtube),
            youTubeUploadInfo: HighlighterService.getUploadInfo(HighlighterService.views.uploadInfo, EUploadPlatform.YOUTUBE),
            exportInfo: HighlighterService.views.exportInfo,
            otherUploadInProgress: HighlighterService.views.uploadInfo
                .filter(info => info.platform !== EUploadPlatform.YOUTUBE)
                .some(info => info.uploading),
        });
    });
    useEffect(() => {
        return () => HighlighterService.actions.dismissError();
    }, []);
    const options = [
        {
            label: $t('Private'),
            value: 'private',
            description: $t('Only you and people you choose can watch your video'),
        },
        {
            label: $t('Unlisted'),
            value: 'unlisted',
            description: $t('Anyone with the video link can watch your video'),
        },
        {
            label: $t('Public'),
            value: 'public',
            description: $t('Everyone can watch your video'),
        },
    ];
    function getYoutubeForm() {
        var _a, _b;
        return (React.createElement("div", null,
            React.createElement("div", { style: {
                    display: 'flex',
                    flexDirection: 'row',
                } },
                v.youtubeLinked && (React.createElement("div", { style: { flexGrow: 1 } },
                    React.createElement(Form, { layout: "vertical" },
                        React.createElement(TextInput, { label: $t('Title'), value: title, onChange: setTitle }),
                        React.createElement(TextAreaInput, { label: $t('Description'), value: description, onChange: setDescription }),
                        React.createElement("div", { style: { marginBottom: '8px' } },
                            " ",
                            $t('Privacy Status')),
                        React.createElement(Dropdown, { overlay: React.createElement("div", { className: styles.innerItemWrapper }, options.map(option => {
                                return (React.createElement("div", { className: `${styles.innerDropdownItem} ${option.value === privacy ? styles.active : ''}`, onClick: () => {
                                        setPrivacy(option.value);
                                        setIsOpen(false);
                                    }, key: option.label },
                                    React.createElement("div", { className: styles.dropdownText },
                                        option.label,
                                        " ",
                                        React.createElement("p", null, option.description))));
                            })), trigger: ['click'], visible: isOpen, onVisibleChange: setIsOpen, placement: "bottomLeft" },
                            React.createElement("div", { className: styles.innerDropdownWrapper, onClick: () => setIsOpen(!isOpen) },
                                React.createElement("div", { className: styles.dropdownText }, (_a = options.find(option => option.value === privacy)) === null || _a === void 0 ? void 0 : _a.label),
                                React.createElement("i", { className: "icon-down" })))))),
                !v.youtubeLinked && (React.createElement("div", { style: { flexGrow: 1 } },
                    React.createElement("div", null, $t('Please connect your YouTube account to upload your video to YouTube.')),
                    React.createElement("button", { style: { marginTop: 8 }, className: "button button--youtube", onClick: () => NavigationService.actions.navigate('PlatformMerge', {
                            platform: 'youtube',
                            highlighter: true,
                        }) }, $t('Connect'))))),
            ((_b = v.youTubeUploadInfo) === null || _b === void 0 ? void 0 : _b.error) && (React.createElement(Alert, { style: { marginBottom: 8, marginTop: 8 }, message: $t('An error occurred while uploading to YouTube'), type: "error", closable: true, showIcon: true, afterClose: () => HighlighterService.actions.dismissError() })),
            v.youtubeLinked && (React.createElement(Button, { type: "primary", size: "large", style: {
                    width: '100%',
                    marginTop: '16px',
                    pointerEvents: v.otherUploadInProgress ? 'none' : 'auto',
                    opacity: v.otherUploadInProgress ? '0.6' : '1',
                }, onClick: () => {
                    UsageStatisticsService.actions.recordFeatureUsage('HighlighterUpload');
                    HighlighterService.actions.uploadYoutube({
                        title,
                        description,
                        privacyStatus: privacy,
                    }, streamId);
                } }, $t('Publish')))));
    }
    function getUploadDone() {
        var _a;
        const url = `https://youtube.com/watch?v=${(_a = v.youTubeUploadInfo) === null || _a === void 0 ? void 0 : _a.videoId}`;
        return (React.createElement("div", null,
            React.createElement("p", null, $t('Your video was successfully uploaded! Click the link below to access your video. Please note that YouTube will take some time to process your video.')),
            React.createElement("br", null),
            React.createElement("a", { onClick: () => remote.shell.openExternal(url) }, url),
            React.createElement(Tooltip, { placement: "right", title: urlCopied ? 'Copied!' : 'Copy URL' },
                React.createElement("i", { className: "icon-copy link", style: { marginLeft: 8, display: 'inline', cursor: 'pointer' }, onClick: () => {
                        setUrlCopied(true);
                        electron.clipboard.writeText(url);
                    } }))));
    }
    return (React.createElement("div", null,
        !((_a = v.youTubeUploadInfo) === null || _a === void 0 ? void 0 : _a.uploading) && !((_b = v.youTubeUploadInfo) === null || _b === void 0 ? void 0 : _b.videoId) && getYoutubeForm(),
        v.youtubeLinked && ((_c = v.youTubeUploadInfo) === null || _c === void 0 ? void 0 : _c.uploading) && (React.createElement(UploadProgress, { platform: EUploadPlatform.YOUTUBE })),
        v.youtubeLinked && ((_d = v.youTubeUploadInfo) === null || _d === void 0 ? void 0 : _d.videoId) && getUploadDone()));
}
//# sourceMappingURL=YoutubeUpload.js.map