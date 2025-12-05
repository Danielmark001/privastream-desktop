import { Service } from 'services/core/service';
import { E_JSON_RPC_ERROR, } from './jsonrpc-api';
import uuid from 'uuid/v4';
export class JsonrpcService extends Service {
    static createError(requestOrRequestId, options) {
        const id = arguments[0] && typeof arguments[0] === 'object'
            ? arguments[0].id
            : arguments[0];
        return {
            id,
            jsonrpc: '2.0',
            error: {
                code: options.code,
                message: E_JSON_RPC_ERROR[options.code] + (options.message ? ' ' + options.message : ''),
            },
        };
    }
    static createRequest(resourceId, method, ...args) {
        return {
            method,
            jsonrpc: '2.0',
            id: uuid(),
            params: {
                args,
                resource: resourceId,
            },
        };
    }
    static createRequestWithOptions(resourceId, method, options, ...args) {
        const request = this.createRequest(resourceId, method, ...args);
        request.params = Object.assign(Object.assign({}, request.params), options);
        return request;
    }
    static createResponse(requestOrRequestId, result = null) {
        const id = arguments[0] && typeof arguments[0] === 'object'
            ? arguments[0].id
            : arguments[0];
        return { id, result, jsonrpc: '2.0' };
    }
    static createEvent(options) {
        return this.createResponse(null, Object.assign({ _type: 'EVENT' }, options));
    }
    createError(requestOrRequestId, options) {
        return JsonrpcService.createError.apply(this, arguments);
    }
    createRequest(resourceId, method, ...args) {
        return JsonrpcService.createRequest.apply(this, arguments);
    }
    createRequestWithOptions(resourceId, method, options, ...args) {
        return JsonrpcService.createRequestWithOptions.apply(this, arguments);
    }
    createResponse(requestOrRequestId, result) {
        return JsonrpcService.createResponse.apply(this, arguments);
    }
    createEvent(options) {
        return JsonrpcService.createResponse.apply(this, arguments);
    }
}
//# sourceMappingURL=jsonrpc.js.map