import { InputNumber } from 'antd';
import React from 'react';
import { useTextInput } from './inputs';
import InputWrapper from './InputWrapper';
export const ANT_NUMBER_FEATURES = ['min', 'max', 'step', 'formatter', 'parser'];
export const NumberInput = React.memo((p) => {
    const { inputAttrs, wrapperAttrs, originalOnChange } = useTextInput('number', p, ANT_NUMBER_FEATURES);
    function onChangeHandler(val) {
        if (typeof val !== 'number')
            return;
        if (typeof p.max === 'number' && val > p.max)
            return;
        if (typeof p.min === 'number' && val < p.min)
            return;
        originalOnChange(val);
    }
    const rules = p.rules ? p.rules[0] : {};
    return (<InputWrapper {...wrapperAttrs} rules={[Object.assign(Object.assign({}, rules), { type: 'number' })]}>
      <InputNumber {...inputAttrs} onChange={onChangeHandler} defaultValue={p.defaultValue}/>
    </InputWrapper>);
});
//# sourceMappingURL=NumberInput.jsx.map