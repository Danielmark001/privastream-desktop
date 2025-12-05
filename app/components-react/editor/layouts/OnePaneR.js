import React from 'react';
import cx from 'classnames';
import useLayout from './hooks';
import ResizeBar from 'components-react/root/ResizeBar';
import styles from './Layouts.m.less';
export function OnePaneR(p) {
    var _a, _b, _c, _d, _e;
    const { mins, bars, resizes, calculateMax, setBar, componentRef } = useLayout([['1', ['3', '4', '5']], ['2']], true, p.childrenMins, p.onTotalWidth);
    return (React.createElement("div", { className: cx(styles.columns, styles.sidePadded, p.className), ref: componentRef },
        React.createElement("div", { className: styles.rows, style: { width: `${100 - resizes.bar1 * 100}%`, paddingTop: '16px' } },
            React.createElement("div", { className: styles.cell, style: { height: '100%' } }, ((_a = p.children) === null || _a === void 0 ? void 0 : _a['1']) || React.createElement(React.Fragment, null)),
            React.createElement("div", { className: styles.segmented },
                React.createElement("div", { className: styles.cell }, ((_b = p.children) === null || _b === void 0 ? void 0 : _b['3']) || React.createElement(React.Fragment, null)),
                React.createElement("div", { className: styles.cell }, ((_c = p.children) === null || _c === void 0 ? void 0 : _c['4']) || React.createElement(React.Fragment, null)),
                React.createElement("div", { className: styles.cell }, ((_d = p.children) === null || _d === void 0 ? void 0 : _d['5']) || React.createElement(React.Fragment, null)))),
        React.createElement(ResizeBar, { position: "right", value: bars.bar1, onInput: (value) => setBar('bar1', value), max: calculateMax(mins.rest), min: mins.bar1 },
            React.createElement("div", { style: { width: `${resizes.bar1 * 100}%` }, className: styles.cell }, ((_e = p.children) === null || _e === void 0 ? void 0 : _e['2']) || React.createElement(React.Fragment, null)))));
}
//# sourceMappingURL=OnePaneR.js.map