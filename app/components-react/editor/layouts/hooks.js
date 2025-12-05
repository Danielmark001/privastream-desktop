import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
export class LayoutProps {
    constructor() {
        this.onTotalWidth = () => { };
    }
}
export default function useLayout(vectors, isColumns, childrenMins, onTotalWidth = () => { }) {
    const { CustomizationService, LayoutService } = Services;
    const { livedockSize, resizes, chatCollapsed } = useVuex(() => ({
        livedockSize: CustomizationService.state.livedockSize,
        resizes: LayoutService.views.currentTab.resizes,
        chatCollapsed: CustomizationService.state.livedockCollapsed,
    }));
    const [bars, setBars] = useState({
        bar1: 0,
        bar2: 0,
    });
    const mins = useMemo(() => {
        const [restSlots, bar1Slots, bar2Slots] = vectors;
        const rest = calculateMinimum(restSlots);
        const bar1 = calculateMinimum(bar1Slots);
        let bar2 = 0;
        if (bar2Slots)
            bar2 = calculateMinimum(bar2Slots);
        return { rest, bar1, bar2 };
    }, []);
    useEffect(() => {
        onTotalWidth(mapVectors(vectors), isColumns);
        updateSize();
        window.addEventListener('resize', () => updateSize());
        return () => {
            window.removeEventListener('resize', () => updateSize());
        };
    }, [chatCollapsed]);
    const componentEl = useRef(null);
    const componentRef = useCallback(node => {
        if (node) {
            componentEl.current = node;
            onTotalWidth(mapVectors(vectors), isColumns);
            updateSize();
        }
    }, []);
    function calculateMinimum(slots) {
        const mins = mapVectors(slots);
        return LayoutService.views.calculateMinimum(isColumns ? 'x' : 'y', mins);
    }
    function mapVectors(slots) {
        return slots.map(slot => {
            if (Array.isArray(slot))
                return mapVectors(slot);
            return minsFromSlot(slot);
        });
    }
    function minsFromSlot(slot) {
        if (!childrenMins || !childrenMins[slot])
            return { x: 0, y: 0 };
        return childrenMins[slot];
    }
    const getBarPixels = useCallback((bar, offset) => {
        if (!componentEl.current)
            return;
        const migratedResize = resizes[bar] >= 1 ? setBar(bar, resizes[bar]) : resizes[bar];
        const { height, width } = componentEl.current.getBoundingClientRect();
        const offsetSize = isColumns ? width - offset : height;
        return Math.round(offsetSize * migratedResize);
    }, []);
    const setBar = useCallback((bar, val) => {
        if (val === 0 || !componentEl.current)
            return;
        setBars(oldState => (Object.assign(Object.assign({}, oldState), { [bar]: val })));
        const { height, width } = componentEl.current.getBoundingClientRect();
        const totalSize = isColumns ? width : height;
        const proportion = parseFloat((val / totalSize).toFixed(2));
        LayoutService.actions.setBarResize(bar, proportion);
        return proportion;
    }, []);
    const updateSize = useCallback((chatCollapsed = true, oldChatCollapsed) => {
        let offset = chatCollapsed ? 0 : livedockSize;
        if (chatCollapsed && oldChatCollapsed === false) {
            offset = livedockSize * -1;
        }
        const bar1 = getBarPixels('bar1', offset);
        if (bar1)
            setBar('bar1', bar1);
        if (mins.bar2) {
            const bar2 = getBarPixels('bar2', offset);
            if (bar2)
                setBar('bar2', bar2);
        }
    }, []);
    const calculateMax = useCallback((restMin) => {
        if (!componentEl.current)
            return 0;
        const { height, width } = componentEl.current.getBoundingClientRect();
        const max = isColumns ? width : height;
        return max - restMin;
    }, []);
    return { componentRef, calculateMax, setBar, mins, bars, resizes };
}
//# sourceMappingURL=hooks.js.map