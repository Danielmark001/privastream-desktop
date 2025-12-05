import React from 'react';
import { Alert, Button, Collapse, Spin, Tabs } from 'antd';
import { $t } from '../../../services/i18n';
import { CodeInput, SwitchInput } from '../../shared/inputs';
import { useWidget } from './useWidget';
import Form from '../../shared/inputs/Form';
import { useOnCreate } from 'slap';
import { Services } from '../../service-provider';
import { getDefined } from '../../../util/properties-type-guards';
import { ModalLayout } from '../../shared/ModalLayout';
import { ButtonGroup } from '../../shared/ButtonGroup';
import { useCodeEditor } from './useCodeEditor';
import Utils from '../../../services/utils';
const { TabPane } = Tabs;
export function CustomCodeWindow() {
    const { sourceId, widgetSelectedTab } = useOnCreate(() => {
        const { WindowsService } = Services;
        const { sourceId } = getDefined(WindowsService.state.child.queryParams);
        const { selectedTab } = getDefined(WindowsService.state[Utils.getWindowId()].queryParams);
        return { sourceId, widgetSelectedTab: selectedTab };
    });
    const { selectedTab, selectTab, tabs, isLoading } = useCodeEditor({
        sourceId,
        shouldCreatePreviewSource: false,
        selectedTab: widgetSelectedTab,
    });
    return (React.createElement(ModalLayout, { footer: React.createElement(EditorFooter, null) },
        isLoading && React.createElement(Spin, { spinning: true }),
        !isLoading && (React.createElement(Tabs, { activeKey: selectedTab, onChange: selectTab }, tabs.map(tab => (React.createElement(TabPane, { tab: tab.label, key: tab.key },
            React.createElement(Editor, null))))))));
}
function EditorFooter() {
    const { canSave, saveCode, reset } = useCodeEditor();
    return (React.createElement(React.Fragment, null,
        canSave && (React.createElement(React.Fragment, null,
            React.createElement(Button, { danger: true, onClick: reset }, $t('Revert Changes')),
            React.createElement(Button, { type: "primary", onClick: saveCode }, $t('Save')))),
        !canSave && React.createElement(Button, { onClick: close }, $t('Close'))));
}
function Editor() {
    const { setCode, code, selectedTab } = useCodeEditor();
    if (selectedTab === 'json')
        return React.createElement(JsonEditor, null);
    return (React.createElement(React.Fragment, null,
        React.createElement(CodeInput, { lang: selectedTab, value: code, onChange: setCode, height: 570, nowrap: true }),
        React.createElement(Alert, { style: { marginTop: '7px' }, message: $t('Saving custom code can have potential security risks, make sure you trust the code you are about to apply.'), type: "warning", showIcon: true })));
}
function JsonEditor() {
    const { setCode, code, addCustomFields, removeCustomFields } = useCodeEditor();
    return (React.createElement(React.Fragment, null,
        React.createElement(ButtonGroup, null,
            !code && React.createElement(Button, { onClick: addCustomFields }, "Generate Custom Fields"),
            code && (React.createElement(Button, { danger: true, onClick: removeCustomFields }, "Remove Custom Fields"))),
        React.createElement(CodeInput, { lang: "json", value: code, onChange: setCode, height: 570, nowrap: true })));
}
export function CustomCodeSection() {
    const { isCustomCodeEnabled, customCode, updateCustomCode, openCustomCodeEditor } = useWidget();
    if (!customCode)
        return React.createElement(React.Fragment, null);
    return (React.createElement(Collapse, { bordered: false },
        React.createElement(Collapse.Panel, { header: $t('Custom Code'), key: 1 },
            React.createElement(Form, { layout: "horizontal" },
                React.createElement(SwitchInput, { label: $t('Enable Custom Code'), value: isCustomCodeEnabled, onChange: custom_enabled => updateCustomCode({ custom_enabled }) }),
                isCustomCodeEnabled && (React.createElement(ButtonGroup, null,
                    React.createElement(Button, { onClick: openCustomCodeEditor }, 'Edit Custom Code')))))));
}
//# sourceMappingURL=CustomCode.js.map