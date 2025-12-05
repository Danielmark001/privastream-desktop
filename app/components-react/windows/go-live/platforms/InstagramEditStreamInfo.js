import React from 'react';
import { Alert, Button } from 'antd';
import { clipboard } from 'electron';
import { TextInput, createBinding } from '../../../shared/inputs';
import Form from '../../../shared/inputs/Form';
import { $t } from 'services/i18n';
export function InstagramEditStreamInfo(p) {
    const bind = createBinding(p.value, updatedSettings => p.onChange(Object.assign(Object.assign({}, p.value), updatedSettings)));
    const { isStreamSettingsWindow } = p;
    const streamKeyLabel = $t(isStreamSettingsWindow ? 'Stream Key' : 'Instagram Stream Key');
    const streamUrlLabel = $t(isStreamSettingsWindow ? 'Stream URL' : 'Instagram Stream URL');
    return (React.createElement(Form, { name: "instagram-settings" },
        React.createElement(TextInput, Object.assign({}, bind.streamUrl, { required: true, label: streamUrlLabel, addonAfter: React.createElement(PasteButton, { onPaste: bind.streamUrl.onChange }), layout: p.layout, size: "large" })),
        React.createElement(TextInput, Object.assign({}, bind.streamKey, { required: true, label: streamKeyLabel, isPassword: true, placeholder: $t('Remember to update your Stream Key'), addonAfter: React.createElement(PasteButton, { onPaste: bind.streamKey.onChange }), layout: p.layout, size: "large" })),
        !isStreamSettingsWindow && (React.createElement(Alert, { style: { marginBottom: 8 }, message: $t('Remember to open Instagram in browser and click "Go Live" to start streaming!'), type: "warning", showIcon: true, closable: true }))));
}
function PasteButton({ onPaste }) {
    return (React.createElement(Button, { title: $t('Paste'), onClick: () => onPaste(clipboard.readText()) },
        React.createElement("i", { className: "fa fa-paste" })));
}
//# sourceMappingURL=InstagramEditStreamInfo.js.map