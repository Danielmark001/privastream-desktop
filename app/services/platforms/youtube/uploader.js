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
import mime from 'mime';
import { platformRequest } from '../utils';
import { Inject } from 'services/core';
export class YoutubeUploader {
    get oauthToken() {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.userService.state.auth) === null || _a === void 0 ? void 0 : _a.platforms) === null || _b === void 0 ? void 0 : _b.youtube) === null || _c === void 0 ? void 0 : _c.token;
    }
    uploadVideo(filePath, options, onProgress) {
        let cancelRequested = false;
        const oauthToken = this.oauthToken;
        function doUpload() {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                const parsed = path.parse(filePath);
                const type = (_a = mime.getType(parsed.ext)) !== null && _a !== void 0 ? _a : 'application/octet-stream';
                const stats = fs.lstatSync(filePath);
                onProgress({
                    totalBytes: stats.size,
                    uploadedBytes: 0,
                });
                const headers = new Headers();
                headers.append('Authorization', `Bearer ${oauthToken}`);
                headers.append('Content-Type', 'application/json');
                headers.append('X-Upload-Content-Length', stats.size.toString());
                headers.append('X-Upload-Content-Type', type);
                const result = yield platformRequest('youtube', {
                    url: 'https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&mine=true&uploadType=resumable',
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        snippet: {
                            title: options.title,
                            description: options.description,
                        },
                        status: {
                            privacyStatus: options.privacyStatus,
                        },
                    }),
                }, true, false);
                const locationHeader = result.headers.get('Location');
                if (!locationHeader) {
                    result.text().then(text => {
                        console.log(`Got ${result.status} response from YT Upload`);
                        console.log(text);
                    });
                    throw new Error('Did not receive upload location header!');
                }
                const uploadLocation = locationHeader;
                let currentByteIndex = 0;
                const CHUNK_SIZE = 262144;
                const file = yield new Promise((resolve, reject) => {
                    fs.open(filePath, 'r', (err, fd) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(fd);
                        }
                    });
                });
                function uploadNextChunk() {
                    return __awaiter(this, void 0, void 0, function* () {
                        const nextChunkSize = Math.min(stats.size - currentByteIndex, CHUNK_SIZE);
                        const readBuffer = Buffer.alloc(nextChunkSize);
                        const bytesRead = yield new Promise((resolve, reject) => {
                            fs.read(file, readBuffer, 0, nextChunkSize, null, (err, bytesRead) => {
                                if (err) {
                                    reject(err);
                                }
                                else {
                                    resolve(bytesRead);
                                }
                            });
                        });
                        if (bytesRead !== nextChunkSize) {
                            throw new Error(`Did not read expected number of bytes from video, Expected: ${nextChunkSize} Actual: ${bytesRead}`);
                        }
                        const headers = new Headers();
                        headers.append('Content-Type', type);
                        headers.append('Content-Range', `bytes ${currentByteIndex}-${currentByteIndex + nextChunkSize - 1}/${stats.size}`);
                        headers.append('X-Upload-Content-Type', type);
                        currentByteIndex += nextChunkSize;
                        const result = yield fetch(new Request(uploadLocation, {
                            method: 'PUT',
                            headers,
                            body: new Blob([readBuffer]),
                        }));
                        onProgress({
                            totalBytes: stats.size,
                            uploadedBytes: currentByteIndex,
                        });
                        if (result.status === 308) {
                            return false;
                        }
                        else if ([200, 201].includes(result.status)) {
                            return (yield result.json());
                        }
                        else {
                            throw new Error(`Got unexpected video chunk upload status ${result.status}`);
                        }
                    });
                }
                let chunkResult;
                while (!(chunkResult = yield uploadNextChunk())) {
                    if (cancelRequested)
                        return Promise.reject('The upload was canceled');
                }
                return chunkResult;
            });
        }
        return {
            cancel: () => (cancelRequested = true),
            complete: doUpload(),
        };
    }
}
__decorate([
    Inject()
], YoutubeUploader.prototype, "userService", void 0);
//# sourceMappingURL=uploader.js.map