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
    return (<InputWrapper {...wrapperAttrs}>
      {p.isPassword && <Input.Password {...textInputAttrs}/>}
      {!p.isPassword && <Input {...textInputAttrs}/>}
    </InputWrapper>);
});
//# sourceMappingURL=TextInput.jsx.map