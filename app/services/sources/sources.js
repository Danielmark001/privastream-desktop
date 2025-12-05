var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import * as fs from 'fs';
import cloneDeep from 'lodash/cloneDeep';
import { Subject } from 'rxjs';
import { InitAfter } from 'services/core';
import { Inject } from 'services/core/injector';
import { mutation, StatefulService, ViewHandler } from 'services/core/stateful-service';
import { $t } from 'services/i18n';
import { WidgetDisplayData, WidgetType } from 'services/widgets';
import namingHelpers from 'util/NamingHelpers';
import { assertIsDefined } from 'util/properties-type-guards';
import uuid from 'uuid/v4';
import Vue from 'vue';
import * as obs from '../../../obs-api';
import { EAvailableFeatures } from '../incremental-rollout';
import { Source, } from './index';
import { DefaultManager } from './properties-managers/default-manager';
import { IconLibraryManager } from './properties-managers/icon-library-manager';
import { PlatformAppManager } from './properties-managers/platform-app-manager';
import { ReplayManager } from './properties-managers/replay-manager';
import { SmartBrowserSourceManager } from './properties-managers/smart-browser-source-manager';
import { StreamlabelsManager } from './properties-managers/streamlabels-manager';
import { WidgetManager } from './properties-managers/widget-manager';
import { SourceDisplayData } from './sources-data';
const AudioFlag = 2;
const VideoFlag = 1;
const AsyncFlag = 4;
const DoNotDuplicateFlag = 128;
const ForceUiRefresh = 1073741824;
export const PROPERTIES_MANAGER_TYPES = {
    default: DefaultManager,
    widget: WidgetManager,
    streamlabels: StreamlabelsManager,
    platformApp: PlatformAppManager,
    replay: ReplayManager,
    iconLibrary: IconLibraryManager,
    smartBrowserSource: SmartBrowserSourceManager,
};
export const windowsSources = [
    'image_source',
    'color_source',
    'browser_source',
    'slideshow',
    'ffmpeg_source',
    'text_gdiplus',
    'monitor_capture',
    'window_capture',
    'game_capture',
    'dshow_input',
    'wasapi_input_capture',
    'wasapi_output_capture',
    'decklink-input',
    'scene',
    'ndi_source',
    'openvr_capture',
    'screen_capture',
    'liv_capture',
    'ovrstream_dc_source',
    'vlc_source',
    'soundtrack_source',
    'mediasoupconnector',
    'wasapi_process_output_capture',
    'spout_capture',
    'smart_browser_source',
];
export const macSources = [
    'image_source',
    'color_source',
    'browser_source',
    'slideshow',
    'ffmpeg_source',
    'text_ft2_source',
    'scene',
    'coreaudio_input_capture',
    'coreaudio_output_capture',
    'av_capture_input',
    'display_capture',
    'audio_line',
    'ndi_source',
    'mac_screen_capture',
    'vlc_source',
    'window_capture',
    'syphon-input',
    'decklink-input',
    'mediasoupconnector',
];
class SourcesViews extends ViewHandler {
    get sources() {
        return Object.values(this.state.sources).map(sourceModel => this.getSource(sourceModel.sourceId));
    }
    get temporarySources() {
        return Object.values(this.state.temporarySources).map(sourceModel => this.getSource(sourceModel.sourceId));
    }
    getSource(id) {
        return this.state.sources[id] || this.state.temporarySources[id] ? new Source(id) : null;
    }
    getSourceByChannel(channel) {
        var _a;
        const id = (_a = Object.values(this.state.sources).find(s => {
            return s.channel === channel;
        })) === null || _a === void 0 ? void 0 : _a.sourceId;
        return id != null ? this.getSource(id) : null;
    }
    getSources() {
        return this.sources;
    }
    getSourcesByName(name) {
        const sourceModels = Object.values(this.state.sources).filter(source => {
            return source.name === name;
        });
        return sourceModels.map(sourceModel => this.getSource(sourceModel.sourceId));
    }
    getSourcesByType(type) {
        return this.sources.filter(s => s.type === type);
    }
    suggestName(name) {
        if (!name)
            return '';
        return namingHelpers.suggestName(name, (name) => this.getSourcesByName(name).length);
    }
}
let SourcesService = class SourcesService extends StatefulService {
    constructor() {
        super(...arguments);
        this.sourceAdded = new Subject();
        this.sourceUpdated = new Subject();
        this.sourceRemoved = new Subject();
        this.sourceDisplayData = SourceDisplayData();
        this.propertiesManagers = {};
        this.missingInputs = [];
    }
    get views() {
        return new SourcesViews(this.state);
    }
    init() {
        obs.NodeObs.RegisterSourceCallback((objs) => this.handleSourceCallback(objs));
        this.scenesService.itemRemoved.subscribe(sceneSourceModel => this.onSceneItemRemovedHandler(sceneSourceModel));
        this.scenesService.sceneRemoved.subscribe(sceneModel => this.removeSource(sceneModel.id));
    }
    RESET_SOURCES() {
        this.state.sources = {};
    }
    ADD_SOURCE(addOptions) {
        const id = addOptions.id;
        const sourceModel = {
            sourceId: id,
            name: addOptions.name,
            type: addOptions.type,
            propertiesManagerType: addOptions.propertiesManagerType || 'default',
            audio: false,
            video: false,
            async: false,
            doNotDuplicate: false,
            forceUiRefresh: false,
            configurable: addOptions.configurable,
            width: addOptions.width,
            height: addOptions.height,
            muted: false,
            channel: addOptions.channel,
            forceHidden: false,
            forceMuted: false,
            deinterlaceMode: addOptions.deinterlaceMode,
            deinterlaceFieldOrder: addOptions.deinterlaceFieldOrder,
        };
        if (addOptions.isTemporary) {
            Vue.set(this.state.temporarySources, id, sourceModel);
        }
        else {
            Vue.set(this.state.sources, id, sourceModel);
        }
    }
    REMOVE_SOURCE(id) {
        if (this.state.sources[id]) {
            Vue.delete(this.state.sources, id);
        }
        else {
            Vue.delete(this.state.temporarySources, id);
        }
    }
    UPDATE_SOURCE(sourcePatch) {
        if (this.state.sources[sourcePatch.id]) {
            Object.assign(this.state.sources[sourcePatch.id], sourcePatch);
        }
        else if (this.state.temporarySources[sourcePatch.id]) {
            Object.assign(this.state.temporarySources[sourcePatch.id], sourcePatch);
        }
        else {
            this.state.temporarySources[sourcePatch.id] = {};
            Object.assign(this.state.temporarySources[sourcePatch.id], sourcePatch);
        }
    }
    createSource(name, type, settings = {}, options = {}) {
        var _a, _b;
        const id = (options === null || options === void 0 ? void 0 : options.sourceId) || `${type}_${uuid()}`;
        const obsInputSettings = this.getObsSourceCreateSettings(type, settings);
        if (obsInputSettings.is_media_flag) {
            obsInputSettings.is_media_flag = false;
        }
        try {
            const computedType = obsInputSettings.__remappedType || type;
            const obsInput = obs.InputFactory.create(computedType, id, obsInputSettings);
            if (type === 'mediasoupconnector' && !((_a = options.audioSettings) === null || _a === void 0 ? void 0 : _a.monitoringType)) {
                (_b = options.audioSettings) !== null && _b !== void 0 ? _b : (options.audioSettings = {});
                options.audioSettings.monitoringType = 1;
            }
            if (type === 'smart_browser_source') {
                options.propertiesManager = 'smartBrowserSource';
            }
            this.addSource(obsInput, name, options);
            if (this.defaultHardwareService.state.defaultVideoDevice === obsInputSettings.video_device_id &&
                this.defaultHardwareService.state.presetFilter !== '' &&
                this.defaultHardwareService.state.presetFilter !== 'none') {
                this.sourceFiltersService.addPresetFilter(id, this.defaultHardwareService.state.presetFilter);
            }
            if (this.defaultHardwareService.state.defaultVideoDevice === obsInputSettings.device &&
                this.defaultHardwareService.state.presetFilter !== '' &&
                this.defaultHardwareService.state.presetFilter !== 'none') {
                this.sourceFiltersService.addPresetFilter(id, this.defaultHardwareService.state.presetFilter);
            }
        }
        catch (e) {
            console.log('Error creating obs source: ', e);
        }
        return this.views.getSource(id);
    }
    addSource(obsInput, name, options = {}) {
        if (options.channel !== void 0) {
            obs.Global.setOutputSource(options.channel, obsInput);
        }
        const id = obsInput.name;
        const type = obsInput.id;
        const managerType = options.propertiesManager || 'default';
        const width = (options === null || options === void 0 ? void 0 : options.display)
            ? this.videoSettingsService.baseResolutions[options === null || options === void 0 ? void 0 : options.display].baseWidth
            : obsInput.width;
        const height = (options === null || options === void 0 ? void 0 : options.display)
            ? this.videoSettingsService.baseResolutions[options === null || options === void 0 ? void 0 : options.display].baseHeight
            : obsInput.height;
        this.ADD_SOURCE({
            id,
            name,
            type,
            width,
            height,
            configurable: obsInput.configurable,
            channel: options.channel,
            isTemporary: options.isTemporary,
            propertiesManagerType: managerType,
            deinterlaceMode: options.deinterlaceMode || 0,
            deinterlaceFieldOrder: options.deinterlaceFieldOrder || 0,
        });
        const source = this.views.getSource(id);
        const muted = obsInput.muted;
        this.UPDATE_SOURCE({ id, muted });
        this.updateSourceFlags(source, obsInput.outputFlags, true);
        if (type === 'ndi_source') {
            this.usageStatisticsService.recordFeatureUsage('NDI');
        }
        else if (type === 'openvr_capture') {
            this.usageStatisticsService.recordFeatureUsage('OpenVR');
        }
        else if (type === 'screen_capture') {
            this.usageStatisticsService.recordFeatureUsage('SimpleCapture');
        }
        else if (type === 'vlc_source') {
            this.usageStatisticsService.recordFeatureUsage('VLC');
        }
        else if (type === 'soundtrack_source') {
            this.usageStatisticsService.recordFeatureUsage('soundtrackSource');
        }
        else if (type === 'wasapi_input_capture' || type === 'coreaudio_input_capture') {
            this.usageStatisticsService.recordFeatureUsage('AudioInputSource');
        }
        else if (type === 'dshow_input') {
            this.usageStatisticsService.recordFeatureUsage('DShowInput');
            const device = this.hardwareService.state.dshowDevices.find(d => d.id === obsInput.settings.video_device_id);
            if (device) {
                this.usageStatisticsService.recordAnalyticsEvent('WebcamUse', {
                    device: device.description,
                });
            }
        }
        else if (type === 'window_capture') {
            this.usageStatisticsService.recordFeatureUsage('WindowCapture');
        }
        else if (type === 'monitor_capture') {
            this.usageStatisticsService.recordFeatureUsage('DisplayCapture');
        }
        else if (type === 'game_capture') {
            this.usageStatisticsService.recordFeatureUsage('GameCapture');
        }
        else if (type === 'spout_capture') {
            this.usageStatisticsService.recordFeatureUsage('SpoutCapture');
        }
        const managerKlass = PROPERTIES_MANAGER_TYPES[managerType];
        this.propertiesManagers[id] = {
            manager: new managerKlass(obsInput, options.propertiesManagerSettings || {}, id),
            type: managerType,
        };
        function checkForDefaultDevice() {
            const props = source.getPropertiesFormData();
            const deviceProp = props.find(p => p.name === 'device_id');
            if (deviceProp && deviceProp.type === 'OBS_PROPERTY_LIST') {
                const deviceOption = deviceProp.options.find(opt => opt.value === deviceProp.value);
                if (!deviceOption) {
                    const updateSettings = source.getSettings();
                    updateSettings['device_id'] = 'default';
                    source.updateSettings(updateSettings);
                    return 'Default';
                }
                return deviceOption.description;
            }
            return 'Default';
        }
        if (type === 'wasapi_input_capture') {
            this.usageStatisticsService.recordAnalyticsEvent('MicrophoneUse', {
                device: checkForDefaultDevice(),
            });
        }
        else if (type === 'wasapi_output_capture') {
            checkForDefaultDevice();
        }
        this.sourceAdded.next(source.state);
        if (options.audioSettings) {
            this.audioService.views.getSource(id).setSettings(options.audioSettings);
        }
        if (type === 'mediasoupconnector' && options.guestCamStreamId) {
            this.guestCamService.setGuestSource(options.guestCamStreamId, id);
        }
    }
    removeSource(id) {
        const source = this.views.getSource(id);
        if (!source)
            throw new Error(`Source ${id} not found`);
        if (source.channel !== void 0) {
            obs.Global.setOutputSource(source.channel, null);
        }
        source.getObsInput().release();
        this.propertiesManagers[id].manager.destroy();
        delete this.propertiesManagers[id];
        this.REMOVE_SOURCE(id);
        this.sourceRemoved.next(source.state);
    }
    addFile(path) {
        const realpath = fs.realpathSync(path);
        const SUPPORTED_EXT = {
            image_source: ['png', 'jpg', 'jpeg', 'tga', 'bmp'],
            ffmpeg_source: [
                'mp4',
                'ts',
                'mov',
                'flv',
                'mkv',
                'avi',
                'mp3',
                'ogg',
                'aac',
                'wav',
                'gif',
                'webm',
            ],
            browser_source: ['html'],
            text_gdiplus: ['txt'],
        };
        let ext = realpath.split('.').splice(-1)[0];
        if (!ext)
            return null;
        ext = ext.toLowerCase();
        const filename = path.split('\\').splice(-1)[0];
        const types = Object.keys(SUPPORTED_EXT);
        for (const type of types) {
            if (!SUPPORTED_EXT[type].includes(ext))
                continue;
            let settings = null;
            if (type === 'image_source') {
                settings = { file: path };
            }
            else if (type === 'browser_source') {
                settings = {
                    is_local_file: true,
                    local_file: path,
                };
            }
            else if (type === 'ffmpeg_source') {
                settings = {
                    is_local_file: true,
                    local_file: path,
                    looping: true,
                };
            }
            else if (type === 'text_gdiplus') {
                settings = {
                    read_from_file: true,
                    file: path,
                };
            }
            if (settings)
                return this.createSource(filename, type, settings);
        }
        return null;
    }
    onSceneItemRemovedHandler(sceneItemState) {
        const source = this.views.getSource(sceneItemState.sourceId);
        if (!source)
            return;
        if (source.type === 'scene')
            return;
        if (this.scenesService.getSourceItemCount(source.sourceId) > 0)
            return;
        this.removeSource(source.sourceId);
    }
    getObsSourceCreateSettings(type, settings) {
        const resolvedSettings = cloneDeep(settings);
        if (type === 'browser_source') {
            if (resolvedSettings.shutdown === void 0)
                resolvedSettings.shutdown = true;
            if (resolvedSettings.url === void 0) {
                resolvedSettings.url = 'https://streamlabs.com/browser-source';
            }
        }
        if (type === 'smart_browser_source') {
            resolvedSettings.__remappedType = 'browser_source';
            resolvedSettings.webpage_control_level = 5;
            resolvedSettings.propertiesManager = 'smart_browser_source';
            resolvedSettings.url = '';
            resolvedSettings.width = 1280;
            resolvedSettings.height = 720;
        }
        if (type === 'text_gdiplus') {
            if (resolvedSettings.text === void 0) {
                resolvedSettings.text = name;
            }
            resolvedSettings.version = 3;
        }
        if (type === 'dshow_input' &&
            resolvedSettings.video_device_id === void 0 &&
            this.defaultHardwareService.state.defaultVideoDevice) {
            resolvedSettings.video_device_id = this.defaultHardwareService.state.defaultVideoDevice;
        }
        if (type === 'av_capture_input' &&
            resolvedSettings.device === void 0 &&
            this.defaultHardwareService.state.defaultVideoDevice) {
            resolvedSettings.device = this.defaultHardwareService.state.defaultVideoDevice;
        }
        return resolvedSettings;
    }
    getAvailableSourcesTypesList() {
        const obsAvailableTypes = obs.InputFactory.types();
        const allowlistedTypes = [
            { description: 'Image', value: 'image_source' },
            { description: 'Color Block', value: 'color_source' },
            { description: 'Browser Source', value: 'browser_source' },
            { description: 'Media File', value: 'ffmpeg_source' },
            { description: 'Image Slide Show', value: 'slideshow' },
            { description: 'Text (GDI+)', value: 'text_gdiplus' },
            { description: 'Text (FreeType 2)', value: 'text_ft2_source' },
            { description: 'Display Capture', value: 'monitor_capture' },
            { description: 'Window Capture', value: 'window_capture' },
            { description: 'Game Capture', value: 'game_capture' },
            { description: 'Video Capture Device', value: 'dshow_input' },
            { description: 'Audio Input Capture', value: 'wasapi_input_capture' },
            { description: 'Audio Output Capture', value: 'wasapi_output_capture' },
            { description: 'Blackmagic Device', value: 'decklink-input' },
            { description: 'NDI Source', value: 'ndi_source' },
            { description: 'OpenVR Capture', value: 'openvr_capture' },
            { description: 'Screen Capture', value: 'screen_capture' },
            { description: 'macOS Screen Capture', value: 'mac_screen_capture' },
            { description: 'LIV Client Capture', value: 'liv_capture' },
            { description: 'OvrStream', value: 'ovrstream_dc_source' },
            { description: 'VLC Source', value: 'vlc_source' },
            { description: 'Audio Input Capture', value: 'coreaudio_input_capture' },
            { description: 'Audio Output Capture', value: 'coreaudio_output_capture' },
            { description: 'Video Capture Device', value: 'av_capture_input' },
            { description: 'Display Capture', value: 'display_capture' },
            { description: 'Soundtrack source', value: 'soundtrack_source' },
            { description: 'Collab Cam', value: 'mediasoupconnector' },
            { description: 'Application Audio Capture (BETA)', value: 'wasapi_process_output_capture' },
            { description: 'Spout2 capture', value: 'spout_capture' },
        ];
        const availableAllowlistedTypes = allowlistedTypes.filter(type => obsAvailableTypes.includes(type.value));
        availableAllowlistedTypes.push({ description: 'Scene', value: 'scene' });
        availableAllowlistedTypes.push({
            description: 'Reactive Source',
            value: 'smart_browser_source',
        });
        return availableAllowlistedTypes;
    }
    getAvailableSourcesTypes() {
        return this.getAvailableSourcesTypesList().map(listItem => listItem.value);
    }
    handleSourceCallback(objs) {
        objs.forEach(info => {
            const source = this.views.getSource(info.name);
            if (!source)
                return;
            if (source.width !== info.width || source.height !== info.height) {
                const size = { id: source.sourceId, width: info.width, height: info.height };
                this.UPDATE_SOURCE(size);
                this.sourceUpdated.next(source.getModel());
            }
            this.updateSourceFlags(source, info.flags);
        });
    }
    updateSourceFlags(source, flags, doNotEmit) {
        const audio = !!(AudioFlag & flags);
        const video = !!(VideoFlag & flags);
        const async = !!(AsyncFlag & flags);
        const doNotDuplicate = !!(DoNotDuplicateFlag & flags);
        const forceUiRefresh = !!(ForceUiRefresh & flags);
        if (source.audio !== audio ||
            source.video !== video ||
            source.forceUiRefresh !== forceUiRefresh) {
            this.UPDATE_SOURCE({
                audio,
                video,
                async,
                doNotDuplicate,
                forceUiRefresh,
                id: source.sourceId,
            });
            if (!doNotEmit)
                this.sourceUpdated.next(source.getModel());
        }
    }
    setMuted(id, muted) {
        const source = this.views.getSource(id);
        if (!source)
            return;
        if (!source.forceMuted) {
            source.getObsInput().muted = muted;
        }
        this.UPDATE_SOURCE({ id, muted });
        this.sourceUpdated.next(source.state);
    }
    reset() {
        this.RESET_SOURCES();
    }
    updatePropertiesManagerSettingsInStore(sourceId, settings) {
        this.UPDATE_SOURCE({ id: sourceId, propertiesManagerSettings: settings });
    }
    showSourceProperties(sourceId) {
        const source = this.views.getSource(sourceId);
        if (!source)
            return;
        if (source.type === 'screen_capture')
            return this.showScreenCaptureProperties(source);
        if (source.type === 'mediasoupconnector')
            return this.showGuestCamProperties(source);
        const propertiesManagerType = source.getPropertiesManagerType();
        if (propertiesManagerType === 'widget')
            return this.showWidgetProperties(source);
        if (propertiesManagerType === 'platformApp')
            return this.showPlatformAppPage(source);
        if (propertiesManagerType === 'iconLibrary')
            return this.showIconLibrarySettings(source);
        let propertiesName = SourceDisplayData()[source.type].name;
        if (propertiesManagerType === 'replay')
            propertiesName = $t('Instant Replay');
        if (propertiesManagerType === 'streamlabels')
            propertiesName = $t('Stream Label');
        const reactSourceProps = [
            'color_source',
            'browser_source',
            'ffmpeg_source',
            'game_capture',
            'dshow_input',
            'openvr_capture',
        ];
        const componentName = reactSourceProps.includes(source.type) && propertiesManagerType === 'default'
            ? 'SourceProperties'
            : 'SourcePropertiesDeprecated';
        this.windowsService.showWindow({
            componentName,
            title: $t('Settings for %{sourceName}', { sourceName: propertiesName }),
            queryParams: { sourceId },
            size: {
                width: 600,
                height: 800,
            },
        });
    }
    showWidgetProperties(source) {
        var _a;
        if (!this.userService.isLoggedIn)
            return;
        const platform = this.userService.views.platform;
        assertIsDefined(platform);
        const widgetType = source.getPropertiesManagerSettings().widgetType;
        const componentName = this.widgetsService.getWidgetComponent(widgetType);
        let reactWidgets = [
            'AlertBox',
            'ChatBox',
            'DonationTicker',
            'EmoteWall',
            'SponsorBanner',
            'ViewerCount',
            'GameWidget',
            'CustomWidget',
        ];
        const isLegacyAlertbox = this.customizationService.state.legacyAlertbox;
        if (isLegacyAlertbox)
            reactWidgets = reactWidgets.filter(w => w !== 'AlertBox');
        const isReactComponent = this.incrementalRolloutService.views.featureIsEnabled(EAvailableFeatures.reactWidgets) &&
            reactWidgets.includes(componentName);
        const windowComponentName = isReactComponent ? 'WidgetWindow' : componentName;
        const defaultVueWindowSize = { width: 920, height: 1024 };
        const defaultReactWindowSize = { width: 600, height: 800 };
        const widgetInfo = this.widgetsService.widgetsConfig[WidgetType[componentName]];
        const { width, height } = isReactComponent
            ? widgetInfo.settingsWindowSize || defaultReactWindowSize
            : defaultVueWindowSize;
        if (componentName) {
            this.windowsService.showWindow({
                componentName: windowComponentName,
                title: $t('Settings for %{sourceName}', {
                    sourceName: ((_a = WidgetDisplayData(platform.type)[widgetType]) === null || _a === void 0 ? void 0 : _a.name) || componentName,
                }),
                queryParams: { sourceId: source.sourceId, widgetType: WidgetType[widgetType] },
                size: {
                    width,
                    height,
                },
            });
        }
    }
    showPlatformAppPage(source) {
        const settings = source.getPropertiesManagerSettings();
        const app = this.platformAppsService.views.getApp(settings.appId);
        if (app) {
            const page = app.manifest.sources.find(appSource => {
                return appSource.id === settings.appSourceId;
            });
            if (page && page.redirectPropertiesToTopNavSlot) {
                this.navigationService.navigate('PlatformAppMainPage', {
                    appId: app.id,
                    sourceId: source.sourceId,
                });
                this.windowsService.closeChildWindow();
                return;
            }
        }
        this.windowsService.showWindow({
            componentName: 'SourcePropertiesDeprecated',
            title: $t('Settings for %{sourceName}', {
                sourceName: SourceDisplayData()[source.type].name,
            }),
            queryParams: { sourceId: source.sourceId },
            size: {
                width: 600,
                height: 800,
            },
        });
    }
    showIconLibrarySettings(source) {
        const propertiesName = SourceDisplayData()[source.type].name;
        this.windowsService.showWindow({
            componentName: 'IconLibraryProperties',
            title: $t('Settings for %{sourceName}', { sourceName: propertiesName }),
            queryParams: { sourceId: source.sourceId },
            size: {
                width: 400,
                height: 600,
            },
        });
    }
    showScreenCaptureProperties(source) {
        const propertiesName = SourceDisplayData()[source.type].name;
        this.windowsService.showWindow({
            componentName: 'ScreenCaptureProperties',
            title: $t('Settings for %{sourceName}', { sourceName: propertiesName }),
            queryParams: { sourceId: source.sourceId },
            size: {
                width: 690,
                height: 800,
            },
        });
    }
    showGuestCamProperties(source) {
        this.windowsService.showWindow({
            componentName: 'GuestCamProperties',
            title: $t('Collab Cam Properties', { sourceName: $t('Collab Cam') }),
            queryParams: { sourceId: source === null || source === void 0 ? void 0 : source.sourceId },
            size: {
                width: 850,
                height: 660,
            },
        });
    }
    showGuestCamPropertiesBySourceId(sourceId) {
        const source = this.views.getSource(sourceId);
        if (source)
            this.showGuestCamProperties(source);
    }
    showShowcase() {
        this.windowsService.showWindow({
            componentName: 'SourceShowcase',
            title: $t('Add Source'),
            size: {
                width: 900,
                height: 700,
            },
        });
    }
    showAddSource(sourceType, sourceAddOptions) {
        this.windowsService.showWindow({
            componentName: 'AddSource',
            title: $t('Add Source'),
            queryParams: { sourceType, sourceAddOptions },
            size: {
                width: 600,
                height: 320,
            },
        });
    }
    showRenameSource(sourceId) {
        this.windowsService.showWindow({
            componentName: 'RenameSource',
            title: $t('Rename Source'),
            queryParams: { sourceId },
            size: {
                width: 400,
                height: 250,
            },
        });
    }
    showInteractWindow(sourceId) {
        const source = this.views.getSource(sourceId);
        if (!source)
            return;
        if (source.type !== 'browser_source')
            return;
        this.windowsService.showWindow({
            componentName: 'BrowserSourceInteraction',
            queryParams: { sourceId },
            title: $t('Interact: %{sourceName}', { sourceName: source.name }),
            size: {
                width: 800,
                height: 600,
            },
        });
    }
};
SourcesService.initialState = {
    sources: {},
    temporarySources: {},
};
__decorate([
    Inject()
], SourcesService.prototype, "scenesService", void 0);
__decorate([
    Inject()
], SourcesService.prototype, "windowsService", void 0);
__decorate([
    Inject()
], SourcesService.prototype, "widgetsService", void 0);
__decorate([
    Inject()
], SourcesService.prototype, "userService", void 0);
__decorate([
    Inject()
], SourcesService.prototype, "navigationService", void 0);
__decorate([
    Inject()
], SourcesService.prototype, "platformAppsService", void 0);
__decorate([
    Inject()
], SourcesService.prototype, "hardwareService", void 0);
__decorate([
    Inject()
], SourcesService.prototype, "audioService", void 0);
__decorate([
    Inject()
], SourcesService.prototype, "defaultHardwareService", void 0);
__decorate([
    Inject()
], SourcesService.prototype, "usageStatisticsService", void 0);
__decorate([
    Inject()
], SourcesService.prototype, "sourceFiltersService", void 0);
__decorate([
    Inject()
], SourcesService.prototype, "videoSettingsService", void 0);
__decorate([
    Inject()
], SourcesService.prototype, "customizationService", void 0);
__decorate([
    Inject()
], SourcesService.prototype, "incrementalRolloutService", void 0);
__decorate([
    Inject()
], SourcesService.prototype, "guestCamService", void 0);
__decorate([
    mutation()
], SourcesService.prototype, "RESET_SOURCES", null);
__decorate([
    mutation()
], SourcesService.prototype, "ADD_SOURCE", null);
__decorate([
    mutation()
], SourcesService.prototype, "REMOVE_SOURCE", null);
__decorate([
    mutation()
], SourcesService.prototype, "UPDATE_SOURCE", null);
SourcesService = __decorate([
    InitAfter('VideoSettingsService')
], SourcesService);
export { SourcesService };
//# sourceMappingURL=sources.js.map