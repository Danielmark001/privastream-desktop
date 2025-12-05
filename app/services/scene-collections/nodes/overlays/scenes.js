var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ArrayNode } from '../array-node';
import { ScenesService } from '../../../scenes';
import { SlotsNode } from './slots';
import uuid from 'uuid';
export class ScenesNode extends ArrayNode {
    constructor() {
        super(...arguments);
        this.schemaVersion = 2;
        this.scenesService = ScenesService.instance;
    }
    getItems() {
        return this.scenesService.views.scenes;
    }
    saveItem(scene, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const slots = new SlotsNode();
            yield slots.save({
                scene,
                assetsPath: context.assetsPath,
                savedAssets: context.savedAssets,
            });
            return {
                slots,
                name: scene.name,
                sceneId: scene.id,
            };
        });
    }
    loadItem(obj, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const scene = this.scenesService.createScene(obj.name, {
                sceneId: obj.sceneId,
            });
            return () => __awaiter(this, void 0, void 0, function* () {
                yield obj.slots.load({
                    scene,
                    assetsPath: context.assetsPath,
                    savedAssets: context.savedAssets,
                });
                const foldersSchemas = obj.slots.data.items
                    .filter(item => item.sceneNodeType === 'folder')
                    .reverse();
                const folders = scene.getFolders();
                folders.forEach((folder, ind) => {
                    const childrenIds = foldersSchemas[ind].childrenIds;
                    scene.getSelection(childrenIds).moveTo(scene.id, folder.id);
                });
            });
        });
    }
    migrate(version) {
        if (version === 1) {
            this.data.items = this.data.items.map(item => {
                if (item.sceneId)
                    return item;
                return Object.assign(Object.assign({}, item), { sceneId: uuid() });
            });
        }
    }
}
//# sourceMappingURL=scenes.js.map