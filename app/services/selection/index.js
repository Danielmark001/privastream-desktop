var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { mutation, StatefulService, Inject } from 'services';
import { $t } from 'services/i18n';
import { shortcut } from 'services/shortcuts';
import { BehaviorSubject } from 'rxjs';
import Utils from 'services/utils';
import { Selection } from './selection';
import { ViewHandler } from 'services/core';
import { GlobalSelection } from './global-selection';
export { Selection, GlobalSelection };
class SelectionViews extends ViewHandler {
    get globalSelection() {
        return new GlobalSelection();
    }
    get lastSelectedId() {
        return this.state.lastSelectedId;
    }
}
export class SelectionService extends StatefulService {
    constructor() {
        super(...arguments);
        this.updated = new BehaviorSubject({
            selectedIds: [],
            lastSelectedId: '',
        });
    }
    init() {
        this.scenesService.sceneSwitched.subscribe(() => {
            this.views.globalSelection.reset();
        });
    }
    get views() {
        return new SelectionViews(this.state);
    }
    removeSelected() {
        if (this.dualOutputService.views.hasSceneNodeMaps) {
            let ids = this.views.globalSelection.getIds();
            const updatedIds = new Set(ids);
            ids.forEach(id => {
                const dualOutputNodeId = this.dualOutputService.views.getDualOutputNodeId(id);
                if (dualOutputNodeId && !updatedIds.has(dualOutputNodeId)) {
                    updatedIds.add(dualOutputNodeId);
                }
            });
            ids = Array.from(updatedIds);
            this.select(ids);
        }
        this.views.globalSelection.remove();
    }
    openEditTransform(display = 'horizontal') {
        this.associateSelectionWithDisplay(display);
        this.windowsService.showWindow({
            componentName: 'EditTransform',
            title: $t('Edit Transform'),
            size: { width: 580, height: 500 },
            queryParams: { display },
        });
    }
    associateSelectionWithDisplay(display) {
        if (this.dualOutputService.views.dualOutputMode) {
            const selectedItems = this.state.selectedIds.map(id => this.scenesService.views.getSceneItem(id));
            const requireFilter = selectedItems.some(item => (item === null || item === void 0 ? void 0 : item.display) !== display);
            if (requireFilter) {
                const filteredIds = selectedItems
                    .filter(item => (item === null || item === void 0 ? void 0 : item.display) === display)
                    .map(item => item.id);
                this.select(filteredIds);
            }
        }
    }
    select(items) {
        const selection = new Selection(this.scenesService.views.activeSceneId, items);
        const scene = selection.getScene();
        const activeObsIds = selection.getItems().map(sceneItem => sceneItem.obsSceneItemId);
        const model = selection.getModel();
        this.SET_STATE({
            lastSelectedId: model.lastSelectedId,
            selectedIds: model.selectedIds,
        });
        this.updated.next(this.state);
        scene
            .getObsScene()
            .getItems()
            .forEach(obsSceneItem => {
            obsSceneItem.selected = activeObsIds.includes(obsSceneItem.id);
        });
    }
    SET_STATE(state) {
        Object.assign(this.state, state);
    }
}
SelectionService.initialState = {
    selectedIds: [],
    lastSelectedId: '',
};
__decorate([
    Inject()
], SelectionService.prototype, "scenesService", void 0);
__decorate([
    Inject()
], SelectionService.prototype, "windowsService", void 0);
__decorate([
    Inject()
], SelectionService.prototype, "editorCommandsService", void 0);
__decorate([
    Inject()
], SelectionService.prototype, "dualOutputService", void 0);
__decorate([
    shortcut('Delete')
], SelectionService.prototype, "removeSelected", null);
__decorate([
    mutation()
], SelectionService.prototype, "SET_STATE", null);
Utils.applyMixins(SelectionService, [Selection]);
//# sourceMappingURL=index.js.map