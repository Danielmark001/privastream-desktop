var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import cloneDeep from 'lodash/cloneDeep';
import { StatefulService, mutation, ViewHandler } from 'services/core/stateful-service';
import { inputValuesToObsValues, obsValuesToInputValues, } from 'components/obs/inputs/ObsInput';
import * as obs from '../../../obs-api';
import { Inject } from '../core/injector';
import { E_AUDIO_CHANNELS } from 'services/audio';
import Utils from '../utils';
import { $t } from 'services/i18n';
import { encoderFieldsMap, obsEncoderToEncoderFamily } from './output';
import { EDeviceType } from 'services/hardware';
import { byOS, getOS, OS } from 'util/operating-systems';
import { Subject } from 'rxjs';
import * as remote from '@electron/remote';
import fs from 'fs';
import path from 'path';
import { Services } from 'components-react/service-provider';
export var ESettingsCategory;
(function (ESettingsCategory) {
    ESettingsCategory["AI"] = "AI";
    ESettingsCategory["SceneCollections"] = "Scene Collections";
    ESettingsCategory["Advanced"] = "Advanced";
    ESettingsCategory["Audio"] = "Audio";
    ESettingsCategory["Video"] = "Video";
    ESettingsCategory["Output"] = "Output";
    ESettingsCategory["Multistreaming"] = "Multistreaming";
    ESettingsCategory["Notifications"] = "Notifications";
    ESettingsCategory["Appearance"] = "Appearance";
    ESettingsCategory["VirtualWebcam"] = "Virtual Webcam";
    ESettingsCategory["GameOverlay"] = "Game Overlay";
    ESettingsCategory["Developer"] = "Developer";
    ESettingsCategory["Experimental"] = "Experimental";
    ESettingsCategory["GetSupport"] = "Get Support";
    ESettingsCategory["InstalledApps"] = "Installed Apps";
    ESettingsCategory["Stream"] = "Stream";
    ESettingsCategory["General"] = "General";
    ESettingsCategory["Mobile"] = "Mobile";
    ESettingsCategory["Hotkeys"] = "Hotkeys";
    ESettingsCategory["Ultra"] = "Ultra";
})(ESettingsCategory || (ESettingsCategory = {}));
export var ESettingsCategoryType;
(function (ESettingsCategoryType) {
    ESettingsCategoryType[ESettingsCategoryType["Untabbed"] = 0] = "Untabbed";
    ESettingsCategoryType[ESettingsCategoryType["Tabbed"] = 1] = "Tabbed";
})(ESettingsCategoryType || (ESettingsCategoryType = {}));
class SettingsViews extends ViewHandler {
    get appState() {
        return Services.AppService.state;
    }
    get platformAppsState() {
        return Services.PlatformAppsService.state;
    }
    get values() {
        const settingsValues = {};
        for (const [groupName, category] of Object.entries(this.state)) {
            this.state[groupName].formData.forEach((subGroup) => {
                subGroup.parameters.forEach(parameter => {
                    settingsValues[groupName] =
                        settingsValues[groupName] || {};
                    settingsValues[groupName][parameter.name] = parameter.value;
                });
            });
        }
        return settingsValues;
    }
    get isSimpleOutputMode() {
        return this.values.Output.Mode === 'Simple';
    }
    get isAdvancedOutput() {
        return this.state.Output.type === 1;
    }
    get streamTrack() {
        if (!this.isAdvancedOutput)
            return 0;
        return Number(this.values.Output.TrackIndex) - 1;
    }
    get recFormat() {
        if (!this.isAdvancedOutput)
            return;
        return this.values.Output.RecFormat;
    }
    get recPath() {
        return this.values.Output.RecFilePath;
    }
    get recordingTracks() {
        if (!this.isAdvancedOutput)
            return [0];
        const bitArray = Utils.numberToBinnaryArray(this.values.Output.RecTracks, 6).reverse();
        const trackLabels = [];
        bitArray.forEach((bit, i) => {
            if (bit === 1)
                trackLabels.push(i);
        });
        return trackLabels;
    }
    get audioTracks() {
        if (!this.isAdvancedOutput)
            return [];
        return Utils.numberToBinnaryArray(this.values.Output.RecTracks, 6).reverse();
    }
    get streamPlatform() {
        return this.values.Stream.service;
    }
    get vodTrackEnabled() {
        return this.values.Output.VodTrackEnabled;
    }
    get vodTrack() {
        if (!this.vodTrackEnabled)
            return 0;
        if (!this.isAdvancedOutput)
            return 1;
        return Number(this.values.Output.VodTrackIndex) - 1;
    }
    get advancedAudioSettings() {
        return this.state.Advanced.formData.find(data => data.nameSubCategory === 'Audio');
    }
    get hasHDRSettings() {
        const advVideo = this.state.Advanced.formData.find(data => data.nameSubCategory === 'Video');
        const colorSetting = advVideo.parameters.find(data => data.name === 'ColorFormat');
        return ['P010', 'I010'].includes(colorSetting.value);
    }
    get recommendedColorSpaceWarnings() {
        const advVideo = this.state.Advanced.formData.find(data => data.nameSubCategory === 'Video');
        const colorSetting = advVideo.parameters.find(data => data.name === 'ColorFormat')
            .value;
        if (!['NV12', 'P010', 'I010'].includes(colorSetting)) {
            return $t('You have selected %{colorFormat} as Color Format. Formats other than NV12 and P010 are commonly used for recording, and might incur high CPU usage or the streaming platform might not support it. Go to Settings -> Advanced -> Video to review.', { colorFormat: colorSetting });
        }
        return null;
    }
    get advancedSettingEnabled() {
        return Utils.isDevMode() || this.appState.argv.includes('--adv-settings');
    }
}
export class SettingsService extends StatefulService {
    constructor() {
        super(...arguments);
        this.audioRefreshed = new Subject();
        this.settingsUpdated = new Subject();
    }
    get views() {
        return new SettingsViews(this.state);
    }
    init() {
        this.loadSettingsIntoStore();
        this.ensureValidEncoder();
        this.ensureValidRecordingEncoder();
        this.sceneCollectionsService.collectionSwitched.subscribe(() => this.refreshAudioSettings());
        try {
            if (fs.existsSync(path.join(this.appService.appDataDirectory, 'HADisable'))) {
                this.usageStatisticsService.recordFeatureUsage('HardwareAccelDisabled');
            }
        }
        catch (e) {
            console.error('Error fetching hardware acceleration state', e);
        }
    }
    fetchSettingsFromObs(categoryName) {
        const settingsMetadata = obs.NodeObs.OBS_settings_getSettings(categoryName);
        let settings = settingsMetadata.data;
        if (!settings)
            settings = [];
        const DENY_LIST_NAMES = [
            'SysTrayMinimizeToTray',
            'SysTrayEnabled',
            'CenterSnapping',
            'HideProjectorCursor',
            'ProjectorAlwaysOnTop',
            'SaveProjectors',
            'SysTrayWhenStarted',
        ];
        for (const group of settings) {
            group.parameters = obsValuesToInputValues(group.parameters, {
                disabledFields: DENY_LIST_NAMES,
                transformListOptions: true,
            });
        }
        if (categoryName === 'Audio') {
            return {
                type: ESettingsCategoryType.Untabbed,
                formData: this.getAudioSettingsFormData(settings[0]),
            };
        }
        if (categoryName === 'Output' &&
            !this.streamingService.isIdle &&
            this.videoEncodingOptimizationService.state.useOptimizedProfile) {
            const encoder = obsEncoderToEncoderFamily(this.findSettingValue(settings, 'Streaming', 'Encoder') ||
                this.findSettingValue(settings, 'Streaming', 'StreamEncoder'));
            settings = this.patchSetting(settings, encoderFieldsMap[encoder].preset, { visible: false });
            if (encoder === 'x264') {
                settings = this.patchSetting(settings, encoderFieldsMap[encoder].encoderOptions, {
                    visible: false,
                });
            }
        }
        return {
            type: settingsMetadata.type,
            formData: settings,
        };
    }
    getCategories() {
        let categories = obs.NodeObs.OBS_settings_getListCategories();
        categories.splice(1, 0, ESettingsCategory.Multistreaming);
        categories = categories.filter(category => category !== ESettingsCategory.VirtualWebcam);
        categories = categories.concat([
            ESettingsCategory.SceneCollections,
            ESettingsCategory.Notifications,
            ESettingsCategory.Appearance,
            ESettingsCategory.Mobile,
            ESettingsCategory.VirtualWebcam,
        ]);
        byOS({
            [OS.Mac]: () => { },
            [OS.Windows]: () => {
                categories.push(ESettingsCategory.GameOverlay);
            },
        });
        if (this.views.advancedSettingEnabled || this.views.platformAppsState.devMode) {
            categories = categories.concat([ESettingsCategory.Developer, ESettingsCategory.Experimental]);
        }
        if (this.views.platformAppsState.loadedApps.filter(app => !app.unpacked).length > 0) {
            categories.push(ESettingsCategory.InstalledApps);
        }
        categories.push(ESettingsCategory.GetSupport);
        if (getOS() === OS.Windows || (getOS() === OS.Mac && Utils.isDevMode())) {
            categories.push(ESettingsCategory.AI);
        }
        categories = categories.filter(category => !category.toLowerCase().startsWith('stream') || category === 'Stream');
        if (!this.userService.views.isPrime) {
            categories.push(ESettingsCategory.Ultra);
        }
        return categories;
    }
    loadSettingsIntoStore() {
        const settingsFormData = {};
        this.getCategories().forEach((categoryName) => {
            settingsFormData[categoryName] = this.fetchSettingsFromObs(categoryName);
        });
        settingsFormData.StreamSecond = this.fetchSettingsFromObs('StreamSecond');
        this.SET_SETTINGS(settingsFormData);
    }
    refreshAudioSettings() {
        this.PATCH_SETTINGS('Audio', {
            type: ESettingsCategoryType.Untabbed,
            formData: this.getAudioSettingsFormData(this.state['Audio'].formData[0]),
        });
        this.audioRefreshed.next();
    }
    refreshVideoSettings() {
        const newVideoSettings = this.fetchSettingsFromObs('Video').formData;
        const newOutputSettings = this.fetchSettingsFromObs('Output').formData;
        this.setSettings('Video', newVideoSettings, 'Video');
        this.setSettings('Output', newOutputSettings);
    }
    showSettings(categoryName) {
        if (categoryName) {
            this.navigationService.setSettingsNavigation(categoryName);
        }
        this.windowsService.showWindow({
            componentName: 'Settings',
            title: $t('Settings'),
            size: {
                width: 830,
                height: 800,
            },
        });
    }
    findSetting(settings, subCategoryName, setting) {
        let inputModel;
        settings.find(subCategory => {
            if (subCategory.nameSubCategory === subCategoryName) {
                subCategory.parameters.find(param => {
                    if (param.name === setting) {
                        inputModel = param;
                        return true;
                    }
                });
                return true;
            }
        });
        return inputModel;
    }
    findSettingValue(settings, subCategoryName, setting) {
        const formModel = this.findSetting(settings, subCategoryName, setting);
        if (!formModel)
            return;
        return formModel.value !== void 0
            ? formModel.value
            : formModel.options[0].value;
    }
    findValidListValue(settings, subCategoryName, setting) {
        const formModel = this.findSetting(settings, subCategoryName, setting);
        if (!formModel)
            return;
        const options = formModel.options;
        const option = options.find(option => option.value === formModel.value);
        return option ? option.value : options[0].value;
    }
    patchSetting(settingsFormData, name, patch) {
        settingsFormData = cloneDeep(settingsFormData);
        for (const subcategory of settingsFormData) {
            for (const field of subcategory.parameters) {
                if (field.name !== name)
                    continue;
                Object.assign(field, patch);
            }
        }
        return settingsFormData;
    }
    setSettingValue(categoryName, name, value) {
        const newSettings = this.patchSetting(this.fetchSettingsFromObs(categoryName).formData, name, {
            value,
        });
        this.setSettings(categoryName, newSettings);
    }
    getAudioSettingsFormData(OBSsettings) {
        this.hardwareService.refreshDevices(true);
        const audioDevices = this.audioService.devices;
        const sourcesInChannels = this.sourcesService.views
            .getSources()
            .filter(source => source.channel !== void 0);
        const parameters = [];
        for (let channel = E_AUDIO_CHANNELS.OUTPUT_1; channel <= E_AUDIO_CHANNELS.OUTPUT_2; channel++) {
            const source = sourcesInChannels.find(source => source.channel === channel);
            const deviceInd = channel;
            parameters.push({
                value: source ? source.getObsInput().settings['device_id'] : null,
                description: `${$t('Desktop Audio Device')} ${deviceInd}`,
                name: `Desktop Audio ${deviceInd > 1 ? deviceInd : ''}`.trim(),
                type: 'OBS_PROPERTY_LIST',
                enabled: true,
                visible: true,
                options: [{ description: 'Disabled', value: null }].concat(audioDevices
                    .filter(device => device.type === EDeviceType.audioOutput)
                    .map(device => {
                    return { description: device.description, value: device.id };
                })),
            });
        }
        for (let channel = E_AUDIO_CHANNELS.INPUT_1; channel <= E_AUDIO_CHANNELS.INPUT_3; channel++) {
            const source = sourcesInChannels.find(source => source.channel === channel);
            const deviceInd = channel - 2;
            parameters.push({
                value: source ? source.getObsInput().settings['device_id'] : null,
                description: `${$t('Mic/Auxiliary Device')} ${deviceInd}`,
                name: `Mic/Aux ${deviceInd > 1 ? deviceInd : ''}`.trim(),
                type: 'OBS_PROPERTY_LIST',
                enabled: true,
                visible: true,
                options: [{ description: 'Disabled', value: null }].concat(audioDevices
                    .filter(device => device.type === EDeviceType.audioInput)
                    .map(device => {
                    return { description: device.description, value: device.id };
                })),
            });
        }
        return [
            OBSsettings,
            {
                parameters,
                nameSubCategory: 'Untitled',
            },
        ];
    }
    setSettings(categoryName, settingsData, forceApplyCategory) {
        if (categoryName === 'Audio')
            this.setAudioSettings([settingsData.pop()]);
        if (categoryName === 'Video' && forceApplyCategory && forceApplyCategory !== 'Video')
            return;
        const dataToSave = [];
        for (const subGroup of settingsData) {
            dataToSave.push(Object.assign(Object.assign({}, subGroup), { parameters: inputValuesToObsValues(subGroup.parameters, {
                    valueToCurrentValue: true,
                }) }));
            if (categoryName === 'Output' &&
                subGroup.nameSubCategory === 'Untitled' &&
                subGroup.parameters[0].value === 'Simple') {
                this.audioService.setSimpleTracks();
            }
        }
        obs.NodeObs.OBS_settings_saveSettings(categoryName, dataToSave);
        this.loadSettingsIntoStore();
    }
    setSettingsPatch(patch) {
        Object.keys(patch).forEach((categoryName) => {
            const category = patch[categoryName];
            const formSubCategories = this.fetchSettingsFromObs(categoryName).formData;
            Object.keys(category).forEach(paramName => {
                formSubCategories.forEach(subCategory => {
                    subCategory.parameters.forEach(subCategoryParam => {
                        if (subCategoryParam.name === paramName) {
                            subCategoryParam.value = category[paramName];
                        }
                    });
                });
            });
            this.setSettings(categoryName, formSubCategories);
            this.settingsUpdated.next(patch);
        });
    }
    setAudioSettings(settingsData) {
        const audioDevices = this.audioService.devices;
        settingsData[0].parameters.forEach((deviceForm, ind) => {
            const channel = ind + 1;
            const isOutput = [E_AUDIO_CHANNELS.OUTPUT_1, E_AUDIO_CHANNELS.OUTPUT_2].includes(channel);
            const device = audioDevices.find(device => device.id === deviceForm.value);
            let source = this.sourcesService.views
                .getSources()
                .find(source => source.channel === channel);
            if (source && deviceForm.value === null) {
                this.sourcesService.removeSource(source.sourceId);
                return;
            }
            else if (device && deviceForm.value !== null) {
                const displayName = device.id === 'default' ? deviceForm.name : device.description;
                if (!source) {
                    source = this.sourcesService.createSource(displayName, byOS({
                        [OS.Windows]: isOutput ? 'wasapi_output_capture' : 'wasapi_input_capture',
                        [OS.Mac]: isOutput ? 'coreaudio_output_capture' : 'coreaudio_input_capture',
                    }), { device_id: deviceForm.value }, { channel });
                }
                else {
                    source.updateSettings({ device_id: deviceForm.value });
                }
                source.setName(displayName);
            }
        });
    }
    ensureValidEncoder() {
        var _a;
        const encoderSetting = (_a = this.findSetting(this.state.Output.formData, 'Streaming', 'Encoder')) !== null && _a !== void 0 ? _a : this.findSetting(this.state.Output.formData, 'Streaming', 'StreamEncoder');
        const encoderIsValid = !!encoderSetting.options.find(opt => opt.value === encoderSetting.value);
        if (encoderSetting.value === 'obs_x264')
            return;
        if (!encoderIsValid) {
            const mode = this.findSettingValue(this.state.Output.formData, 'Untitled', 'Mode');
            if (mode === 'Advanced') {
                this.setSettingValue('Output', 'Encoder', 'obs_x264');
            }
            else {
                this.setSettingValue('Output', 'StreamEncoder', 'x264');
            }
            remote.dialog.showMessageBox(this.windowsService.windows.main, {
                type: 'error',
                message: 'Your stream encoder has been reset to Software (x264). This can be caused by out of date graphics drivers. Please update your graphics drivers to continue using hardware encoding.',
            });
        }
    }
    ensureValidRecordingEncoder() {
        this.setSettings('Output', this.state.Output.formData);
    }
    listSettingsByCategory() {
        const settings = {};
        for (const category in this.state) {
            settings[category] = this.state[category].formData.reduce((acc, subCategory) => {
                subCategory.parameters.forEach(param => {
                    console.log(param.name, category, subCategory.nameSubCategory, param.value);
                });
            }, {});
        }
    }
    isEnhancedBroadcasting() {
        return obs.NodeObs.OBS_settings_isEnhancedBroadcasting();
    }
    setEnhancedBroadcasting(enable) {
        obs.NodeObs.OBS_settings_setEnhancedBroadcasting(enable);
    }
    SET_SETTINGS(settingsData) {
        this.state = Object.assign({}, this.state, settingsData);
    }
    PATCH_SETTINGS(categoryName, category) {
        this.state[categoryName] = category;
    }
}
SettingsService.initialState = {};
__decorate([
    Inject()
], SettingsService.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], SettingsService.prototype, "audioService", void 0);
__decorate([
    Inject()
], SettingsService.prototype, "windowsService", void 0);
__decorate([
    Inject()
], SettingsService.prototype, "appService", void 0);
__decorate([
    Inject()
], SettingsService.prototype, "streamingService", void 0);
__decorate([
    Inject()
], SettingsService.prototype, "usageStatisticsService", void 0);
__decorate([
    Inject()
], SettingsService.prototype, "sceneCollectionsService", void 0);
__decorate([
    Inject()
], SettingsService.prototype, "hardwareService", void 0);
__decorate([
    Inject()
], SettingsService.prototype, "navigationService", void 0);
__decorate([
    Inject()
], SettingsService.prototype, "userService", void 0);
__decorate([
    Inject()
], SettingsService.prototype, "videoEncodingOptimizationService", void 0);
__decorate([
    mutation()
], SettingsService.prototype, "SET_SETTINGS", null);
__decorate([
    mutation()
], SettingsService.prototype, "PATCH_SETTINGS", null);
//# sourceMappingURL=settings.js.map