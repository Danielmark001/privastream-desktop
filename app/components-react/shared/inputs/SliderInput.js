import React from 'react';
import { InputComponent, useInput } from './inputs';
import { Slider, InputNumber, Row, Col } from 'antd';
import InputWrapper from './InputWrapper';
import omit from 'lodash/omit';
const ANT_SLIDER_FEATURES = ['min', 'max', 'step', 'tooltipPlacement', 'tipFormatter'];
export const SliderInput = InputComponent((partialProps) => {
    const p = Object.assign({ hasNumberInput: false }, partialProps);
    const { inputAttrs, wrapperAttrs, dataAttrs } = useInput('slider', p, ANT_SLIDER_FEATURES);
    const numberInputHeight = p.slimNumberInput ? '50px' : '70px';
    function onChangeHandler(val) {
        if (typeof val !== 'number')
            return;
        if (typeof p.max === 'number' && val > p.max)
            return;
        if (typeof p.min === 'number' && val < p.min)
            return;
        inputAttrs.onChange(val);
    }
    function tipFormatter(value) {
        if (p.tipFormatter)
            return p.tipFormatter(value);
        if (p.usePercentages)
            return `${value * 100}%`;
        return value;
    }
    return (React.createElement(InputWrapper, Object.assign({}, wrapperAttrs),
        React.createElement(Row, null,
            React.createElement(Col, Object.assign({ flex: "auto" }, dataAttrs, { "data-role": "input", "data-value": inputAttrs.value }),
                React.createElement(Slider, Object.assign({}, inputAttrs, { tipFormatter: tipFormatter }))),
            p.hasNumberInput && (React.createElement(Col, { flex: numberInputHeight },
                React.createElement(InputNumber, Object.assign({}, omit(inputAttrs, 'tooltipPlacement'), { onChange: onChangeHandler, style: { width: numberInputHeight, marginLeft: '8px' } })))))));
});
//# sourceMappingURL=SliderInput.js.map