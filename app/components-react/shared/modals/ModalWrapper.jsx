import React from 'react';
import Animation from 'rc-animate';
export default function ModalWrapper(p) {
    return (<div style={{ position: 'absolute' }}>
      <Animation transitionName="antd-fade">{(p === null || p === void 0 ? void 0 : p.renderFn) && p.renderFn()}</Animation>
    </div>);
}
//# sourceMappingURL=ModalWrapper.jsx.map