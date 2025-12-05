var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { promises as fs, createReadStream, existsSync } from 'fs';
import path from 'path';
import { downloadFile, jfetch } from 'util/requests';
import crypto from 'crypto';
import * as remote from '@electron/remote';
import { spawn } from 'child_process';
export class AvatarUpdater {
    constructor() {
        this.manifest = null;
        this.isCurrentlyUpdating = false;
        this.versionChecked = false;
        this.currentUpdate = null;
        this.manifestPath = path.resolve(AvatarUpdater.basepath, 'manifest.json');
        console.log('AvatarUpdater initialized with manifest path:', this.manifestPath);
    }
    static getEnvironment() {
        if (remote.process.argv.includes('--bundle-qa')) {
            return 'staging';
        }
        if (process.env.AVATAR_ENV !== 'staging' && process.env.AVATAR_ENV !== 'local') {
            return 'production';
        }
        return process.env.AVATAR_ENV;
    }
    performUpdate(progressCallback, outputHandler) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.manifest) {
                outputHandler === null || outputHandler === void 0 ? void 0 : outputHandler('stderr', 'No manifest available. Please check for updates first.');
                throw new Error('No manifest available. Please check for updates first.');
            }
            if (!existsSync(AvatarUpdater.basepath)) {
                outputHandler === null || outputHandler === void 0 ? void 0 : outputHandler('stderr', 'Creating basepath directory...');
                yield fs.mkdir(AvatarUpdater.basepath, { recursive: true });
            }
            const filesToUpdate = [];
            let totalBytes = 0;
            for (const [relativePath, fileInfo] of Object.entries(this.manifest.files)) {
                const normalizedPath = relativePath.replace(/^\\+/, '');
                const filePath = path.join(AvatarUpdater.basepath, normalizedPath);
                outputHandler === null || outputHandler === void 0 ? void 0 : outputHandler('stdout', `Checking file: ${normalizedPath}`);
                console.log(`Checking file: ${normalizedPath}`);
                const folderPath = path.dirname(filePath);
                if (!existsSync(folderPath)) {
                    yield fs.mkdir(folderPath, { recursive: true });
                }
                if (!(yield this.isFileUpToDate(filePath, fileInfo))) {
                    console.log(`File needs update: ${normalizedPath}`);
                    outputHandler === null || outputHandler === void 0 ? void 0 : outputHandler('stdout', `File needs update: ${normalizedPath}`);
                    filesToUpdate.push({ filePath, relativePath: normalizedPath, fileInfo });
                    totalBytes += fileInfo.size;
                }
            }
            const downloadedSoFar = {};
            for (const { filePath, relativePath, fileInfo } of filesToUpdate) {
                downloadedSoFar[relativePath] = 0;
                console.log(`Updating file: ${relativePath}`);
                outputHandler === null || outputHandler === void 0 ? void 0 : outputHandler('stdout', `Updating file: ${relativePath}`);
                yield this.downloadAndUpdateFile(filePath, relativePath, fileInfo, progress => {
                    downloadedSoFar[relativePath] = progress.downloadedBytes;
                    const downloadedBytes = Object.values(downloadedSoFar).reduce((sum, bytes) => sum + bytes, 0);
                    progressCallback({
                        percent: downloadedBytes / totalBytes,
                        totalBytes,
                        downloadedBytes,
                    });
                });
            }
            console.log('All files are up to date.');
            outputHandler === null || outputHandler === void 0 ? void 0 : outputHandler('stdout', 'All files are up to date.');
            console.log('Updating manifest...');
            outputHandler === null || outputHandler === void 0 ? void 0 : outputHandler('stdout', 'Updating manifest...');
            yield fs.writeFile(this.manifestPath, JSON.stringify(this.manifest));
            console.log('Update complete.');
            outputHandler === null || outputHandler === void 0 ? void 0 : outputHandler('stdout', 'Update complete.');
        });
    }
    downloadAndUpdateFile(filePath, relativePath, fileInfo, progressCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Downloading and updating file: ${filePath}`);
            const tempFilePath = `${filePath}.tmp`;
            if (existsSync(tempFilePath)) {
                yield fs.rm(tempFilePath);
            }
            const fileUrl = this.getFileUrl(relativePath.replace(/\\/g, '/'));
            yield downloadFile(fileUrl + `?t=${fileInfo.hash}`, tempFilePath, progressCallback);
            const checksum = yield this.sha256(tempFilePath);
            if (checksum !== fileInfo.hash) {
                throw new Error(`Checksum verification failed for ${filePath} | ${fileInfo.hash} | ${checksum}`);
            }
            if (existsSync(filePath)) {
                yield fs.rm(filePath);
            }
            yield fs.rename(tempFilePath, filePath);
            console.log(`File updated: ${filePath}`);
        });
    }
    isFileUpToDate(filePath, fileInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!existsSync(filePath)) {
                return false;
            }
            const stats = yield fs.stat(filePath);
            if (stats.size !== fileInfo.size) {
                return false;
            }
            const fileHash = yield this.sha256(filePath);
            return fileHash === fileInfo.hash;
        });
    }
    getFileUrl(relativePath) {
        const baseUrl = AvatarUpdater.getEnvironment() === 'staging'
            ? 'https://cdn-avatar-builds.streamlabs.com/staging/'
            : 'https://cdn-avatar-builds.streamlabs.com/production/';
        return `${baseUrl}${relativePath}`;
    }
    get updateInProgress() {
        return this.isCurrentlyUpdating;
    }
    get version() {
        var _a;
        return ((_a = this.manifest) === null || _a === void 0 ? void 0 : _a.version) || null;
    }
    getManifestUrl() {
        const cacheBuster = Math.floor(Date.now() / 1000);
        if (AvatarUpdater.getEnvironment() === 'staging') {
            return `https://cdn-avatar-builds.streamlabs.com/staging/manifest.json?t=${cacheBuster}`;
        }
        else {
            return `https://cdn-avatar-builds.streamlabs.com/production/manifest.json?t=${cacheBuster}`;
        }
    }
    isNewVersionAvailable() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.versionChecked || AvatarUpdater.getEnvironment() === 'local') {
                return false;
            }
            this.versionChecked = true;
            console.log('Checking for Streamlabs Avatar updates...');
            const manifestUrl = this.getManifestUrl();
            const newManifest = JSON.parse(yield jfetch(new Request(manifestUrl, {
                headers: {
                    'Cache-Control': 'no-cache',
                    Pragma: 'no-cache',
                },
                cache: 'no-store',
            })));
            this.manifest = newManifest;
            if (!existsSync(this.manifestPath)) {
                console.log('Manifest file not found. Initial download required.');
                return true;
            }
            const currentManifest = JSON.parse(yield fs.readFile(this.manifestPath, 'utf-8'));
            if (newManifest.version !== currentManifest.version ||
                newManifest.timestamp > currentManifest.timestamp) {
                console.log(`New Streamlabs Avatar version available: ${currentManifest.version} -> ${newManifest.version}`);
                return true;
            }
            console.log('Streamlabs Avatar is up to date.');
            return false;
        });
    }
    update(progressCallback, outputHandler) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.isCurrentlyUpdating = true;
                this.currentUpdate = this.performUpdate(progressCallback, outputHandler);
                yield this.currentUpdate;
            }
            finally {
                this.isCurrentlyUpdating = false;
            }
        });
    }
    uninstall() {
        return __awaiter(this, void 0, void 0, function* () {
            if (existsSync(AvatarUpdater.basepath)) {
                console.log('Uninstalling Streamlabs Avatar...');
                yield fs.rm(AvatarUpdater.basepath, { recursive: true });
            }
        });
    }
    sha256(file) {
        return __awaiter(this, void 0, void 0, function* () {
            const hash = crypto.createHash('sha256');
            const stream = createReadStream(file);
            return new Promise((resolve, reject) => {
                stream.on('data', chunk => hash.update(chunk));
                stream.on('end', () => resolve(hash.digest('hex')));
                stream.on('error', err => reject(err));
            });
        });
    }
    startAvatarProcess(renderOffscreen = false) {
        const executablePath = path.resolve(AvatarUpdater.basepath, './StreamlabsAIAvatar.exe');
        const pixelStreamingUrl = 'ws://127.0.0.1:1339';
        if (!existsSync(executablePath)) {
            throw new Error('Avatar UE5 executable not found. Please ensure it is installed.');
        }
        console.log('Starting Avatar UE5 process...');
        const args = [];
        if (pixelStreamingUrl) {
            args.push(`-PixelStreamingURL=${pixelStreamingUrl}`);
        }
        if (renderOffscreen) {
            args.push('-RenderOffscreen');
        }
        const process = spawn(executablePath, args, {
            cwd: AvatarUpdater.basepath,
        });
        console.log('Avatar UE5 process started with arguments:', args.join(' '));
        return process;
    }
}
AvatarUpdater.basepath = path.join(remote.app.getPath('userData'), '..', 'streamlabs-avatar');
//# sourceMappingURL=avatar-updater.js.map