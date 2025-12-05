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
import { Menu } from 'antd';
import * as remote from '@electron/remote';
import { WidgetDisplayData } from 'services/widgets';
import { $t } from 'services/i18n';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import Display from 'components-react/shared/Display';
import { Services } from 'components-react/service-provider';
import { useChildWindowParams, useVuex } from 'components-react/hooks';
import styles from './AddSource.m.less';
import { TextInput, SwitchInput } from 'components-react/shared/inputs';
import Form, { useForm } from 'components-react/shared/inputs/Form';
import Scrollable from 'components-react/shared/Scrollable';
export default function AddSource() {
    var _a, _b;
    const { SourcesService, ScenesService, WindowsService, WidgetsService, PlatformAppsService, EditorCommandsService, UserService, AudioService, } = Services;
    const sourceType = useChildWindowParams('sourceType');
    const sourceAddOptions = (useChildWindowParams('sourceAddOptions') || {
        propertiesManagerSettings: {},
    });
    const widgetType = (_a = sourceAddOptions.propertiesManagerSettings) === null || _a === void 0 ? void 0 : _a.widgetType;
    const { platform, activeScene, sources } = useVuex(() => {
        var _a;
        return ({
            platform: (_a = UserService.views.platform) === null || _a === void 0 ? void 0 : _a.type,
            activeScene: ScenesService.views.activeScene,
            sources: SourcesService.views.getSources().filter(source => {
                var _a, _b;
                if (!sourceAddOptions.propertiesManager)
                    return false;
                const comparison = {
                    type: sourceType,
                    propertiesManager: sourceAddOptions.propertiesManager,
                    appId: (_a = sourceAddOptions.propertiesManagerSettings) === null || _a === void 0 ? void 0 : _a.appId,
                    appSourceId: (_b = sourceAddOptions.propertiesManagerSettings) === null || _b === void 0 ? void 0 : _b.appSourceId,
                    isStreamlabel: sourceAddOptions.propertiesManager === 'streamlabels' || undefined,
                    widgetType,
                };
                const isSameType = source.isSameType(comparison);
                return isSameType && source.sourceId !== ScenesService.views.activeSceneId;
            }),
        });
    });
    const [name, setName] = useState('');
    const [overrideExistingSource, setOverrideExistingSource] = useState(false);
    const [selectedSourceId, setSelectedSourceId] = useState(((_b = sources[0]) === null || _b === void 0 ? void 0 : _b.sourceId) || '');
    const form = useForm();
    const existingSources = sources.map(source => ({ name: source.name, value: source.sourceId }));
    useEffect(() => {
        var _a, _b, _c;
        const suggestName = (name) => SourcesService.views.suggestName(name);
        let name;
        if (sourceAddOptions.propertiesManager === 'replay') {
            name = $t('Instant Replay');
        }
        else if (sourceAddOptions.propertiesManager === 'streamlabels') {
            name = $t('Stream Label');
        }
        else if (sourceAddOptions.propertiesManager === 'iconLibrary') {
            name = $t('Custom Icon');
        }
        else if (sourceAddOptions.propertiesManager === 'widget') {
            name = suggestName(WidgetDisplayData(platform)[widgetType].name);
        }
        else if (sourceAddOptions.propertiesManager === 'platformApp') {
            const app = PlatformAppsService.views.getApp((_a = sourceAddOptions.propertiesManagerSettings) === null || _a === void 0 ? void 0 : _a.appId);
            const sourceName = (_b = app === null || app === void 0 ? void 0 : app.manifest.sources.find(source => { var _a; return source.id === ((_a = sourceAddOptions.propertiesManagerSettings) === null || _a === void 0 ? void 0 : _a.appSourceId); })) === null || _b === void 0 ? void 0 : _b.name;
            name = suggestName(sourceName || '');
        }
        else {
            const sourceDescription = sourceType &&
                ((_c = SourcesService.getAvailableSourcesTypesList().find(sourceTypeDef => sourceTypeDef.value === sourceType)) === null || _c === void 0 ? void 0 : _c.description);
            name = suggestName(sourceDescription || '');
        }
        setName(name);
    }, []);
    function close() {
        WindowsService.actions.closeChildWindow();
    }
    function isNewSource() {
        if (sourceType === 'scene')
            return false;
        return overrideExistingSource || !existingSources.length;
    }
    const canCreateNew = existingSources.length > 0 && !['scene'].includes(sourceType);
    function addExisting() {
        if (!selectedSourceId || !activeScene)
            return;
        if (!activeScene.canAddSource(selectedSourceId)) {
            remote.dialog.showErrorBox($t('Error'), $t('Unable to add a source: the scene you are trying to add already contains your current scene'));
            return;
        }
        EditorCommandsService.actions.executeCommand('CreateExistingItemCommand', activeScene.id, selectedSourceId);
        close();
    }
    function addNew() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (!activeScene)
                return;
            try {
                yield form.validateFields();
            }
            catch (e) {
                return;
            }
            let source;
            if (sourceAddOptions.propertiesManager === 'widget') {
                const widget = yield WidgetsService.actions.return.createWidget(widgetType, name);
                source = widget.getSource();
            }
            else {
                const settings = {};
                if (sourceAddOptions.propertiesManager === 'platformApp') {
                    const { width, height } = yield PlatformAppsService.actions.return.getAppSourceSize((_a = sourceAddOptions.propertiesManagerSettings) === null || _a === void 0 ? void 0 : _a.appId, (_b = sourceAddOptions.propertiesManagerSettings) === null || _b === void 0 ? void 0 : _b.appSourceId);
                    settings.width = width;
                    settings.height = height;
                }
                const item = yield EditorCommandsService.actions.return.executeCommand('CreateNewItemCommand', activeScene.id, name, sourceType, settings, {
                    sourceAddOptions: {
                        propertiesManager: sourceAddOptions.propertiesManager,
                        propertiesManagerSettings: sourceAddOptions.propertiesManagerSettings,
                        guestCamStreamId: sourceAddOptions.guestCamStreamId,
                    },
                    display: 'horizontal',
                });
                source = item === null || item === void 0 ? void 0 : item.source;
            }
            if (!(source === null || source === void 0 ? void 0 : source.video) && (source === null || source === void 0 ? void 0 : source.hasProps())) {
                AudioService.actions.showAdvancedSettings(source.sourceId);
            }
            else if (source === null || source === void 0 ? void 0 : source.hasProps()) {
                SourcesService.actions.showSourceProperties(source.sourceId);
            }
            else {
                close();
            }
        });
    }
    function handleSubmit() {
        isNewSource() ? addNew() : addExisting();
    }
    function Footer() {
        return (<>
        <div className={styles.newSourceToggle}>
          {canCreateNew && (<SwitchInput value={overrideExistingSource} onChange={setOverrideExistingSource} label={$t('Add a new source instead')}/>)}
        </div>
        <button className="button button--default" onClick={close} style={{ marginRight: '6px' }}>
          {$t('Cancel')}
        </button>
        <button className="button button--action" onClick={handleSubmit}>
          {$t('Add Source')}
        </button>
      </>);
    }
    return (<ModalLayout footer={<Footer />}>
      <div className={styles.container}>
        {!isNewSource() && (<>
            <div>
              <h4>
                {$t('Add Existing Source')}
                {sourceAddOptions.propertiesManager === 'widget' && existingSources.length > 0 && (<span className={styles.recommendedLabel}>{$t('Recommended')}</span>)}
              </h4>
              <Scrollable className={styles.menuContainer}>
                <Menu mode="vertical" selectedKeys={[selectedSourceId]} onClick={({ key }) => {
                setSelectedSourceId(key);
            }} className={styles.menu}>
                  {existingSources.map(source => (<Menu.Item key={source.value}>{source.name}</Menu.Item>))}
                </Menu>
              </Scrollable>
            </div>
            {selectedSourceId && (<Display sourceId={selectedSourceId} style={{ width: '200px', height: '200px' }}/>)}
          </>)}
        {isNewSource() && (<Form form={form} name="addNewSourceForm" onFinish={addNew}>
            <h4>{$t('Add New Source')}</h4>
            <TextInput label={$t('Please enter the name of the source')} value={name} onInput={setName} name="newSourceName" autoFocus required uncontrolled={false} layout="vertical"/>
          </Form>)}
      </div>
    </ModalLayout>);
}
//# sourceMappingURL=AddSource.jsx.map