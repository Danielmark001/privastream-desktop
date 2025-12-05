import { Space } from 'antd';
import React from 'react';
export function ButtonGroup(p) {
    var _a;
    return (<div className={p === null || p === void 0 ? void 0 : p.className} style={Object.assign(Object.assign({}, p === null || p === void 0 ? void 0 : p.style), { textAlign: 'right', marginBottom: '8px' })}>
      <Space align={(_a = p === null || p === void 0 ? void 0 : p.align) !== null && _a !== void 0 ? _a : 'end'} direction={p === null || p === void 0 ? void 0 : p.direction} size={p === null || p === void 0 ? void 0 : p.size} split={p === null || p === void 0 ? void 0 : p.split} wrap={p === null || p === void 0 ? void 0 : p.wrap}>
        {p.children}
      </Space>
    </div>);
}
//# sourceMappingURL=ButtonGroup.jsx.map