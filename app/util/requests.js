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
import crypto from 'crypto';
import humps from 'humps';
export const handleResponse = (response) => {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const result = isJson ? response.json() : response.text();
    return response.ok ? result : result.then(r => Promise.reject(r));
};
export const handleErrors = (response) => {
    if (response.ok)
        return Promise.resolve(response);
    return response.json().then(json => Promise.reject(json));
};
export function camelize(response) {
    return new Promise(resolve => {
        return response.json().then((json) => {
            resolve(humps.camelizeKeys(json));
        });
    });
}
export function authorizedHeaders(token, headers = new Headers()) {
    if (token)
        headers.append('Authorization', `Bearer ${token}`);
    return headers;
}
export function downloadFile(srcUrl, dstPath, progressCallback) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            return fetch(srcUrl)
                .then(resp => (resp.ok ? Promise.resolve(resp) : Promise.reject(resp)))
                .then(response => {
                const contentLength = response.headers.get('content-length');
                const totalSize = parseInt(contentLength, 10);
                const reader = response.body.getReader();
                const fileStream = fs.createWriteStream(dstPath);
                let bytesWritten = 0;
                const readStream = ({ done, value }) => {
                    if (done) {
                        fileStream.end((err) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            if (progressCallback) {
                                progressCallback({
                                    totalBytes: totalSize || 0,
                                    downloadedBytes: totalSize || 0,
                                    percent: 1,
                                });
                            }
                            resolve();
                        });
                    }
                    else {
                        bytesWritten += value.byteLength;
                        fileStream.write(value);
                        reader.read().then(readStream);
                        if (progressCallback && totalSize) {
                            progressCallback({
                                totalBytes: totalSize,
                                downloadedBytes: bytesWritten,
                                percent: bytesWritten / totalSize,
                            });
                        }
                    }
                };
                return reader.read().then(readStream);
            })
                .catch(e => reject(e));
        });
    });
}
export const isUrl = (x) => !!x.match(/^https?:/);
export function getChecksum(filePath) {
    return new Promise((resolve, reject) => {
        const file = fs.createReadStream(filePath);
        const hash = crypto.createHash('md5');
        file.on('data', data => hash.update(data));
        file.on('end', () => resolve(hash.digest('hex')));
        file.on('error', e => reject(e));
    });
}
export function jfetch(request, init, options = {}) {
    return fetch(request, init).then(response => {
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');
        if (response.ok) {
            if (isJson || options.forceJson) {
                return response.json();
            }
            else {
                console.warn('jfetch: Got non-JSON response');
                return response.text();
            }
        }
        else if (isJson) {
            return throwJsonError(response);
        }
        else {
            throw response;
        }
    });
}
function throwJsonError(response) {
    return new Promise((res, rej) => {
        response.json().then((json) => {
            rej({
                status: response.status,
                statusText: response.statusText,
                url: response.url,
                result: json,
            });
        });
    });
}
//# sourceMappingURL=requests.js.map