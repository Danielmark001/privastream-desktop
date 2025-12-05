import React from 'react';
import cx from 'classnames';
import { InputComponent } from './inputs';
import styles from 'components/shared/inputs/BoolButtonInput.m.less';
import { Tooltip } from 'antd';
export const BoolButtonInput = InputComponent((p) => {
    let customStyles = Object.assign({}, p.checkboxStyles);
    if (p.value) {
        customStyles = Object.assign(Object.assign({}, customStyles), p.checkboxActiveStyles);
    }
    function handleClick(e) {
        if (p.disabled)
            return;
        if (p.onChange)
            p.onChange(!p.value);
    }
    return (React.createElement(Tooltip, { title: p.tooltip, placement: p.tooltipPlacement },
        React.createElement("div", { className: cx('input-wrapper', { disabled: p.disabled }), "data-role": "input", "data-type": "bool-button", "data-value": !!p.value, "data-name": p.name },
            React.createElement("div", { className: cx(styles.boolButton, { [styles.active]: !!p.value }), style: customStyles, onClick: handleClick }, p.label || (p.value && React.createElement("i", { className: "fa fa-check" }))))));
});
//# sourceMappingURL=BoolButtonInput.js.map