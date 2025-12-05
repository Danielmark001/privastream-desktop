import React from 'react';
import { Tooltip as AntdTooltip } from 'antd';
import styles from './Tooltip.m.less';
import cx from 'classnames';
export default function Tooltip(props) {
    const { title, id, className = undefined, style, wrapperStyle, lightShadow, placement = 'bottom', content, disabled = false, autoAdjustOverflow = true, visible, onClick, } = props;
    return (React.createElement("div", { id: id, className: cx(className, styles.tooltipWrapper), style: wrapperStyle, onClick: onClick }, disabled ? (React.createElement(React.Fragment, null,
        content,
        Object.assign({}, props).children)) : (React.createElement(AntdTooltip, { className: cx(styles.tooltipContent, { [styles.lightShadow]: lightShadow }), placement: placement, title: title, style: style, getPopupContainer: triggerNode => triggerNode, mouseLeaveDelay: 0.1, trigger: ['hover', 'focus', 'click'], autoAdjustOverflow: autoAdjustOverflow, visible: visible },
        content,
        Object.assign({}, props).children))));
}
//# sourceMappingURL=Tooltip.js.map