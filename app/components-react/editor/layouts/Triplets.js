import React from 'react';
import cx from 'classnames';
import useLayout from './hooks';
import ResizeBar from 'components-react/root/ResizeBar';
import styles from './Layouts.m.less';
export function Triplets(p) {
    const { mins, bars, resizes, calculateMax, setBar, componentRef } = useLayout([
        ['1', '4'],
        ['2', '5'],
        ['3', '6'],
    ], true, p.childrenMins, p.onTotalWidth);
    return (React.createElement("div", { className: cx(styles.columns, styles.sidePadded, p.className), ref: componentRef },
        React.createElement(ResizeBar, { position: "left", value: bars.bar1, onInput: (value) => setBar('bar1', value), max: calculateMax(mins.rest + bars.bar2), min: mins.bar1 },
            React.createElement("div", { className: styles.stacked, style: { width: `${100 - (resizes.bar1 + resizes.bar2) * 100}%` } }, ['1', '4'].map((slot) => {
                var _a;
                return (React.createElement("div", { key: slot, className: styles.cell }, ((_a = p.children) === null || _a === void 0 ? void 0 : _a[slot]) || React.createElement(React.Fragment, null)));
            }))),
        React.createElement("div", { className: styles.stacked, style: { width: `${resizes.bar1 * 100}%` } }, ['2', '5'].map((slot) => {
            var _a;
            return (React.createElement("div", { key: slot, className: styles.cell }, ((_a = p.children) === null || _a === void 0 ? void 0 : _a[slot]) || React.createElement(React.Fragment, null)));
        })),
        React.createElement(ResizeBar, { position: "right", value: bars.bar2, onInput: (value) => setBar('bar2', value), max: calculateMax(mins.rest + mins.bar1), min: mins.bar2, transformScale: 1 },
            React.createElement("div", { className: styles.stacked, style: { width: `${resizes.bar2 * 100}%` } }, ['3', '6'].map((slot) => {
                var _a;
                return (React.createElement("div", { key: slot, className: styles.cell }, ((_a = p.children) === null || _a === void 0 ? void 0 : _a[slot]) || React.createElement(React.Fragment, null)));
            })))));
}
//# sourceMappingURL=Triplets.js.map