import React, { useRef } from 'react';
import StudioEditor from 'components-react/root/StudioEditor';
import useBaseElement from './hooks';
const mins = { x: 0, y: 0 };
export function Display() {
    const containerRef = useRef(null);
    const { renderElement } = useBaseElement(React.createElement(StudioEditor, null), mins, containerRef.current);
    return (React.createElement("div", { ref: containerRef, style: { height: '100%' } }, renderElement()));
}
Display.mins = mins;
//# sourceMappingURL=Display.js.map