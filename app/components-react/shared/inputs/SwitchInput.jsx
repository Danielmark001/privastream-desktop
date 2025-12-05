import { Form, Switch } from 'antd';
import React from 'react';
import { InputComponent, useInput } from './inputs';
import InputWrapper from './InputWrapper';
import styles from './SwitchInput.m.less';
import cx from 'classnames';
const ANT_SWITCH_FEATURES = ['checkedChildren', 'unCheckedChildren'];
export const SwitchInput = InputComponent((p) => {
    const { wrapperAttrs, inputAttrs } = useInput('switch', p, ANT_SWITCH_FEATURES);
    const { size = 'small' } = p;
    const labelAlign = (p === null || p === void 0 ? void 0 : p.labelAlign) || 'right';
    const nowrap = (wrapperAttrs === null || wrapperAttrs === void 0 ? void 0 : wrapperAttrs.layout) === 'horizontal';
    const attrs = (p === null || p === void 0 ? void 0 : p.skipWrapperAttrs)
        ? { nolabel: p === null || p === void 0 ? void 0 : p.nolabel, nowrap }
        : Object.assign(Object.assign({}, wrapperAttrs), { nolabel: p === null || p === void 0 ? void 0 : p.nolabel, nowrap });
    return (wrapperAttrs === null || wrapperAttrs === void 0 ? void 0 : wrapperAttrs.layout) === 'horizontal' ? (<InputWrapper {...attrs}>
      <Form.Item colon={false} aria-label={p.label} style={p.style}>
        {!p.nolabel && labelAlign === 'left' && (<span style={{ marginRight: '10px' }}>{p.label}</span>)}
        <Switch checked={inputAttrs.value} size={size} {...inputAttrs} ref={p.inputRef} className={cx(styles.horizontal, styles.horizontalItem, {
            [styles.checkmark]: p === null || p === void 0 ? void 0 : p.checkmark,
            [styles.secondarySwitch]: (p === null || p === void 0 ? void 0 : p.color) === 'secondary',
            [styles.noLabel]: p === null || p === void 0 ? void 0 : p.nolabel,
        })} checkedChildren={(p === null || p === void 0 ? void 0 : p.checkmark) ? <i className="icon-check-mark"/> : undefined}/>
        {!p.nolabel && labelAlign === 'right' && (<span style={{ marginLeft: '10px' }}>{p.label}</span>)}
      </Form.Item>
    </InputWrapper>) : (<InputWrapper {...attrs}>
      <Switch checked={inputAttrs.value} size={size} {...inputAttrs} ref={p.inputRef} className={cx({
            [styles.secondarySwitch]: (p === null || p === void 0 ? void 0 : p.color) === 'secondary',
            [styles.noLabel]: p === null || p === void 0 ? void 0 : p.nolabel,
        })}/>
    </InputWrapper>);
});
//# sourceMappingURL=SwitchInput.jsx.map