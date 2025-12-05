import React from 'react';
import { InputComponent, useInput } from './inputs';
import InputWrapper from './InputWrapper';
import styles from './RadioInput.m.less';
import { Radio, Space, Tooltip } from 'antd';
import cx from 'classnames';
import { pick } from 'lodash';
export const RadioInput = InputComponent((p) => {
    var _a, _b;
    const { inputAttrs, wrapperAttrs } = useInput('radio', p);
    const inputProps = Object.assign(Object.assign({}, inputAttrs), pick(p, 'name'));
    return (React.createElement(InputWrapper, Object.assign({}, wrapperAttrs, { "data-title": p.label }),
        p.buttons && (React.createElement(Radio.Group, Object.assign({}, inputProps, { "data-title": p.label, name: p.name, value: p.value, onChange: e => p.onChange && p.onChange(e.target.value), options: p.options, optionType: "button", buttonStyle: "solid", disabled: p.disabled, className: p.className, style: p === null || p === void 0 ? void 0 : p.style }))),
        p.icons && (React.createElement(Radio.Group, Object.assign({}, inputProps, { "data-title": p.label, name: p.name, value: p.value, defaultValue: p.defaultValue, onChange: e => p.onChange && p.onChange(e.target.value), className: cx(p.className, styles.iconRadio), style: p === null || p === void 0 ? void 0 : p.style, disabled: p.disabled }), p.options.map((option) => {
            return (React.createElement(Radio, { key: option.value, value: option.value, disabled: p.disabled, children: (option === null || option === void 0 ? void 0 : option.tooltip) ? (React.createElement(Tooltip, { title: option === null || option === void 0 ? void 0 : option.tooltip, placement: "topRight" },
                    React.createElement("i", { className: cx(option.icon, styles.iconToggle) }))) : (React.createElement("i", { className: cx(option.icon, styles.iconToggle) })) }));
        }))),
        !p.icons && !p.buttons && (React.createElement(Radio.Group, Object.assign({}, inputProps, { "data-title": p.label, name: p.name, value: p.value, defaultValue: p.defaultValue, onChange: e => p.onChange && p.onChange(e.target.value), className: p.className, style: p === null || p === void 0 ? void 0 : p.style }),
            React.createElement(Space, { size: (_a = p === null || p === void 0 ? void 0 : p.gapsize) !== null && _a !== void 0 ? _a : undefined, direction: (_b = p === null || p === void 0 ? void 0 : p.direction) !== null && _b !== void 0 ? _b : 'vertical' }, p.options.map(option => {
                return (React.createElement(Radio, { key: option.value, value: option.value, disabled: p.disabled, name: `${p.name}-${option.value}` },
                    option.label,
                    option.description && React.createElement("br", null),
                    option.description && React.createElement("span", { style: { fontSize: 12 } }, option.description)));
            }))))));
});
//# sourceMappingURL=RadioInput.js.map