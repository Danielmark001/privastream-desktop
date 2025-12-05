export function lazyModule(module) {
    return function (target, key) {
        const objectKey = `_${key}`;
        Object.defineProperty(target, key, {
            get: () => {
                if (!target[objectKey])
                    target[objectKey] = new module();
                return target[objectKey];
            },
        });
    };
}
//# sourceMappingURL=lazy-module.js.map