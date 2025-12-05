import merge from 'lodash/merge';
import cloneDeep from 'lodash/cloneDeep';
import { StatefulService } from './stateful-service';
import Utils from '../utils';
export class PersistentStatefulService extends StatefulService {
    static get initialState() {
        const persisted = JSON.parse(localStorage.getItem(this.localStorageKey)) || {};
        return this.filter(merge({}, this.defaultState, persisted));
    }
    static get localStorageKey() {
        return `PersistentStatefulService-${this.name}`;
    }
    init() {
        this.store.watch(() => {
            return JSON.stringify(this.constructor.filter(this.state));
        }, val => {
            const PersistentService = this.constructor;
            const valueToSave = Utils.getDeepChangedParams(PersistentService.defaultState, JSON.parse(val));
            localStorage.setItem(PersistentService.localStorageKey, JSON.stringify(valueToSave));
        });
    }
    static filter(state) {
        return state;
    }
    runMigrations(persistedState, migrations) {
        const migratedState = cloneDeep(persistedState);
        migrations.forEach(migration => {
            if (persistedState[migration.oldKey] == null)
                return;
            migratedState[migration.newKey] = migration.transform(persistedState[migration.oldKey]);
            delete migratedState[migration.oldKey];
        });
        return migratedState;
    }
}
PersistentStatefulService.defaultState = {};
//# sourceMappingURL=persistent-stateful-service.js.map