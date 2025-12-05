import React from 'react';
import cx from 'classnames';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import styles from './HelpTip.m.less';
export default function HelpTip(props) {
    const p = Object.assign({ tipPosition: 'left', arrowPosition: 'top' }, props);
    const { DismissablesService } = Services;
    const { shouldShow } = useVuex(() => ({
        shouldShow: DismissablesService.views.shouldShow(p.dismissableKey),
    }));
    function closeHelpTip() {
        DismissablesService.actions.dismiss(p.dismissableKey);
    }
    if (!shouldShow)
        return React.createElement(React.Fragment, null);
    return (React.createElement("div", { className: styles.helpTip, style: p.position },
        p.arrowPosition === 'top' && (React.createElement("div", { className: cx(styles.helpTipArrow, {
                [styles.helpTipArrowRight]: p.tipPosition === 'right',
            }) })),
        React.createElement("i", { onClick: closeHelpTip, className: cx(styles.helpTipClose, 'icon-close') }),
        React.createElement("div", { className: styles.helpTipTitle },
            React.createElement("i", { className: "fa fa-info-circle" }),
            p.title),
        React.createElement("div", { className: styles.helpTipBody }, p.children),
        p.arrowPosition === 'bottom' && (React.createElement("div", { className: cx(styles.helpTipArrow, styles.helpTipArrowBottom, {
                [styles.helpTipArrowRight]: p.tipPosition === 'right',
            }) }))));
}
//# sourceMappingURL=HelpTip.js.map