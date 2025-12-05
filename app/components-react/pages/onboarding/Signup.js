import React from 'react';
import { $t } from 'services/i18n';
import Translate from 'components-react/shared/Translate';
import PlatformButton from 'components-react/shared/PlatformButton';
import styles from './Signup.m.less';
import { Services } from 'components-react/service-provider';
import { EPlatformCallResult } from 'services/platforms';
export default function Signup({ onSignupLinkClick, onSuccess, }) {
    const { UserService } = Services;
    const openSLIDSignup = () => UserService.startSLAuth({ signup: true })
        .then((success) => {
        if (success !== EPlatformCallResult.Success)
            return;
        onSuccess();
    })
        .catch(e => console.error('Signup Error: ', e));
    return (React.createElement(React.Fragment, null,
        React.createElement("p", { className: styles.signupSubtitle }, $t('Create an account to unlock the most useful features like Streaming, Themes, Highlighter, App Store, Collab Cam and more!')),
        React.createElement(PlatformButton, { platform: "streamlabs", onClick: openSLIDSignup },
            React.createElement(Translate, { message: $t('Create a <span>Streamlabs ID</span>') },
                React.createElement("span", { slot: "span", style: { fontWeight: 'bold' } }))),
        React.createElement("span", { className: styles.signupTextContainer },
            React.createElement(Translate, { message: $t('Already have an account? <span>Login</span>') },
                React.createElement("a", { slot: "span", style: { textDecoration: 'underline' }, onClick: onSignupLinkClick })))));
}
//# sourceMappingURL=Signup.js.map