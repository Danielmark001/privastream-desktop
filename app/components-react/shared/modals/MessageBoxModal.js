import React from 'react';
import { WindowsService } from 'services/windows';
import styles from './MessageBoxModal.m.less';
export default function MessageBoxModal(p) {
    return (React.createElement("div", { className: styles.wrapper },
        React.createElement("div", { className: styles.header },
            React.createElement("i", { className: "icon-close", onClick: () => WindowsService.hideModal() })),
        React.createElement("div", { className: styles.contentWrapper },
            React.createElement("div", { className: styles.content }, p.children))));
}
//# sourceMappingURL=MessageBoxModal.js.map