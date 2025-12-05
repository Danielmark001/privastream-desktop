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
    return (<InputWrapper {...wrapperAttrs}>
      <div className={css.mediaInput} {...dataAttrs}>
        
        {isVideo && (<div>
            <video loop muted autoPlay className={css.preview} key={value} src={value}/>
          </div>)}

        
        {isImage && !isPreview && <img src={value} className={css.preview}/>}

        
        {isPreview && (<div>
            <video loop muted autoPlay className={css.preview} key={PREVIEW_SRC} src={PREVIEW_SRC}/>
          </div>)}

        
        <MediaInputButtons value={inputAttrs.value} onChange={inputAttrs.onChange}/>
      </div>
    </InputWrapper>);
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
    return (<Row className={css.mediaButtons} wrap={false}>
      <Col flex="auto" className={fileClassName}>
        {fileName}
      </Col>
      <Col flex="none">
        {p.value && (<Tooltip title={$t('Clear Link')}>
            <Button type="link" onClick={remove}>
              <CloseOutlined />
            </Button>
          </Tooltip>)}

        <Tooltip title={$t('Change Link')}>
          <Button type="link" onClick={showLink}>
            <LinkOutlined />
          </Button>
        </Tooltip>

        <Tooltip title={$t('Change Media')}>
          <Button type="link" onClick={pickFromGallery}>
            <CloudDownloadOutlined />
          </Button>
        </Tooltip>
      </Col>
    </Row>);
}
//# sourceMappingURL=MediaUrlInput.jsx.map