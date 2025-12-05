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
    return (<>
      {showTabs && <Tabs onChange={setDisplay}/>}
      <ObsFormGroup value={settingsFormData} onChange={newSettings => saveSettings(newSettings)} type={p === null || p === void 0 ? void 0 : p.type}/>
    </>);
}
export function ObsSettingsSection(p) {
    return (<div className="section" style={p.style}>
      {p.title && <h2>{p.title}</h2>}
      <div className="section-content">
        <Form layout="vertical">{p.children}</Form>
      </div>
    </div>);
}
//# sourceMappingURL=ObsSettings.jsx.map