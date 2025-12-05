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
import fs from 'fs';
import path from 'path';
import { Service, Inject, ViewHandler } from 'services/core';
import { authorizedHeaders, jfetch } from 'util/requests';
import { $t } from 'services/i18n';
const PLATFORM_RULES = {
    crossclip: { size: 1024 * 1024 * 1024, types: ['.mp4'] },
    typestudio: { size: 1024 * 1024 * 1024 * 3.4, types: ['.mp4', '.mov', '.webm'] },
};
class SharedStorageServiceViews extends ViewHandler {
    getPlatformLink(platform, id) {
        if (platform === 'crossclip') {
            return `https://crossclip.streamlabs.com/storage/${id}`;
        }
        if (platform === 'typestudio') {
            return `https://podcasteditor.streamlabs.com/storage/${id}`;
        }
        if (platform === 'videoeditor') {
            return `https://videoeditor.streamlabs.com/import/${id}`;
        }
        return '';
    }
}
export class SharedStorageService extends Service {
    constructor() {
        super(...arguments);
        this.uploading = false;
    }
    get host() {
        return `https://${this.hostsService.streamlabs}/api/v5/slobs/streamlabs-storage`;
    }
    get views() {
        return new SharedStorageServiceViews({});
    }
    uploadFile(filepath, onProgress, onError, platform) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            let uploadInfo;
            try {
                if (this.uploading) {
                    throw new Error($t('Upload already in progress'));
                }
                this.uploading = true;
                uploadInfo = yield this.prepareUpload(filepath, platform);
                this.id = uploadInfo.file.id;
                this.uploader = new S3Uploader({
                    fileInfo: uploadInfo,
                    filepath,
                    onProgress,
                    onError,
                });
                this.cancel = this.uploader.cancel;
            }
            catch (e) {
                onError(e);
            }
            return {
                cancel: this.cancelUpload.bind(this),
                complete: this.performUpload(filepath),
                size: (_a = uploadInfo === null || uploadInfo === void 0 ? void 0 : uploadInfo.file) === null || _a === void 0 ? void 0 : _a.size,
            };
        });
    }
    performUpload(filepath) {
        return __awaiter(this, void 0, void 0, function* () {
            const { uploaded, reqBody } = yield this.uploadS3File();
            if (uploaded) {
                yield this.completeUpload(reqBody);
                return yield this.generateShare(filepath);
            }
            else {
                return Promise.reject('The upload was canceled');
            }
        });
    }
    validateFile(filepath, platform) {
        const stats = fs.lstatSync(filepath);
        if (platform && PLATFORM_RULES[platform]) {
            if (stats.size > PLATFORM_RULES[platform].size) {
                throw new Error($t('File is too large to upload'));
            }
            if (!PLATFORM_RULES[platform].types.includes(path.extname(filepath))) {
                throw new Error($t('File type %{extension} is not supported', { extension: path.extname(filepath) }));
            }
        }
        return { size: stats.size, name: path.basename(filepath) };
    }
    completeUpload(body) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${this.host}/storage/v1/temporary-files/${this.id}/complete`;
            const headers = authorizedHeaders(this.userService.apiToken, new Headers({ 'Content-Type': 'application/json' }));
            return yield jfetch(new Request(url, { headers, method: 'POST', body: JSON.stringify(body) }));
        });
    }
    cancelUpload() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.id || !this.cancel)
                return;
            const url = `${this.host}/storage/v1/temporary-files/${this.id}`;
            const headers = authorizedHeaders(this.userService.apiToken);
            this.cancel();
            this.id = undefined;
            this.cancel = undefined;
            this.uploading = false;
            return yield jfetch(new Request(url, { headers, method: 'DELETE' }));
        });
    }
    prepareUpload(filepath, platform) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { size, name } = this.validateFile(filepath, platform);
                const url = `${this.host}/storage/v1/temporary-files`;
                const headers = authorizedHeaders(this.userService.apiToken);
                const body = new FormData();
                body.append('name', name);
                body.append('size', String(size));
                body.append('mime_type', 'video/mpeg');
                return yield jfetch(new Request(url, { headers, body, method: 'POST' }));
            }
            catch (e) {
                this.uploading = false;
                if (e.toString() === '[object Object]') {
                    return Promise.reject('Error preparing storage upload');
                }
                return Promise.reject(e);
            }
        });
    }
    uploadS3File() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.uploader.start();
        });
    }
    generateShare(filepath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.id)
                return;
            const { name, dir } = path.parse(filepath);
            const bookmarksFile = path.join(dir, `${name}_markers.csv`);
            let bookmarks;
            if (fs.existsSync(bookmarksFile))
                bookmarks = yield this.parseBookmarks(bookmarksFile);
            const url = `${this.host}/storage/v1/temporary-shares`;
            const headers = authorizedHeaders(this.userService.apiToken, new Headers({ 'Content-Type': 'application/json' }));
            const body = JSON.stringify({
                temporary_file_id: this.id,
                type: 'video',
                metadata: { name, bookmarks },
            });
            this.uploading = false;
            return yield jfetch(new Request(url, { method: 'POST', headers, body }));
        });
    }
    parseBookmarks(filpath) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.markersService.actions.return.parseCSV(filpath);
        });
    }
}
__decorate([
    Inject()
], SharedStorageService.prototype, "userService", void 0);
__decorate([
    Inject()
], SharedStorageService.prototype, "hostsService", void 0);
__decorate([
    Inject()
], SharedStorageService.prototype, "markersService", void 0);
class S3Uploader {
    constructor(opts) {
        this.uploadedSize = 0;
        this.aborted = false;
        this.onProgress = (progress) => { };
        this.onError = (e) => { };
        this.uploadUrls = [];
        this.isMultipart = false;
        this.chunkSize = null;
        this.size = 0;
        this.type = '';
        this.filepath = '';
        this.cancelRequested = false;
        this.parts = [];
        this.onProgress = opts.onProgress;
        this.onError = opts.onError;
        this.uploadUrls = opts.fileInfo.uploadUrls;
        this.isMultipart = opts.fileInfo.isMultipart;
        this.size = opts.fileInfo.file.size;
        this.chunkSize = this.isMultipart
            ? Math.max(Math.round(this.size / this.uploadUrls.length), 1024 * 1024 * 5)
            : this.size;
        this.type = opts.fileInfo.file.mime_type;
        this.filepath = opts.filepath;
        this.cancel = this.cancel.bind(this);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const file = yield new Promise((resolve, reject) => {
                    fs.open(this.filepath, 'r', (err, fd) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(fd);
                        }
                    });
                });
                const uploaded = yield this.uploadChunks(file);
                const reqBody = this.isMultipart ? { parts: this.parts } : {};
                return { uploaded, reqBody };
            }
            catch (e) {
                this.onError(e);
            }
        });
    }
    uploadChunks(file) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                for (const url of this.uploadUrls) {
                    if (this.cancelRequested)
                        return false;
                    yield this.uploadChunk(url, file);
                }
                return true;
            }
            catch (e) {
                this.onError(e);
            }
        });
    }
    uploadChunk(url, file) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const chunkSize = Math.min(this.size - this.uploadedSize, this.chunkSize);
            const readBuffer = Buffer.alloc(chunkSize);
            const bytesRead = yield new Promise((resolve, reject) => {
                fs.read(file, readBuffer, 0, chunkSize, null, (err, bytesRead) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(bytesRead);
                    }
                });
            });
            if (bytesRead !== chunkSize) {
                throw new Error(`Did not read expected number of bytes from video, Expected: ${chunkSize} Actual: ${bytesRead}`);
            }
            const headers = new Headers();
            headers.append('Content-Type', this.type);
            this.uploadedSize += chunkSize;
            const result = yield fetch(new Request(url, {
                method: 'PUT',
                headers,
                body: new Blob([readBuffer]),
            }));
            const tag = (_b = (_a = result === null || result === void 0 ? void 0 : result.headers) === null || _a === void 0 ? void 0 : _a.get('ETag')) === null || _b === void 0 ? void 0 : _b.replace(/"/g, '');
            this.parts.push({ number: this.parts.length + 1, tag });
            this.onProgress({
                totalBytes: this.size,
                uploadedBytes: this.uploadedSize,
            });
        });
    }
    cancel() {
        this.cancelRequested = true;
    }
}
//# sourceMappingURL=shared-storage.js.map