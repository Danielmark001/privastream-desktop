var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React from 'react';
import { InputComponent, useInput } from './inputs';
import InputWrapper from './InputWrapper';
import { Services } from '../../service-provider';
import { LinkOutlined, CloseOutlined, CloudDownloadOutlined } from '@ant-design/icons';
import { Button, Col, Row, Tooltip } from 'antd';
import css from './mediaUrlInput.m.less';
import { $t } from '../../../services/i18n';
import { promptAsync } from '../../modals';
import cx from 'classnames';
const PREVIEW_SRC = 'https://cdn.streamlabs.com/library/giflibrary/jumpy-kevin.webm';
export const MediaUrlInput = InputComponent((p) => {
    const { wrapperAttrs, inputAttrs, dataAttrs } = useInput('mediaurl', p);
    const value = inputAttrs.value;
    const isVideo = /\.webm$/.test(value) || /\.mp4$/.test(value);
    const isImage = !isVideo;
    const isPreview = value === '/images/gallery/default.gif' || !value;
    return (React.createElement(InputWrapper, Object.assign({}, wrapperAttrs),
        React.createElement("div", Object.assign({ className: css.mediaInput }, dataAttrs),
            isVideo && (React.createElement("div", null,
                React.createElement("video", { loop: true, muted: true, autoPlay: true, className: css.preview, key: value, src: value }))),
            isImage && !isPreview && React.createElement("img", { src: value, className: css.preview }),
            isPreview && (React.createElement("div", null,
                React.createElement("video", { loop: true, muted: true, autoPlay: true, className: css.preview, key: PREVIEW_SRC, src: PREVIEW_SRC }))),
            React.createElement(MediaInputButtons, { value: inputAttrs.value, onChange: inputAttrs.onChange }))));
});
export function MediaInputButtons(p) {
    function pickFromGallery() {
        return __awaiter(this, void 0, void 0, function* () {
            const file = yield Services.MediaGalleryService.actions.return.pickFile({
                filter: p.isAudio ? 'audio' : 'image',
            });
            p.onChange(file.href);
        });
    }
    function showLink() {
        return __awaiter(this, void 0, void 0, function* () {
            const newUrl = yield promptAsync({
                title: $t('Media URL'),
                placeholder: 'https://yoururl.com/image/Streamlabs',
            }, p.value);
            p.onChange(newUrl);
        });
    }
    function remove() {
        p.onChange('');
    }
    const noFileText = p.isAudio ? $t('No Sound') : $t('No Media');
    const fileName = p.value ? p.value.split(/(\\|\/)/g).pop() : noFileText;
    const fileClassName = cx({ [css.filename]: true, [css.filenameEmpty]: !p.value });
    return (React.createElement(Row, { className: css.mediaButtons, wrap: false },
        React.createElement(Col, { flex: "auto", className: fileClassName }, fileName),
        React.createElement(Col, { flex: "none" },
            p.value && (React.createElement(Tooltip, { title: $t('Clear Link') },
                React.createElement(Button, { type: "link", onClick: remove },
                    React.createElement(CloseOutlined, null)))),
            React.createElement(Tooltip, { title: $t('Change Link') },
                React.createElement(Button, { type: "link", onClick: showLink },
                    React.createElement(LinkOutlined, null))),
            React.createElement(Tooltip, { title: $t('Change Media') },
                React.createElement(Button, { type: "link", onClick: pickFromGallery },
                    React.createElement(CloudDownloadOutlined, null))))));
}
//# sourceMappingURL=MediaUrlInput.js.map