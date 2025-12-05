import styles from './GoLiveError.m.less';
import React, { useState } from 'react';
import { errorTypes } from '../../../services/streaming/stream-error';
import { $t } from '../../../services/i18n';
import { Alert } from 'antd';
import cx from 'classnames';
import { Services } from '../../service-provider';
import { useVuex } from 'components-react/hooks';
export default function MessageLayout(p) {
    var _a, _b, _c;
    const [isErrorDetailsShown, setDetailsShown] = useState(false);
    const { shouldShow } = useVuex(() => ({
        shouldShow: (p === null || p === void 0 ? void 0 : p.dismissableKey)
            ? Services.DismissablesService.views.shouldShow(p === null || p === void 0 ? void 0 : p.dismissableKey)
            : true,
    }));
    if (!shouldShow)
        return <></>;
    const error = p.error;
    const details = (_a = error === null || error === void 0 ? void 0 : error.details) !== null && _a !== void 0 ? _a : p === null || p === void 0 ? void 0 : p.details;
    const type = (_b = p === null || p === void 0 ? void 0 : p.type) !== null && _b !== void 0 ? _b : 'error';
    const message = p.message || (error === null || error === void 0 ? void 0 : error.message) || (p.error && ((_c = errorTypes[p.error.type]) === null || _c === void 0 ? void 0 : _c.message));
    const hasButton = p.hasButton;
    function render() {
        return (<div className={styles.container}>
        <Alert type={type} message={message} showIcon description={renderDescription()} closable={p === null || p === void 0 ? void 0 : p.closable} onClose={p === null || p === void 0 ? void 0 : p.onClose}/>
      </div>);
    }
    function renderDescription() {
        return (<div style={{ marginTop: '16px' }}>
        <div>{p.children}</div>
        <div className={cx({ [styles.ctaBtn]: hasButton })}>
          {details && !isErrorDetailsShown && (<a className={styles.link} onClick={() => setDetailsShown(true)}>
              {$t('Show details')}
            </a>)}
          {details && isErrorDetailsShown && (<div className={styles.details}>
              {details}
              <br />
              <br />
              {error === null || error === void 0 ? void 0 : error.status} {error === null || error === void 0 ? void 0 : error.statusText} {error === null || error === void 0 ? void 0 : error.url}
            </div>)}
        </div>
      </div>);
    }
    return render();
}
//# sourceMappingURL=MessageLayout.jsx.map