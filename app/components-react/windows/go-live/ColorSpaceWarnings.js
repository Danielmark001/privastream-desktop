import React from 'react';
import { Alert } from 'antd';
export default function ColorSpaceWarnings({ warnings }) {
    return React.createElement(Alert, { type: "warning", message: warnings, closable: true, style: { marginBottom: 16 } });
}
//# sourceMappingURL=ColorSpaceWarnings.js.map