export var EApiPermissions;
(function (EApiPermissions) {
    EApiPermissions["ScenesSources"] = "slobs.scenes-sources";
    EApiPermissions["ObsSettings"] = "slobs.obs-settings";
    EApiPermissions["Streaming"] = "slobs.streaming";
    EApiPermissions["Authorization"] = "slobs.authorization";
    EApiPermissions["SceneCollections"] = "slobs.scene-collections";
    EApiPermissions["SceneTransitions"] = "slobs.scene-transitions";
    EApiPermissions["ExternalLinks"] = "slobs.external-links";
    EApiPermissions["Notifications"] = "slobs.notifications";
    EApiPermissions["Hotkeys"] = "slobs.hotkeys";
    EApiPermissions["Vision"] = "sld.vision";
})(EApiPermissions || (EApiPermissions = {}));
export function apiMethod() {
    return (target, methodName, descriptor) => {
        const klass = target.constructor;
        klass.apiMethods = klass.apiMethods || [];
        klass.apiMethods.push(methodName);
        return descriptor;
    };
}
export function apiEvent() {
    return (target, methodName) => {
        const klass = target.constructor;
        klass.apiEvents = klass.apiEvents || [];
        klass.apiEvents.push(methodName);
    };
}
export class NotImplementedError extends Error {
    constructor() {
        super('This function is not yet implemented.  It you are interested in ' +
            'using it, please reach out to the Streamlabs dev team.  Thanks!');
    }
}
export class Module {
    constructor() {
        this.requiresHighlyPrivileged = false;
    }
    validatePatch(requiredKeys, patch) {
        requiredKeys.forEach(key => {
            if (!patch[key]) {
                throw new Error(`Missing required key in patch: ${key}`);
            }
        });
    }
}
//# sourceMappingURL=module.js.map