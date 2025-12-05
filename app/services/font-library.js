var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Service } from './core/service';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { Inject } from 'services/core/injector';
import { jfetch } from 'util/requests';
export class FontLibraryService extends Service {
    constructor() {
        super(...arguments);
        this.fontDownloadPromises = {};
    }
    getManifest() {
        if (!this.manifest) {
            const req = new Request(this.libraryUrl('manifest.json'));
            return jfetch(req, null, { forceJson: true })
                .then(json => {
                this.manifest = json;
                return json;
            })
                .catch(() => {
                return { families: [] };
            });
        }
        return Promise.resolve(this.manifest);
    }
    findFamily(family) {
        return this.getManifest().then(manifest => {
            return manifest.families.find(fam => fam.name === family);
        });
    }
    findStyle(family, style) {
        return this.findFamily(family).then(fam => {
            return fam.styles.find(sty => sty.name === style);
        });
    }
    lookupFontInfo(fontPath) {
        return this.getManifest().then(manifest => {
            let family;
            let style;
            const file = path.parse(fontPath).base;
            manifest.families.find(fam => {
                return !!fam.styles.find(sty => {
                    if (sty.file === file) {
                        family = fam.name;
                        style = sty.name;
                        return true;
                    }
                });
            });
            return { family, style };
        });
    }
    downloadFont(file) {
        const fontPath = this.libraryPath(file);
        if (this.fontDownloadPromises[file])
            return this.fontDownloadPromises[file];
        if (fs.existsSync(fontPath)) {
            this.fontDownloadPromises[file] = Promise.resolve(fontPath);
            return this.fontDownloadPromises[file];
        }
        this.fontDownloadPromises[file] = new Promise(resolve => {
            this.ensureFontsDirectory();
            https.get(this.libraryUrl(file), response => {
                const fontFile = fs.createWriteStream(fontPath);
                fontFile.on('finish', () => resolve(fontPath));
                response.pipe(fontFile);
            });
        });
        return this.fontDownloadPromises[file];
    }
    ensureFontsDirectory() {
        if (!fs.existsSync(this.fontsDirectory)) {
            fs.mkdirSync(this.fontsDirectory);
        }
    }
    get fontsDirectory() {
        return path.join(this.appService.appDataDirectory, 'Fonts');
    }
    libraryPath(file) {
        return path.join(this.fontsDirectory, file);
    }
    libraryUrl(file) {
        return `https://d1g6eog1uhe0xm.cloudfront.net/fonts/${file}`;
    }
}
__decorate([
    Inject()
], FontLibraryService.prototype, "appService", void 0);
//# sourceMappingURL=font-library.js.map