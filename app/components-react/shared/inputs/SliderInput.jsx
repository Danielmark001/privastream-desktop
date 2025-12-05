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
    return (<InputWrapper {...wrapperAttrs}>
      <Row>
        <Col flex="auto" {...dataAttrs} data-role="input" data-value={inputAttrs.value}>
          <Slider {...inputAttrs} tipFormatter={tipFormatter}/>
        </Col>

        {p.hasNumberInput && (<Col flex={numberInputHeight}>
            <InputNumber {...omit(inputAttrs, 'tooltipPlacement')} onChange={onChangeHandler} style={{ width: numberInputHeight, marginLeft: '8px' }}/>
          </Col>)}
      </Row>
    </InputWrapper>);
});
//# sourceMappingURL=SliderInput.jsx.map