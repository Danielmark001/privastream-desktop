export var OS;
(function (OS) {
    OS["Windows"] = "win32";
    OS["Mac"] = "darwin";
})(OS || (OS = {}));
export function byOS(handlers) {
    const handler = handlers[process.platform];
    if (typeof handler === 'function')
        return handler();
    return handler;
}
export function getOS() {
    return process.platform;
}
//# sourceMappingURL=operating-systems.js.map