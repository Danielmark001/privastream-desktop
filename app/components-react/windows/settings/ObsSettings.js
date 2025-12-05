import React, { useMemo, useState } from 'react';
import { ObsFormGroup } from '../../obs/ObsForm';
import Form from '../../shared/inputs/Form';
import Tabs from 'components-react/shared/Tabs';
import { Services } from '../../service-provider';
import { useVuex } from 'components-react/hooks';
import { useRealmObject } from 'components-react/hooks/realm';
export function useObsSettings(page) {
    const { SettingsService, NavigationService } = Services;
    const [display, setDisplay] = useState('horizontal');
    const category = useRealmObject(NavigationService.state).currentSettingsTab;
    const memoizedPage = useMemo(() => {
        if (page)
            return page;
        if (category)
            return category;
        return 'General';
    }, [page, category]);
    function saveSettings(newSettings) {
        SettingsService.actions.setSettings(memoizedPage, newSettings);
    }
    const { settingsFormData } = useVuex(() => {
        var _a, _b;
        return ({
            settingsFormData: (_b = (_a = SettingsService.state[memoizedPage]) === null || _a === void 0 ? void 0 : _a.formData) !== null && _b !== void 0 ? _b : {},
        });
    });
    return { settingsFormData, saveSettings, display, setDisplay };
}
export function ObsGenericSettingsForm(p) {
    const { settingsFormData, saveSettings, setDisplay } = useObsSettings(p.page);
    const showTabs = false;
    return (React.createElement(React.Fragment, null,
        showTabs && React.createElement(Tabs, { onChange: setDisplay }),
        React.createElement(ObsFormGroup, { value: settingsFormData, onChange: newSettings => saveSettings(newSettings), type: p === null || p === void 0 ? void 0 : p.type })));
}
export function ObsSettingsSection(p) {
    return (React.createElement("div", { className: "section", style: p.style },
        p.title && React.createElement("h2", null, p.title),
        React.createElement("div", { className: "section-content" },
            React.createElement(Form, { layout: "vertical" }, p.children))));
}
//# sourceMappingURL=ObsSettings.js.map