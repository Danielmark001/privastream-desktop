import { RpcApi } from './rpc-api';
import * as Sentry from '@sentry/browser';
export class InternalApiService extends RpcApi {
    getResource(resourceId) {
        return this.servicesManager.getResource(resourceId);
    }
    onErrorsHandler(request, errors) {
        Sentry.setExtra('API request', request);
        errors
            .filter(e => e instanceof Error)
            .forEach(e => {
            setTimeout(() => {
                throw e;
            }, 0);
        });
        return super.onErrorsHandler(request, errors);
    }
}
//# sourceMappingURL=internal-api.js.map