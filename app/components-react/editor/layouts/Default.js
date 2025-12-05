import React from 'react';
import cx from 'classnames';
import useLayout from './hooks';
import ResizeBar from 'components-react/root/ResizeBar';
import styles from './Layouts.m.less';
export function Default(p) {
    var _a, _b;
    const { mins, bars, resizes, calculateMax, setBar, componentRef } = useLayout([['1'], ['2'], ['3', '4', '5']], false, p.childrenMins, p.onTotalWidth);
    return (React.createElement("div", { className: cx(styles.rows, p.className), ref: componentRef },
        React.createElement("div", { className: styles.cell, style: { height: `${100 - (resizes.bar1 + resizes.bar2) * 100}%` } }, ((_a = p.children) === null || _a === void 0 ? void 0 : _a['1']) || React.createElement(React.Fragment, null)),
        React.createElement(ResizeBar, { position: "top", value: bars.bar1, onInput: (value) => setBar('bar1', value), max: calculateMax(mins.rest + bars.bar2), min: mins.bar1, transformScale: 1 },
            React.createElement("div", { style: { height: `${resizes.bar1 * 100}%` }, className: cx(styles.cell, 'no-top-padding') }, ((_b = p.children) === null || _b === void 0 ? void 0 : _b['2']) || React.createElement(React.Fragment, null))),
        React.createElement(ResizeBar, { position: "top", value: bars.bar2, onInput: (value) => setBar('bar2', value), max: calculateMax(mins.rest + mins.bar1), min: mins.bar2 },
            React.createElement("div", { className: styles.segmented, style: { height: `${resizes.bar2 * 100}%`, padding: '0 8px' } }, ['3', '4', '5'].map((slot) => {
                var _a;
                return (React.createElement("div", { key: slot, className: cx(styles.cell, 'no-top-padding') }, ((_a = p.children) === null || _a === void 0 ? void 0 : _a[slot]) || React.createElement(React.Fragment, null)));
            })))));
}
//# sourceMappingURL=Default.js.map