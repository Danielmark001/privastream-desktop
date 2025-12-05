var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React from 'react';
import { Button } from 'antd';
import { ObsSettingsSection } from './ObsSettings';
import { Services } from '../../service-provider';
import { alertAsync } from '../../modals';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { $t } from 'services/i18n/index';
export function ExperimentalSettings() {
    const { ScenesService, WindowsService, SceneCollectionsService } = Services;
    function repairSceneCollection() {
        ScenesService.repair();
        alertAsync('Repair finished. See details in the log file');
    }
    function showDemoComponents() {
        WindowsService.actions.showWindow({
            title: 'Shared React Components',
            componentName: 'SharedComponentsLibrary',
            size: { width: 1000, height: 1000 },
        });
    }
    function convertDualOutputCollection() {
        return __awaiter(this, arguments, void 0, function* (assignToHorizontal = false) {
            if (!(SceneCollectionsService === null || SceneCollectionsService === void 0 ? void 0 : SceneCollectionsService.sceneNodeMaps) ||
                ((SceneCollectionsService === null || SceneCollectionsService === void 0 ? void 0 : SceneCollectionsService.sceneNodeMaps) &&
                    Object.values(SceneCollectionsService === null || SceneCollectionsService === void 0 ? void 0 : SceneCollectionsService.sceneNodeMaps).length === 0)) {
                alertAsync({
                    icon: React.createElement(ExclamationCircleOutlined, { style: { color: 'var(--red)' } }),
                    getContainer: '#mainWrapper',
                    className: 'react',
                    title: $t('Invalid Scene Collection'),
                    content: $t('The active scene collection is not a dual output scene collection.'),
                });
                return;
            }
            yield SceneCollectionsService.actions.return
                .convertDualOutputCollection(assignToHorizontal)
                .then((message) => {
                var _a, _b;
                const messageData = JSON.parse(message);
                const className = messageData.error ? 'react convert-error' : 'react convert-success';
                const icon = messageData.error ? (React.createElement(ExclamationCircleOutlined, { style: { color: 'var(--red)' } })) : (React.createElement(CheckCircleOutlined, { style: { color: 'var(--teal)' } }));
                const title = (_a = $t(messageData === null || messageData === void 0 ? void 0 : messageData.title)) !== null && _a !== void 0 ? _a : 'Success';
                const content = (_b = messageData === null || messageData === void 0 ? void 0 : messageData.content) !== null && _b !== void 0 ? _b : $t('Successfully converted scene collection.');
                alertAsync({
                    icon,
                    getContainer: '#mainWrapper',
                    className,
                    title,
                    content,
                });
            });
        });
    }
    return (React.createElement(ObsSettingsSection, null,
        React.createElement("div", { className: "section" },
            React.createElement("h2", null, $t('Repair Scene Collection')),
            React.createElement(Button, { onClick: repairSceneCollection }, "Repair Scene Collection")),
        React.createElement("div", { className: "section" },
            React.createElement("h2", null, $t('Convert Dual Output Scene Collection')),
            React.createElement("span", null, $t('The below will create a copy of the active scene collection, set the copy as the active collection, and then remove all vertical sources.')),
            React.createElement("div", { style: { marginTop: '10px' } },
                React.createElement("h4", null, $t('Convert to Vanilla Scene')),
                React.createElement(Button, { className: "convert-collection button button--soft-warning", onClick: () => __awaiter(this, void 0, void 0, function* () { return yield convertDualOutputCollection(); }) }, $t('Convert')))),
        React.createElement("div", { className: "section" },
            React.createElement("h2", null, $t('Show Components Library')),
            React.createElement(Button, { type: "primary", onClick: showDemoComponents }, "Show Shared Components Library"))));
}
//# sourceMappingURL=Experimental.js.map