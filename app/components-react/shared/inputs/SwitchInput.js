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
    return (wrapperAttrs === null || wrapperAttrs === void 0 ? void 0 : wrapperAttrs.layout) === 'horizontal' ? (React.createElement(InputWrapper, Object.assign({}, attrs),
        React.createElement(Form.Item, { colon: false, "aria-label": p.label, style: p.style },
            !p.nolabel && labelAlign === 'left' && (React.createElement("span", { style: { marginRight: '10px' } }, p.label)),
            React.createElement(Switch, Object.assign({ checked: inputAttrs.value, size: size }, inputAttrs, { ref: p.inputRef, className: cx(styles.horizontal, styles.horizontalItem, {
                    [styles.checkmark]: p === null || p === void 0 ? void 0 : p.checkmark,
                    [styles.secondarySwitch]: (p === null || p === void 0 ? void 0 : p.color) === 'secondary',
                    [styles.noLabel]: p === null || p === void 0 ? void 0 : p.nolabel,
                }), checkedChildren: (p === null || p === void 0 ? void 0 : p.checkmark) ? React.createElement("i", { className: "icon-check-mark" }) : undefined })),
            !p.nolabel && labelAlign === 'right' && (React.createElement("span", { style: { marginLeft: '10px' } }, p.label))))) : (React.createElement(InputWrapper, Object.assign({}, attrs),
        React.createElement(Switch, Object.assign({ checked: inputAttrs.value, size: size }, inputAttrs, { ref: p.inputRef, className: cx({
                [styles.secondarySwitch]: (p === null || p === void 0 ? void 0 : p.color) === 'secondary',
                [styles.noLabel]: p === null || p === void 0 ? void 0 : p.nolabel,
            }) }))));
});
//# sourceMappingURL=SwitchInput.js.map