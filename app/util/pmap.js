export function pmap(items, executor, options = {}) {
    const opts = Object.assign({ concurrency: Infinity }, options);
    if (items.length === 0)
        return Promise.resolve([]);
    return new Promise((resolve, reject) => {
        var _a;
        const toExecute = items.map((item, index) => [item, index]);
        const returns = [];
        const totalNum = toExecute.length;
        let errored = false;
        function executeNext() {
            const item = toExecute.shift();
            if (item == null)
                return;
            executor(item[0])
                .then(ret => {
                if (errored)
                    return;
                returns.push([ret, item[1]]);
                if (opts.onProgress) {
                    opts.onProgress(item[0], ret, returns.length);
                }
                if (toExecute.length > 0) {
                    executeNext();
                }
                else if (returns.length === totalNum) {
                    const orderedReturns = [];
                    returns.forEach(set => {
                        orderedReturns[set[1]] = set[0];
                    });
                    resolve(orderedReturns);
                }
            })
                .catch(e => {
                errored = true;
                reject(e);
            });
        }
        Array(Math.min(items.length, (_a = opts.concurrency) !== null && _a !== void 0 ? _a : Infinity))
            .fill(0)
            .forEach(() => executeNext());
    });
}
//# sourceMappingURL=pmap.js.map