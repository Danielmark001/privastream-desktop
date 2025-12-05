var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Selection } from './selection';
import { Inject, ServiceHelper } from 'services/core';
import { $t } from 'services/i18n';
import Utils from 'services/utils';
import cloneDeep from 'lodash/cloneDeep';
import * as remote from '@electron/remote';
let GlobalSelection = class GlobalSelection extends Selection {
    get state() {
        return this.isFrozen ? this.frozenState : this.selectionService.state;
    }
    get sceneId() {
        return this.isFrozen ? this.frozenSceneId : this.scenesService.views.activeSceneId;
    }
    set sceneId(val) { }
    set state(val) { }
    constructor() {
        super(null);
    }
    freeze() {
        this.frozenState = cloneDeep(this.state);
        this.frozenSceneId = this.sceneId;
        super.freeze();
    }
    remove() {
        const lastSelected = this.getLastSelected();
        if (!lastSelected)
            return;
        const name = lastSelected.name;
        const selectionLength = this.dualOutputService.views.isDualOutputCollection
            ? this.getIds().length / 2
            : this.getIds().length;
        const message = selectionLength > 1
            ? $t('Are you sure you want to remove these %{count} items?', { count: selectionLength })
            : $t('Are you sure you want to remove %{sceneName}?', { sceneName: name });
        remote.dialog
            .showMessageBox(Utils.getMainWindow(), {
            title: 'Streamlabs Desktop',
            message,
            type: 'warning',
            buttons: [$t('Cancel'), $t('OK')],
        })
            .then(({ response }) => {
            if (!response)
                return;
            this.editorCommandsService.executeCommand('RemoveNodesCommand', this.clone());
        });
    }
    filterDualOutputNodes() {
        const dualOutputItems = this.clone().getItems('vertical');
        if (!dualOutputItems.length)
            return;
        const dualOutputSelection = new Selection(this._sceneId, dualOutputItems);
        this.editorCommandsService.executeCommand('RemoveNodesCommand', dualOutputSelection);
    }
    select(items, sync = false) {
        if (this.isFrozen) {
            throw new Error('Attempted to modify frozen selection');
        }
        if (sync) {
            this.selectionService.select(items);
        }
        else {
            this.selectionService.actions.select(items);
        }
        return this;
    }
    setState(state) {
        throw new Error('setState cannot be called on the GlobalSelection');
    }
};
__decorate([
    Inject()
], GlobalSelection.prototype, "selectionService", void 0);
__decorate([
    Inject()
], GlobalSelection.prototype, "editorCommandsService", void 0);
GlobalSelection = __decorate([
    ServiceHelper('SelectionService')
], GlobalSelection);
export { GlobalSelection };
//# sourceMappingURL=global-selection.js.map