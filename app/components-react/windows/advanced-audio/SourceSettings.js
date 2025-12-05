import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Button, Collapse, Tooltip } from 'antd';
import { SliderInput, BoolButtonInput, ListInput, SwitchInput, NumberInput, } from 'components-react/shared/inputs';
import InputWrapper from 'components-react/shared/inputs/InputWrapper';
import Form from 'components-react/shared/inputs/Form';
import { Services } from 'components-react/service-provider';
import { useChildWindowParams, useVuex } from 'components-react/hooks';
import { $t } from 'services/i18n';
import Utils from 'services/utils';
import styles from './AdvancedAudio.m.less';
const { Panel } = Collapse;
export default function AdvancedAudio() {
    const { AudioService, WindowsService } = Services;
    const initialSource = useChildWindowParams('sourceId') || '';
    const [expandedSource, setExpandedSource] = useState(initialSource);
    const { audioSources } = useVuex(() => ({
        audioSources: AudioService.views.sourcesForCurrentScene,
    }));
    return (React.createElement(Collapse, { accordion: true, activeKey: expandedSource, onChange: (key) => setExpandedSource(key) }, audioSources.map(audioSource => (React.createElement(Panel, { key: audioSource.sourceId, header: React.createElement(PanelHeader, { source: audioSource }) },
        React.createElement(PanelForm, { source: audioSource }))))));
}
function PanelHeader(p) {
    const { EditorCommandsService, SettingsService } = Services;
    const { isAdvancedOutput, recordingTracks, streamTrack, vodTrackEnabled, vodTrack, muted, } = useVuex(() => ({
        isAdvancedOutput: SettingsService.views.isAdvancedOutput,
        streamTrack: SettingsService.views.streamTrack,
        recordingTracks: SettingsService.views.recordingTracks,
        vodTrackEnabled: SettingsService.views.vodTrackEnabled,
        vodTrack: SettingsService.views.vodTrack,
        muted: p.source.muted,
    }));
    const { name, mixerHidden, fader, audioMixers, sourceId } = p.source;
    const [trackFlags, setTrackFlags] = useState(Utils.numberToBinnaryArray(audioMixers, 6).reverse());
    function onTrackInput(index, value) {
        const newArray = [...trackFlags];
        newArray[index] = Number(value);
        setTrackFlags(newArray);
        const newValue = Utils.binnaryArrayToNumber([...newArray].reverse());
        EditorCommandsService.actions.executeCommand('SetAudioSettingsCommand', sourceId, {
            audioMixers: newValue,
        });
    }
    function onDeflectionInput(value) {
        EditorCommandsService.actions.executeCommand('SetDeflectionCommand', sourceId, value / 100);
    }
    function onInputHandler(name, value, e) {
        e.stopPropagation();
        EditorCommandsService.actions.executeCommand('SetAudioSettingsCommand', sourceId, {
            [name]: value,
        });
    }
    return (React.createElement(Form, { className: styles.audioSettingsRow, "data-role": "form", "data-name": "advanced-audio-header" },
        React.createElement("div", { className: styles.audioSourceName }, name),
        React.createElement(Tooltip, { title: muted ? $t('Unmute') : $t('Mute') },
            React.createElement("i", { className: muted ? 'icon-mute' : 'icon-audio', onClick: (e) => onInputHandler('muted', !muted, e) })),
        React.createElement("div", { style: { width: '200px', flexShrink: 0 }, onClick: (e) => e.stopPropagation() },
            React.createElement(SliderInput, { value: Math.floor(fader.deflection * 100), max: 100, min: 0, name: "deflection", onInput: onDeflectionInput, hasNumberInput: true, slimNumberInput: true, nowrap: true })),
        React.createElement(Tooltip, { title: mixerHidden ? $t('Show in Mixer') : $t('Hide in Mixer') },
            React.createElement("i", { className: mixerHidden ? 'icon-hide' : 'icon-view', onClick: (e) => onInputHandler('mixerHidden', !mixerHidden, e) })),
        (isAdvancedOutput || vodTrackEnabled) && (React.createElement("div", { className: styles.audioSettingsTracks, onClick: (e) => e.stopPropagation() },
            (isAdvancedOutput || vodTrackEnabled) && (React.createElement(InputWrapper, { label: vodTrackEnabled ? $t('Stream Tracks') : $t('Stream Track'), tooltip: $t('Designates if this source is audible in your live broadcast'), layout: "horizontal", style: { flexWrap: 'nowrap' } },
                React.createElement("div", { style: { display: 'flex' } },
                    React.createElement(BoolButtonInput, { label: String(streamTrack + 1), value: !!trackFlags[streamTrack], onChange: value => onTrackInput(streamTrack, value), checkboxStyles: { marginRight: vodTrackEnabled ? '4px' : '8px' }, name: "streamTrack" }),
                    vodTrackEnabled && (React.createElement(BoolButtonInput, { label: String(vodTrack + 1), value: !!trackFlags[vodTrack], onChange: value => onTrackInput(vodTrack, value), checkboxStyles: { marginRight: '8px' }, name: "vodTrack" }))))),
            isAdvancedOutput && (React.createElement(InputWrapper, { label: $t('Rec. Tracks'), tooltip: $t('Designates if this source is audible in your recorded track(s)'), layout: "horizontal", style: { flexWrap: 'nowrap' } },
                React.createElement("div", { style: { display: 'flex' } }, recordingTracks === null || recordingTracks === void 0 ? void 0 : recordingTracks.map(track => (React.createElement(BoolButtonInput, { label: String(track + 1), key: track, value: !!trackFlags[track], onChange: value => onTrackInput(track, value), checkboxStyles: { marginRight: '4px' }, name: `flag${track}` }))))))))));
}
function PanelForm(p) {
    const { sourceId, forceMono, syncOffset, source, monitoringType } = p.source;
    const [testing, setTesting] = useState(false);
    const savedMonitoring = useRef(monitoringType);
    const hasDevices = !(source === null || source === void 0 ? void 0 : source.video) && !((source === null || source === void 0 ? void 0 : source.type) === 'soundtrack_source');
    const isMic = source
        ? [
            'wasapi_input_capture',
            'coreaudio_input_capture',
            'dshow_input',
            'av_capture_input',
        ].includes(source.type)
        : false;
    const isProcessCapture = (source === null || source === void 0 ? void 0 : source.type) === 'wasapi_process_output_capture';
    const { EditorCommandsService } = Services;
    function handleSettingsChange(name, value) {
        EditorCommandsService.actions.executeCommand('SetAudioSettingsCommand', sourceId, {
            [name]: value,
        });
    }
    useEffect(() => {
        if (testing)
            return;
        savedMonitoring.current = monitoringType;
    }, [monitoringType, testing]);
    useEffect(() => {
        return () => {
            if (p.source.isDestroyed())
                return;
            p.source.setSettings({ monitoringType: savedMonitoring.current });
        };
    }, []);
    function handleTestButtonClick() {
        if (!testing) {
            setTesting(true);
            p.source.setSettings({ monitoringType: 1 });
        }
        else {
            p.source.setSettings({ monitoringType: savedMonitoring.current });
            setTesting(false);
        }
    }
    return (React.createElement(Form, { "data-role": "form", "data-name": "advanced-audio-detail" },
        hasDevices && source && React.createElement(DeviceInputs, { source: source }),
        React.createElement(NumberInput, { label: $t('Sync Offset'), value: syncOffset, name: "syncOffset", onChange: value => handleSettingsChange('syncOffset', value), tooltip: $t('Time it takes between sound occuring and being broadcast (ms)'), min: -950, max: 5000, uncontrolled: false }),
        !isProcessCapture && React.createElement(SwitchInput, { label: $t('Downmix to Mono'), value: forceMono, name: "forceMono", onChange: value => handleSettingsChange('forceMono', value), tooltip: $t('Route audio to the central channel instead of left or right stereo channels') }),
        React.createElement(ListInput, { label: $t('Audio Monitoring'), options: p.source.monitoringOptions, value: monitoringType, disabled: testing, name: "monitoringType", onChange: value => handleSettingsChange('monitoringType', value), tooltip: $t('Generally, enabling monitoring sends the audio through the Desktop Audio channel') }),
        isMic && (React.createElement(Button, { onClick: handleTestButtonClick, type: testing ? 'default' : 'primary', style: { marginLeft: '278px' } }, testing ? $t('Testing...') : $t('Test Audio')))));
}
function DeviceInputs(p) {
    const { EditorCommandsService } = Services;
    const sourceProperties = useMemo(() => p.source.getPropertiesFormData(), [
        p.source.sourceId,
    ]);
    const settings = useMemo(() => p.source.getSettings(), [p.source.sourceId]);
    const [statefulSettings, setStatefulSettings] = useState(settings);
    const deviceOptions = sourceProperties[0].options.map(option => ({
        label: option.description,
        value: option.value,
    }));
    function handleInput(name, value) {
        EditorCommandsService.actions.executeCommand('EditSourceSettingsCommand', p.source.sourceId, {
            [name]: value,
        });
        setStatefulSettings(Object.assign(Object.assign({}, statefulSettings), { [name]: value }));
    }
    const input = p.source.type === 'wasapi_process_output_capture' ? (React.createElement(ListInput, { label: $t('Window'), options: deviceOptions, value: statefulSettings.window, onChange: value => handleInput('window', value) })) : (React.createElement(ListInput, { label: $t('Device'), options: deviceOptions, value: statefulSettings.device_id, onChange: value => handleInput('device_id', value) }));
    return (React.createElement(React.Fragment, null,
        input,
        p.source.type !== 'wasapi_process_output_capture' && React.createElement(SwitchInput, { label: $t('Use Device Timestamps'), value: statefulSettings.use_device_timing, onChange: value => handleInput('use_device_timing', value) })));
}
//# sourceMappingURL=SourceSettings.js.map