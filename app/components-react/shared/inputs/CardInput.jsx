import { Col, Row } from 'antd';
import React from 'react';
import { InputComponent, useInput } from './inputs';
import InputWrapper from './InputWrapper';
export const CardInput = InputComponent((props) => {
    const defaultProps = { itemWidth: 64, itemHeight: 64 };
    const p = Object.assign(Object.assign({}, defaultProps), props);
    const { inputAttrs, wrapperAttrs } = useInput('card', p);
    function renderOption(opt) {
        const isSelected = opt.value === inputAttrs.value;
        const style = Object.assign({ backgroundColor: isSelected ? 'var(--link-active)' : 'var(--solid-input)', cursor: 'pointer', width: p.isIcons ? p.itemWidth : undefined, height: p.isIcons ? p.itemHeight : undefined }, p.style);
        const width = `${p.itemWidth}px`;
        const height = `${p.itemHeight}px`;
        return (<Col onClick={() => inputAttrs.onChange(opt.value)} style={style} key={opt.value}>
        {!p.isIcons && <img src={opt.label} style={{ width, height }}/>}
        {p.isIcons && (<i className={opt.label} style={{
                    fontSize: Math.round(p.itemWidth * 0.6),
                    padding: Math.round(p.itemWidth * 0.2),
                    display: 'block',
                }}/>)}
      </Col>);
    }
    return (<InputWrapper {...wrapperAttrs}>
      <Row justify={p.isIcons ? 'end' : 'start'}>{p.options.map(renderOption)}</Row>
    </InputWrapper>);
});
//# sourceMappingURL=CardInput.jsx.map