import { StatefulService } from 'services/core';
import * as obs from '../../obs-api';
export class SignalsService extends StatefulService {
    init() {
        obs.NodeObs.OBS_service_connectOutputSignals((info) => {
            for (const callback of this.state.signalCallbacks) {
                callback(info);
            }
        });
    }
    addCallback(callback) {
        this.state.signalCallbacks.push(callback);
    }
}
SignalsService.initialState = {
    signalCallbacks: [],
};
//# sourceMappingURL=signals-manager.js.map