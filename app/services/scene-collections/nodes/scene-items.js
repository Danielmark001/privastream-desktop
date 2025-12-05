var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Node } from './node';
import { HotkeysNode } from './hotkeys';
import { Inject } from '../../core/injector';
export class SceneItemsNode extends Node {
    constructor() {
        super(...arguments);
        this.schemaVersion = 1;
    }
    getItems(context) {
        return context.scene.getNodes().slice().reverse();
    }
    save(context) {
        const promises = this.getItems(context).map(sceneItem => {
            return new Promise(resolve => {
                var _a, _b;
                const hotkeys = new HotkeysNode();
                if (sceneItem.isItem()) {
                    const display = (_a = sceneItem === null || sceneItem === void 0 ? void 0 : sceneItem.display) !== null && _a !== void 0 ? _a : this.dualOutputService.views.getNodeDisplay(sceneItem.sceneItemId, sceneItem.sceneId);
                    hotkeys.save({ sceneItemId: sceneItem.sceneItemId }).then(() => {
                        const transform = sceneItem.transform;
                        resolve({
                            hotkeys,
                            id: sceneItem.sceneItemId,
                            sourceId: sceneItem.sourceId,
                            x: transform.position.x,
                            y: transform.position.y,
                            scaleX: transform.scale.x,
                            scaleY: transform.scale.y,
                            visible: sceneItem.visible,
                            crop: transform.crop,
                            locked: sceneItem.locked,
                            rotation: transform.rotation,
                            streamVisible: sceneItem.streamVisible,
                            recordingVisible: sceneItem.recordingVisible,
                            scaleFilter: sceneItem.scaleFilter,
                            blendingMode: sceneItem.blendingMode,
                            blendingMethod: sceneItem.blendingMethod,
                            sceneNodeType: 'item',
                            display,
                        });
                    });
                }
                else {
                    const display = (_b = sceneItem === null || sceneItem === void 0 ? void 0 : sceneItem.display) !== null && _b !== void 0 ? _b : this.dualOutputService.views.getNodeDisplay(sceneItem.id, sceneItem.sceneId);
                    resolve(Object.assign(Object.assign({}, sceneItem.getModel()), { childrenIds: sceneItem.childrenIds, display }));
                }
            });
        });
        return new Promise(resolve => {
            Promise.all(promises).then(items => {
                this.data = { items };
                resolve();
            });
        });
    }
    sanitizeIds() {
        const ids = {};
        this.data.items = this.data.items.filter(item => {
            if (ids[item.id])
                return false;
            ids[item.id] = true;
            return true;
        });
    }
    load(context) {
        this.sanitizeIds();
        if (this.dualOutputService.views.hasNodeMap(context.scene.id)) {
            this.videoSettingsService.validateVideoContext();
            const nodeMap = this.dualOutputService.views.sceneNodeMaps[context.scene.id];
            const verticalNodeIds = Object.values(nodeMap);
            this.data.items.forEach(item => {
                if (!(item === null || item === void 0 ? void 0 : item.display)) {
                    item.display = verticalNodeIds.includes(item.id) ? 'vertical' : 'horizontal';
                }
                if (item.sceneNodeType === 'item') {
                    if (item.streamVisible == null)
                        item.streamVisible = true;
                    if (item.recordingVisible == null)
                        item.recordingVisible = true;
                }
            });
        }
        else {
            this.data.items.forEach(item => {
                if (!(item === null || item === void 0 ? void 0 : item.display)) {
                    item.display = 'horizontal';
                }
                if (item.sceneNodeType === 'item') {
                    if (item.streamVisible == null)
                        item.streamVisible = true;
                    if (item.recordingVisible == null)
                        item.recordingVisible = true;
                }
            });
        }
        context.scene.addSources(this.data.items);
        const promises = [];
        const sources = this.sourcesService.state.sources;
        this.data.items.forEach(item => {
            if (item.sceneNodeType === 'folder')
                return;
            if (!sources[item.sourceId])
                return;
            const hotkeys = item.hotkeys;
            if (hotkeys)
                promises.push(hotkeys.load({ sceneItemId: item.id }));
        });
        return new Promise(resolve => {
            Promise.all(promises).then(() => resolve());
        });
    }
}
__decorate([
    Inject('SourcesService')
], SceneItemsNode.prototype, "sourcesService", void 0);
__decorate([
    Inject('ScenesService')
], SceneItemsNode.prototype, "scenesService", void 0);
__decorate([
    Inject('DualOutputService')
], SceneItemsNode.prototype, "dualOutputService", void 0);
__decorate([
    Inject('VideoSettingsService')
], SceneItemsNode.prototype, "videoSettingsService", void 0);
//# sourceMappingURL=scene-items.js.map