var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useState } from 'react';
import * as remote from '@electron/remote';
import { useVuex } from '../../hooks';
import { Services } from '../../service-provider';
import { alertAsync, confirmAsync } from '../../modals';
import { $t } from '../../../services/i18n';
import { ObsSettingsSection } from './ObsSettings';
import { CheckboxInput, TextInput } from '../../shared/inputs';
import { getOS, OS } from 'util/operating-systems';
import { Button } from 'antd';
import cx from 'classnames';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
export function Support() {
    return (React.createElement("div", null,
        React.createElement(SupportLinks, null),
        React.createElement(DiagnosticReport, null),
        React.createElement(CacheSettings, null),
        getOS() === OS.Windows && React.createElement(CrashReporting, null)));
}
function SupportLinks() {
    const { UrlService } = Services;
    function openLink(link) {
        remote.shell.openExternal(link);
    }
    return (React.createElement(ObsSettingsSection, { title: $t('Support Links') },
        React.createElement("div", { className: "input-container" },
            React.createElement("a", { className: "link", onClick: () => openLink(UrlService.supportLink) },
                React.createElement("i", { className: "icon-question" }),
                " ",
                React.createElement("span", null, $t('Streamlabs Support')))),
        React.createElement("div", { className: "input-container" },
            React.createElement("a", { className: "link", onClick: () => openLink('https://discord.gg/stream') },
                React.createElement("i", { className: "icon-discord" }),
                " ",
                React.createElement("span", null, $t('Community Discord'))))));
}
function DiagnosticReport() {
    const { DiagnosticsService } = Services;
    const [uploading, setUploading] = useState(false);
    function uploadReport() {
        setUploading(true);
        DiagnosticsService.actions.return
            .uploadReport()
            .then(r => {
            remote.clipboard.writeText(r.report_code);
            alertAsync({
                icon: React.createElement(CheckCircleOutlined, { style: { color: 'var(--teal)' } }),
                width: 550,
                getContainer: '#mainWrapper',
                className: 'react',
                title: $t('Diagnostic Report Uploaded Successfully'),
                content: (React.createElement("div", null,
                    $t('The diagnostic report was securely uploaded, and the Report ID below has been copied to your clipboard. Please provide the Report ID to the Streamlabs Streamer Success Team.'),
                    React.createElement(TextInput, { readOnly: true, style: { marginTop: 20, marginLeft: -10 }, value: r.report_code, addonAfter: React.createElement(Button, { onClick: () => remote.clipboard.writeText(r.report_code) }, $t('Copy')) }))),
            });
        })
            .catch(e => {
            console.error('Error generating diagnostic report', e);
            alertAsync({
                icon: React.createElement(ExclamationCircleOutlined, { style: { color: 'var(--red)' } }),
                getContainer: '#mainWrapper',
                className: 'react',
                title: $t('Error Uploading Diagnostic Report'),
                content: $t('There was an error uploading the diagnostic report. Please try again, and let the Streamlabs Streamer Success team know if the issue persists.'),
            });
        })
            .finally(() => setUploading(false));
    }
    return (React.createElement(ObsSettingsSection, { title: $t('Diagnostic Report') },
        $t('The diagnostic report is an automatically generated report that contains information about your system and configuration. Clicking the upload button below will generate and securely transmit a diagnostic report to the Streamlabs team.'),
        React.createElement(Button, { style: { margin: '20px 0' }, onClick: uploadReport, disabled: uploading },
            React.createElement("i", { className: cx('fa', { 'fa-upload': !uploading, 'fa-spinner fa-pulse': uploading }), style: { marginRight: 8 } }),
            $t('Upload Diagnostic Report'))));
}
function CacheSettings() {
    const { AppService, CacheUploaderService } = Services;
    const [cacheUploading, setCacheUploading] = useState(false);
    function showCacheDir() {
        return __awaiter(this, void 0, void 0, function* () {
            yield remote.shell.openPath(AppService.appDataDirectory);
        });
    }
    function deleteCacheDir() {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield confirmAsync($t('WARNING! You will lose all stream and encoder settings. If you are logged in, your scenes and sources will be restored from the cloud. This cannot be undone.'))) {
                remote.app.relaunch({ args: ['--clearCacheDir'] });
                remote.app.quit();
            }
        });
    }
    function uploadCacheDir() {
        if (cacheUploading)
            return;
        setCacheUploading(true);
        CacheUploaderService.uploadCache().then(file => {
            remote.clipboard.writeText(file);
            alert($t('Your cache directory has been successfully uploaded.  ' +
                'The file name %{file} has been copied to your clipboard.', { file }));
            setCacheUploading(false);
        });
    }
    return (React.createElement(ObsSettingsSection, { title: $t('Cache Directory') },
        React.createElement("p", null, $t('Deleting your cache directory will cause you to lose some settings. Do not delete your cache directory unless instructed to do so by a Streamlabs staff member.')),
        React.createElement("div", { className: "input-container" },
            React.createElement("a", { className: "link", onClick: showCacheDir },
                React.createElement("i", { className: "icon-view" }),
                " ",
                React.createElement("span", null, $t('Show Cache Directory')))),
        React.createElement("div", { className: "input-container" },
            React.createElement("a", { className: "link", onClick: deleteCacheDir },
                React.createElement("i", { className: "icon-trash" }),
                React.createElement("span", null, $t('Delete Cache and Restart')))),
        React.createElement("div", { className: "input-container" },
            React.createElement("a", { className: "link", onClick: uploadCacheDir },
                React.createElement("i", { className: "fa fa-upload" }),
                " ",
                React.createElement("span", null, $t('Upload Cache to Developers')),
                cacheUploading && React.createElement("i", { className: "fa fa-spinner fa-spin" })))));
}
function CrashReporting() {
    const { CustomizationService } = Services;
    const { enableCrashDumps } = useVuex(() => {
        return { enableCrashDumps: CustomizationService.state.enableCrashDumps };
    });
    return (React.createElement(ObsSettingsSection, { title: $t('Crash Reporting') },
        React.createElement(CheckboxInput, { name: "enable_dump_upload", label: $t('Enable reporting additional information on a crash (requires restart)'), value: enableCrashDumps, onChange: val => CustomizationService.actions.setSettings({ enableCrashDumps: val }) })));
}
//# sourceMappingURL=Support.js.map