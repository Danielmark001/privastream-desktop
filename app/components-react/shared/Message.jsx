import React from 'react';
import ExclamationCircleOutlined from '@ant-design/icons';
export default function Message(p) {
    const type = p.type;
    const classProp = `ant-message-custom-content ant-message-${type}`;
    return (<div className={classProp}>
      {type === 'warning' && <ExclamationCircleOutlined color="orange"/>} {p.children}
    </div>);
}
//# sourceMappingURL=Message.jsx.map