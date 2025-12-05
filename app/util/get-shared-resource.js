import Utils from 'services/utils';
import path from 'path';
import * as remote from '@electron/remote';
export function getSharedResource(resource) {
    if (Utils.isDevMode()) {
        return path.resolve(remote.app.getAppPath(), 'shared-resources', resource);
    }
    return path.resolve(remote.app.getAppPath(), '../../shared-resources', resource);
}
//# sourceMappingURL=get-shared-resource.js.map