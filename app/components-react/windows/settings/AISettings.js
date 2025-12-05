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
    return (React.createElement(ObsSettingsSection, { title: message },
        React.createElement("div", { style: { marginBottom: 16 } },
            React.createElement(Progress, { percent: props.percent * 100, status: "active", format: percent => `${(percent || 0).toFixed(0)}%` }))));
}
function VisionInfo({ status, needsUpdate, installedVersion, pid, port, startProcess, stopProcess, ensureUpdated, openExternal, activeProcessId, availableProcesses, requestAvailableProcesses, activateProcess, availableGames, selectedGame, }) {
    const activeProcess = availableProcesses === null || availableProcesses === void 0 ? void 0 : availableProcesses.find(p => p.pid === activeProcessId);
    const eventsUrl = useMemo(() => buildLocalUrl(port, '/events'), [port]);
    const frameUrl = useMemo(() => buildLocalUrl(port, '/display_frame'), [port]);
    const isQaBundle = useMemo(() => remote.process.argv.includes('--bundle-qa') && (activeProcess === null || activeProcess === void 0 ? void 0 : activeProcess.executable_name) === 'vlc.exe', [activeProcess]);
    return (React.createElement(ObsSettingsSection, { title: "Streamlabs AI" },
        React.createElement("div", { style: { marginBottom: 16 } },
            React.createElement("div", null,
                "Installed: ",
                installedVersion ? $t('Yes') : $t('No'),
                installedVersion ? ` (${installedVersion})` : ''),
            React.createElement("div", null,
                "Status: ",
                status),
            status === 'running' && !!pid && React.createElement("div", null,
                "PID: ",
                pid),
            status === 'running' && !!port && React.createElement("div", null,
                "Port: ",
                port),
            status === 'stopped' && (React.createElement("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' } },
                needsUpdate && (React.createElement("button", { className: "button button--action", onClick: () => ensureUpdated() }, "Update Streamlabs AI")),
                !needsUpdate && (React.createElement("button", { className: "button button--action", onClick: e => startProcess({ debugMode: e.ctrlKey }) }, "Start Streamlabs AI")))),
            status === 'running' && (React.createElement("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' } },
                eventsUrl && (React.createElement("button", { className: "button button--action", onClick: () => openExternal(eventsUrl) }, "Open Events Log")),
                frameUrl && (React.createElement("button", { className: "button button--action", onClick: () => openExternal(frameUrl) }, "Open Display Frame")),
                React.createElement("button", { className: "button button--warn", onClick: stopProcess }, "Stop Streamlabs AI"))),
            React.createElement("div", { style: {
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 12,
                } },
                status === 'running' && availableProcesses && (React.createElement("div", { style: { marginTop: 12 } },
                    React.createElement("div", { style: { marginBottom: 6 } }, "Active Process"),
                    React.createElement(Select, { style: { minWidth: 240 }, value: activeProcessId, onFocus: () => requestAvailableProcesses(), onChange: val => activateProcess(val, selectedGame) }, availableProcesses.map(p => (React.createElement(Select.Option, { key: p.pid, value: p.pid }, p.title || p.executable_name)))))),
                status === 'running' &&
                    ((activeProcess === null || activeProcess === void 0 ? void 0 : activeProcess.type) === 'capture_device' || isQaBundle) &&
                    availableGames &&
                    Object.keys(availableGames).length > 0 && (React.createElement("div", { style: { marginTop: 12 } },
                    React.createElement("div", { style: { marginBottom: 6 } }, "Selected Game"),
                    React.createElement(Select, { style: { minWidth: 240 }, value: selectedGame, onChange: val => {
                            console.log('Changing game to: ', val);
                            activateProcess(activeProcessId, val);
                        } }, Object.entries(availableGames).map(([key, label]) => (React.createElement(Select.Option, { key: key, value: key }, label))))))))));
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
    return (React.createElement("div", null,
        React.createElement(VisionInfo, { status: getStatusText(state), needsUpdate: state.needsUpdate, installedVersion: state.installedVersion, pid: state.pid, port: state.port, stopProcess: () => actions.stop(), openExternal: openLink, startProcess: (options) => actions.ensureRunning(options), ensureUpdated: () => actions.ensureUpdated(), availableProcesses: state.availableProcesses, activeProcessId: state.selectedProcessId, requestAvailableProcesses: () => actions.requestAvailableProcesses(), activateProcess: (pid, gameHint) => actions.activateProcess(pid, gameHint), availableGames: state.availableGames, selectedGame: state.selectedGame }),
        state.isCurrentlyUpdating && (React.createElement(VisionInstalling, { percent: state.percentDownloaded, isUpdate: !!state.installedVersion }))));
}
//# sourceMappingURL=AISettings.js.map