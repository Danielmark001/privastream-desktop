import React, { useMemo, useEffect } from 'react';
import { useVuex } from 'components-react/hooks';
import { getOS, OS } from 'util/operating-systems';
import { $t } from 'services/i18n';
import { EVirtualWebcamPluginInstallStatus } from 'services/virtual-webcam';
import { Services } from 'components-react/service-provider';
import Translate from 'components-react/shared/Translate';
import { ObsSettingsSection } from './ObsSettings';
import Form from 'components-react/shared/inputs/Form';
import { ListInput } from 'components-react/shared/inputs/ListInput';
import { Button } from 'antd';
import styles from './VirtualWebcam.m.less';
import cx from 'classnames';
export function VirtualWebcamSettings() {
    const { VirtualWebcamService, ScenesService, SourcesService } = Services;
    useEffect(() => {
        let mounted = true;
        if (mounted) {
            VirtualWebcamService.actions.setInstallStatus();
        }
        return () => {
            mounted = false;
        };
    }, []);
    const v = useVuex(() => ({
        running: VirtualWebcamService.views.running,
        outputType: VirtualWebcamService.views.outputType,
        outputSelection: VirtualWebcamService.views.outputSelection,
        installStatus: VirtualWebcamService.views.installStatus,
        update: VirtualWebcamService.actions.update,
    }));
    const OUTPUT_TYPE_OPTIONS = [
        { label: $t('Program (default)'), value: 3..toString() },
        { label: $t('Scene'), value: 1..toString() },
        { label: $t('Source'), value: 2..toString() },
    ];
    const outputSelectionOptions = useMemo(() => {
        let options = [{ label: 'None', value: '' }];
        if (v.outputType === 1..toString()) {
            options = ScenesService.views.scenes.map(scene => ({
                label: scene.name,
                value: scene.id,
            }));
        }
        if (v.outputType === 2..toString()) {
            options = SourcesService.views
                .getSources()
                .filter(source => source.type !== 'scene' && source.video)
                .map(source => ({
                label: source.name,
                value: source.sourceId,
            }));
        }
        return options;
    }, [v.outputType, v.outputSelection]);
    const outputSelectionValue = useMemo(() => {
        var _a;
        if (!outputSelectionOptions.length)
            return { label: 'None', value: '' };
        const outputSelection = (_a = outputSelectionOptions.find(o => o.value === v.outputSelection)) !== null && _a !== void 0 ? _a : outputSelectionOptions[0];
        return outputSelection;
    }, [v.outputSelection, outputSelectionOptions]);
    const isInstalled = v.installStatus === EVirtualWebcamPluginInstallStatus.Installed;
    const showOutputSelection = isInstalled &&
        (v.outputType === 1..toString() ||
            v.outputType === 2..toString());
    const showOutputLabel = v.outputType === 1..toString()
        ? $t('Output Scene')
        : $t('Output Source');
    function onSelectType(value, label) {
        v.update(value, label);
    }
    function onSelectSelection(value) {
        v.update(v.outputType, value);
    }
    return (<div className={cx(styles.container, styles.virtualWebcam)}>
      <ObsSettingsSection key="vw-description">
        <div className={styles.description}>
          {$t('Virtual Webcam allows you to display your scenes from Streamlabs Desktop in video conferencing software. Streamlabs Desktop will appear as a Webcam that can be selected in most video conferencing apps.')}
        </div>
      </ObsSettingsSection>

      
      {isInstalled && (<ObsSettingsSection key="vw-type">
          <Form>
            <ListInput label={$t('Output Type')} options={OUTPUT_TYPE_OPTIONS} value={v.outputType} defaultValue={OUTPUT_TYPE_OPTIONS[0].value} onSelect={(val, opts) => {
                onSelectType(val, opts.labelrender);
            }} allowClear={false} style={{ width: '100%' }}/>
          </Form>
        </ObsSettingsSection>)}

      {showOutputSelection && (<ObsSettingsSection key="vw-selection">
          <Form>
            <ListInput label={showOutputLabel} options={outputSelectionOptions} value={outputSelectionValue.value} onSelect={onSelectSelection} allowClear={false} style={{ width: '100%' }}/>
          </Form>
        </ObsSettingsSection>)}

      
      {isInstalled && <ManageVirtualWebcam isRunning={v.running}/>}

      
      {!isInstalled && (<InstallVirtualWebcam isUpdate={v.installStatus === EVirtualWebcamPluginInstallStatus.Outdated} name={outputSelectionValue.value}/>)}
      {isInstalled && <UninstallVirtualWebcam />}
    </div>);
}
function ManageVirtualWebcam(p) {
    const { VirtualWebcamService } = Services;
    const buttonText = p.isRunning ? $t('Stop Virtual Webcam') : $t('Start Virtual Webcam');
    const statusText = p.isRunning
        ? $t('Virtual webcam is <status>Running</status>')
        : $t('Virtual webcam is <status>Offline</status>');
    function handleStartStop() {
        if (p.isRunning) {
            VirtualWebcamService.actions.stop();
        }
        else {
            VirtualWebcamService.actions.start();
        }
    }
    return (<ObsSettingsSection>
      <div className="section-content">
        <p>
          <Translate message={statusText} renderSlots={{
            status: (text) => {
                return (<span key="vw-running" className={cx({ [styles.running]: p.isRunning })}>
                    <b>{text}</b>
                  </span>);
            },
        }}/>
        </p>
        <button className={cx('button', { 'button--action': !p.isRunning, 'button--warn': p.isRunning })} style={{ marginBottom: '16px' }} onClick={handleStartStop}>
          {buttonText}
        </button>
        {getOS() === OS.Mac && (<p>
            {$t('If the virtual webcam does not appear in other applications, you may need to restart your computer.')}
          </p>)}
      </div>
    </ObsSettingsSection>);
}
function InstallVirtualWebcam(p) {
    const message = p.isUpdate
        ? $t('The Virtual Webcam plugin needs to be updated before it can be started. This requires administrator privileges.')
        : $t('Virtual Webcam requires administrator privileges to be installed on your system.');
    const buttonText = p.isUpdate ? $t('Update Virtual Webcam') : $t('Install Virtual Webcam');
    function handleInstall() {
        if (p.isUpdate) {
            const type = Services.VirtualWebcamService.views.outputType;
            Services.VirtualWebcamService.actions.update(type, p.name);
        }
        else {
            Services.VirtualWebcamService.actions.install();
        }
    }
    return (<ObsSettingsSection>
      <p>{message}</p>
      <Button className="button button--action" style={{ marginBottom: '16px' }} onClick={() => handleInstall()}>
        {buttonText}
      </Button>
    </ObsSettingsSection>);
}
function UninstallVirtualWebcam() {
    function handleUninstall() {
        Services.VirtualWebcamService.actions.uninstall();
    }
    return (<ObsSettingsSection>
      <p>
        {$t('Uninstalling Virtual Webcam will remove it as a device option in other applications.')}
      </p>
      <Button className="button button--default" style={{ marginBottom: '16px' }} onClick={() => handleUninstall()}>
        {$t('Uninstall Virtual Webcam')}
      </Button>
    </ObsSettingsSection>);
}
//# sourceMappingURL=VirtualWebcam.jsx.map