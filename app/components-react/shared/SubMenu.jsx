import React from 'react';
import { Menu } from 'antd';
import styles from './SubMenu.m.less';
import cx from 'classnames';
export default function SubMenu(p) {
    const { title, style } = p;
    return (<div title={title} className={styles.submenuWrapper} style={style}>
      <Menu.SubMenu {...p} className={cx(p === null || p === void 0 ? void 0 : p.className)}>
        {p.children}
      </Menu.SubMenu>
    </div>);
}
//# sourceMappingURL=SubMenu.jsx.map