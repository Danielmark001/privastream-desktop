export function onUnload(fun) {
    window.addEventListener('beforeunload', fun);
    return () => window.removeEventListener('beforeunload', fun);
}
//# sourceMappingURL=unload.js.map