var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useEffect, useRef, useState, useMemo } from 'react';
import pick from 'lodash/pick';
import { message, Tooltip, Tree } from 'antd';
import cx from 'classnames';
import { isItem } from 'services/scenes';
import { EditMenu } from 'util/menus/EditMenu';
import { $t } from 'services/i18n';
import { EPlaceType } from 'services/editor-commands/commands/reorder-nodes';
import { EDismissable } from 'services/dismissables';
import { assertIsDefined, getDefined } from 'util/properties-type-guards';
import useBaseElement from './hooks';
import styles from './SceneSelector.m.less';
import Scrollable from 'components-react/shared/Scrollable';
import HelpTip from 'components-react/shared/HelpTip';
import Translate from 'components-react/shared/Translate';
import { DualOutputSourceSelector } from './DualOutputSourceSelector';
import { Services } from 'components-react/service-provider';
import { initStore, useController } from 'components-react/hooks/zustand';
import { useVuex } from 'components-react/hooks';
import * as remote from '@electron/remote';
import { AuthModal } from 'components-react/shared/AuthModal';
import Utils from 'services/utils';
export const SourceSelectorCtx = React.createContext(null);
class SourceSelectorController {
    constructor() {
        this.scenesService = Services.ScenesService;
        this.sourcesService = Services.SourcesService;
        this.widgetsService = Services.WidgetsService;
        this.selectionService = Services.SelectionService;
        this.editorCommandsService = Services.EditorCommandsService;
        this.streamingService = Services.StreamingService;
        this.audioService = Services.AudioService;
        this.guestCamService = Services.GuestCamService;
        this.dualOutputService = Services.DualOutputService;
        this.userService = Services.UserService;
        this.tiktokService = Services.TikTokService;
        this.store = initStore({
            expandedFoldersIds: [],
            showModal: false,
        });
        this.nodeRefs = {};
        this.callCameFromInsideTheHouse = false;
        this.callCameFromIcon = false;
    }
    getTreeData(nodeData) {
        const getTreeNodes = (sceneNodes) => {
            return sceneNodes.map(sceneNode => {
                if (!this.nodeRefs[sceneNode.id])
                    this.nodeRefs[sceneNode.id] = React.createRef();
                let children;
                if (sceneNode.isFolder) {
                    children = getTreeNodes(nodeData.filter(n => n.parentId === sceneNode.id));
                }
                return {
                    title: (<TreeNode title={sceneNode.title} id={sceneNode.id} sceneId={sceneNode.sceneId} isVisible={sceneNode.isVisible} isLocked={sceneNode.isLocked} canShowActions={sceneNode.canShowActions} toggleVisibility={() => this.toggleVisibility(sceneNode.id, sceneNode === null || sceneNode === void 0 ? void 0 : sceneNode.toggleAll)} toggleLock={() => this.toggleLock(sceneNode.id)} selectiveRecordingEnabled={this.selectiveRecordingEnabled} isStreamVisible={sceneNode.isStreamVisible} isRecordingVisible={sceneNode.isRecordingVisible} isGuestCamActive={sceneNode.isGuestCamActive} isDualOutputActive={sceneNode.isDualOutputActive} hasNodeMap={this.hasNodeMap} cycleSelectiveRecording={() => this.cycleSelectiveRecording(sceneNode.id)} ref={this.nodeRefs[sceneNode.id]} onDoubleClick={() => this.sourceProperties(sceneNode.id)} removeSource={() => this.removeItems(sceneNode.id)} sourceProperties={() => this.sourceProperties(sceneNode.id)}/>),
                    isLeaf: !children,
                    key: sceneNode.id,
                    switcherIcon: <i className={sceneNode.icon}/>,
                    children,
                };
            });
        };
        return getTreeNodes(nodeData.filter(n => !n.parentId));
    }
    get nodeData() {
        return this.scene.getSourceSelectorNodes().map(node => {
            const itemsForNode = this.scene.getItemsForNode(node.id);
            const toggleAll = !!this.dualOutputService.views.sceneNodeMaps[this.scene.id];
            const isLocked = itemsForNode.every(i => i.locked);
            const isRecordingVisible = itemsForNode.every(i => i.recordingVisible);
            const isStreamVisible = itemsForNode.every(i => i.streamVisible);
            const isGuestCamActive = itemsForNode.some(i => {
                return (this.sourcesService.state.sources[i.sourceId].type === 'mediasoupconnector' &&
                    !!this.guestCamService.views.getGuestBySourceId(i.sourceId));
            });
            const isDualOutputActive = this.isDualOutputActive;
            const isFolder = !isItem(node);
            let isVisible = itemsForNode.some(i => i.visible);
            if (toggleAll && this.isDualOutputActive) {
                const dualOutputNodeId = this.dualOutputService.views.getDualOutputNodeId(node.id);
                const itemsForDualOutputNode = this.scene.getItemsForNode(dualOutputNodeId);
                isVisible =
                    itemsForNode.some(i => i.visible) || itemsForDualOutputNode.some(i => i.visible);
            }
            return {
                id: node.id,
                title: this.getNameForNode(node),
                icon: this.determineIcon(!isFolder, isFolder ? node.id : node.sourceId),
                isVisible,
                isLocked,
                isRecordingVisible,
                isStreamVisible,
                isGuestCamActive,
                isDualOutputActive,
                parentId: node.parentId,
                sceneId: node.sceneId,
                canShowActions: itemsForNode.length > 0,
                isFolder,
                toggleAll,
            };
        });
    }
    getNameForNode(node) {
        if (isItem(node)) {
            return this.sourcesService.state.sources[node.sourceId].name;
        }
        return node.name;
    }
    isSelected(node) {
        return this.selectionService.state.selectedIds.includes(node.id);
    }
    determineIcon(isLeaf, sourceId) {
        var _a, _b;
        if (!isLeaf) {
            return this.store.expandedFoldersIds.includes(sourceId)
                ? 'fas fa-folder-open'
                : 'fa fa-folder';
        }
        const { sourcesService, widgetsService } = this;
        const source = sourcesService.state.sources[sourceId];
        if (source.propertiesManagerType === 'smartBrowserSource') {
            return 'icon-ai';
        }
        if (source.propertiesManagerType === 'streamlabels') {
            return 'fas fa-file-alt';
        }
        if (source.propertiesManagerType === 'widget') {
            const widgetType = this.sourcesService.views
                .getSource(sourceId)
                .getPropertiesManagerSettings().widgetType;
            assertIsDefined(widgetType);
            return ((_a = widgetsService.widgetDisplayData[widgetType]) === null || _a === void 0 ? void 0 : _a.icon) || 'icon-error';
        }
        return ((_b = sourcesService.sourceDisplayData[source.type]) === null || _b === void 0 ? void 0 : _b.icon) || 'fas fa-file';
    }
    addSource() {
        if (this.scenesService.views.activeScene) {
            this.sourcesService.actions.showShowcase();
        }
    }
    addFolder() {
        if (this.scenesService.views.activeScene) {
            let itemsToGroup = [];
            let parentId = '';
            if (this.selectionService.views.globalSelection.canGroupIntoFolder()) {
                itemsToGroup = this.selectionService.views.globalSelection.getIds();
                const parent = this.selectionService.views.globalSelection.getClosestParent();
                if (parent)
                    parentId = parent.id;
            }
            this.scenesService.actions.showNameFolder({
                itemsToGroup,
                parentId,
                sceneId: this.scenesService.views.activeScene.id,
            });
        }
    }
    showContextMenu(sceneNodeId, event) {
        var _a;
        const sceneNode = this.scene.getNode(sceneNodeId || '');
        let sourceId = '';
        if (sceneNode) {
            sourceId = sceneNode.isFolder() ? (_a = sceneNode.getItems()[0]) === null || _a === void 0 ? void 0 : _a.sourceId : sceneNode.sourceId;
        }
        if (sceneNode && !sceneNode.isSelected())
            sceneNode.select(true);
        const menuOptions = sceneNode
            ? { selectedSceneId: this.scene.id, showSceneItemMenu: true, selectedSourceId: sourceId }
            : { selectedSceneId: this.scene.id };
        const menu = new EditMenu(menuOptions);
        menu.popup();
        event && event.stopPropagation();
    }
    removeItems(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (id) {
                yield this.selectionService.actions.return.select([id]);
            }
            this.selectionService.views.globalSelection.remove();
        });
    }
    sourceProperties(nodeId) {
        const node = this.scenesService.views.getSceneNode(nodeId) ||
            this.selectionService.views.globalSelection.getNodes()[0];
        if (!node)
            return;
        const item = node.isItem() ? node : node.getNestedItems()[0];
        if (!item)
            return;
        if (item.type === 'scene') {
            this.scenesService.actions.makeSceneActive(item.sourceId);
            return;
        }
        if (!item.video) {
            this.audioService.actions.showAdvancedSettings(item.sourceId);
            return;
        }
        this.sourcesService.actions.showSourceProperties(item.sourceId);
    }
    determinePlacement(info) {
        if (!info.dropToGap && !info.node.isLeaf)
            return EPlaceType.Inside;
        const dropPos = info.node.pos.split('-');
        const delta = info.dropPosition - Number(dropPos[dropPos.length - 1]);
        return delta > 0 ? EPlaceType.After : EPlaceType.Before;
    }
    handleSort(info) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const targetNodes = this.activeItemIds.length > 0 && this.activeItemIds.includes(info.dragNode.key)
                ? this.activeItemIds
                : info.dragNodesKeys;
            const nodesToDrop = this.scene.getSelection(targetNodes);
            const destNode = this.scene.getNode(info.node.key);
            const placement = this.determinePlacement(info);
            if (!nodesToDrop || !destNode)
                return;
            if (targetNodes.some(nodeId => nodeId === destNode.id))
                return;
            yield this.editorCommandsService.actions.return.executeCommand('ReorderNodesCommand', nodesToDrop, destNode === null || destNode === void 0 ? void 0 : destNode.id, placement);
            if (this.dualOutputService.views.hasSceneNodeMaps) {
                const destNodeId = (_a = destNode === null || destNode === void 0 ? void 0 : destNode.id) !== null && _a !== void 0 ? _a : info.node.key;
                const dualOutputNodes = targetNodes
                    .map(nodeId => {
                    const dualOutputNodeId = this.dualOutputService.views.getDualOutputNodeId(nodeId);
                    if (dualOutputNodeId) {
                        return dualOutputNodeId;
                    }
                })
                    .filter(nodeId => typeof nodeId === 'string');
                const dualOutputNodesToDrop = this.scene.getSelection(dualOutputNodes);
                const dualOutputDestNodeId = this.dualOutputService.views.getDualOutputNodeId(destNodeId);
                if (!dualOutputDestNodeId)
                    return;
                const dualOutputNode = this.scene.getNode(dualOutputDestNodeId);
                if (!dualOutputNodesToDrop || !dualOutputNode)
                    return;
                if (dualOutputNodes.some(nodeId => nodeId === dualOutputNode.id))
                    return;
                yield this.editorCommandsService.actions.return.executeCommand('ReorderNodesCommand', dualOutputNodesToDrop, dualOutputNode === null || dualOutputNode === void 0 ? void 0 : dualOutputNode.id, placement);
            }
        });
    }
    makeActive(info) {
        this.callCameFromInsideTheHouse = true;
        if (typeof info === 'string') {
            this.callCameFromIcon = true;
            this.selectionService.views.globalSelection.reset();
            this.selectionService.views.globalSelection.select([info]);
            return;
        }
        if (!this.callCameFromIcon) {
            let ids = [info.node.key];
            if (info.nativeEvent.ctrlKey) {
                ids = this.activeItemIds.concat(ids);
            }
            else if (info.nativeEvent.shiftKey) {
                const idx1 = this.nodeData.findIndex(i => i.id === this.activeItemIds[this.activeItemIds.length - 1]);
                const idx2 = this.nodeData.findIndex(i => i.id === info.node.key);
                const swapIdx = idx1 > idx2;
                ids = this.nodeData
                    .map(i => i.id)
                    .slice(swapIdx ? idx2 : idx1, swapIdx ? idx1 + 1 : idx2 + 1);
            }
            if (this.dualOutputService.views.hasNodeMap(this.scene.id) &&
                this.dualOutputService.views.activeDisplays.horizontal &&
                this.dualOutputService.views.activeDisplays.vertical) {
                const updatedIds = new Set(ids);
                ids.forEach(id => {
                    const dualOutputNodeId = this.dualOutputService.views.getDualOutputNodeId(id);
                    if (dualOutputNodeId && !updatedIds.has(dualOutputNodeId)) {
                        updatedIds.add(dualOutputNodeId);
                    }
                });
                ids = Array.from(updatedIds);
            }
            this.selectionService.views.globalSelection.select(ids);
        }
        this.callCameFromIcon = false;
    }
    toggleFolder(nodeId) {
        this.store.setState(s => {
            if (s.expandedFoldersIds.includes(nodeId)) {
                s.expandedFoldersIds = s.expandedFoldersIds.filter(id => id !== nodeId);
            }
            else {
                s.expandedFoldersIds = [...s.expandedFoldersIds, nodeId];
            }
        });
    }
    get lastSelectedId() {
        return this.selectionService.state.lastSelectedId;
    }
    get isDualOutputActive() {
        return this.dualOutputService.views.dualOutputMode;
    }
    get hasNodeMap() {
        return !!this.dualOutputService.views.sceneNodeMaps[this.scene.id];
    }
    get hasSceneNodeMaps() {
        return this.dualOutputService.views.hasSceneNodeMaps;
    }
    get horizontalActive() {
        return this.dualOutputService.views.activeDisplays.horizontal;
    }
    get verticalActive() {
        return this.dualOutputService.views.activeDisplays.vertical;
    }
    expandSelectedFolders() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (!this.store)
                return;
            if (this.callCameFromInsideTheHouse) {
                this.callCameFromInsideTheHouse = false;
                return;
            }
            const node = this.scene.getNode(this.lastSelectedId);
            if (!node || this.selectionService.state.selectedIds.length > 1)
                return;
            this.store.setState(s => {
                s.expandedFoldersIds = s.expandedFoldersIds.concat(node.getPath().slice(0, -1));
            });
            (_b = (_a = this.nodeRefs[this.lastSelectedId]) === null || _a === void 0 ? void 0 : _a.current) === null || _b === void 0 ? void 0 : _b.scrollIntoView({
                behavior: 'smooth',
            });
        });
    }
    get activeItemIds() {
        if (this.dualOutputService.views.hasNodeMap()) {
            const selectedIds = this.selectionService.state.selectedIds;
            const nodeIds = this.dualOutputService.views.onlyVerticalDisplayActive
                ? this.dualOutputService.views.verticalNodeIds
                : this.dualOutputService.views.horizontalNodeIds;
            if (!nodeIds)
                return selectedIds;
            return selectedIds.filter(id => nodeIds.includes(id));
        }
        return this.selectionService.state.selectedIds;
    }
    get selectionItemIds() {
        if (this.dualOutputService.views.activeDisplays.horizontal &&
            this.dualOutputService.views.activeDisplays.vertical) {
            const selectedIds = new Set(this.selectionService.state.selectedIds);
            this.selectionService.state.selectedIds.map(id => {
                const horizontalNodeId = this.dualOutputService.views.getHorizontalNodeId(id);
                if (horizontalNodeId && !selectedIds.has(horizontalNodeId)) {
                    selectedIds.add(horizontalNodeId);
                }
            });
            return Array.from(selectedIds);
        }
        return this.selectionService.state.selectedIds;
    }
    get activeItems() {
        return this.selectionService.views.globalSelection.getItems();
    }
    toggleVisibility(sceneNodeId, toggleAll = false) {
        if (!sceneNodeId)
            return;
        if (toggleAll) {
            const bothToggled = this.toggleBothVisibility(sceneNodeId);
            if (bothToggled)
                return;
        }
        const selection = this.scene.getSelection(sceneNodeId);
        const visible = !selection.isVisible();
        this.editorCommandsService.actions.executeCommand('HideItemsCommand', selection, !visible);
    }
    toggleBothVisibility(sceneNodeId) {
        const dualOutputNodeId = this.dualOutputService.views.getDualOutputNodeId(sceneNodeId);
        if (!dualOutputNodeId)
            return false;
        const selectedNodeSelection = this.scene.getSelection(sceneNodeId);
        const dualOutputNodeSelection = this.scene.getSelection(dualOutputNodeId);
        const selectedNodeVisibility = !selectedNodeSelection.isVisible();
        const dualOutputNodeVisibility = !dualOutputNodeSelection.isVisible();
        if (selectedNodeVisibility === dualOutputNodeVisibility) {
            const selection = this.scene.getSelection([sceneNodeId, dualOutputNodeId]);
            this.editorCommandsService.actions.executeCommand('HideItemsCommand', selection, !selectedNodeVisibility);
            return true;
        }
        return false;
    }
    get selectiveRecordingEnabled() {
        return this.streamingService.state.selectiveRecording;
    }
    get streamingServiceIdle() {
        return this.streamingService.isIdle;
    }
    get replayBufferActive() {
        return this.streamingService.isReplayBufferActive;
    }
    get selectiveRecordingLocked() {
        return this.replayBufferActive || !this.streamingServiceIdle;
    }
    toggleSelectiveRecording() {
        if (this.selectiveRecordingLocked)
            return;
        this.streamingService.actions.setSelectiveRecording(!this.streamingService.state.selectiveRecording);
        if (this.isDualOutputActive) {
            this.dualOutputService.actions.toggleDisplay(this.selectiveRecordingEnabled, 'vertical');
            this.selectionService.views.globalSelection.filterDualOutputNodes();
            if (!this.selectiveRecordingEnabled) {
                remote.dialog.showMessageBox({
                    title: 'Vertical Display Disabled',
                    message: $t('Dual Output can’t be displayed - Selective Recording only works with horizontal sources and disables editing the vertical output scene. Please disable selective recording from Sources to set up Dual Output.'),
                });
            }
        }
    }
    cycleSelectiveRecording(sceneNodeId) {
        const selection = this.scene.getSelection(sceneNodeId);
        if (selection.isLocked())
            return;
        if (selection.isStreamVisible() && selection.isRecordingVisible()) {
            selection.setRecordingVisible(false);
        }
        else if (selection.isStreamVisible()) {
            selection.setStreamVisible(false);
            selection.setRecordingVisible(true);
        }
        else {
            selection.setStreamVisible(true);
            selection.setRecordingVisible(true);
        }
    }
    toggleLock(sceneNodeId) {
        const selection = this.createSelection(sceneNodeId);
        const locked = !selection.isLocked();
        selection.setSettings({ locked });
    }
    createSelection(sceneNodeId) {
        if (this.dualOutputService.views.hasSceneNodeMaps) {
            const otherDisplayNodeId = this.dualOutputService.views.getDualOutputNodeId(sceneNodeId);
            return this.scene.getSelection([sceneNodeId, otherDisplayNodeId]);
        }
        return this.scene.getSelection(sceneNodeId);
    }
    toggleDualOutput() {
        if (this.userService.isLoggedIn) {
            if (Services.StreamingService.views.isMidStreamMode) {
                message.error({
                    content: $t('Cannot toggle Dual Output while live.'),
                    className: styles.toggleError,
                });
            }
            else if (Services.TransitionsService.views.studioMode) {
                message.error({
                    content: $t('Cannot toggle Dual Output while in Studio Mode.'),
                    className: styles.toggleError,
                });
            }
            else {
                const skipShowVideoSettings = this.dualOutputService.views.dualOutputMode === true;
                this.dualOutputService.actions.setDualOutputModeIfPossible(!this.dualOutputService.views.dualOutputMode, skipShowVideoSettings);
                Services.UsageStatisticsService.recordFeatureUsage('DualOutput');
                Services.UsageStatisticsService.recordAnalyticsEvent('DualOutput', {
                    type: 'ToggleOnDualOutput',
                    source: 'SourceSelector',
                    isPrime: this.userService.isPrime,
                    platforms: this.streamingService.views.linkedPlatforms,
                    tiktokStatus: this.tiktokService.scope,
                });
                if (!this.dualOutputService.views.dualOutputMode && this.selectiveRecordingEnabled) {
                    remote.dialog
                        .showMessageBox(Utils.getChildWindow(), {
                        title: 'Vertical Display Disabled',
                        message: $t('Dual Output can’t be displayed - Selective Recording only works with horizontal sources and disables editing the vertical output scene. Please disable selective recording from Sources to set up Dual Output.'),
                        buttons: [$t('OK')],
                    })
                        .catch(() => { });
                }
            }
        }
        else {
            this.handleShowModal(true);
        }
    }
    handleShowModal(status) {
        Services.WindowsService.actions.updateStyleBlockers('main', status);
        this.store.update('showModal', status);
    }
    handleAuth() {
        this.userService.actions.showLogin();
        const onboardingCompleted = Services.OnboardingService.onboardingCompleted.subscribe(() => {
            Services.DualOutputService.actions.setDualOutputModeIfPossible();
            Services.SettingsService.actions.showSettings('Video');
            onboardingCompleted.unsubscribe();
        });
    }
    get dualOutputTitle() {
        return !this.isDualOutputActive || !this.userService.isLoggedIn
            ? $t('Enable Dual Output to stream to horizontal & vertical platforms simultaneously')
            : $t('Disable Dual Output');
    }
    get scene() {
        const scene = getDefined(this.scenesService.views.activeScene);
        return scene;
    }
}
function SourceSelector() {
    const ctrl = useController(SourceSelectorCtx);
    const showModal = ctrl.store.useState(s => s.showModal);
    return (<>
      <StudioControls />
      <ItemsTree />
      {ctrl.nodeData.some(node => node.isFolder) && (<HelpTip title={$t('Folder Expansion')} dismissableKey={EDismissable.SourceSelectorFolders} position={{ top: '-8px', left: '102px' }}>
          <Translate message={$t('Wondering how to expand your folders? Just click on the <icon></icon> icon')}>
            <i slot="icon" className="fa fa-folder"/>
          </Translate>
        </HelpTip>)}
      <AuthModal prompt={$t('Please log in to enable dual output. Would you like to log in now?')} showModal={showModal} handleShowModal={ctrl.handleShowModal} handleAuth={ctrl.handleAuth}/>
    </>);
}
function StudioControls() {
    const ctrl = useController(SourceSelectorCtx);
    const { selectiveRecordingEnabled, selectiveRecordingLocked } = useVuex(() => pick(ctrl, ['selectiveRecordingEnabled', 'selectiveRecordingLocked']));
    const sourcesTooltip = $t('The building blocks of your scene. Also contains widgets.');
    const addSourceTooltip = $t('Add a new Source to your Scene. Includes widgets.');
    const addGroupTooltip = $t('Add a Group so you can move multiple Sources at the same time.');
    return (<div className={styles.topContainer} data-name="sourcesControls">
      <div className={styles.activeSceneContainer}>
        <Tooltip title={sourcesTooltip} placement="bottomLeft">
          <span className={styles.sourcesHeader}>{$t('Sources')}</span>
        </Tooltip>
      </div>
      <Tooltip title={addSourceTooltip} placement="bottomLeft">
        <i className="icon-add-circle icon-button icon-button--lg" onClick={() => ctrl.addSource()}/>
      </Tooltip>

      <Tooltip title={ctrl.dualOutputTitle} placement="bottomRight">
        <i className={cx('icon-dual-output icon-button icon-button--lg', {
            active: ctrl.isDualOutputActive,
        })} onClick={() => ctrl.toggleDualOutput()} data-testid={ctrl.isDualOutputActive ? 'dual-output-active' : 'dual-output-inactive'}/>
      </Tooltip>

      <Tooltip title={$t('Toggle Selective Recording')} placement="bottomRight">
        <i className={cx('icon-smart-record icon-button icon-button--lg', {
            active: selectiveRecordingEnabled,
            disabled: selectiveRecordingLocked,
        })} onClick={() => ctrl.toggleSelectiveRecording()}/>
      </Tooltip>
      <Tooltip title={addGroupTooltip} placement="bottomRight">
        <i className="icon-add-folder icon-button icon-button--lg" onClick={() => ctrl.addFolder()}/>
      </Tooltip>
    </div>);
}
function ItemsTree() {
    const ctrl = useController(SourceSelectorCtx);
    const { nodeData, selectionItemIds, selectiveRecordingEnabled, lastSelectedId } = useVuex(() => pick(ctrl, ['nodeData', 'selectionItemIds', 'selectiveRecordingEnabled', 'lastSelectedId']));
    const expandedFoldersIds = ctrl.store.useState(s => s.expandedFoldersIds);
    const [showTreeMask, setShowTreeMask] = useState(true);
    const [selectiveRecordingToggled, setSelectiveRecordingToggled] = useState(false);
    useEffect(() => setSelectiveRecordingToggled(!selectiveRecordingToggled), [
        selectiveRecordingEnabled,
    ]);
    useEffect(() => {
        ctrl.expandSelectedFolders();
    }, [lastSelectedId]);
    const treeData = ctrl.getTreeData(nodeData);
    return (<div style={{ height: 'calc(100% - 33px)' }} onMouseEnter={(e) => setShowTreeMask(e.buttons !== 0)} onMouseUp={() => setShowTreeMask(false)} onMouseLeave={() => setShowTreeMask(true)}>
      <Scrollable className={cx(styles.scenesContainer, styles.sourcesContainer)} onContextMenu={(e) => ctrl.showContextMenu('', e)}>
        {showTreeMask && <div className={styles.treeMask} data-name="treeMask"/>}
        <Tree selectedKeys={selectionItemIds} expandedKeys={expandedFoldersIds} onSelect={(selectedKeys, info) => ctrl.makeActive(info)} onExpand={(selectedKeys, info) => ctrl.toggleFolder(info.node.key)} onRightClick={info => ctrl.showContextMenu(info.node.key, info.event)} onDrop={(info) => ctrl.handleSort(info)} treeData={treeData} draggable multiple blockNode showIcon/>
      </Scrollable>
    </div>);
}
const TreeNode = React.forwardRef((p, ref) => {
    function selectiveRecordingMetadata() {
        if (p.isStreamVisible && p.isRecordingVisible) {
            return { icon: 'icon-smart-record', tooltip: $t('Visible on both Stream and Recording') };
        }
        return p.isStreamVisible
            ? { icon: 'icon-broadcast', tooltip: $t('Only visible on Stream') }
            : { icon: 'icon-studio', tooltip: $t('Only visible on Recording') };
    }
    const [hoveredIcon, setHoveredIcon] = useState('');
    return (<div className={styles.sourceTitleContainer} data-name={p.title} data-role="source" ref={ref} onDoubleClick={p.onDoubleClick}>
        <span className={styles.sourceTitle}>{p.title}</span>
        {p.canShowActions && (<>
            {p.isGuestCamActive && <i className="fa fa-signal"/>}
            {p.isDualOutputActive && p.hasNodeMap && (<DualOutputSourceSelector nodeId={p.id} sceneId={p === null || p === void 0 ? void 0 : p.sceneId}/>)}
            {p.selectiveRecordingEnabled && (<Tooltip title={selectiveRecordingMetadata().tooltip} placement="left">
                <i className={cx(selectiveRecordingMetadata().icon, { disabled: p.isLocked })} onClick={p.cycleSelectiveRecording}/>
              </Tooltip>)}
            <Tooltip title={$t('Lock/Unlock Source')} placement="left" visible={['icon-lock', 'icon-unlock'].includes(hoveredIcon)}>
              <i onClick={p.toggleLock} className={p.isLocked ? 'icon-lock' : 'icon-unlock'} onMouseEnter={() => setHoveredIcon(p.isLocked ? 'icon-lock' : 'icon-unlock')} onMouseLeave={() => setHoveredIcon('')}/>
            </Tooltip>
            <Tooltip title={$t('Hide/Unhide')} placement="left" visible={['icon-view', 'icon-hide'].includes(hoveredIcon)}>
              <i onClick={p.toggleVisibility} className={p.isVisible ? 'icon-view' : 'icon-hide'} onMouseEnter={() => setHoveredIcon(p.isVisible ? 'icon-view' : 'icon-hide')} onMouseLeave={() => setHoveredIcon('')}/>
            </Tooltip>
          </>)}
        <Tooltip title={$t('Remove Sources from your Scene.')} placement="left" visible={hoveredIcon === 'icon-trash'}>
          <i onClick={p.removeSource} className="icon-trash" onMouseEnter={() => setHoveredIcon('icon-trash')} onMouseLeave={() => setHoveredIcon('')}/>
        </Tooltip>
        <Tooltip title={$t('Open the Source Properties.')} placement="left" visible={hoveredIcon === 'icon-settings'}>
          <i onClick={p.sourceProperties} className="icon-settings" onMouseEnter={() => setHoveredIcon('icon-settings')} onMouseLeave={() => setHoveredIcon('')}/>
        </Tooltip>
      </div>);
});
const mins = { x: 200, y: 120 };
export function SourceSelectorElement() {
    const containerRef = useRef(null);
    const { renderElement } = useBaseElement(<SourceSelector />, mins, containerRef.current);
    const controller = useMemo(() => new SourceSelectorController(), []);
    return (<div ref={containerRef} data-name="SourceSelector" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <SourceSelectorCtx.Provider value={controller}>{renderElement()}</SourceSelectorCtx.Provider>
    </div>);
}
SourceSelectorElement.mins = mins;
//# sourceMappingURL=SourceSelector.jsx.map