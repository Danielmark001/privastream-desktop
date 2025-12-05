import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import { StatefulService } from '../services/core';
import { Services } from './service-provider';
import Util from 'services/utils';
export function useVuex(selector, deep = true) {
    const [state, setState] = useState(selector);
    useEffect(() => {
        const unsubscribe = StatefulService.store.watch(() => selector(), newState => {
            setState(newState);
        }, { deep });
        return () => {
            unsubscribe();
        };
    }, []);
    return state;
}
export function useWatchVuex(selector, watchFn) {
    const selectorVal = useVuex(selector);
    const oldVal = useRef(selectorVal);
    useEffect(() => {
        if (selectorVal !== oldVal.current) {
            watchFn(selectorVal, oldVal.current);
            oldVal.current = selectorVal;
        }
    }, [selectorVal]);
}
export function useOnCreate(cb) {
    return useState(cb)[0];
}
export function useOnDestroy(cb) {
    useEffect(() => cb, []);
}
export function useDebounce(ms = 0, cb) {
    return useCallback(debounce(cb, ms), []);
}
export function useThrottle(ms = 0, cb) {
    return useCallback(throttle(cb, ms), []);
}
export function useRenderInterval(callback, delay, condition = true) {
    const [tick, setTick] = useState(0);
    useEffect(() => {
        if (condition) {
            const timeout = window.setTimeout(() => {
                callback();
                setTick(tick + 1);
            }, delay);
            return () => clearTimeout(timeout);
        }
    }, [tick, condition]);
}
export function usePromise(executor, handler) {
    useEffect(() => {
        let unmounted = false;
        handler(new Promise((resolve, reject) => {
            executor()
                .then(r => {
                if (unmounted)
                    return;
                resolve(r);
            })
                .catch(e => {
                if (unmounted)
                    return;
                reject(e);
            });
        }));
        return () => {
            unmounted = true;
        };
    }, []);
}
export function useChildWindowParams(key) {
    const { WindowsService } = Services;
    const params = useMemo(() => WindowsService.getChildWindowQueryParams(), []);
    return key ? params[key] : params;
}
export function useOneOffWindowParams(key) {
    const { WindowsService } = Services;
    const params = useMemo(() => {
        const windowId = Util.getCurrentUrlParams().windowId;
        return WindowsService.getWindowOptions(windowId);
    }, []);
    return key ? params[key] : params;
}
//# sourceMappingURL=hooks.js.map