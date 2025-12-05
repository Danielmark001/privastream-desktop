import React from 'react';
import { Menu } from 'antd';
import styles from './SubMenu.m.less';
import cx from 'classnames';
export default function SubMenu(p) {
    const { title, style } = p;
    return (React.createElement("div", { title: title, className: styles.submenuWrapper, style: style },
        React.createElement(Menu.SubMenu, Object.assign({}, p, { className: cx(p === null || p === void 0 ? void 0 : p.className) }), p.children)));
}
//# sourceMappingURL=SubMenu.js.map