import React from 'react';
import { Input } from 'antd';
import { InputComponent, useTextInput } from './inputs';
import InputWrapper from './InputWrapper';
const ANT_TEXTAREA_FEATURES = ['showCount', 'autoSize', 'maxLength', 'rows'];
export const TextAreaInput = InputComponent((p) => {
    const { inputAttrs, wrapperAttrs } = useTextInput('textarea', p, ANT_TEXTAREA_FEATURES);
    return (<InputWrapper {...wrapperAttrs}>
      <Input.TextArea {...inputAttrs}/>
    </InputWrapper>);
});
//# sourceMappingURL=TextAreaInput.jsx.map