import React from 'react';
import { Button } from 'antd';
import cx from 'classnames';
import PlatformLogo from './PlatformLogo';
import styles from './PlatformButton.m.less';
const loadingIcon = React.createElement("i", { className: "fas fa-spinner fa-spin" });
export const PlatformIconButton = ({ platform, logo, logoSize, title, onClick, disabled, loading, name, }) => {
    const icon = platform ? (React.createElement(PlatformLogo, { platform: platform, size: logoSize, className: styles.platformIcon })) : (React.createElement("img", { src: logo }));
    return (React.createElement(Button, { "data-testid": `platform-icon-button-${name}`, className: cx(styles.platformIconButton, platform ? `platform-icon-button--${platform}` : ''), onClick: onClick, disabled: disabled, icon: loading ? loadingIcon : icon, title: title }));
};
export default function PlatformButton({ disabled = false, loading = false, platform, logoSize, className, children, onClick, }) {
    const logoProps = platform === 'streamlabs' ? { color: 'black' } : {};
    const Loading = () => React.createElement("i", { className: "fas fa-spinner fa-spin" });
    const Logo = () => (React.createElement(PlatformLogo, Object.assign({ platform: platform, size: logoSize, className: styles.platformIcon }, logoProps)));
    return (React.createElement(Button, { size: "large", className: cx([styles.platformButton, styles[`platform-button--${platform}`], className]), onClick: onClick, disabled: disabled },
        loading ? React.createElement(Loading, null) : React.createElement(Logo, null),
        children,
        React.createElement("i", { className: cx('fa fa-arrow-right', styles.arrowIcon), "aria-hidden": "true" })));
}
//# sourceMappingURL=PlatformButton.js.map