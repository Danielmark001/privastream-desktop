import React, { useState } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
export default function Scrollable(initialProps) {
    const p = Object.assign({ snapToWindowEdge: false, isResizable: true }, initialProps);
    const [wrapperStyles, setWrapperStyles] = useState({});
    function onOverflowChanged(ev) {
        if (!ev)
            return;
        if (p.snapToWindowEdge && ev.yScrollable) {
            setWrapperStyles({ marginRight: '-24px', paddingRight: '24px' });
        }
        else {
            setWrapperStyles({});
        }
    }
    return (<OverlayScrollbarsComponent style={Object.assign(Object.assign({}, p.style), wrapperStyles)} options={{
            autoUpdate: true,
            autoUpdateInterval: 200,
            className: p.className,
            sizeAutoCapable: p.autoSizeCapable,
            scrollbars: { clickScrolling: true },
            overflowBehavior: { x: (p.horizontal ? 'scroll' : 'hidden') },
            callbacks: {
                onOverflowChanged,
            },
        }} onContextMenu={p.onContextMenu}>
      {p.children}
    </OverlayScrollbarsComponent>);
}
//# sourceMappingURL=Scrollable.jsx.map