import { Button, Col, Collapse, Layout, Row, Spin } from 'antd';
import React from 'react';
import { useWidget } from './useWidget';
import Display from '../../shared/Display';
import css from './WidgetLayout.m.less';
import Form, { useForm } from '../../shared/inputs/Form';
import { ObsForm } from '../../obs/ObsForm';
import { $t } from '../../../services/i18n';
import { CustomCodeSection } from './CustomCode';
import { CustomFieldsSection } from './CustomFields';
import { RollbackOutlined } from '@ant-design/icons';
import { assertIsDefined } from '../../../util/properties-type-guards';
const { Content, Header, Sider } = Layout;
const MENU_WIDTH = 270;
const PREVIEW_HEIGHT = 250;
export function WidgetLayout(p) {
    const layout = p.layout || 'basic';
    switch (layout) {
        case 'basic':
            return React.createElement(BasicLayout, null, p.children);
        case 'long-menu':
            return React.createElement(LongMenuLayout, null, p.children);
    }
}
function BasicLayout(p) {
    const { isLoading } = useWidget();
    const { MenuPanel, ContentPanel } = getLayoutPanels(p.children);
    return (React.createElement(Layout, { className: css.widgetLayout },
        React.createElement(Header, { style: { padding: 0, height: `${PREVIEW_HEIGHT}px` } },
            React.createElement(ModalDisplay, null)),
        React.createElement(Content, null,
            React.createElement(Row, { style: { height: '100%', borderTop: '1px solid var(--border)' } },
                MenuPanel && React.createElement(Col, { className: css.menuWrapper }, !isLoading && MenuPanel),
                React.createElement(Col, { flex: "auto", className: css.contentWrapper },
                    React.createElement(ModalContent, null, ContentPanel)))),
        React.createElement(ModalFooter, null)));
}
function LongMenuLayout(p) {
    const { isLoading } = useWidget();
    const { MenuPanel, ContentPanel } = getLayoutPanels(p.children);
    const wrapperStyle = {
        height: `calc(100% - ${PREVIEW_HEIGHT}px)`,
        borderTop: '1px solid var(--border)',
    };
    assertIsDefined(MenuPanel);
    return (React.createElement(Layout, { className: css.widgetLayout },
        React.createElement(Layout, null,
            React.createElement(Sider, { className: css.menuWrapper, width: MENU_WIDTH }, !isLoading && MenuPanel),
            React.createElement(Content, null,
                React.createElement(ModalDisplay, null),
                React.createElement("div", { className: css.contentWrapper, style: wrapperStyle },
                    React.createElement(ModalContent, null, ContentPanel)))),
        React.createElement(ModalFooter, null)));
}
function ModalContent(p) {
    const ContentPanel = p.children;
    const { isLoading, selectedTab, config, hasCustomFields } = useWidget();
    const form = useForm();
    return (React.createElement(Form, { form: form, layout: "horizontal" },
        React.createElement(Spin, { spinning: isLoading }, !isLoading && (React.createElement(React.Fragment, null,
            ContentPanel,
            selectedTab === 'general' && React.createElement(BrowserSourceSettings, null),
            config.customCodeAllowed && React.createElement(CustomCodeSection, null),
            hasCustomFields && React.createElement(CustomFieldsSection, null))))));
}
function ModalFooter() {
    const { canRevert, revertChanges, close } = useWidget();
    return (React.createElement("div", { className: "ant-modal-footer" },
        canRevert && (React.createElement(Button, { onClick: revertChanges, type: "ghost", style: { position: 'absolute', left: '16px' } },
            React.createElement(RollbackOutlined, null),
            $t('Revert Changes'))),
        React.createElement(Button, { onClick: close }, $t('Close'))));
}
function ModalDisplay() {
    const { previewSourceId, isLoading } = useWidget();
    return (React.createElement("div", { style: { height: `${PREVIEW_HEIGHT}px`, backgroundColor: 'var(--section)' } }, !isLoading && React.createElement(Display, { sourceId: previewSourceId })));
}
function BrowserSourceSettings() {
    const { browserSourceProps, updateBrowserSourceProps } = useWidget();
    return (React.createElement(React.Fragment, null,
        React.createElement(Collapse, { bordered: false },
            React.createElement(Collapse.Panel, { header: $t('Browser Settings'), key: 1 },
                React.createElement(ObsForm, { value: browserSourceProps, onChange: updateBrowserSourceProps, layout: "horizontal" })))));
}
function getLayoutPanels(layoutChildren) {
    let MenuPanel;
    let ContentPanel;
    if (Array.isArray(layoutChildren)) {
        [MenuPanel, ContentPanel] = layoutChildren;
    }
    else {
        [MenuPanel, ContentPanel] = [null, layoutChildren];
    }
    return { MenuPanel, ContentPanel };
}
//# sourceMappingURL=WidgetLayout.js.map