import React from 'react';
import { DatePicker } from 'antd';
import { InputComponent, useInput } from './inputs';
import InputWrapper from './InputWrapper';
const ANT_DATEPICKER_FEATURES = [];
export const DateInput = InputComponent((p) => {
    const { inputAttrs, wrapperAttrs } = useInput('date', p, ANT_DATEPICKER_FEATURES);
    return (<InputWrapper {...wrapperAttrs}>
      
      <DatePicker picker="date" {...inputAttrs} onChange={(newVal, dateString) => inputAttrs.onChange(new Date(dateString))}/>
    </InputWrapper>);
});
//# sourceMappingURL=DateInput.jsx.map