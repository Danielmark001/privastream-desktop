var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useEffect, useState, useRef } from 'react';
import { clipboard } from 'electron';
import * as remote from '@electron/remote';
import { Layout, message, Card, Menu, Progress, PageHeader } from 'antd';
import cx from 'classnames';
import { $t } from 'services/i18n';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import Scrollable from 'components-react/shared/Scrollable';
import UltraIcon from 'components-react/shared/UltraIcon';
import { Services } from 'components-react/service-provider';
import { useSubscription } from 'components-react/hooks/useSubscription';
import { useChildWindowParams, useVuex } from 'components-react/hooks';
import { confirmAsync } from 'components-react/modals';
import styles from './MediaGallery.m.less';
const getTypeMap = () => ({
    title: {
        image: $t('Images'),
        audio: $t('Sounds'),
    },
    noFilesCopy: {
        image: $t("You don't have any uploaded images!"),
        audio: $t("You don't have any uploaded sounds!"),
    },
    noFilesBtn: {
        image: $t('Upload An Image'),
        audio: $t('Upload A Sound'),
    },
});
function formatBytes(bytes, argPlaces = 1) {
    if (!bytes) {
        return '0KB';
    }
    const divisor = Math.pow(10, argPlaces);
    const base = Math.log(bytes) / Math.log(1024);
    const suffix = ['', 'KB', 'MB', 'GB', 'TB'][Math.floor(base)];
    return Math.round(Math.pow(1024, base - Math.floor(base)) * divisor) / divisor + suffix;
}
export default function MediaGallery() {
    var _a, _b;
    const { WindowsService, MediaGalleryService, UserService, MagicLinkService, WebsocketService, } = Services;
    const [dragOver, setDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [category, setCategory] = useState('uploads');
    const [galleryInfo, setGalleryInfo] = useState(null);
    const [busy, setBusy] = useState(false);
    const audio = useRef(new Audio());
    const typeMap = getTypeMap();
    const promiseId = useChildWindowParams('promiseId');
    const filter = useChildWindowParams('filter');
    useEffect(() => {
        fetchGalleryInfo();
        return audio.current.pause;
    }, []);
    useSubscription(WebsocketService.socketEvent, ev => {
        if (ev.type !== 'streamlabs_prime_subscribe')
            return;
        fetchGalleryInfo();
    });
    const { isPrime } = useVuex(() => ({
        isPrime: UserService.views.isPrime,
    }));
    function fetchGalleryInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            setGalleryInfo(yield MediaGalleryService.actions.return.fetchGalleryInfo());
        });
    }
    function openFilePicker() {
        return __awaiter(this, void 0, void 0, function* () {
            const choices = yield remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
                properties: ['openFile', 'multiSelections'],
            });
            if (choices && choices.filePaths) {
                upload(choices.filePaths);
            }
        });
    }
    function upload(filepaths) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!filepaths || !filepaths.length)
                return;
            setBusy(true);
            message.loading({ content: $t('Uploading...'), duration: 0, key: 'uploadingMsg' });
            try {
                setGalleryInfo(yield MediaGalleryService.actions.return.upload(filepaths));
            }
            catch (e) {
                message.error($t('This file could not be uploaded'), 2);
            }
            finally {
                message.destroy('uploadingMsg');
                setBusy(false);
            }
        });
    }
    function upgradeToPrime() {
        MagicLinkService.linkToPrime('slobs-media-gallery');
        message.warning($t('You must have Streamlabs Ultra to use this media'), 5);
    }
    const filteredGallery = galleryInfo === null || galleryInfo === void 0 ? void 0 : galleryInfo.files.filter(file => {
        if (category !== 'stock' && file.isStock !== false)
            return false;
        if (category === 'stock' && file.isStock === false)
            return false;
        return !(filter && file.type !== filter);
    });
    const title = filter && typeMap.title[filter];
    const noFilesCopy = (filter && typeMap.noFilesCopy[filter]) || $t("You don't have any uploaded files!");
    const noFilesBtn = (filter && typeMap.noFilesBtn[filter]) || $t('Upload A File');
    const totalUsage = (_a = galleryInfo === null || galleryInfo === void 0 ? void 0 : galleryInfo.totalUsage) !== null && _a !== void 0 ? _a : 0;
    const maxUsage = (_b = galleryInfo === null || galleryInfo === void 0 ? void 0 : galleryInfo.maxUsage) !== null && _b !== void 0 ? _b : 0;
    const usagePct = galleryInfo ? totalUsage / maxUsage : 0;
    function displaySpaceRemaining() {
        return `${formatBytes(totalUsage, 2)}/${formatBytes(maxUsage, 2)}`;
    }
    function onDragEnter(e) {
        e.preventDefault();
        setDragOver(true);
    }
    function onDragLeave(e) {
        e.preventDefault();
        setDragOver(false);
    }
    function handleFileDrop(e) {
        var _a;
        e.preventDefault();
        if (!((_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.files))
            return;
        const mappedFiles = Array.from(e.dataTransfer.files).map(file => file.path);
        upload(mappedFiles);
        setDragOver(false);
    }
    function handleCategory(e) {
        if (e.key !== category)
            setCategory(e.key);
    }
    function selectFile(file, shouldSelect = false, e) {
        e.preventDefault();
        if (filter && file.type !== filter) {
            message.error($t('Not a supported file type'), 1);
        }
        setSelectedFile(file);
        if (file.type === 'audio' && !shouldSelect) {
            audio.current.pause();
            audio.current.setAttribute('src', file.href);
            audio.current.play();
        }
        if (shouldSelect)
            handleSelect();
    }
    function handleSelect() {
        if (!selectedFile)
            return WindowsService.actions.closeChildWindow();
        if (selectedFile.prime && !isPrime) {
            upgradeToPrime();
            return;
        }
        MediaGalleryService.actions.resolveFileSelect(promiseId, selectedFile);
        WindowsService.actions.closeChildWindow();
    }
    function handleDelete() {
        return __awaiter(this, void 0, void 0, function* () {
            if (selectedFile) {
                confirmAsync($t('Are you sure you want to delete this file? This action is irreversable.')).then((response) => __awaiter(this, void 0, void 0, function* () {
                    if (!response || !selectedFile)
                        return;
                    setGalleryInfo(yield MediaGalleryService.actions.return.deleteFile(selectedFile));
                    setSelectedFile(null);
                }));
            }
        });
    }
    function handleCopy(href) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield clipboard.writeText(href);
                message.success($t('URL Copied'), 1);
            }
            catch (e) {
                message.error($t('Failed to copy URL'), 1);
            }
        });
    }
    return (React.createElement(ModalLayout, { onOk: handleSelect },
        React.createElement(Layout, { className: styles.container, onDragEnter: onDragEnter, onDragOver: onDragEnter },
            React.createElement(Layout.Sider, null,
                React.createElement("div", { className: styles.dropzone, onClick: openFilePicker },
                    React.createElement("i", { className: "icon-cloud-backup" }),
                    $t('Drag & Drop Upload')),
                React.createElement(Menu, { mode: "inline", onClick: handleCategory, defaultSelectedKeys: ['uploads'] }, ['uploads', 'stock'].map((cat) => (React.createElement(Menu.Item, { key: cat }, cat === 'stock' ? $t('Stock Files') : $t('My Uploads')))))),
            React.createElement(Layout.Content, null,
                React.createElement(PageHeader, { title: title, subTitle: React.createElement(Progress, { percent: Math.round(usagePct * 100), style: { width: '200px', display: 'flex', alignItems: 'center' }, trailColor: 'var(--section-alt)', format: displaySpaceRemaining }), extra: [
                        React.createElement("i", { className: cx(styles.toolbarIcon, 'icon-cloud-backup'), onClick: openFilePicker, key: "backup" }),
                        React.createElement("i", { className: cx(styles.toolbarIcon, 'icon-trash', {
                                [styles.disabled]: !selectedFile || (selectedFile && selectedFile.isStock),
                            }), onClick: handleDelete, key: "trash" }),
                    ] }),
                React.createElement(Scrollable, { style: { height: 'calc(100% - 18px)' } }, filteredGallery &&
                    filteredGallery.map(file => (React.createElement(Card, { key: file.href, hoverable: true, onClick: e => selectFile(file, false, e), onDoubleClick: e => selectFile(file, true, e), cover: React.createElement(CardContent, { file: file }), style: {
                            borderColor: (selectedFile === null || selectedFile === void 0 ? void 0 : selectedFile.href) === file.href ? 'var(--teal)' : undefined,
                        }, bodyStyle: { fontSize: 10, padding: '8px' }, headStyle: { position: 'absolute', padding: 0, border: 'none', right: '8px' }, extra: [
                            file.prime ? (React.createElement(UltraIcon, { key: "prime", style: {
                                    display: 'inline-block',
                                    height: '12px',
                                    width: '12px',
                                    marginRight: '5px',
                                } })) : (React.createElement("i", { className: "icon-copy", onClick: () => handleCopy(file.href), key: "copy" })),
                        ] },
                        React.createElement(Card.Meta, { title: file.filename, description: file.size && formatBytes(file.size) }))))),
                !filteredGallery && (React.createElement("div", { className: styles.emptyBox },
                    React.createElement("span", null, noFilesCopy),
                    React.createElement("button", { onClick: openFilePicker, className: "button" }, noFilesBtn),
                    React.createElement("button", { onClick: () => setCategory('stock'), className: "button" }, $t('Browse the Gallery')))))),
        dragOver && (React.createElement("div", { onDragOver: onDragEnter, onDragLeave: onDragLeave, onDrop: handleFileDrop, className: cx(styles.dragOverlay, 'radius') })),
        busy && React.createElement("div", { className: styles.busyOverlay })));
}
function CardContent(p) {
    const { type, href } = p.file;
    let FilePreview = () => React.createElement("div", null);
    if (type === 'image' && (/\.webm$/.test(href) || /\.mp4$/.test(href))) {
        FilePreview = () => (React.createElement("video", { autoPlay: true, muted: true, loop: true, src: href, style: { maxHeight: '148px', maxWidth: '148px' } }));
    }
    else if (type === 'image') {
        FilePreview = () => React.createElement("img", { src: href, style: { maxHeight: '148px', maxWidth: '148px' } });
    }
    else if (type === 'audio') {
        FilePreview = () => (React.createElement("i", { className: "icon-music", style: {
                height: '132px',
                lineHeight: '132px',
                fontSize: '28px',
                textAlign: 'center',
                display: 'block',
            } }));
    }
    return (React.createElement("div", { style: {
            height: '150px',
            width: '150px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        } },
        React.createElement(FilePreview, null)));
}
//# sourceMappingURL=MediaGallery.js.map