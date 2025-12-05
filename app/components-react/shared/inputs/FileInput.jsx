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
import * as remote from '@electron/remote';
import { Input, Button } from 'antd';
import { InputComponent, useInput } from './inputs';
import InputWrapper from './InputWrapper';
import { $t } from '../../../services/i18n';
export function showFileDialog(p) {
    return __awaiter(this, void 0, void 0, function* () {
        if (p.save) {
            const options = {
                defaultPath: p.value,
                filters: p.filters,
                properties: [],
            };
            const { filePath } = yield remote.dialog.showSaveDialog(options);
            if (filePath && p.onChange) {
                p.onChange(filePath);
            }
        }
        else {
            const options = {
                defaultPath: p.value,
                filters: p.filters,
                properties: [],
            };
            if (p.directory && options.properties) {
                options.properties.push('openDirectory');
            }
            else if (options.properties) {
                options.properties.push('openFile');
            }
            const { filePaths } = yield remote.dialog.showOpenDialog(options);
            if (filePaths[0] && p.onChange) {
                p.onChange(filePaths[0]);
            }
        }
    });
}
export const FileInput = InputComponent((p) => {
    const { wrapperAttrs, inputAttrs } = useInput('file', p);
    function handleShowFileDialog() {
        showFileDialog(p);
    }
    return (<InputWrapper {...wrapperAttrs}>
      <Input {...inputAttrs} onChange={val => inputAttrs === null || inputAttrs === void 0 ? void 0 : inputAttrs.onChange(val.target.value)} value={p.value} disabled addonAfter={<Button style={p.buttonContent ? { borderRadius: '4px' } : {}} onClick={handleShowFileDialog}>
            {p.buttonContent || $t('Browse')}
          </Button>}/>
    </InputWrapper>);
});
//# sourceMappingURL=FileInput.jsx.map