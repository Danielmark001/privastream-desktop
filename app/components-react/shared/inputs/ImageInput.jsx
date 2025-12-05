var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Upload, Modal } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { InputComponent, useInput } from './inputs';
import InputWrapper from './InputWrapper';
import { assertIsDefined } from '../../../util/properties-type-guards';
import { $t } from '../../../services/i18n';
import { alertAsync } from '../../modals';
import Utils from '../../../services/utils';
export const ImageInput = InputComponent((p) => {
    const { inputAttrs, wrapperAttrs } = useInput('image', p);
    const [isPreviewVisible, setPreviewVisible] = useState(false);
    const elRef = useRef(null);
    const value = inputAttrs.value;
    useEffect(() => {
        var _a, _b, _c;
        (_c = (_b = (_a = elRef.current) === null || _a === void 0 ? void 0 : _a.parentNode) === null || _b === void 0 ? void 0 : _b.querySelectorAll('.ant-upload-list-picture-card-container,.ant-upload-select-picture-card')) === null || _c === void 0 ? void 0 : _c.forEach(el => (el.style.width = '100%'));
    });
    const defaultImageMetadata = {
        uid: '-1',
        name: '',
        status: 'done',
        url: '',
        size: 0,
        type: '',
    };
    const [fileInfo, setFileInfo] = useState(Object.assign(Object.assign({}, defaultImageMetadata), { url: value }));
    useEffect(() => {
        if (fileInfo.url === p.value)
            return;
        setFileInfo(Object.assign(Object.assign({}, defaultImageMetadata), { url: p.value }));
    }, [p.value]);
    function onPreviewHandler(file) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!file.url && !file.preview) {
                assertIsDefined(file.originFileObj);
                file.preview = yield getBase64(file.originFileObj);
            }
            setPreviewVisible(true);
        });
    }
    function onBeforeUploadHandler(file) {
        let error = '';
        if (!['image/png', 'image/jpeg'].includes(file.type)) {
            error = $t('Only .jpeg and .png is supported');
        }
        else if (file.size > p.maxFileSize) {
            error = $t('Maximum file size reached ') + Utils.getReadableFileSizeString(p.maxFileSize);
        }
        if (error) {
            alertAsync(error);
            return Upload.LIST_IGNORE;
        }
        getBase64(file).then(previewImage => {
            setFileInfo(Object.assign(Object.assign(Object.assign({}, defaultImageMetadata), file), { url: previewImage }));
            inputAttrs.onChange(previewImage);
        });
        return true;
    }
    function onRemoveHandler() {
        setPreviewVisible(false);
        if (p.onRemoveHandler) {
            p.onRemoveHandler();
            return;
        }
        inputAttrs.onChange('');
    }
    return (<InputWrapper {...wrapperAttrs}>
      <Upload {...inputAttrs} accept="image/png, image/jpeg" listType="picture-card" fileList={(fileInfo.url && [fileInfo]) || []} beforeUpload={onBeforeUploadHandler} onPreview={onPreviewHandler} onRemove={onRemoveHandler} customRequest={() => null} onChange={() => null}>
        {!p.value && '+ Upload'}
      </Upload>
      <Modal visible={isPreviewVisible} title={$t('Preview')} footer={null} onCancel={() => setPreviewVisible(false)}>
        <img style={{ width: '100%' }} src={p.value}/>
      </Modal>
      <div ref={elRef}/>
    </InputWrapper>);
});
function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}
//# sourceMappingURL=ImageInput.jsx.map