import React from 'react';
import cx from 'classnames';
import useLayout from './hooks';
import ResizeBar from 'components-react/root/ResizeBar';
import styles from './Layouts.m.less';
export function TwoPane(p) {
    var _a, _b, _c, _d, _e;
    const { mins, bars, resizes, calculateMax, setBar, componentRef } = useLayout([['2'], ['5'], ['1', ['3', '4']]], true, p.childrenMins, p.onTotalWidth);
    return (<div className={cx(styles.columns, styles.sidePadded, p.className)} ref={componentRef}>
      <ResizeBar position="left" value={bars.bar1} onInput={(value) => setBar('bar1', value)} max={calculateMax(mins.rest + bars.bar2)} min={mins.bar1}>
        <div style={{ width: `${100 - (resizes.bar1 + resizes.bar2) * 100}%` }} className={styles.cell}>
          {((_a = p.children) === null || _a === void 0 ? void 0 : _a['2']) || <></>}
        </div>
      </ResizeBar>
      <div className={styles.rows} style={{ width: `${resizes.bar1 * 100}%`, paddingTop: '16px' }}>
        <div style={{ height: '100%' }} className={styles.cell}>
          {((_b = p.children) === null || _b === void 0 ? void 0 : _b['1']) || <></>}
        </div>
        <div className={styles.segmented}>
          <div className={styles.cell}>{((_c = p.children) === null || _c === void 0 ? void 0 : _c['3']) || <></>}</div>
          <div className={styles.cell}>{((_d = p.children) === null || _d === void 0 ? void 0 : _d['4']) || <></>}</div>
        </div>
      </div>
      <ResizeBar position="right" value={bars.bar2} onInput={(value) => setBar('bar2', value)} max={calculateMax(mins.rest + mins.bar1)} min={mins.bar2} transformScale={1}>
        <div style={{ width: `${resizes.bar2 * 100}%` }} className={styles.cell}>
          {((_e = p.children) === null || _e === void 0 ? void 0 : _e['5']) || <></>}
        </div>
      </ResizeBar>
    </div>);
}
//# sourceMappingURL=TwoPane.jsx.map