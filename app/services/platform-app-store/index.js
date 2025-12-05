import { Service } from 'services/core/service';
export class PlatformAppStoreService extends Service {
    constructor() {
        super(...arguments);
        this.paypalAuthCallback = () => { };
    }
    paypalAuthSuccess() {
        this.paypalAuthCallback();
    }
    bindsPaypalSuccessCallback(callback) {
        this.paypalAuthCallback = callback;
    }
}
//# sourceMappingURL=index.js.map