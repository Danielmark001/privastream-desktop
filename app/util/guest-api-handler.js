import electron from 'electron';
import { Observable } from 'rxjs';
import uuid from 'uuid/v4';
import * as remote from '@electron/remote';
export var EResponseResultProcessing;
(function (EResponseResultProcessing) {
    EResponseResultProcessing["None"] = "none";
    EResponseResultProcessing["File"] = "file";
})(EResponseResultProcessing || (EResponseResultProcessing = {}));
export class FileReturnWrapper {
    constructor(filePath) {
        this.filePath = filePath;
    }
}
export class GuestApiHandler {
    exposeApi(targetWebContentsId, api) {
        const ipcChannel = `guestApiRequest-${uuid()}`;
        const webContents = remote.webContents.fromId(targetWebContentsId);
        let subscriptions = [];
        webContents.on('destroyed', () => {
            subscriptions.forEach(sub => {
                sub.unsubscribe();
            });
            subscriptions = [];
            electron.ipcRenderer.removeAllListeners(ipcChannel);
        });
        const requestHandler = (request) => {
            const mappedArgs = this.getMappedArgs(request, webContents);
            const endpoint = this.getEndpointFromPath(api, request.methodPath);
            if (!endpoint) {
                this.handleMissingEndpoint(request, webContents);
                return;
            }
            if (endpoint instanceof Observable) {
                subscriptions.push(endpoint.subscribe(mappedArgs[0]));
            }
            else {
                this.callEndpointMethod(endpoint, mappedArgs, request, webContents);
            }
        };
        electron.ipcRenderer.on(ipcChannel, (event, request) => {
            requestHandler(request);
        });
        electron.ipcRenderer.send('guestApi-setInfo', {
            webContentsId: targetWebContentsId,
            schema: this.getSchema(api),
            hostWebContentsId: remote.getCurrentWebContents().id,
            ipcChannel,
        });
    }
    getSchema(api) {
        const newObj = {};
        Object.keys(api).forEach(key => {
            if (api[key] instanceof Function || api[key] instanceof Observable) {
                newObj[key] = true;
            }
            else {
                newObj[key] = this.getSchema(api[key]);
            }
        });
        return newObj;
    }
    getMappedArgs(request, contents) {
        return request.args.map(arg => {
            const isCallbackPlaceholder = typeof arg === 'object' && arg && arg.__guestApiCallback;
            if (isCallbackPlaceholder) {
                return (...args) => {
                    const callbackObj = {
                        args,
                        requestId: request.id,
                        callbackId: arg.id,
                    };
                    this.safeSend(contents, 'guestApiCallback', callbackObj);
                };
            }
            return arg;
        });
    }
    handleMissingEndpoint(request, contents) {
        const response = {
            id: request.id,
            error: true,
            result: `Error: The function ${request.methodPath.join('.')} does not exist!`,
            resultProcessing: EResponseResultProcessing.None,
        };
        this.safeSend(contents, 'guestApiResponse', response);
    }
    callEndpointMethod(method, args, request, contents) {
        method(...args)
            .then(result => {
            let response;
            if (result instanceof FileReturnWrapper) {
                response = {
                    result: result.filePath,
                    resultProcessing: EResponseResultProcessing.File,
                    id: request.id,
                    error: false,
                };
            }
            else {
                response = {
                    result,
                    resultProcessing: EResponseResultProcessing.None,
                    id: request.id,
                    error: false,
                };
            }
            this.safeSend(contents, 'guestApiResponse', response);
        })
            .catch(rawResult => {
            const result = rawResult instanceof Error ? rawResult.message : rawResult;
            const response = {
                result,
                resultProcessing: EResponseResultProcessing.None,
                id: request.id,
                error: true,
            };
            this.safeSend(contents, 'guestApiResponse', response);
        });
    }
    safeSend(contents, channel, msg) {
        if (contents && !contents.isDestroyed()) {
            contents.send(channel, msg);
        }
    }
    getEndpointFromPath(handler, path) {
        if (!handler)
            return;
        if (path.length === 0)
            return;
        if (!handler.propertyIsEnumerable(path[0]))
            return;
        if (path.length === 1) {
            const endpoint = handler[path[0]];
            if (endpoint instanceof Function || endpoint instanceof Observable)
                return endpoint;
            return;
        }
        return this.getEndpointFromPath(handler[path[0]], path.slice(1));
    }
}
//# sourceMappingURL=guest-api-handler.js.map