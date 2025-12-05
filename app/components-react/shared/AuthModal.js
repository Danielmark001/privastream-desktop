import React from 'react';
import { Button, Form, Modal } from 'antd';
import styles from './AuthModal.m.less';
import { $t } from 'services/i18n';
import { Services } from 'components-react/service-provider';
import cx from 'classnames';
export function AuthModal(p) {
    const title = (p === null || p === void 0 ? void 0 : p.title) || Services.UserService.isLoggedIn ? $t('Log Out') : $t('Login');
    const prompt = p === null || p === void 0 ? void 0 : p.prompt;
    const confirm = (p === null || p === void 0 ? void 0 : p.confirm) || $t('Yes');
    const cancel = (p === null || p === void 0 ? void 0 : p.cancel) || $t('No');
    return (React.createElement(Modal, { footer: null, visible: p.showModal, onCancel: () => p.handleShowModal(false), getContainer: false, className: cx(styles.authModalWrapper, p === null || p === void 0 ? void 0 : p.className) },
        React.createElement(Form, { id: p === null || p === void 0 ? void 0 : p.id, className: styles.authModal },
            React.createElement("h2", null, title),
            prompt,
            React.createElement("div", { className: styles.buttons },
                React.createElement(Button, { onClick: p.handleAuth }, confirm),
                React.createElement(Button, { onClick: () => p.handleShowModal(false) }, cancel)))));
}
//# sourceMappingURL=AuthModal.js.map