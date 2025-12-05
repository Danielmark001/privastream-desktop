var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Service } from 'services/core/service';
import path from 'path';
import fs from 'fs';
export class FileManagerService extends Service {
    constructor() {
        super(...arguments);
        this.files = {};
    }
    exists(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const truePath = path.resolve(filePath);
            if (this.files[truePath])
                return Promise.resolve(true);
            return this.fileExists(truePath);
        });
    }
    write(filePath, data) {
        const truePath = path.resolve(filePath);
        const file = this.files[truePath];
        if (file) {
            file.data = data;
            file.version += 1;
            file.dirty = true;
        }
        else {
            this.files[truePath] = {
                data,
                locked: false,
                version: 0,
                dirty: true,
            };
        }
        this.flush(truePath);
    }
    read(filePath, options = {}) {
        const truePath = path.resolve(filePath);
        let file = this.files[truePath];
        const opts = Object.assign({ validateJSON: false, retries: 0 }, options);
        if (!file) {
            let data;
            try {
                data = fs.readFileSync(truePath).toString();
                if (opts.validateJSON) {
                    JSON.parse(data);
                }
            }
            catch (e) {
                if (opts.retries > 0) {
                    this.read(filePath, Object.assign(Object.assign({}, opts), { retries: opts.retries - 1 }));
                }
                else {
                    throw e;
                }
            }
            file = this.files[truePath] = {
                data,
                locked: false,
                version: 0,
                dirty: false,
            };
        }
        return file.data;
    }
    copy(sourcePath, destPath) {
        const trueSource = path.resolve(sourcePath);
        const trueDest = path.resolve(destPath);
        this.files[trueDest] = {
            data: this.read(trueSource),
            locked: false,
            version: 0,
            dirty: true,
        };
        this.flush(trueDest);
    }
    flushAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = Object.values(this.files)
                .filter(file => file.dirty)
                .map(file => {
                return new Promise(resolve => {
                    file.flushFinished = resolve;
                });
            });
            yield Promise.all(promises);
        });
    }
    flush(filePath_1) {
        return __awaiter(this, arguments, void 0, function* (filePath, tries = 10) {
            const file = this.files[filePath];
            if (file.locked)
                return;
            file.locked = true;
            const version = file.version;
            try {
                yield this.writeFile(filePath, file.data);
                if (version !== file.version) {
                    throw new Error('Wrote out of date file!  Will retry...');
                }
                file.locked = false;
                file.dirty = false;
                if (file.flushFinished)
                    file.flushFinished();
                console.debug(`Wrote file ${filePath} version ${version}`);
            }
            catch (e) {
                if (tries > 0) {
                    file.locked = false;
                    yield this.flush(filePath, tries - 1);
                }
                else {
                    if (file.flushFinished)
                        file.flushFinished();
                    console.error(`Ran out of retries writing ${filePath}`);
                }
            }
        });
    }
    fileExists(filePath) {
        return new Promise(resolve => {
            fs.exists(filePath, exists => resolve(exists));
        });
    }
    writeFile(filePath, data) {
        return new Promise((resolve, reject) => {
            const tmpPath = `${filePath}.tmp`;
            fs.writeFile(tmpPath, data, err => {
                if (err) {
                    reject(err);
                    return;
                }
                fs.rename(tmpPath, filePath, err => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
        });
    }
}
//# sourceMappingURL=file-manager.js.map