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
import { ObsGenericSettingsForm, ObsSettingsSection } from './ObsSettings';
import { $t, I18nService } from '../../../services/i18n';
import { alertAsync, confirmAsync } from '../../modals';
import { CheckboxInput, ListInput } from '../../shared/inputs';
import { Services } from '../../service-provider';
import fs from 'fs';
import path from 'path';
import { getDefined } from '../../../util/properties-type-guards';
import { useVuex } from 'components-react/hooks';
import { useRealmObject } from 'components-react/hooks/realm';
export function GeneralSettings() {
    return (React.createElement("div", null,
        React.createElement(LanguageSettings, null),
        React.createElement(ExtraSettings, null),
        React.createElement(ObsGenericSettingsForm, { page: "General" })));
}
function LanguageSettings() {
    const i18nService = I18nService.instance;
    const localeOptions = i18nService.state.localeList;
    const currentLocale = i18nService.state.locale;
    function save(lang) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield confirmAsync('This action will restart the application. Continue?'))) {
                return;
            }
            i18nService.actions.setLocale(lang);
        });
    }
    return (React.createElement(ObsSettingsSection, null,
        React.createElement(ListInput, { options: localeOptions, label: 'Language', onChange: save, value: currentLocale })));
}
function ExtraSettings() {
    const { UserService, StreamingService, StreamSettingsService, CustomizationService, AppService, OnboardingService, WindowsService, StreamlabelsService, RecordingModeService, SettingsService, } = Services;
    const isLoggedIn = UserService.isLoggedIn;
    const isTwitch = isLoggedIn && getDefined(UserService.platform).type === 'twitch';
    const isFacebook = isLoggedIn && getDefined(UserService.platform).type === 'facebook';
    const isYoutube = isLoggedIn && getDefined(UserService.platform).type === 'youtube';
    const protectedMode = StreamSettingsService.state.protectedModeEnabled;
    const disableHAFilePath = path.join(AppService.appDataDirectory, 'HADisable');
    const [disableHA, setDisableHA] = useState(() => fs.existsSync(disableHAFilePath));
    const { isRecordingOrStreaming, recordingMode, isSimpleOutputMode } = useVuex(() => ({
        isRecordingOrStreaming: StreamingService.isStreaming || StreamingService.isRecording,
        recordingMode: RecordingModeService.views.isRecordingModeEnabled,
        isSimpleOutputMode: SettingsService.views.isSimpleOutputMode,
    }));
    const updateStreamInfoOnLive = useRealmObject(CustomizationService.state).updateStreamInfoOnLive;
    const canRunOptimizer = false;
    function restartStreamlabelsSession() {
        StreamlabelsService.restartSession().then(result => {
            if (result) {
                alertAsync($t('Stream Labels session has been successfully restarted!'));
            }
        });
    }
    function runAutoOptimizer() {
        OnboardingService.actions.start({ isOptimize: true });
        WindowsService.actions.closeChildWindow();
    }
    function configureDefaults() {
        OnboardingService.actions.start({ isHardware: true });
        WindowsService.actions.closeChildWindow();
    }
    function importFromObs() {
        OnboardingService.actions.setImport('obs');
        OnboardingService.actions.start({ isImport: true });
        WindowsService.actions.closeChildWindow();
    }
    function disableHardwareAcceleration(val) {
        try {
            if (val) {
                fs.closeSync(fs.openSync(disableHAFilePath, 'w'));
                setDisableHA(true);
            }
            else {
                fs.unlinkSync(disableHAFilePath);
                setDisableHA(false);
            }
        }
        catch (e) {
            console.error('Error setting hardware acceleration', e);
        }
    }
    return (React.createElement(React.Fragment, null,
        React.createElement(ObsSettingsSection, null,
            isLoggedIn && !isFacebook && !isYoutube && (React.createElement(CheckboxInput, { value: updateStreamInfoOnLive, onChange: val => CustomizationService.actions.setUpdateStreamInfoOnLive(val), label: $t('Confirm stream title and game before going live'), name: "stream_info_udpate" })),
            React.createElement(CheckboxInput, { label: $t('Disable hardware acceleration (requires restart)'), value: disableHA, onChange: disableHardwareAcceleration, name: "disable_ha" }),
            React.createElement(CheckboxInput, { label: $t('Disable live streaming features (Recording Only mode)'), value: recordingMode, onChange: RecordingModeService.actions.setRecordingMode }),
            React.createElement("div", { className: "actions" },
                React.createElement("div", { className: "input-container" },
                    React.createElement("button", { className: "button button--default", onClick: restartStreamlabelsSession }, $t('Restart Stream Labels'))))),
        React.createElement(ObsSettingsSection, null,
            React.createElement("div", { className: "actions" },
                React.createElement("div", { className: "input-container" },
                    React.createElement("button", { className: "button button--default", onClick: configureDefaults }, $t('Configure Default Devices'))),
                canRunOptimizer && (React.createElement("div", { className: "input-container" },
                    React.createElement("button", { className: "button button--default", onClick: runAutoOptimizer }, $t('Auto Optimize')))),
                React.createElement("div", { className: "input-container" },
                    React.createElement("button", { className: "button button--default", onClick: importFromObs }, $t('OBS Import')))))));
}
//# sourceMappingURL=General.js.map