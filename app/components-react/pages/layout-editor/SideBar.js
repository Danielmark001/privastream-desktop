import React from 'react';
import styles from './LayoutEditor.m.less';
import { ELayoutElement, ELayout } from 'services/layout';
import { $t } from 'services/i18n';
import Scrollable from 'components-react/shared/Scrollable';
import { Services } from 'components-react/service-provider';
import { useLayoutEditor } from './hooks';
import { useRealmObject } from 'components-react/hooks/realm';
export default function SideBar() {
    const { LayoutService, CustomizationService } = Services;
    const { currentLayout, setCurrentLayout } = useLayoutEditor();
    const mode = useRealmObject(CustomizationService.state).isDarkTheme ? 'night' : 'day';
    function layoutImage(layout) {
        const active = currentLayout === layout ? '-active' : '';
        const className = LayoutService.views.className(layout);
        return require(`../../../../media/images/layouts/${mode}-${className}${active}.png`);
    }
    return (React.createElement("div", { className: styles.sideBar },
        React.createElement("div", null,
            React.createElement("div", { className: styles.title }, $t('Layouts')),
            React.createElement(Scrollable, { className: styles.layouts }, Object.values(ELayout).map(layout => (React.createElement("img", { key: layout, className: currentLayout === layout ? styles.active : '', onClick: () => setCurrentLayout(layout), src: layoutImage(layout) }))))),
        React.createElement(ElementList, null)));
}
function ElementList() {
    const { LayoutService } = Services;
    const { handleElementDrag } = useLayoutEditor();
    return (React.createElement("div", { className: styles.elementList },
        React.createElement("div", { className: styles.title }, $t('Elements')),
        React.createElement("div", { className: styles.subtitle }, $t('Drag and drop to edit.')),
        React.createElement(Scrollable, { className: styles.elementContainer }, Object.keys(ELayoutElement).map((element) => (React.createElement("div", { draggable: true, key: element, className: styles.elementCell, onDragEnd: (e) => handleElementDrag(e, ELayoutElement[element]) },
            React.createElement("i", { className: "fas fa-ellipsis-v" }),
            LayoutService.views.elementTitle(element)))))));
}
//# sourceMappingURL=SideBar.js.map