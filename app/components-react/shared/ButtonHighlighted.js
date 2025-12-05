import React from 'react';
import { Button } from 'antd';
import cx from 'classnames';
import styles from './ButtonHighlighted.m.less';
export default function ButtonHighlighted(p) {
    return (React.createElement(Button, { className: cx(styles.highlighted, p.className, p.filled && styles.filled, p.faded && styles.faded), style: p.style, onClick: p.onClick, disabled: p.disabled },
        p.icon,
        p.text,
        p.children));
}
//# sourceMappingURL=ButtonHighlighted.js.map