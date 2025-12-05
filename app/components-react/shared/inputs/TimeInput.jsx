import { TimePicker } from 'antd';
import React, { useEffect, useRef } from 'react';
import { InputComponent, useInput } from './inputs';
import InputWrapper from './InputWrapper';
import moment from 'moment';
import { findDOMNode } from 'react-dom';
export const TimeInput = InputComponent((p) => {
    const { wrapperAttrs, inputAttrs } = useInput('time', p);
    const value = getAntdValue(inputAttrs.value);
    const inputRef = useRef(null);
    useEffect(() => {
        const $input = findDOMNode(inputRef.current);
        $input.querySelector('input').removeAttribute('readonly');
    });
    function onChange(moment) {
        const isParsed = (moment === null || moment === void 0 ? void 0 : moment._f) === undefined;
        const val = isParsed
            ? moment
            :
                value
                    .clone()
                    .set('hours', moment.hours())
                    .set('minutes', moment.minutes())
                    .set('seconds', 0);
        inputAttrs.onChange(val.valueOf() || 0);
    }
    return (<InputWrapper {...wrapperAttrs}>
      <TimePicker {...inputAttrs} ref={inputRef} value={value} onSelect={onChange} onChange={onChange} use12Hours format="h:mm a" showNow={false} allowClear={false}/>
    </InputWrapper>);
});
function getAntdValue(value) {
    return moment(value);
}
TimeInput['getAntdValue'] = getAntdValue;
//# sourceMappingURL=TimeInput.jsx.map