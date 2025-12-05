import { useRealmObject } from 'components-react/hooks/realm';
import { Services } from 'components-react/service-provider';
import React, { useEffect, useMemo } from 'react';
import { message, Progress, Select } from 'antd';
import { ObsSettingsSection } from './ObsSettings';
import { confirmAsync } from 'components-react/modals';
import * as remote from '@electron/remote';
import { $t } from 'services/i18n/index';
function getStatusText(state) {
    if (state.isRunning)
        return 'running';
    if (state.isCurrentlyUpdating)
        return 'updating';
    if (state.isStarting)
        return 'starting';
    return 'stopped';
}
function buildLocalUrl(port, path = '') {
    if (!port || port <= 0)
        return undefined;
    return `http://localhost:${port}${path}`;
}
function VisionInstalling(props) {
    const message = props.isUpdate ? 'Updating...' : 'Installing...';
    return (<ObsSettingsSection title={message}>
      <div style={{ marginBottom: 16 }}>
        <Progress percent={props.percent * 100} status="active" format={percent => `${(percent || 0).toFixed(0)}%`}/>
      </div>
    </ObsSettingsSection>);
}
function VisionInfo({ status, needsUpdate, installedVersion, pid, port, startProcess, stopProcess, ensureUpdated, openExternal, activeProcessId, availableProcesses, requestAvailableProcesses, activateProcess, availableGames, selectedGame, }) {
    const activeProcess = availableProcesses === null || availableProcesses === void 0 ? void 0 : availableProcesses.find(p => p.pid === activeProcessId);
    const eventsUrl = useMemo(() => buildLocalUrl(port, '/events'), [port]);
    const frameUrl = useMemo(() => buildLocalUrl(port, '/display_frame'), [port]);
    const isQaBundle = useMemo(() => remote.process.argv.includes('--bundle-qa') && (activeProcess === null || activeProcess === void 0 ? void 0 : activeProcess.executable_name) === 'vlc.exe', [activeProcess]);
    return (<ObsSettingsSection title="Streamlabs AI">
      <div style={{ marginBottom: 16 }}>
        <div>
          Installed: {installedVersion ? $t('Yes') : $t('No')}
          {installedVersion ? ` (${installedVersion})` : ''}
        </div>
        <div>Status: {status}</div>

        {status === 'running' && !!pid && <div>PID: {pid}</div>}
        {status === 'running' && !!port && <div>Port: {port}</div>}

        {status === 'stopped' && (<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
            {needsUpdate && (<button className="button button--action" onClick={() => ensureUpdated()}>
                Update Streamlabs AI
              </button>)}

            {!needsUpdate && (<button className="button button--action" onClick={e => startProcess({ debugMode: e.ctrlKey })}>
                Start Streamlabs AI
              </button>)}
          </div>)}

        {status === 'running' && (<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
            {eventsUrl && (<button className="button button--action" onClick={() => openExternal(eventsUrl)}>
                Open Events Log
              </button>)}

            {frameUrl && (<button className="button button--action" onClick={() => openExternal(frameUrl)}>
                Open Display Frame
              </button>)}

            <button className="button button--warn" onClick={stopProcess}>
              Stop Streamlabs AI
            </button>
          </div>)}
        <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
        }}>
          {status === 'running' && availableProcesses && (<div style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 6 }}>Active Process</div>
              <Select style={{ minWidth: 240 }} value={activeProcessId} onFocus={() => requestAvailableProcesses()} onChange={val => activateProcess(val, selectedGame)}>
                {availableProcesses.map(p => (<Select.Option key={p.pid} value={p.pid}>
                    {p.title || p.executable_name}
                  </Select.Option>))}
              </Select>
            </div>)}

          {status === 'running' &&
            ((activeProcess === null || activeProcess === void 0 ? void 0 : activeProcess.type) === 'capture_device' || isQaBundle) &&
            availableGames &&
            Object.keys(availableGames).length > 0 && (<div style={{ marginTop: 12 }}>
                <div style={{ marginBottom: 6 }}>Selected Game</div>
                <Select style={{ minWidth: 240 }} value={selectedGame} onChange={val => {
                console.log('Changing game to: ', val);
                activateProcess(activeProcessId, val);
            }}>
                  {Object.entries(availableGames).map(([key, label]) => (<Select.Option key={key} value={key}>
                      {label}
                    </Select.Option>))}
                </Select>
              </div>)}
        </div>
      </div>
    </ObsSettingsSection>);
}
function openLink(url) {
    remote.shell.openExternal(url);
}
export function AISettings() {
    const { VisionService } = Services;
    const state = useRealmObject(VisionService.state);
    const actions = VisionService.actions;
    const promptOpen = React.useRef(false);
    useEffect(() => {
        if (promptOpen.current)
            return;
        if (!state.needsUpdate)
            return;
        let message = 'Streamlabs AI must be updated before you can use it.';
        let button = 'Update Now';
        if (!state.installedVersion) {
            message =
                'Streamlabs needs to download additional components. Would you like to install them now?';
            button = 'Install';
        }
        promptOpen.current = true;
        confirmAsync({ title: message, okText: button }).then(confirmed => {
            promptOpen.current = false;
            if (confirmed) {
                actions.ensureUpdated();
            }
        });
    }, []);
    useEffect(() => {
        if (state.hasFailedToUpdate) {
            message.error({
                content: $t('There was an error installing Streamlabs AI.'),
            });
        }
    }, [state.hasFailedToUpdate]);
    useEffect(() => {
        if (state.isRunning) {
            actions.requestAvailableProcesses();
            actions.requestActiveProcess();
        }
    }, [state.isRunning]);
    return (<div>
      <VisionInfo status={getStatusText(state)} needsUpdate={state.needsUpdate} installedVersion={state.installedVersion} pid={state.pid} port={state.port} stopProcess={() => actions.stop()} openExternal={openLink} startProcess={(options) => actions.ensureRunning(options)} ensureUpdated={() => actions.ensureUpdated()} availableProcesses={state.availableProcesses} activeProcessId={state.selectedProcessId} requestAvailableProcesses={() => actions.requestAvailableProcesses()} activateProcess={(pid, gameHint) => actions.activateProcess(pid, gameHint)} availableGames={state.availableGames} selectedGame={state.selectedGame}/>

      {state.isCurrentlyUpdating && (<VisionInstalling percent={state.percentDownloaded} isUpdate={!!state.installedVersion}/>)}
    </div>);
}
//# sourceMappingURL=AISettings.jsx.map