import React, { useMemo } from 'react';
import * as elements from 'components-react/editor/elements';
import * as layouts from 'components-react/editor/layouts';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
export default function Studio(p) {
    const { LayoutService } = Services;
    function totalWidthHandler(slots, isColumns) {
        if (isColumns) {
            p.onTotalWidth(LayoutService.views.calculateColumnTotal(slots));
        }
        else {
            p.onTotalWidth(LayoutService.views.calculateMinimum('x', slots));
        }
    }
    const { elementsToRender, slottedElements, layout, currentTab } = useVuex(() => ({
        elementsToRender: LayoutService.views.elementsToRender,
        slottedElements: LayoutService.views.currentTab.slottedElements,
        layout: LayoutService.views.component,
        currentTab: LayoutService.views.currentTab,
    }));
    const Layout = layouts[layout];
    const { children, childrenMins } = useMemo(() => {
        const children = {};
        const childrenMins = {};
        elementsToRender.forEach((el) => {
            var _a;
            const componentName = LayoutService.views.elementComponent(el);
            const Component = elements[componentName];
            const slot = (_a = slottedElements[el]) === null || _a === void 0 ? void 0 : _a.slot;
            if (slot && Component) {
                children[slot] = React.createElement(Component, null);
                childrenMins[slot] = Component.mins;
            }
        });
        return { children, childrenMins };
    }, [currentTab]);
    return (React.createElement(Layout, { className: p.className, "data-name": "editor-page", childrenMins: childrenMins, onTotalWidth: (slots, isColumns) => totalWidthHandler(slots, isColumns) }, children));
}
//# sourceMappingURL=Studio.js.map