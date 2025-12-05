import React, { useState } from 'react';
import cx from 'classnames';
import styles from './LayoutEditor.m.less';
import { ELayoutElement } from 'services/layout';
import { $t } from 'services/i18n';
import { Services } from 'components-react/service-provider';
import { TextInput } from 'components-react/shared/inputs';
import { useLayoutEditor } from './hooks';
import TopBar from './TopBar';
import SideBar from './SideBar';
import AddTabModal from './AddTabModal';
export default function LayoutEditor() {
    const { LayoutService } = Services;
    const { currentLayout, showModal } = useLayoutEditor();
    return (React.createElement("div", { style: { flexDirection: 'column', width: '100%' } },
        React.createElement(TopBar, null),
        React.createElement("div", { className: styles.editorContainer },
            React.createElement(SideBar, null),
            React.createElement("div", { className: cx(styles.templateContainer, styles[LayoutService.views.className(currentLayout)]) },
                React.createElement(DisplayedLayout, null))),
        showModal && (React.createElement("div", { className: styles.modalBackdrop },
            React.createElement(AddTabModal, null)))));
}
function DisplayedLayout() {
    const { LayoutService } = Services;
    const { slottedElements, currentLayout, browserUrl, setBrowserUrl, handleElementDrag, } = useLayoutEditor();
    const [canDragSlot, setCanDragSlot] = useState(true);
    const [highlightedSlot, setHighlightedSlot] = useState(null);
    function elementInSlot(slot) {
        return Object.keys(slottedElements).find((el) => { var _a; return ((_a = slottedElements[el]) === null || _a === void 0 ? void 0 : _a.slot) === slot; });
    }
    function classForSlot(slot) {
        const layout = LayoutService.views.className(currentLayout);
        return cx(styles.placementZone, styles[`${layout}${slot}`], {
            [styles.occupied]: elementInSlot(slot),
            [styles.highlight]: highlightedSlot === slot,
        });
    }
    return (React.createElement(React.Fragment, null, ['1', '2', '3', '4', '5', '6'].map((slot) => (React.createElement("div", { className: classForSlot(slot), id: slot, key: slot, draggable: elementInSlot(slot) && canDragSlot, onDragEnter: () => setHighlightedSlot(slot), onDragExit: () => setHighlightedSlot(null), onDragEnd: (e) => handleElementDrag(e, ELayoutElement[elementInSlot(slot)]) },
        React.createElement("span", null, LayoutService.views.elementTitle(elementInSlot(slot))),
        elementInSlot(slot) === ELayoutElement.Browser && (React.createElement("div", { className: styles.urlInput },
            React.createElement(TextInput, { value: browserUrl, onChange: setBrowserUrl, onFocus: () => setCanDragSlot(false), onBlur: () => setCanDragSlot(true), placeholder: $t('Enter Target URL'), nowrap: true }))))))));
}
//# sourceMappingURL=LayoutEditor.js.map