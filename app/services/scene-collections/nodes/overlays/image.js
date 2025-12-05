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
import uniqueId from 'lodash/uniqueId';
import path from 'path';
import fs from 'fs';
export class ImageNode extends Node {
    constructor() {
        super(...arguments);
        this.schemaVersion = 1;
    }
    save(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const filePath = context.sceneItem.getObsInput().settings.file;
            const newFileName = `${uniqueId()}${path.parse(filePath).ext}`;
            if (context.savedAssets[filePath]) {
                this.data = { filename: context.savedAssets[filePath] };
                return;
            }
            context.savedAssets[filePath] = newFileName;
            const destination = path.join(context.assetsPath, newFileName);
            fs.writeFileSync(destination, fs.readFileSync(filePath));
            this.data = {
                filename: newFileName,
            };
        });
    }
    load(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const filePath = path.join(context.assetsPath, this.data.filename);
            const settings = Object.assign({}, context.sceneItem.getObsInput().settings);
            settings['file'] = filePath;
            context.sceneItem.getObsInput().update(settings);
            context.sceneItem.getSource().replacePropertiesManager('default', {});
        });
    }
}
//# sourceMappingURL=image.js.map