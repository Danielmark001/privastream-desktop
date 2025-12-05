import React from 'react';
import { WindowsService } from 'services/windows';
import styles from './MessageBoxModal.m.less';
export default function MessageBoxModal(p) {
    return (<div className={styles.wrapper}>
      <div className={styles.header}>
        <i className="icon-close" onClick={() => WindowsService.hideModal()}/>
      </div>
      <div className={styles.contentWrapper}>
        <div className={styles.content}>{p.children}</div>
      </div>
    </div>);
}
//# sourceMappingURL=MessageBoxModal.jsx.map