var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { downloadFile, jfetch } from 'util/requests';
import { importExtractZip } from 'util/slow-imports';
import * as remote from '@electron/remote';
import pMemoize, { pMemoizeClear } from 'p-memoize';
export class VisionUpdater {
    constructor(baseDir) {
        this.baseDir = baseDir;
        this.checkCooldownMs = 60000;
        this.checkNeedsUpdate = pMemoize(() => __awaiter(this, void 0, void 0, function* () {
            const installedManifest = yield this.readInstalledManifest();
            const manifestUrl = this.getManifestUrl();
            this.log(`checkNeedsUpdate manifestUrl: ${manifestUrl}`);
            const latestManifest = yield jfetch(new Request(manifestUrl));
            const needsUpdate = !installedManifest ||
                latestManifest.version !== installedManifest.version ||
                latestManifest.timestamp > installedManifest.timestamp;
            return { needsUpdate, installedManifest, latestManifest };
        }), {
            maxAge: this.checkCooldownMs,
        });
        this.downloadAndInstall = pMemoize((manifest, onProgress) => __awaiter(this, void 0, void 0, function* () {
            const { version, url, checksum } = manifest;
            yield this.ensureDirs();
            const zipPath = path.join(this.paths.tmp, `vision-${version}.zip`);
            const outDir = path.join(this.baseDir, `bin-${version}`);
            const bakDir = path.join(this.baseDir, 'bin.bak');
            yield downloadFile(`${url}?t=${checksum}`, zipPath, onProgress);
            this.log('download complete');
            if ((yield sha256(zipPath)).toLowerCase() !== checksum.toLowerCase()) {
                throw new Error('Checksum verification failed');
            }
            if (fssync.existsSync(outDir))
                yield fs.rm(outDir, { recursive: true, force: true });
            yield extractZip(zipPath, outDir);
            yield fs.rm(zipPath, { force: true });
            if (fssync.existsSync(this.paths.bin)) {
                if (fssync.existsSync(bakDir))
                    yield fs.rm(bakDir, { recursive: true, force: true });
                yield fs.rename(this.paths.bin, bakDir);
            }
            try {
                yield fs.rename(outDir, this.paths.bin);
                yield atomicWriteFile(this.paths.manifest, JSON.stringify(manifest));
                if (fssync.existsSync(bakDir))
                    yield fs.rm(bakDir, { recursive: true, force: true });
            }
            catch (e) {
                if (fssync.existsSync(bakDir))
                    yield fs.rename(bakDir, this.paths.bin);
                throw e;
            }
            return yield this.forceCheckNeedsUpdate();
        }), { cache: false });
    }
    log(...args) {
        console.log('[VisionUpdater]', ...args);
    }
    get paths() {
        return {
            bin: path.join(this.baseDir, 'bin'),
            manifest: path.join(this.baseDir, 'manifest.json'),
            tmp: path.join(this.baseDir, '.tmp'),
        };
    }
    ensureDirs() {
        return __awaiter(this, void 0, void 0, function* () {
            yield fs.mkdir(this.baseDir, { recursive: true });
            yield fs.mkdir(this.paths.tmp, { recursive: true });
        });
    }
    readInstalledManifest() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const raw = yield fs.readFile(this.paths.manifest, 'utf8');
                return JSON.parse(raw);
            }
            catch (_a) {
                return;
            }
        });
    }
    getEnvironment() {
        if (remote.process.argv.includes('--bundle-qa')) {
            return 'staging';
        }
        if (process.env.VISION_ENV !== 'staging' && process.env.VISION_ENV !== 'local') {
            return 'production';
        }
        return process.env.VISION_ENV;
    }
    getManifestUrl() {
        this.log('getManifestUrl called');
        const cacheBuster = Math.floor(Date.now() / 1000);
        if (this.getEnvironment() === 'staging') {
            return `https://cdn-vision-builds.streamlabs.com/staging/manifest_win_x86_64.json?t=${cacheBuster}`;
        }
        else {
            return `https://cdn-vision-builds.streamlabs.com/production/manifest_win_x86_64.json?t=${cacheBuster}`;
        }
    }
    forceCheckNeedsUpdate() {
        return __awaiter(this, void 0, void 0, function* () {
            pMemoizeClear(this.checkNeedsUpdate);
            return this.checkNeedsUpdate();
        });
    }
}
function sha256(file) {
    return __awaiter(this, void 0, void 0, function* () {
        const hash = crypto.createHash('sha256');
        const stream = fssync.createReadStream(file);
        yield pipeline(stream, hash);
        return hash.digest('hex');
    });
}
function atomicWriteFile(target, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const tmp = `${target}.tmp`;
        yield fs.writeFile(tmp, data, 'utf8');
        yield fs.rename(tmp, target);
    });
}
function extractZip(zipPath, unzipPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const extractZip = (yield importExtractZip()).default;
        return new Promise((resolve, reject) => {
            extractZip(zipPath, { dir: unzipPath }, err => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    });
}
//# sourceMappingURL=vision-updater.js.map