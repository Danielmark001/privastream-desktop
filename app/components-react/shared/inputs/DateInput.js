import React from 'react';
import { DatePicker } from 'antd';
import { InputComponent, useInput } from './inputs';
import InputWrapper from './InputWrapper';
const ANT_DATEPICKER_FEATURES = [];
export const DateInput = InputComponent((p) => {
    const { inputAttrs, wrapperAttrs } = useInput('date', p, ANT_DATEPICKER_FEATURES);
    return (React.createElement(InputWrapper, Object.assign({}, wrapperAttrs),
        React.createElement(DatePicker, Object.assign({ picker: "date" }, inputAttrs, { onChange: (newVal, dateString) => inputAttrs.onChange(new Date(dateString)) }))));
});
//# sourceMappingURL=DateInput.js.map