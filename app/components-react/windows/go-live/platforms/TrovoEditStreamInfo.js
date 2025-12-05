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
    return (React.createElement(Form, { name: "trovo-settings" },
        React.createElement(PlatformSettingsLayout, { layoutMode: p.layoutMode, commonFields: React.createElement(CommonPlatformFields, { key: "common", platform: "trovo", layoutMode: p.layoutMode, value: trSettings, onChange: updateSettings, layout: p.layout }), requiredFields: React.createElement(GameSelector, Object.assign({ key: "game", platform: "trovo" }, bind.game, { layout: p.layout })) })));
}
//# sourceMappingURL=TrovoEditStreamInfo.js.map