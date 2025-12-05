import React, { useMemo, useState } from 'react';
import { useObsSettings } from './ObsSettings';
import { ObsCollapsibleFormGroup, ObsForm, } from 'components-react/obs/ObsForm';
import Tabs from 'components-react/shared/Tabs';
import { $t } from 'services/i18n';
import cloneDeep from 'lodash/cloneDeep';
export function OutputSettings() {
    const { settingsFormData, saveSettings } = useObsSettings('Output');
    const type = settingsFormData[0].parameters[0].currentValue === 'Simple' ? 'collapsible' : 'tabs';
    function onChange(formData, ind) {
        const newVal = cloneDeep(settingsFormData);
        newVal[ind].parameters = formData;
        saveSettings(newVal);
    }
    const sections = settingsFormData.filter(section => section.parameters.filter(p => p.visible).length);
    return (React.createElement("div", { className: "form-groups", style: { paddingBottom: '12px' } },
        type === 'tabs' && React.createElement(ObsTabbedOutputFormGroup, { sections: sections, onChange: onChange }),
        type === 'collapsible' && (React.createElement(ObsCollapsibleFormGroup, { sections: sections, onChange: onChange }))));
}
export function ObsTabbedOutputFormGroup(p) {
    const tabs = useMemo(() => {
        const filtered = p.sections
            .filter(sectionProps => sectionProps.nameSubCategory !== 'Untitled')
            .filter(sectionProps => !sectionProps.nameSubCategory.startsWith('Audio - Track'))
            .map(sectionProps => sectionProps.nameSubCategory);
        filtered.splice(2, 0, 'Audio');
        return filtered;
    }, [p.sections]);
    const [currentTab, setCurrentTab] = useState(p.sections[1].nameSubCategory);
    return (React.createElement("div", { className: "section", key: "tabbed-section", style: { marginBottom: '24px' } }, p.sections.map((sectionProps, ind) => (React.createElement("div", { className: "section-content", key: `${sectionProps.nameSubCategory}${ind}` },
        sectionProps.nameSubCategory === 'Untitled' && (React.createElement(React.Fragment, null,
            React.createElement(ObsForm, { value: sectionProps.parameters, onChange: formData => p.onChange(formData, ind) }),
            React.createElement(Tabs, { tabs: tabs, onChange: setCurrentTab, style: { marginBottom: '24px' } }))),
        sectionProps.nameSubCategory === currentTab && (React.createElement(ObsForm, { name: sectionProps.nameSubCategory, value: sectionProps.parameters, onChange: formData => p.onChange(formData, ind) })),
        currentTab === 'Audio' && sectionProps.nameSubCategory.startsWith('Audio - Track') && (React.createElement("div", { style: {
                backgroundColor: 'var(--section-wrapper)',
                padding: '15px',
                marginBottom: '30px',
                borderRadius: '5px',
            } },
            React.createElement("h2", { className: "section-title" }, $t(sectionProps.nameSubCategory)),
            React.createElement(ObsForm, { value: sectionProps.parameters, onChange: formData => p.onChange(formData, ind) }))))))));
}
//# sourceMappingURL=Output.js.map