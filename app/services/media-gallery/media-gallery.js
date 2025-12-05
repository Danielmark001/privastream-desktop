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
import { Inject } from '../core/injector';
import { authorizedHeaders, downloadFile } from '../../util/requests';
import { Service } from 'services/core/service';
import uuid from 'uuid';
import { $t } from '../i18n';
import { jfetch } from 'util/requests';
const fileTypeMap = {
    mp3: 'audio',
    wav: 'audio',
    ogg: 'audio',
    jpg: 'image',
    png: 'image',
    gif: 'image',
    jpeg: 'image',
    webm: 'image',
    svg: 'image',
    mp4: 'video',
};
const DEFAULT_MAX_USAGE = 1024 * Math.pow(1024, 2);
const DEFAULT_MAX_FILE_SIZE = 50 * Math.pow(1024, 2);
export class MediaGalleryService extends Service {
    constructor() {
        super(...arguments);
        this.promises = {};
    }
    fetchGalleryInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const [uploads, limits, stockMedia] = yield Promise.all([
                this.fetchFiles(),
                this.fetchFileLimits(),
                this.fetchStockMedia(),
            ]);
            const files = uploads.concat(stockMedia.audios, stockMedia.images);
            const totalUsage = uploads.reduce((size, file) => size + Number(file.size), 0);
            return Object.assign({ files, totalUsage }, limits);
        });
    }
    pickFile(props) {
        return __awaiter(this, void 0, void 0, function* () {
            const promiseId = uuid();
            const promise = new Promise((resolve, reject) => {
                this.promises[promiseId] = { resolve, reject };
            });
            this.showMediaGallery(promiseId, props);
            return promise;
        });
    }
    resolveFileSelect(promiseId, file) {
        this.promises[promiseId].resolve(file);
        delete this.promises[promiseId];
        return file;
    }
    upload(filePaths) {
        return __awaiter(this, void 0, void 0, function* () {
            const formData = new FormData();
            filePaths.forEach((path) => {
                const contents = fs.readFileSync(path);
                const name = path.split('\\').pop();
                const ext = name.toLowerCase().split('.').pop();
                const file = new File([contents], name, { type: `${fileTypeMap[ext]}/${ext}` });
                formData.append('uploads[]', file);
            });
            const req = this.formRequest('api/v5/slobs/uploads', {
                body: formData,
                method: 'POST',
            });
            yield jfetch(req);
            return this.fetchGalleryInfo();
        });
    }
    downloadFile(filename, file) {
        return __awaiter(this, void 0, void 0, function* () {
            return downloadFile(file.href, filename);
        });
    }
    deleteFile(file) {
        return __awaiter(this, void 0, void 0, function* () {
            const a = document.createElement('a');
            a.href = file.href;
            const path = a.pathname;
            const req = this.formRequest(`api/v5/slobs/uploads${path}`, { method: 'DELETE' });
            yield fetch(req);
            return this.fetchGalleryInfo();
        });
    }
    showMediaGallery(promiseId, props) {
        this.windowsService.showWindow({
            componentName: 'MediaGallery',
            title: $t('Media Gallery'),
            preservePrevWindow: true,
            queryParams: Object.assign({ promiseId }, props),
            size: {
                width: 1100,
                height: 680,
            },
        });
    }
    formRequest(endpoint, options) {
        const host = this.hostsService.streamlabs;
        const headers = authorizedHeaders(this.userService.apiToken);
        const url = `https://${host}/${endpoint}`;
        return new Request(url, Object.assign(Object.assign({}, options), { headers }));
    }
    fetchStockMedia() {
        return __awaiter(this, void 0, void 0, function* () {
            const req = this.formRequest('api/v5/slobs/widget/alertbox/stock-media?alerts_panels=true');
            return jfetch(req);
        });
    }
    fetchFiles() {
        return __awaiter(this, void 0, void 0, function* () {
            const req = this.formRequest('api/v5/slobs/uploads');
            const files = yield jfetch(req);
            const uploads = files.map(item => {
                const filename = decodeURIComponent(item.href.split(/[\\/]/).pop());
                const ext = filename.toLowerCase().split('.').pop();
                const type = fileTypeMap[ext] === 'video' ? 'image' : fileTypeMap[ext];
                const size = item.size || 0;
                return Object.assign(Object.assign({}, item), { filename, type, size, isStock: false });
            });
            return uploads;
        });
    }
    fetchFileLimits() {
        return __awaiter(this, void 0, void 0, function* () {
            const req = this.formRequest('api/v5/slobs/user/filelimits');
            try {
                return yield fetch(req).then((rawRes) => {
                    const resp = rawRes.json();
                    return {
                        maxUsage: resp.body.max_allowed_upload_usage,
                        maxFileSize: resp.body.max_allowed_upload_fize_size,
                    };
                });
            }
            catch (e) {
                return {
                    maxUsage: DEFAULT_MAX_USAGE,
                    maxFileSize: DEFAULT_MAX_FILE_SIZE,
                };
            }
        });
    }
}
__decorate([
    Inject()
], MediaGalleryService.prototype, "userService", void 0);
__decorate([
    Inject()
], MediaGalleryService.prototype, "hostsService", void 0);
__decorate([
    Inject()
], MediaGalleryService.prototype, "windowsService", void 0);
//# sourceMappingURL=media-gallery.js.map