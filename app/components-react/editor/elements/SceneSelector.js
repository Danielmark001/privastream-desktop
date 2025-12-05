import React, { useState, useRef } from 'react';
import cx from 'classnames';
import { Dropdown, Tooltip, Tree } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import * as remote from '@electron/remote';
import { Menu } from 'util/menus/Menu';
import { getOS } from 'util/operating-systems';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import HelpTip from 'components-react/shared/HelpTip';
import Scrollable from 'components-react/shared/Scrollable';
import { DisplayToggle } from 'components-react/shared/DisplayToggle';
import { useTree } from 'components-react/hooks/useTree';
import { $t } from 'services/i18n';
import { EDismissable } from 'services/dismissables';
import styles from './SceneSelector.m.less';
import useBaseElement from './hooks';
function SceneSelector() {
    const { ScenesService, SceneCollectionsService, TransitionsService, SourceFiltersService, ProjectorService, EditorCommandsService, StreamingService, DualOutputService, } = Services;
    const v = useVuex(() => ({
        studioMode: TransitionsService.views.studioMode,
        isMidStreamMode: StreamingService.views.isMidStreamMode,
        showDualOutput: DualOutputService.views.dualOutputMode,
        selectiveRecording: StreamingService.state.selectiveRecording,
    }));
    const { treeSort } = useTree(true);
    const [showDropdown, setShowDropdown] = useState(false);
    const { scenes, activeSceneId, activeScene, collections, activeCollection } = useVuex(() => ({
        scenes: ScenesService.views.scenes.map(scene => ({
            title: React.createElement(TreeNode, { scene: scene, removeScene: removeScene }),
            key: scene.id,
            selectable: true,
            isLeaf: true,
        })),
        activeScene: ScenesService.views.activeScene,
        activeSceneId: ScenesService.views.activeSceneId,
        activeCollection: SceneCollectionsService.activeCollection,
        collections: SceneCollectionsService.collections,
    }));
    function showContextMenu(info) {
        info.event.preventDefault();
        info.event.stopPropagation();
        const menu = new Menu();
        menu.append({
            label: $t('Duplicate'),
            click: () => ScenesService.actions.showDuplicateScene(activeSceneId),
        });
        menu.append({
            label: $t('Rename'),
            click: () => ScenesService.actions.showNameScene({ rename: activeSceneId }),
        });
        menu.append({
            label: $t('Remove'),
            click: () => removeScene(activeScene),
        });
        menu.append({
            label: $t('Filters'),
            click: () => SourceFiltersService.actions.showSourceFilters(activeSceneId),
        });
        menu.append({
            label: $t('Create Scene Projector'),
            click: () => ProjectorService.actions.createProjector(0, activeSceneId),
        });
        menu.popup();
    }
    function makeActive(selectedKeys) {
        ScenesService.actions.makeSceneActive(selectedKeys[0]);
    }
    function handleSort(info) {
        const newState = treeSort(info, scenes);
        ScenesService.actions.setSceneOrder(newState.map(node => node.key));
    }
    function addScene() {
        ScenesService.actions.showNameScene();
    }
    function showTransitions() {
        TransitionsService.actions.showSceneTransitions();
    }
    function manageCollections() {
        SceneCollectionsService.actions.showManageWindow();
    }
    function removeScene(scene) {
        if (!scene)
            return;
        const name = scene.name;
        remote.dialog
            .showMessageBox(remote.getCurrentWindow(), {
            title: 'Streamlabs Desktop',
            type: 'warning',
            message: $t('Are you sure you want to remove %{sceneName}?', { sceneName: name }),
            buttons: [$t('Cancel'), $t('OK')],
        })
            .then(({ response }) => {
            if (!response)
                return;
            if (!ScenesService.canRemoveScene()) {
                remote.dialog.showMessageBox({
                    title: 'Streamlabs Desktop',
                    message: $t('There needs to be at least one scene.'),
                });
                return;
            }
            EditorCommandsService.actions.executeCommand('RemoveSceneCommand', scene.id);
        });
    }
    function loadCollection(id) {
        var _a;
        if (((_a = SceneCollectionsService.getCollection(id)) === null || _a === void 0 ? void 0 : _a.operatingSystem) !== getOS())
            return;
        SceneCollectionsService.actions.load(id);
        setShowDropdown(false);
    }
    const DropdownMenu = (React.createElement("div", { className: cx(styles.dropdownContainer, 'react') },
        React.createElement("div", { className: styles.dropdownItem, onClick: manageCollections, style: { marginTop: '6px' } },
            React.createElement("i", { className: "icon-edit", style: { marginRight: '6px' } }),
            $t('Manage Scene Collections')),
        React.createElement("hr", { style: { borderColor: 'var(--border)' } }),
        React.createElement("span", { className: styles.whisper }, $t('Your Scene Collections')),
        React.createElement(Scrollable, { style: { height: 'calc(100% - 60px)' } }, collections.map(collection => (React.createElement("div", { key: collection.id, onClick: () => loadCollection(collection.id), className: cx(styles.dropdownItem, {
                [styles.osMismatch]: getOS() !== collection.operatingSystem,
            }), "data-name": collection.name },
            React.createElement("i", { className: cx('fab', collection.operatingSystem === 'win32' ? 'fa-windows' : 'fa-apple') }),
            collection.name))))));
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: styles.topContainer, id: "sceneSelector" },
            React.createElement(Dropdown, { overlay: DropdownMenu, trigger: ['click'], getPopupContainer: () => document.getElementById('sceneSelector'), visible: showDropdown, onVisibleChange: setShowDropdown, placement: "bottomLeft" },
                React.createElement("span", { className: styles.activeSceneContainer, "data-name": "SceneSelectorDropdown" },
                    React.createElement(DownOutlined, { style: { marginRight: '4px' } }),
                    React.createElement("span", { className: styles.activeScene }, activeCollection === null || activeCollection === void 0 ? void 0 : activeCollection.name))),
            React.createElement(Tooltip, { title: $t('Add a new Scene.'), placement: "bottomLeft" },
                React.createElement("i", { className: "icon-add-circle icon-button icon-button--lg", onClick: addScene })),
            v.showDualOutput && (React.createElement(DisplayToggle, { name: "editor-displays", className: styles.editorDisplayToggle })),
            React.createElement(Tooltip, { title: $t('Edit Scene Transitions.'), placement: "bottomRight" },
                React.createElement("i", { className: "icon-transition icon-button icon-button--lg", onClick: showTransitions }))),
        React.createElement(Scrollable, { style: { height: '100%' }, className: styles.scenesContainer },
            React.createElement(Tree, { draggable: true, treeData: scenes, onDrop: handleSort, onSelect: makeActive, onRightClick: showContextMenu, selectedKeys: [activeSceneId] })),
        React.createElement(HelpTip, { title: $t('Scene Collections'), dismissableKey: EDismissable.SceneCollectionsHelpTip, position: { top: '-8px', left: '102px' } },
            React.createElement("div", null, $t('This is where your Scene Collections live. Clicking the title will dropdown a menu where you can view & manage.')))));
}
function TreeNode(p) {
    return (React.createElement("div", { className: styles.sourceTitleContainer, "data-name": p.scene.name, "data-role": "scene" },
        React.createElement("span", { className: styles.sourceTitle }, p.scene.name),
        React.createElement(Tooltip, { title: $t('Remove Scene.'), placement: "left" },
            React.createElement("i", { onClick: () => p.removeScene(p.scene), className: "icon-trash" }))));
}
const mins = { x: 200, y: 120 };
export function SceneSelectorElement() {
    const containerRef = useRef(null);
    const { renderElement } = useBaseElement(React.createElement(SceneSelector, null), mins, containerRef.current);
    return (React.createElement("div", { ref: containerRef, "data-name": "SceneSelector", style: { height: '100%', display: 'flex', flexDirection: 'column' } }, renderElement()));
}
SceneSelectorElement.mins = mins;
//# sourceMappingURL=SceneSelector.js.map