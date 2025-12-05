var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Service } from './core/service';
import fs from 'fs';
import path from 'path';
import * as obs from '../../obs-api';
import * as remote from '@electron/remote';
export class ObsUserPluginsService extends Service {
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.ensureDirectory(this.pluginsBaseDir);
                yield this.ensureDirectory(this.obsPluginsDir);
                yield this.ensureDirectory(this.pluginsDir);
                yield this.ensureDirectory(this.dataBaseDir);
                yield this.ensureDirectory(this.dataDir);
            }
            catch (e) {
                console.error('Error creating plugin directories', e);
            }
        });
    }
    initializeModule(dllFile) {
        return __awaiter(this, void 0, void 0, function* () {
            const name = path.parse(dllFile).name;
            const dataDir = path.join(this.dataDir, name);
            yield this.ensureDirectory(dataDir);
            const module = obs.ModuleFactory.open(path.join(this.pluginsDir, dllFile), dataDir);
            module.initialize();
        });
    }
    get pluginsDir() {
        return path.join(this.obsPluginsDir, '64bit');
    }
    get dataDir() {
        return path.join(this.dataBaseDir, 'obs-plugins');
    }
    get appData() {
        return remote.app.getPath('appData');
    }
    get pluginsBaseDir() {
        return path.join(this.appData, 'slobs-plugins');
    }
    get obsPluginsDir() {
        return path.join(this.pluginsBaseDir, 'obs-plugins');
    }
    get dataBaseDir() {
        return path.join(this.pluginsBaseDir, 'data');
    }
    ensureDirectory(dirPath) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                fs.exists(dirPath, exists => {
                    if (exists) {
                        resolve();
                    }
                    else {
                        fs.mkdir(dirPath, err => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve();
                            }
                        });
                    }
                });
            });
        });
    }
}
//# sourceMappingURL=obs-user-plugins.js.map