var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useEffect, useRef, useState } from 'react';
import { useInput } from './inputs';
import { Button, Input, Popover } from 'antd';
import InputWrapper from './InputWrapper';
import omit from 'lodash/omit';
import { getOS, OS } from '../../../util/operating-systems';
import { $t } from '../../../services/i18n';
import { loadColorPicker } from '../../../util/slow-imports';
import { Services } from '../../service-provider';
import { HexColorPicker, RgbaColorPicker } from 'react-colorful';
import { findDOMNode } from 'react-dom';
import { getDefined } from '../../../util/properties-type-guards';
function intTo2hexDigit(int) {
    let result = int.toString(16);
    if (result.length === 1)
        result = `0${result}`;
    return result;
}
function rgbaToHex(color) {
    return `#${intTo2hexDigit(color.r)}${intTo2hexDigit(color.g)}${intTo2hexDigit(color.b)}${intTo2hexDigit(Math.round(color.a * 255))}`;
}
function hexToRGB(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}
function hexToRGBA(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const a = parseInt(hex.slice(7, 9), 16) / 255;
    return { r, g, b, a };
}
function colorToHex(color) {
    if (typeof color === 'string')
        return color;
    return rgbaToHex(color);
}
export function ColorInput(p) {
    const debounce = p.debounce === undefined ? 500 : p.debounce;
    const { wrapperAttrs, inputAttrs } = useInput('color', Object.assign(Object.assign({}, p), { debounce }));
    const divAttrs = omit(inputAttrs, 'onChange');
    const [textInputVal, setTextInputVal] = useState(colorToHex(inputAttrs.value));
    const alphaMode = typeof inputAttrs.value !== 'string';
    useEffect(() => {
        setTextInputVal(colorToHex(inputAttrs.value));
    }, [inputAttrs.value]);
    function eyedrop(e) {
        return __awaiter(this, void 0, void 0, function* () {
            e.stopPropagation();
            const colorPicker = (yield loadColorPicker()).default;
            Services.UsageStatisticsService.actions.recordFeatureUsage('screenColorPicker');
            colorPicker.startColorPicker((data) => {
                if (data.event === 'mouseClick') {
                    if (typeof inputAttrs.value === 'string') {
                        inputAttrs.onChange(`#${data.hex}`);
                    }
                    else {
                        const rgb = hexToRGB(`#${data.hex}`);
                        inputAttrs.onChange(Object.assign(Object.assign({}, rgb), { a: 1 }));
                    }
                }
            }, () => { }, { onMouseMoveEnabled: true, showPreview: true, showText: false, previewSize: 35 });
        });
    }
    const $formRef = useRef(null);
    const ref = useRef(null);
    useEffect(() => {
        const $input = findDOMNode(ref.current);
        const $form = $input.closest('[data-role="form"]');
        $formRef.current = $form;
    }, []);
    function getPopupContainer() {
        return getDefined($formRef.current);
    }
    function onTextInputChange(ev) {
        var _a;
        const color = ev.target.value;
        setTextInputVal(color);
        const isValidColor = alphaMode
            ? color.match(/^#(?:[0-9a-fA-F]{8})$/)
            : color.match(/^#(?:[0-9a-fA-F]{3}){1,2}$/);
        if (!isValidColor)
            return;
        const textLength = (_a = ev.target.value) === null || _a === void 0 ? void 0 : _a.length;
        handleChangeOBSColor(color, textLength);
    }
    function onTextInputBlur() {
        const validColor = colorToHex(inputAttrs.value);
        if (textInputVal !== validColor)
            setTextInputVal(validColor);
    }
    function handleChangeOBSColor(color, textLength) {
        if (typeof inputAttrs.value === 'string') {
            inputAttrs.onChange(color.toLowerCase());
        }
        else {
            if (textLength === 6) {
                const opaqueColor = color.concat('ff');
                inputAttrs.onChange(opaqueColor.toLowerCase());
            }
            else if (textLength === 7) {
                const opaqueColor = color.concat('f');
                inputAttrs.onChange(opaqueColor.toLowerCase());
            }
            else {
                const rgbaColor = hexToRGBA(color);
                inputAttrs.onChange(rgbaColor);
            }
        }
    }
    function handleKeyDown(event) {
        if (event.key === 'Enter') {
            const isValidColor = alphaMode
                ? textInputVal.match(/^#(?:[0-9a-fA-F]{8})$/)
                : textInputVal.match(/^#(?:[0-9a-fA-F]{3}){1,2}$/);
            if (!isValidColor)
                return;
            handleChangeOBSColor(textInputVal, textInputVal.length);
        }
    }
    const picker = typeof inputAttrs.value === 'string' ? (<HexColorPicker color={inputAttrs.value} onChange={inputAttrs.onChange}/>) : (<RgbaColorPicker color={inputAttrs.value} onChange={inputAttrs.onChange}/>);
    return (<InputWrapper {...wrapperAttrs}>
      <Popover content={picker} trigger="click" placement="bottomLeft" getPopupContainer={getPopupContainer} overlayStyle={{ marginTop: '-20px' }}>
        <Input {...divAttrs} value={textInputVal} onChange={onTextInputChange} onBlur={onTextInputBlur} onKeyDown={handleKeyDown} ref={ref} prefix={<span style={{ width: '22px' }}>
              <div style={{
                backgroundColor: colorToHex(inputAttrs.value),
                position: 'absolute',
                borderRadius: '2px',
                left: '2px',
                bottom: '2px',
                width: '26px',
                top: '2px',
            }}/>
            </span>} addonAfter={getOS() === OS.Windows ? (<Button title={$t('Pick Screen Color')} style={{ padding: '4px 9px' }} onClick={eyedrop}>
                <i className="fas fa-eye-dropper"/>
              </Button>) : (false)}/>
      </Popover>
    </InputWrapper>);
}
//# sourceMappingURL=ColorInput.jsx.map