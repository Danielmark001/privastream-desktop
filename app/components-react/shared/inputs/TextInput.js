import { Input } from 'antd';
import React from 'react';
import { InputComponent, useTextInput } from './inputs';
import InputWrapper from './InputWrapper';
export const ANT_INPUT_FEATURES = [
    'addonBefore',
    'addonAfter',
    'autoFocus',
    'prefix',
    'size',
];
export const TextInput = InputComponent((p) => {
    const { inputAttrs, wrapperAttrs } = useTextInput('text', p, ANT_INPUT_FEATURES);
    const textInputAttrs = Object.assign(Object.assign({}, inputAttrs), { onFocus: p.onFocus, onKeyDown: p.onKeyDown, onMouseDown: p.onMouseDown, ref: p.inputRef, prefix: p.prefix });
    return (React.createElement(InputWrapper, Object.assign({}, wrapperAttrs),
        p.isPassword && React.createElement(Input.Password, Object.assign({}, textInputAttrs)),
        !p.isPassword && React.createElement(Input, Object.assign({}, textInputAttrs))));
});
//# sourceMappingURL=TextInput.js.map