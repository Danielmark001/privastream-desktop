import React from 'react';
import cx from 'classnames';
import useLayout from './hooks';
import ResizeBar from 'components-react/root/ResizeBar';
import styles from './Layouts.m.less';
export function Pyramid(p) {
    var _a;
    const { mins, bars, resizes, calculateMax, setBar, componentRef } = useLayout([['1'], ['2', '3']], false, p.childrenMins, p.onTotalWidth);
    return (<div className={cx(styles.rows, p.className)} ref={componentRef}>
      <div className={styles.cell} style={{ height: `${100 - resizes.bar1 * 100}%` }}>
        {((_a = p.children) === null || _a === void 0 ? void 0 : _a['1']) || <></>}
      </div>
      <ResizeBar position="top" value={bars.bar1} onInput={(value) => setBar('bar1', value)} max={calculateMax(mins.rest)} min={mins.bar1}>
        <div className={styles.segmented} style={{ height: `${resizes.bar1 * 100}%`, padding: '0 8px' }}>
          {['2', '3'].map((slot) => {
            var _a;
            return (<div className={cx(styles.cell, 'no-top-padding')} key={slot}>
              {((_a = p.children) === null || _a === void 0 ? void 0 : _a[slot]) || <></>}
            </div>);
        })}
        </div>
      </ResizeBar>
    </div>);
}
//# sourceMappingURL=Pyramid.jsx.map