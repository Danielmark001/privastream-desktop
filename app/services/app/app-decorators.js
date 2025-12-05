import { getResource } from 'services/core/injector';
import { createDecorator } from 'vue-class-component';
import cloneDeep from 'lodash/cloneDeep';
export function RunInLoadingMode(options = {}) {
    return function (target, methodName, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            const appService = getResource('AppService');
            return appService.runInLoadingMode(() => {
                return originalMethod.call(this, ...args);
            }, options);
        };
        return descriptor;
    };
}
export function SyncWithValue() {
    return createDecorator((options, key) => {
        (options.props || (options.props = {}))['value'] = null;
        if (!options.watch)
            options.watch = {};
        options.data = () => ({ [key]: null });
        options.watch['value'] = {
            deep: true,
            immediate: true,
            handler(newVal) {
                this[key] = cloneDeep(newVal);
                if (!this['_isNotInitialCall']) {
                    this['_isNotInitialCall'] = true;
                }
                else {
                    this['_shouldSkipNextWatcher'] = true;
                }
            },
        };
        options.watch[key] = {
            deep: true,
            handler(newVal) {
                if (!this['_shouldSkipNextWatcher']) {
                    this['$emit']('input', cloneDeep(newVal));
                }
                this['_shouldSkipNextWatcher'] = false;
            },
        };
    });
}
//# sourceMappingURL=app-decorators.js.map