import React from 'react';
import styles from './DismissableBadge.m.less';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import cx from 'classnames';
import { $t } from 'services/i18n';
export default function DismissableBadge({ content = 'New', dismissableKey, size = 'standard', absolute = false, style, className, }) {
    const { DismissablesService } = Services;
    const { shouldShow } = useVuex(() => ({
        shouldShow: !dismissableKey || DismissablesService.views.shouldShow(dismissableKey),
    }));
    if (!shouldShow)
        return React.createElement(React.Fragment, null);
    return (React.createElement("div", { className: cx(className, styles.badge, styles.dismissableBadge, { [styles.absolute]: absolute }, { [styles.small]: size === 'small' }), style: style }, typeof content === 'string' ? $t(content) : content));
}
//# sourceMappingURL=DismissableBadge.js.map