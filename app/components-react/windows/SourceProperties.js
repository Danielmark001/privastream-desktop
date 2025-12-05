import React, { useMemo, useState } from 'react';
import { Services } from '../service-provider';
import { ObsForm } from '../obs/ObsForm';
import { ModalLayout } from '../shared/ModalLayout';
import Display from '../shared/Display';
import { assertIsDefined } from '../../util/properties-type-guards';
import { useSubscription } from '../hooks/useSubscription';
export default function SourceProperties() {
    const { WindowsService, SourcesService, EditorCommandsService, UsageStatisticsService, } = Services;
    const source = useMemo(() => {
        const { sourceId } = WindowsService.getChildWindowQueryParams();
        return SourcesService.views.getSource(sourceId);
    }, []);
    const [properties, setProperties] = useState(() => source ? source.getPropertiesFormData() : []);
    useSubscription(SourcesService.sourceRemoved, removedSource => {
        if (source && removedSource.sourceId !== source.sourceId)
            return;
        WindowsService.actions.closeChildWindow();
    });
    useSubscription(SourcesService.sourceUpdated, updatedSource => {
        if (source && updatedSource.sourceId !== source.sourceId)
            return;
        setProperties(source.getPropertiesFormData());
    });
    function onChangeHandler(formData, changedInd) {
        assertIsDefined(source);
        if (formData[changedInd].name === 'video_config') {
            UsageStatisticsService.actions.recordFeatureUsage('DShowConfigureVideo');
        }
        EditorCommandsService.executeCommand('EditSourcePropertiesCommand', source.sourceId, [
            formData[changedInd],
        ]);
    }
    const extraProps = {};
    if (source && source.type === 'browser_source') {
        extraProps['url'] = { debounce: 1000 };
    }
    return (React.createElement(ModalLayout, { scrollable: true, fixedChild: source && React.createElement(Display, { sourceId: source.sourceId, style: { position: 'relative' } }) },
        React.createElement(ObsForm, { value: properties, onChange: onChangeHandler, extraProps: extraProps, layout: "horizontal" })));
}
//# sourceMappingURL=SourceProperties.js.map