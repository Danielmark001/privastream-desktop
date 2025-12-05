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
export class WidgetNode extends Node {
    constructor() {
        super(...arguments);
        this.schemaVersion = 1;
    }
    save(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const settings = Object.assign({}, context.sceneItem.getObsInput().settings);
            const type = context.sceneItem.source.getPropertiesManagerSettings().widgetType;
            settings['url'] = '';
            this.data = {
                settings,
                type,
            };
        });
    }
    load(context) {
        return __awaiter(this, void 0, void 0, function* () {
            context.sceneItem.source.replacePropertiesManager('widget', {
                widgetType: this.data.type,
            });
            delete this.data.settings['url'];
            context.sceneItem.getSource().updateSettings(this.data.settings);
        });
    }
}
//# sourceMappingURL=widget.js.map