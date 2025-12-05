import Vue from 'vue';
import Vuex from 'vuex';
import each from 'lodash/each';
import electron from 'electron';
import { getModule, StatefulService } from '../services/core/stateful-service';
import { ServicesManager } from '../services-manager';
import Util from 'services/utils';
import { InternalApiService } from 'services/api/internal-api';
import cloneDeep from 'lodash/cloneDeep';
import * as remote from '@electron/remote';
Vue.use(Vuex);
const { ipcRenderer } = electron;
const debug = process.env.NODE_ENV !== 'production';
const mutations = {
    BULK_LOAD_STATE(state, data) {
        each(data.state, (value, key) => {
            if (key === 'i18nReady')
                return;
            state[key] = value;
        });
    },
    I18N_READY(state) {
        state.i18nReady = true;
    },
};
const actions = {};
const plugins = [];
let mutationId = 1;
const isWorkerWindow = Util.isWorkerWindow();
let storeCanReceiveMutations = isWorkerWindow;
const appliedForeignMutations = new Set();
plugins.push((store) => {
    store.subscribe((mutation) => {
        const internalApiService = InternalApiService.instance;
        if (mutation.payload && !mutation.payload.__vuexSyncIgnore) {
            const mutationToSend = {
                id: mutationId++,
                type: mutation.type,
                payload: mutation.payload,
            };
            internalApiService.handleMutation(mutationToSend);
            sendMutationToRendererWindows(mutationToSend);
        }
    });
    ipcRenderer.on('vuex-sendState', (event, windowId) => {
        const win = remote.BrowserWindow.fromId(windowId);
        flushMutations();
        win.webContents.send('vuex-loadState', JSON.stringify(store.state));
    });
    ipcRenderer.on('vuex-loadState', (event, state) => {
        store.commit('BULK_LOAD_STATE', {
            state: JSON.parse(state),
            __vuexSyncIgnore: true,
        });
        storeCanReceiveMutations = true;
    });
    ipcRenderer.on('vuex-mutation', (event, mutationString) => {
        if (!storeCanReceiveMutations)
            return;
        const mutations = JSON.parse(mutationString);
        for (const mutation of mutations) {
            commitMutation(mutation);
        }
    });
    ipcRenderer.send('vuex-register');
});
let store = null;
export function createStore() {
    const statefulServiceModules = {};
    const servicesManager = ServicesManager.instance;
    window['servicesManager'] = servicesManager;
    const statefulServices = servicesManager.getStatefulServicesAndMutators();
    Object.keys(statefulServices).forEach(serviceName => {
        statefulServiceModules[serviceName] = getModule(statefulServices[serviceName]);
    });
    store = new Vuex.Store({
        plugins,
        mutations,
        actions,
        modules: Object.assign({}, statefulServiceModules),
        strict: false,
        state: {
            bulkLoadFinished: !!Util.isWorkerWindow(),
            i18nReady: false,
        },
    });
    StatefulService.setupVuexStore(store);
    return store;
}
export function commitMutation(mutation) {
    if (appliedForeignMutations.has(mutation.id))
        return;
    appliedForeignMutations.add(mutation.id);
    store.commit(mutation.type, Object.assign({}, mutation.payload, {
        __vuexSyncIgnore: true,
    }));
}
const mutationsQueue = [];
function sendMutationToRendererWindows(mutation) {
    mutationsQueue.push(cloneDeep(mutation));
    setTimeout(() => flushMutations());
}
function flushMutations() {
    ipcRenderer.send('vuex-mutation', JSON.stringify(mutationsQueue));
    mutationsQueue.length = 0;
}
//# sourceMappingURL=index.js.map