import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';
import { useContext, useMemo } from 'react';
export function initStore(initialStateDraft) {
    const initialState = Object.assign({}, initialStateDraft);
    const store = createStore(immer(set => initialState));
    for (const key in initialState) {
        if (initialState.hasOwnProperty(key)) {
            Object.defineProperty(store, key, {
                get() {
                    return store.getState()[key];
                },
            });
        }
    }
    const useState = createBoundedUseStore(store);
    store.useState = useState;
    const update = (key, value) => store.setState((s) => {
        s[key] = value;
    });
    store.update = update;
    return store;
}
const createBoundedUseStore = (store => (selector, equals) => useStore(store, selector, equals));
export function useController(ControllerCtx) {
    const controller = useContext(ControllerCtx);
    if (!controller) {
        throw new Error('No controller found in context. Did you forget to wrap your component in a controller provider?');
    }
    useMemo(() => {
        var _a;
        const actionNames = Object.getOwnPropertyNames(Object.getPrototypeOf(controller));
        const actions = {};
        for (const actionName of actionNames) {
            if (actionName === 'constructor')
                continue;
            if (!((_a = controller[actionName]) === null || _a === void 0 ? void 0 : _a.bind))
                continue;
            if (actionName === 'init')
                controller[actionName]();
            actions[actionName] = controller[actionName].bind(controller);
        }
        Object.assign(controller, actions);
    }, [controller]);
    return controller;
}
//# sourceMappingURL=zustand.js.map