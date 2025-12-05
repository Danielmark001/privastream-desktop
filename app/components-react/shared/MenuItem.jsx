import React from 'react';
import { Menu } from 'antd';
import styles from './MenuItem.m.less';
import cx from 'classnames';
export default function Menutem(p) {
    const { title, style, type = 'item' } = p;
    return (<>
      <div title={title} className={styles.menuitemWrapper} style={style}>
        <Menu.Item {...p} className={cx(p === null || p === void 0 ? void 0 : p.className, type === 'item' && styles.rootMenuItem, type === 'submenu' && styles.submenuItem, type === 'app' && styles.appSidenavItem)} title={false}>
          {p.children}
        </Menu.Item>
      </div>
    </>);
}
//# sourceMappingURL=MenuItem.jsx.map