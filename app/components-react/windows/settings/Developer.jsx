var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useEffect, useState } from 'react';
import remote from '@electron/remote';
import path from 'path';
import { Button } from 'antd';
import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
import { $t } from 'services/i18n';
import { ObsSettingsSection } from './ObsSettings';
import FormFactory from 'components-react/shared/inputs/FormFactory';
import { TextInput } from 'components-react/shared/inputs';
import { metadata } from 'components-react/shared/inputs/metadata';
export function DeveloperSettings() {
    const { TcpServerService, PlatformAppsService } = Services;
    const { tokenInput, appDeveloperMode, apiMeta, apiValues } = useVuex(() => ({
        tokenInput: TcpServerService.state.token,
        appDeveloperMode: PlatformAppsService.state.devMode,
        apiMeta: TcpServerService.views.metadata,
        apiValues: TcpServerService.views.settings,
    }));
    useEffect(() => {
        TcpServerService.actions.stopListening();
        return () => {
            TcpServerService.actions.listen();
        };
    }, []);
    function generateToken() {
        TcpServerService.actions.generateToken();
    }
    function restoreDefaults() {
        TcpServerService.actions.restoreDefaultSettings();
    }
    function handleNamedPipeChange(key) {
        return (value) => {
            TcpServerService.actions.setSettings({ namedPipe: Object.assign(Object.assign({}, apiValues.namedPipe), { [key]: value }) });
        };
    }
    function handleWebsocketsChange(key) {
        return (value) => {
            TcpServerService.actions.setSettings({
                websockets: Object.assign(Object.assign({}, apiValues.websockets), { [key]: value }),
            });
        };
    }
    return (<>
      {appDeveloperMode && (<ObsSettingsSection title={$t('App Platform')}>
          <AppPlatformDeveloperSettings />
        </ObsSettingsSection>)}
      <ObsSettingsSection title={$t('Manage Dual Output Scene')}>
        <DualOutputDeveloperSettings />
      </ObsSettingsSection>
      <ObsSettingsSection>
        <Button className="button--soft-warning" onClick={restoreDefaults}>
          {$t('Restore Defaults')}
        </Button>
        <div style={{ padding: '8px' }}/>
      </ObsSettingsSection>
      <ObsSettingsSection>
        <TextInput label={$t('API Token')} value={tokenInput} isPassword addonAfter={<Button onClick={generateToken}>{$t('Update')}</Button>}/>
      </ObsSettingsSection>
      <ObsSettingsSection title={$t('Named Pipe')}>
        <FormFactory values={apiValues.namedPipe} metadata={apiMeta.namedPipe} onChange={handleNamedPipeChange}/>
      </ObsSettingsSection>
      <ObsSettingsSection title={$t('Websockets')}>
        <FormFactory values={apiValues.websockets} metadata={apiMeta.websockets} onChange={handleWebsocketsChange}/>
      </ObsSettingsSection>
    </>);
}
export function DualOutputDeveloperSettings(p) {
    const { OverlaysPersistenceService, SceneCollectionsService } = Services;
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState(false);
    function convertDualOutputCollection() {
        return __awaiter(this, arguments, void 0, function* (assignToHorizontal = false, exportOverlay = false) {
            if (!(SceneCollectionsService === null || SceneCollectionsService === void 0 ? void 0 : SceneCollectionsService.sceneNodeMaps) ||
                ((SceneCollectionsService === null || SceneCollectionsService === void 0 ? void 0 : SceneCollectionsService.sceneNodeMaps) &&
                    Object.values(SceneCollectionsService === null || SceneCollectionsService === void 0 ? void 0 : SceneCollectionsService.sceneNodeMaps).length === 0)) {
                setError(true);
                setMessage($t('The active scene collection is not a dual output scene collection.'));
                return;
            }
            if (exportOverlay) {
                const { filePath } = yield remote.dialog.showSaveDialog({
                    filters: [{ name: 'Overlay File', extensions: ['overlay'] }],
                });
                if (!filePath)
                    return;
                setBusy(true);
                const collectionFilePath = yield SceneCollectionsService.actions.return.convertDualOutputCollection(assignToHorizontal, p.collection);
                if (!collectionFilePath) {
                    setError(true);
                    setMessage($t('Unable to convert dual output collection.'));
                    return;
                }
                OverlaysPersistenceService.actions.return.saveOverlay(filePath).then(() => {
                    setError(false);
                    setBusy(false);
                    setMessage($t('Successfully saved %{filename} to %{filepath}', {
                        filename: path.parse(collectionFilePath).base,
                        filepath: filePath,
                    }));
                });
            }
            else {
                setBusy(true);
                const filePath = yield SceneCollectionsService.actions.return.convertDualOutputCollection(assignToHorizontal);
                if (filePath) {
                    setError(false);
                    setMessage($t('Successfully converted %{filename}', {
                        filename: path.parse(filePath).base,
                    }));
                }
                else {
                    setError(true);
                    setMessage($t('Unable to convert dual output collection.'));
                }
                setBusy(false);
            }
        });
    }
    return (<>
      <span>
        {$t('The below will create a copy of the active scene collection, set the copy as the active collection, and then apply the function.')}
      </span>
      <div>
        <h4>{$t('Convert to Vanilla Scene')}</h4>
        <div style={{ display: 'flex', justifyContent: 'space-evenly', paddingBottom: '16px' }}>
          <Button className="button--soft-warning" style={{ marginRight: '16px' }} onClick={() => convertDualOutputCollection()} disabled={busy}>
            {$t('Convert')}
          </Button>
          {!p.collection && (<Button className="button--soft-warning" onClick={() => convertDualOutputCollection(false, true)} disabled={busy}>
              {$t('Convert and Export Overlay')}
            </Button>)}
        </div>
      </div>
      {!p.collection && (<div style={{ marginTop: '10px' }}>
          <h4>{$t('Assign Vertical Sources to Horizontal Display')}</h4>
          <div style={{ display: 'flex', justifyContent: 'space-evenly', paddingBottom: '16px' }}>
            <Button className="button--soft-warning" style={{ marginRight: '16px' }} onClick={() => convertDualOutputCollection(true)} disabled={busy}>
              {$t('Assign')}
            </Button>
            <Button className="button--soft-warning" onClick={() => convertDualOutputCollection(true, true)} disabled={busy}>
              {$t('Assign and Export Overlay')}
            </Button>
          </div>
        </div>)}
      <div style={{ color: error ? 'red' : 'var(--teal)' }}>{message}</div>
      <div style={{ padding: '8px' }}/>
    </>);
}
function AppPlatformDeveloperSettings() {
    const { PlatformAppsService } = Services;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { loadedUnpackedApp } = useVuex(() => ({
        loadedUnpackedApp: PlatformAppsService.views.enabledApps.length === 0
            ? null
            : PlatformAppsService.views.enabledApps.find(app => app.unpacked),
    }));
    const [s, setAppState] = useState({
        appPath: (loadedUnpackedApp === null || loadedUnpackedApp === void 0 ? void 0 : loadedUnpackedApp.appPath) || '',
        appToken: (loadedUnpackedApp === null || loadedUnpackedApp === void 0 ? void 0 : loadedUnpackedApp.appToken) || '',
    });
    const meta = {
        appPath: metadata.file({
            label: $t('Unpacked App Path'),
            directory: true,
            tooltip: $t('This is the path to your unpacked app. It should be a folder containing a valid manifest.json'),
        }),
        appToken: metadata.text({
            label: $t('App Token'),
            tooltip: $t('This token allows you app to authenticate with the Streamlabs API. Visit platform.streamlabs.com to create a developer account and get a test app token.'),
        }),
    };
    function handleFormChange(key) {
        return (value) => {
            setAppState(Object.assign(Object.assign({}, s), { [key]: value }));
        };
    }
    function loadApp() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!s.appPath || !s.appToken)
                return;
            if (loadedUnpackedApp) {
                yield PlatformAppsService.actions.return.unloadApp(loadedUnpackedApp);
            }
            setLoading(true);
            try {
                setError(yield PlatformAppsService.actions.return.loadUnpackedApp(s.appPath, s.appToken));
            }
            catch (e) {
                setError($t('There was an error loading this app, please try again or contact the Streamlabs development team for assistance.'));
            }
            setLoading(false);
        });
    }
    function reloadApp() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!loadedUnpackedApp)
                return;
            setLoading(true);
            setError('');
            try {
                setError(yield PlatformAppsService.actions.return.refreshApp(loadedUnpackedApp.id));
            }
            catch (e) {
                setError($t('There was an error loading this app, please try again or contact the Streamlabs development team for assistance.'));
            }
            setLoading(false);
        });
    }
    function unloadApp() {
        if (!loadedUnpackedApp)
            return;
        PlatformAppsService.actions.unloadApp(loadedUnpackedApp);
    }
    return (<>
      {loadedUnpackedApp && (<>
          <h4>{$t('Currently Loaded App')}</h4>
          <p style={{ wordWrap: 'break-word' }}>
            {loadedUnpackedApp.manifest.name}
            {loadedUnpackedApp.manifest.version}
          </p>
          <h4>{$t('Path')}</h4>
          <p style={{ wordWrap: 'break-word' }}>{loadedUnpackedApp.appPath}</p>
          <h4>{$t('Token')}</h4>
          <p style={{ wordWrap: 'break-word' }}>{loadedUnpackedApp.appToken}</p>
          <div style={{ display: 'flex', justifyContent: 'space-evenly', paddingBottom: '16px' }}>
            <Button onClick={reloadApp} type="primary" disabled={loading}>
              {$t('Reload')}
              {loading && <i className="fa fa-spinner fa-pulse"/>}
            </Button>
            <Button onClick={unloadApp} type="primary" disabled={loading}>
              {$t('Unload')}
              {loading && <i className="fa fa-spinner fa-pulse"/>}
            </Button>
          </div>
        </>)}
      {!loadedUnpackedApp && (<>
          <FormFactory values={s} metadata={meta} onChange={handleFormChange}/>
          <Button onClick={loadApp} type="primary" disabled={loading}>
            {$t('Load App')}
            {loading && <i className="fa fa-spinner fa-pulse"/>}
          </Button>
          {error && <div style={{ color: 'var(--warning)', fontSize: '12px' }}>{error}</div>}
          <div style={{ padding: '8px' }}/>
        </>)}
    </>);
}
//# sourceMappingURL=Developer.jsx.map