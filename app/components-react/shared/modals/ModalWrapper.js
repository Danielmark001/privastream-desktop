import React from 'react';
import Animation from 'rc-animate';
export default function ModalWrapper(p) {
    return (React.createElement("div", { style: { position: 'absolute' } },
        React.createElement(Animation, { transitionName: "antd-fade" }, (p === null || p === void 0 ? void 0 : p.renderFn) && p.renderFn())));
}
//# sourceMappingURL=ModalWrapper.js.map