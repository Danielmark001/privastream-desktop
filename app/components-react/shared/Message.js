import React from 'react';
import ExclamationCircleOutlined from '@ant-design/icons';
export default function Message(p) {
    const type = p.type;
    const classProp = `ant-message-custom-content ant-message-${type}`;
    return (React.createElement("div", { className: classProp },
        type === 'warning' && React.createElement(ExclamationCircleOutlined, { color: "orange" }),
        " ",
        p.children));
}
//# sourceMappingURL=Message.js.map