import React from 'react';
import PlatformSettingsLayout from './PlatformSettingsLayout';
import { createBinding } from '../../../shared/inputs';
import Form from '../../../shared/inputs/Form';
import { CommonPlatformFields } from '../CommonPlatformFields';
import GameSelector from '../GameSelector';
export function TrovoEditStreamInfo(p) {
    const trSettings = p.value;
    function updateSettings(patch) {
        p.onChange(Object.assign(Object.assign({}, trSettings), patch));
    }
    const bind = createBinding(trSettings, updatedSettings => updateSettings(updatedSettings));
    return (<Form name="trovo-settings">
      <PlatformSettingsLayout layoutMode={p.layoutMode} commonFields={<CommonPlatformFields key="common" platform="trovo" layoutMode={p.layoutMode} value={trSettings} onChange={updateSettings} layout={p.layout}/>} requiredFields={<GameSelector key="game" platform="trovo" {...bind.game} layout={p.layout}/>}/>
    </Form>);
}
//# sourceMappingURL=TrovoEditStreamInfo.jsx.map