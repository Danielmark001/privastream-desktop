var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Node } from '../node';
import { ScenesNode } from './scenes';
import { TransitionNode } from './transition';
import { NodeMapNode } from './node-map';
export class RootNode extends Node {
    constructor() {
        super(...arguments);
        this.schemaVersion = 2;
        this.savedAssets = {};
    }
    save(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const scenes = new ScenesNode();
            yield scenes.save(Object.assign(Object.assign({}, context), { savedAssets: this.savedAssets }));
            const transition = new TransitionNode();
            yield transition.save(context);
            const nodeMap = new NodeMapNode();
            yield nodeMap.save();
            this.data = { scenes, transition, nodeMap };
        });
    }
    load(context) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.data.nodeMap)
                yield this.data.nodeMap.load();
            if (this.data.transition)
                yield this.data.transition.load(context);
            yield this.data.scenes.load(Object.assign(Object.assign({}, context), { savedAssets: this.savedAssets }));
        });
    }
}
//# sourceMappingURL=root.js.map