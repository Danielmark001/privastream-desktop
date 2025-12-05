var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { mutation, StatefulService, ViewHandler } from 'services/core/stateful-service';
import path from 'path';
import fs from 'fs';
import { Inject } from 'services/core/injector';
import { getChecksum, isUrl, downloadFile, jfetch } from 'util/requests';
const uuid = window['require']('uuid/v4');
export var EMediaFileStatus;
(function (EMediaFileStatus) {
    EMediaFileStatus[EMediaFileStatus["Checking"] = 0] = "Checking";
    EMediaFileStatus[EMediaFileStatus["Synced"] = 1] = "Synced";
    EMediaFileStatus[EMediaFileStatus["Uploading"] = 2] = "Uploading";
    EMediaFileStatus[EMediaFileStatus["Downloading"] = 3] = "Downloading";
})(EMediaFileStatus || (EMediaFileStatus = {}));
export var EGlobalSyncStatus;
(function (EGlobalSyncStatus) {
    EGlobalSyncStatus[EGlobalSyncStatus["Syncing"] = 0] = "Syncing";
    EGlobalSyncStatus[EGlobalSyncStatus["Synced"] = 1] = "Synced";
})(EGlobalSyncStatus || (EGlobalSyncStatus = {}));
const ONE_MEGABYTE = 1048576;
class MediaBackupViews extends ViewHandler {
    get globalSyncStatus() {
        const syncing = this.state.files.find(file => file.status !== EMediaFileStatus.Synced);
        if (syncing)
            return EGlobalSyncStatus.Syncing;
        return EGlobalSyncStatus.Synced;
    }
}
export class MediaBackupService extends StatefulService {
    getLocalFileId() {
        return uuid();
    }
    get views() {
        return new MediaBackupViews(this.state);
    }
    createNewFile(localId, filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            let name;
            if (isUrl(filePath)) {
                return;
            }
            try {
                name = path.parse(filePath).base;
            }
            catch (e) {
                console.warn(`[Media Backup] Got unparseable path ${filePath}`);
                return null;
            }
            let stats;
            try {
                stats = yield new Promise((resolve, reject) => {
                    fs.lstat(filePath, (err, stats) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(stats);
                        }
                    });
                });
            }
            catch (e) {
                console.warn(`[Media Backup] Error fetching stats for: ${filePath}`);
                return null;
            }
            if (stats.size > ONE_MEGABYTE * 350) {
                return null;
            }
            const syncLock = uuid();
            const file = {
                name,
                filePath,
                syncLock,
                id: localId,
                status: EMediaFileStatus.Uploading,
            };
            if (!fs.existsSync(filePath))
                return null;
            this.INSERT_FILE(file);
            let data;
            try {
                data = yield this.withRetry(() => this.uploadFile(file));
            }
            catch (e) {
                console.error('[Media Backup] Error uploading file:', JSON.stringify(e));
                if (this.validateSyncLock(localId, syncLock)) {
                    this.UPDATE_FILE(localId, { status: EMediaFileStatus.Synced });
                }
                return null;
            }
            if (this.validateSyncLock(localId, syncLock)) {
                file.serverId = data.id;
                file.status = EMediaFileStatus.Synced;
                this.UPDATE_FILE(localId, file);
                return file;
            }
            return null;
        });
    }
    syncFile(localId, serverId, originalFilePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const name = path.parse(originalFilePath).base;
            const syncLock = uuid();
            const file = {
                name,
                serverId,
                syncLock,
                id: localId,
                filePath: originalFilePath,
                status: EMediaFileStatus.Checking,
            };
            this.INSERT_FILE(file);
            let data;
            try {
                data = yield this.withRetry(() => this.getFileData(serverId));
            }
            catch (e) {
                if (this.validateSyncLock(localId, syncLock)) {
                    if (e['status'] !== 404) {
                        console.error(`[Media Backup] Ran out of retries fetching data ${e['body']}`);
                    }
                    this.UPDATE_FILE(localId, { status: EMediaFileStatus.Synced });
                }
                return null;
            }
            const filesToCheck = [originalFilePath, this.getMediaFilePath(serverId, data.filename)];
            for (const fileToCheck of filesToCheck) {
                if (fs.existsSync(fileToCheck)) {
                    let checksum;
                    try {
                        checksum = yield this.withRetry(() => getChecksum(fileToCheck));
                    }
                    catch (e) {
                        console.warn(`[Media Backup] Error calculating checksum: ${e}`);
                    }
                    if (checksum && checksum === data.checksum) {
                        if (this.validateSyncLock(localId, syncLock)) {
                            file.filePath = fileToCheck;
                            file.status = EMediaFileStatus.Synced;
                            this.UPDATE_FILE(localId, file);
                            return file;
                        }
                    }
                    console.debug(`[Media Backup] Got checksum mismatch: ${checksum} =/= ${data.checksum}`);
                }
            }
            if (!this.validateSyncLock(localId, syncLock))
                return null;
            this.UPDATE_FILE(localId, { status: EMediaFileStatus.Downloading });
            let downloadedPath;
            try {
                downloadedPath = yield this.withRetry(() => this.downloadFile(data.url, serverId, data.filename));
            }
            catch (e) {
                console.error(`[Media Backup] Error downloading file: ${e['body']}`);
                if (this.validateSyncLock(localId, syncLock)) {
                    this.UPDATE_FILE(localId, { status: EMediaFileStatus.Synced });
                }
                return null;
            }
            if (this.validateSyncLock(localId, syncLock)) {
                file.status = EMediaFileStatus.Synced;
                file.filePath = downloadedPath;
                this.UPDATE_FILE(localId, file);
                return file;
            }
        });
    }
    uploadFile(file) {
        return __awaiter(this, void 0, void 0, function* () {
            const checksum = yield getChecksum(file.filePath);
            const fileBlob = yield new Promise(r => {
                fs.readFile(file.filePath, (err, data) => r(new Blob([data])));
            });
            const fileObj = new File([fileBlob], file.name);
            const formData = new FormData();
            formData.append('checksum', checksum);
            formData.append('file', fileObj);
            formData.append('modified', new Date().toISOString());
            return jfetch(`${this.apiBase}/upload`, {
                method: 'POST',
                headers: this.authedHeaders,
                body: formData,
            });
        });
    }
    getFileData(id) {
        const req = new Request(`${this.apiBase}/${id}`, { headers: new Headers(this.authedHeaders) });
        return jfetch(req);
    }
    downloadFile(url, serverId, filename) {
        return __awaiter(this, void 0, void 0, function* () {
            this.ensureMediaDirectory();
            const filePath = this.getMediaFilePath(serverId, filename);
            yield downloadFile(url, filePath);
            return filePath;
        });
    }
    withRetry(executor) {
        return __awaiter(this, void 0, void 0, function* () {
            let retries = 2;
            while (true) {
                try {
                    return yield executor();
                }
                catch (e) {
                    if (retries <= 0)
                        throw e;
                    retries -= 1;
                }
            }
        });
    }
    validateSyncLock(id, syncLock) {
        return !!this.state.files.find(file => {
            return file.id === id && file.syncLock === syncLock;
        });
    }
    getMediaFilePath(serverId, filename) {
        return path.join(this.mediaDirectory, `${serverId.toString()}-${filename}`);
    }
    get apiBase() {
        return `https://${this.hostsService.media}/api/v5/slobs/media`;
    }
    get authedHeaders() {
        return { Authorization: `Bearer ${this.userService.apiToken}` };
    }
    ensureMediaDirectory() {
        if (!fs.existsSync(this.mediaDirectory)) {
            fs.mkdirSync(this.mediaDirectory);
        }
    }
    get mediaDirectory() {
        return path.join(this.appService.appDataDirectory, 'Media');
    }
    INSERT_FILE(file) {
        this.state.files = this.state.files.filter(storeFile => {
            return storeFile.id !== file.id;
        });
        this.state.files.push(Object.assign({}, file));
    }
    UPDATE_FILE(id, patch) {
        this.state.files.forEach(file => {
            if (file.id === id) {
                Object.assign(file, patch);
            }
        });
    }
}
MediaBackupService.initialState = { files: [] };
__decorate([
    Inject()
], MediaBackupService.prototype, "hostsService", void 0);
__decorate([
    Inject()
], MediaBackupService.prototype, "userService", void 0);
__decorate([
    Inject()
], MediaBackupService.prototype, "appService", void 0);
__decorate([
    mutation()
], MediaBackupService.prototype, "INSERT_FILE", null);
__decorate([
    mutation()
], MediaBackupService.prototype, "UPDATE_FILE", null);
//# sourceMappingURL=media-backup.js.map