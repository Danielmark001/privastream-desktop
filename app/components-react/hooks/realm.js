import { useEffect, useReducer } from 'react';
export function useRealmObject(obj) {
    const [_, forceUpdate] = useReducer(x => x + 1, 0);
    useEffect(() => {
        const listener = (_o, changes) => {
            var _a;
            if (!changes.deleted && ((_a = changes.changedProperties) === null || _a === void 0 ? void 0 : _a.length) === 0)
                return;
            forceUpdate();
        };
        obj.realmModel.addListener(listener);
        return () => {
            obj.realmModel.removeListener(listener);
        };
    }, [obj]);
    return obj;
}
//# sourceMappingURL=realm.js.map