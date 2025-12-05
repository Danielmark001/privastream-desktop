import React from 'react';
import styles from './InfoBanner.m.less';
import cx from 'classnames';
import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
export default function InfoBanner(p) {
    var _a;
    const { shouldShow } = useVuex(() => ({
        shouldShow: (p === null || p === void 0 ? void 0 : p.dismissableKey)
            ? Services.DismissablesService.views.shouldShow(p === null || p === void 0 ? void 0 : p.dismissableKey)
            : true,
    }));
    if (!shouldShow)
        return <></>;
    function handleDismiss(e) {
        if (!(p === null || p === void 0 ? void 0 : p.dismissableKey))
            return;
        e.stopPropagation();
        Services.DismissablesService.actions.dismiss(p === null || p === void 0 ? void 0 : p.dismissableKey);
    }
    function handleOnClick(e) {
        if (!(p === null || p === void 0 ? void 0 : p.onClick))
            return;
        e.stopPropagation();
        p === null || p === void 0 ? void 0 : p.onClick();
    }
    return (<div id={p === null || p === void 0 ? void 0 : p.id} className={cx(styles.infoBanner, { [styles.info]: p.type === 'info' }, { [styles.warning]: p.type === 'warning' }, p.className)} style={(_a = p.style) !== null && _a !== void 0 ? _a : undefined} onClick={handleOnClick}>
      <i className="icon-information"/>
      <span className={styles.message}>{p.message}</span>
      {(p === null || p === void 0 ? void 0 : p.dismissableKey) && (<i className={cx(styles.close, 'icon-close')} onClick={handleDismiss}/>)}
    </div>);
}
//# sourceMappingURL=InfoBanner.jsx.map