import React from 'react';
import { CommonPlatformFields } from '../CommonPlatformFields';
import Form from '../../../shared/inputs/Form';
import { createBinding, InputComponent } from '../../../shared/inputs';
import PlatformSettingsLayout from './PlatformSettingsLayout';
import GameSelector from '../GameSelector';
export const KickEditStreamInfo = InputComponent((p) => {
    function updateSettings(patch) {
        p.onChange(Object.assign(Object.assign({}, kickSettings), patch));
    }
    const kickSettings = p.value;
    const bind = createBinding(kickSettings, newKickSettings => updateSettings(newKickSettings));
    return (React.createElement(Form, { name: "kick-settings" },
        React.createElement(PlatformSettingsLayout, { layoutMode: p.layoutMode, commonFields: React.createElement(CommonPlatformFields, { key: "common", platform: "kick", layoutMode: p.layoutMode, value: kickSettings, onChange: updateSettings, layout: p.layout }), requiredFields: React.createElement(GameSelector, Object.assign({ key: "required", platform: 'kick' }, bind.game, { layout: p.layout })) })));
});
//# sourceMappingURL=KickEditStreamInfo.js.map