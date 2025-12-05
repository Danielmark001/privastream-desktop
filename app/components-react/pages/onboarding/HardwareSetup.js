import React, { useEffect, useRef } from 'react';
import { $t } from 'services/i18n';
import commonStyles from './Common.m.less';
import styles from './HardwareSetup.m.less';
import { Services } from 'components-react/service-provider';
import Display from 'components-react/shared/Display';
import Form from 'components-react/shared/inputs/Form';
import { ListInput } from 'components-react/shared/inputs';
import { useVuex } from 'components-react/hooks';
import { Volmeter2d } from 'services/audio/volmeter-2d';
import cx from 'classnames';
export function HardwareSetup() {
    const { DefaultHardwareService, SourceFiltersService } = Services;
    const v = useVuex(() => ({
        videoDevices: DefaultHardwareService.videoDevices.map(device => ({
            label: device.description,
            value: device.id,
        })),
        audioDevices: DefaultHardwareService.audioDevices.map(device => ({
            label: device.description,
            value: device.id,
        })),
        selectedVideoSource: DefaultHardwareService.selectedVideoSource,
        selectedVideoDevice: DefaultHardwareService.state.defaultVideoDevice,
        presetFilterValue: DefaultHardwareService.state.presetFilter || 'none',
        selectedAudioDevice: DefaultHardwareService.state.defaultAudioDevice,
        selectedAudioSource: DefaultHardwareService.selectedAudioSource,
    }));
    useEffect(() => {
        DefaultHardwareService.createTemporarySources();
        if (!DefaultHardwareService.selectedVideoSource && v.videoDevices.length) {
            DefaultHardwareService.actions.setDefault('video', v.videoDevices[0].value);
        }
        return () => DefaultHardwareService.actions.clearTemporarySources();
    }, []);
    function setVideoDevice(val) {
        const oldPresetValue = v.presetFilterValue;
        if (oldPresetValue !== 'none') {
            setPresetFilter('none');
        }
        DefaultHardwareService.setDefault('video', val);
        if (oldPresetValue !== 'none') {
            setPresetFilter(oldPresetValue);
        }
    }
    function setPresetFilter(value) {
        if (!DefaultHardwareService.selectedVideoSource)
            return;
        DefaultHardwareService.actions.setPresetFilter(value === 'none' ? '' : value);
        if (value === 'none') {
            SourceFiltersService.removePresetFilter(DefaultHardwareService.selectedVideoSource.sourceId);
        }
        else {
            SourceFiltersService.addPresetFilter(DefaultHardwareService.selectedVideoSource.sourceId, value);
        }
    }
    return (React.createElement("div", { style: {
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            height: '85%',
            flexDirection: 'column',
        } },
        React.createElement("h1", { className: commonStyles.titleContainer, style: { marginBottom: 0 } }, $t('Set up your mic & webcam')),
        React.createElement("div", { className: commonStyles.subtitleContainer }, $t('Connect your most essential devices now or later on.')),
        React.createElement("div", { className: styles.contentContainer },
            React.createElement(DisplaySection, null),
            !!v.videoDevices.length && (React.createElement(Form, { layout: "vertical", style: { width: 300 } },
                React.createElement(ListInput, { label: $t('Webcam'), options: v.videoDevices, value: v.selectedVideoDevice, onChange: setVideoDevice, allowClear: false }),
                React.createElement(ListInput, { label: $t('Visual Preset'), options: SourceFiltersService.views.presetFilterOptionsReact, value: v.presetFilterValue, onChange: setPresetFilter, allowClear: false }),
                React.createElement(ListInput, { label: $t('Microphone'), options: v.audioDevices, value: v.selectedAudioDevice, onChange: val => DefaultHardwareService.actions.setDefault('audio', val), allowClear: false }))))));
}
function DisplaySection() {
    const { DefaultHardwareService } = Services;
    const v = useVuex(() => ({
        videoDevices: DefaultHardwareService.videoDevices,
        selectedVideoSource: DefaultHardwareService.selectedVideoSource,
        selectedAudioSource: DefaultHardwareService.selectedAudioSource,
    }));
    const canvasRef = useRef(null);
    useEffect(() => {
        if (canvasRef.current && v.selectedAudioSource) {
            const volmeter2d = new Volmeter2d(v.selectedAudioSource, canvasRef.current);
            return () => volmeter2d.destroy();
        }
    }, [canvasRef.current, v.selectedAudioSource]);
    if (v.selectedVideoSource && v.videoDevices.length) {
        return (React.createElement("div", { className: cx(styles.display, 'section') },
            React.createElement(Display, { sourceId: v.selectedVideoSource.sourceId, renderingMode: 0 }),
            React.createElement("div", { style: { display: 'flex', justifyContent: 'center', marginTop: 8 } },
                React.createElement("canvas", { ref: canvasRef, style: { backgroundColor: 'var(--border)', width: '100%' } }))));
    }
    return (React.createElement("div", { className: styles.placeholder },
        React.createElement("span", null, $t('No webcam detected'))));
}
//# sourceMappingURL=HardwareSetup.js.map