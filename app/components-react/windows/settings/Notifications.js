import { Button } from 'antd';
import React from 'react';
import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
import { ObsSettingsSection } from './ObsSettings';
import { $t } from 'services/i18n';
import FormFactory from 'components-react/shared/inputs/FormFactory';
export function NotificationSettings() {
    const { NotificationsService, TroubleshooterService } = Services;
    const { notifValues, notifMeta, troubleValues, troubleMeta } = useVuex(() => ({
        notifValues: NotificationsService.views.settings,
        notifMeta: NotificationsService.views.metadata,
        troubleValues: TroubleshooterService.views.settings,
        troubleMeta: TroubleshooterService.views.metadata,
    }));
    function saveNotifSetting(key) {
        return (value) => {
            NotificationsService.actions.setSettings({ [key]: value });
        };
    }
    function saveTroubleshooterSetting(key) {
        return (value) => {
            TroubleshooterService.actions.setSettings({ [key]: value });
        };
    }
    function restoreDefaults() {
        NotificationsService.actions.restoreDefaultSettings();
        TroubleshooterService.actions.restoreDefaultSettings();
    }
    function showNotifications() {
        NotificationsService.actions.showNotifications();
    }
    return (React.createElement(React.Fragment, null,
        React.createElement(ObsSettingsSection, null,
            React.createElement("div", { style: { display: 'flex', justifyContent: 'space-evenly', paddingBottom: '16px' } },
                React.createElement(Button, { type: "primary", onClick: showNotifications }, $t('Show Notifications')),
                React.createElement(Button, { className: "button--soft-warning", onClick: restoreDefaults }, $t('Restore Defaults')))),
        React.createElement(ObsSettingsSection, null,
            React.createElement(FormFactory, { values: notifValues, metadata: notifMeta, onChange: saveNotifSetting })),
        React.createElement(ObsSettingsSection, { title: $t('Troubleshooter Notifications') },
            React.createElement(FormFactory, { values: troubleValues, metadata: troubleMeta, onChange: saveTroubleshooterSetting }))));
}
//# sourceMappingURL=Notifications.js.map