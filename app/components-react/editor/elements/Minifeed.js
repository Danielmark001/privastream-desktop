import React, { useRef } from 'react';
import RecentEvents from './RecentEvents';
import useBaseElement from './hooks';
const mins = { x: 330, y: 90 };
export function MiniFeed() {
    const containerRef = useRef(null);
    const { renderElement } = useBaseElement(React.createElement(RecentEvents, { isOverlay: false }), mins, containerRef.current);
    return (React.createElement("div", { ref: containerRef, style: { height: '100%' } }, renderElement()));
}
MiniFeed.mins = mins;
//# sourceMappingURL=Minifeed.js.map