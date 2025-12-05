var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ArrayNode } from './array-node';
import { SceneItemsNode } from './scene-items';
import { ScenesService } from '../../scenes';
import { SourcesService } from '../../sources';
import { HotkeysNode } from './hotkeys';
import { SceneFiltersNode } from './scene-filters';
export class ScenesNode extends ArrayNode {
    constructor() {
        super(...arguments);
        this.schemaVersion = 1;
        this.scenesService = ScenesService.instance;
        this.sourcesService = SourcesService.instance;
    }
    getItems() {
        return this.scenesService.views.scenes;
    }
    saveItem(scene) {
        return new Promise(resolve => {
            const sceneItems = new SceneItemsNode();
            const hotkeys = new HotkeysNode();
            const filters = new SceneFiltersNode();
            sceneItems
                .save({ scene })
                .then(() => {
                return hotkeys.save({ sceneId: scene.id });
            })
                .then(() => {
                return filters.save({ sceneId: scene.id });
            })
                .then(() => {
                resolve({
                    hotkeys,
                    filters,
                    sceneItems,
                    id: scene.id,
                    name: scene.name,
                    active: this.scenesService.views.activeSceneId === scene.id,
                });
            });
        });
    }
    beforeLoad() {
        return __awaiter(this, void 0, void 0, function* () {
            const ids = {};
            this.data.items = this.data.items.filter(item => {
                if (ids[item.id])
                    return false;
                ids[item.id] = true;
                return true;
            });
        });
    }
    loadItem(obj) {
        return new Promise(resolve => {
            const scene = this.scenesService.createScene(obj.name, { sceneId: obj.id });
            if (obj.filters)
                obj.filters.load({ sceneId: scene.id });
            resolve(() => {
                return new Promise(resolve => {
                    obj.sceneItems.load({ scene }).then(() => {
                        if (obj.active)
                            this.scenesService.makeSceneActive(scene.id);
                        if (obj.hotkeys) {
                            obj.hotkeys.load({ sceneId: scene.id }).then(() => resolve());
                        }
                        else {
                            resolve();
                        }
                    });
                });
            });
        });
    }
    afterLoad() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.scenesService.views.activeSceneId) {
                this.scenesService.makeSceneActive(this.scenesService.views.scenes[0].id);
            }
        });
    }
}
//# sourceMappingURL=scenes.js.map