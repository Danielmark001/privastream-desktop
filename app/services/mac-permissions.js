import { Service } from 'services/core';
import * as obs from '../../obs-api';
import { Subject } from 'rxjs';
export class MacPermissionsService extends Service {
    constructor() {
        super(...arguments);
        this.permissionsUpdated = new Subject();
    }
    getPermissionsStatus() {
        return obs.NodeObs.GetPermissionsStatus();
    }
    requestPermissions() {
        obs.NodeObs.RequestPermissions((permissions) => {
            this.permissionsUpdated.next(permissions);
        });
    }
}
//# sourceMappingURL=mac-permissions.js.map