import React from 'react';
import styles from './InfoBadge.m.less';
import { $t } from 'services/i18n';
import cx from 'classnames';
export default function InfoBadge(p) {
    return (React.createElement("div", { className: cx(styles.infoBadge, p.hasMargin && styles.margin, p.className), style: p.style }, typeof p.content === 'string' ? $t(p.content) : p.content));
}
//# sourceMappingURL=InfoBadge.js.map