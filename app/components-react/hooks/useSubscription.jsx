import { useEffect } from 'react';
export function useSubscription(observable, cb) {
    useEffect(() => {
        const subscription = observable.subscribe(cb);
        return () => subscription.unsubscribe();
    }, []);
}
//# sourceMappingURL=useSubscription.jsx.map