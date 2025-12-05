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
import { TextNode } from './text';
export class StreamlabelNode extends Node {
    constructor() {
        super(...arguments);
        this.schemaVersion = 1;
    }
    save(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const textSource = new TextNode();
            yield textSource.save(context);
            const labelType = context.sceneItem.source.getPropertiesManagerSettings().statname;
            this.data = { labelType, textSource };
        });
    }
    load(context) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.data.textSource.load(context);
            context.sceneItem.source.replacePropertiesManager('streamlabels', {
                statname: this.data.labelType,
            });
        });
    }
}
//# sourceMappingURL=streamlabel.js.map