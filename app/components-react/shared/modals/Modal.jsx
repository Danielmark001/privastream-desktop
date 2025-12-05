import React from 'react';
import styles from './Modal.m.less';
export default function Modal(p) {
    return (<div className={styles.wrapper}>
      <div className={styles.fader}></div>
      <div className={styles.content}>{p.children}</div>
    </div>);
}
//# sourceMappingURL=Modal.jsx.map