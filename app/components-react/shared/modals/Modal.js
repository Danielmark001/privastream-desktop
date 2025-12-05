import React from 'react';
import styles from './Modal.m.less';
export default function Modal(p) {
    return (React.createElement("div", { className: styles.wrapper },
        React.createElement("div", { className: styles.fader }),
        React.createElement("div", { className: styles.content }, p.children)));
}
//# sourceMappingURL=Modal.js.map