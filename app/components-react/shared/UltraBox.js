import React from 'react';
import cx from 'classnames';
import styles from './UltraBox.m.less';
export default function UltraBox(p) {
    return (React.createElement("div", { className: cx(styles.container, p.className) },
        React.createElement("div", { className: styles.backing }),
        React.createElement("div", null, p.children)));
}
//# sourceMappingURL=UltraBox.js.map