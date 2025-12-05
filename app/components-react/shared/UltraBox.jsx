import React from 'react';
import cx from 'classnames';
import styles from './UltraBox.m.less';
export default function UltraBox(p) {
    return (<div className={cx(styles.container, p.className)}>
      <div className={styles.backing}/>
      <div>{p.children}</div>
    </div>);
}
//# sourceMappingURL=UltraBox.jsx.map