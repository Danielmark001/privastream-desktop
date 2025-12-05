var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getPlatformService } from './index';
import { jfetch } from '../../util/requests';
export function handlePlatformResponse(response) {
    return __awaiter(this, void 0, void 0, function* () {
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');
        let result;
        try {
            result = yield (isJson ? response.json() : response.text());
        }
        catch (e) {
            result = '';
        }
        const serializedResponse = { ok: response.ok, url: response.url, status: response.status };
        return response.ok
            ? result
            : Promise.reject(Object.assign({ result, message: status }, serializedResponse));
    });
}
export function platformRequest(platform_1, reqInfo_1) {
    return __awaiter(this, arguments, void 0, function* (platform, reqInfo, useToken = false, useJfetch = true) {
        const req = typeof reqInfo === 'string' ? { url: reqInfo } : reqInfo;
        const platformService = getPlatformService(platform);
        const requestFn = () => {
            const headers = new Headers(platformService.getHeaders(req, useToken));
            const request = new Request(req.url, Object.assign(Object.assign({}, req), { headers }));
            if (useJfetch) {
                return jfetch(request);
            }
            else {
                return fetch(request).then(response => {
                    if (!response.ok)
                        throw response;
                    return response;
                });
            }
        };
        return requestFn().catch(error => {
            if (useToken && error.status === 401) {
                return platformService.fetchNewToken().then(() => {
                    return requestFn();
                });
            }
            console.log('Failed platform request', req);
            return Promise.reject(error);
        });
    });
}
export function platformAuthorizedRequest(platform, req) {
    return platformRequest(platform, req, true);
}
//# sourceMappingURL=utils.js.map