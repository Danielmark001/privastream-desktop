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
export class IconLibraryNode extends Node {
    constructor() {
        super(...arguments);
        this.schemaVersion = 1;
    }
    save(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const folder = context.sceneItem.getSource().getPropertiesManagerSettings().folder;
            const newFolderName = uniqueId();
            if (context.savedAssets[folder]) {
                this.data = { folder: context.savedAssets[folder] };
                return;
            }
            context.savedAssets[folder] = newFolderName;
            const destination = path.join(context.assetsPath, newFolderName);
            fs.mkdirSync(destination);
            fs.readdir(folder, (err, files) => {
                if (err) {
                    console.error('error reading icon library directory', err);
                    throw err;
                }
                else {
                    files.forEach(file => {
                        const filePath = path.join(folder, file);
                        if (fs.lstatSync(filePath).isDirectory())
                            return;
                        fs.writeFileSync(path.join(destination, file), fs.readFileSync(filePath));
                    });
                }
            });
            this.data = { folder: newFolderName };
        });
    }
    load(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const folder = path.join(context.assetsPath, this.data.folder);
            fs.readdir(folder, (err, files) => {
                if (err) {
                    console.error('error reading icon library directory', err);
                    throw err;
                }
                else {
                    const activeIcon = path.join(folder, files[0]);
                    context.sceneItem.getSource().setPropertiesManagerSettings({ folder, activeIcon });
                }
            });
        });
    }
}
//# sourceMappingURL=icon-library.js.map