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
    return (<Tooltip title={p.tooltip} placement={p.tooltipPlacement}>
      <div className={cx('input-wrapper', { disabled: p.disabled })} data-role="input" data-type="bool-button" data-value={!!p.value} data-name={p.name}>
        <div className={cx(styles.boolButton, { [styles.active]: !!p.value })} style={customStyles} onClick={handleClick}>
          {p.label || (p.value && <i className="fa fa-check"/>)}
        </div>
      </div>
    </Tooltip>);
});
//# sourceMappingURL=BoolButtonInput.jsx.map