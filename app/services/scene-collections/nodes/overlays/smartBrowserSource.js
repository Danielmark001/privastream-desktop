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
export class SmartBrowserNode extends Node {
    constructor() {
        super(...arguments);
        this.schemaVersion = 1;
    }
    save(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const settings = Object.assign({}, context.sceneItem.getObsInput().settings);
            this.data = {
                settings,
                type: 'smart_browser_source',
            };
        });
    }
    load(context) {
        return __awaiter(this, void 0, void 0, function* () {
            context.sceneItem.getSource().updateSettings(this.data.settings);
            context.sceneItem.source.replacePropertiesManager('smartBrowserSource', {});
        });
    }
}
//# sourceMappingURL=smartBrowserSource.js.map