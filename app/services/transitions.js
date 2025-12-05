var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { mutation, StatefulService, ViewHandler } from 'services/core/stateful-service';
import * as obs from '../../obs-api';
import { Inject } from 'services/core/injector';
import uuid from 'uuid/v4';
import { $t } from 'services/i18n';
import { DefaultManager } from 'services/sources/properties-managers/default-manager';
import { Subject } from 'rxjs';
import { isUrl } from '../util/requests';
import { getOS, OS } from 'util/operating-systems';
import { ENotificationType } from './notifications';
export const TRANSITION_DURATION_MAX = 2000000000;
export var ETransitionType;
(function (ETransitionType) {
    ETransitionType["Cut"] = "cut_transition";
    ETransitionType["Fade"] = "fade_transition";
    ETransitionType["Swipe"] = "swipe_transition";
    ETransitionType["Shuffle"] = "shuffle_transition";
    ETransitionType["Slide"] = "slide_transition";
    ETransitionType["FadeToColor"] = "fade_to_color_transition";
    ETransitionType["LumaWipe"] = "wipe_transition";
    ETransitionType["Stinger"] = "obs_stinger_transition";
    ETransitionType["Motion"] = "motion_transition";
})(ETransitionType || (ETransitionType = {}));
class TransitionsViews extends ViewHandler {
    getTypes() {
        const types = [
            { title: $t('Cut'), value: ETransitionType.Cut },
            { title: $t('Fade'), value: ETransitionType.Fade },
            { title: $t('Swipe'), value: ETransitionType.Swipe },
            { title: $t('Slide'), value: ETransitionType.Slide },
            { title: $t('Fade to Color'), value: ETransitionType.FadeToColor },
            { title: $t('Luma Wipe'), value: ETransitionType.LumaWipe },
            { title: $t('Stinger'), value: ETransitionType.Stinger },
        ];
        if (getOS() === OS.Windows) {
            types.push({ title: $t('Motion'), value: ETransitionType.Motion });
            types.push({ title: $t('Shuffle'), value: ETransitionType.Shuffle });
        }
        return types;
    }
    isConnectionRedundant(id) {
        const connection = this.getConnection(id);
        const match = this.state.connections.find(conn => {
            return conn.fromSceneId === connection.fromSceneId && conn.toSceneId === connection.toSceneId;
        });
        return match.id !== connection.id;
    }
    getConnection(id) {
        return this.state.connections.find(conn => conn.id === id);
    }
    get studioMode() {
        return this.state.studioMode;
    }
}
export class TransitionsService extends StatefulService {
    constructor() {
        super(...arguments);
        this.studioModeChanged = new Subject();
        this.transitionPropertiesChanged = new Subject();
        this.studioModeLocked = false;
        this.obsTransitions = {};
        this.propertiesManagers = {};
    }
    get views() {
        return new TransitionsViews(this.state);
    }
    init() {
        this.sceneCollectionsService.collectionWillSwitch.subscribe(() => {
            this.disableStudioMode();
        });
        obs.NodeObs.RegisterTransitionCallback((objs) => this.handleTransitionCallback(objs));
        const establishedContext = this.videoSettingsService.establishedContext.subscribe(() => {
            if (!this.studioModeTransition)
                this.createStudioModeTransition();
            establishedContext.unsubscribe();
        });
    }
    enableStudioMode() {
        if (this.state.studioMode)
            return;
        if (this.dualOutputService.views.dualOutputMode) {
            this.notificationsService.actions.push({
                message: $t('Cannot toggle Studio Mode in Dual Output Mode.'),
                type: ENotificationType.WARNING,
                lifeTime: 2000,
            });
            return;
        }
        this.usageStatisticsService.recordFeatureUsage('StudioMode');
        this.SET_STUDIO_MODE(true);
        this.studioModeChanged.next(true);
        if (!this.studioModeTransition)
            this.createStudioModeTransition();
        this.currentSceneId = this.scenesService.views.activeScene.id;
        const currentScene = this.scenesService.views.activeScene.getObsScene();
        this.sceneDuplicate = currentScene.duplicate('scene_copy_' + uuid(), 1);
        this.getCurrentTransition().set(this.sceneDuplicate);
        this.studioModeTransition.set(currentScene);
        obs.Global.addSceneToBackstage(this.studioModeTransition);
    }
    disableStudioMode() {
        if (!this.state.studioMode)
            return;
        this.SET_STUDIO_MODE(false);
        this.studioModeChanged.next(false);
        const currentScene = this.scenesService.views.activeScene;
        this.getCurrentTransition().set(currentScene.getObsScene());
        this.releaseStudioModeObjects();
    }
    executeStudioModeTransition() {
        if (!this.state.studioMode)
            return;
        if (this.studioModeLocked)
            return;
        this.studioModeLocked = true;
        const currentScene = this.scenesService.views.activeScene;
        obs.Global.removeSceneFromBackstage(currentScene.getSource().getObsInput());
        this.oldDuplicate = this.sceneDuplicate;
        this.sceneDuplicate = currentScene
            .getObsScene()
            .duplicate('scene_copy_' + uuid(), 1);
        const transition = this.getDefaultTransition();
        const obsTransition = this.obsTransitions[transition.id];
        obsTransition.set(this.getCurrentTransition().getActiveSource());
        obs.Global.setOutputSource(0, obsTransition);
        obsTransition.start(Math.min(transition.duration, TRANSITION_DURATION_MAX), this.sceneDuplicate);
    }
    handleTransitionCallback(callbackInfo) {
        callbackInfo.forEach(info => {
            const obsTransition = this.obsTransitions[info.id];
            if (!obsTransition) {
                return;
            }
            if (this.studioModeLocked && info.event === 'stop') {
                this.oldDuplicate.release();
                this.oldDuplicate = null;
                this.currentSceneId = this.scenesService.views.activeScene.id;
                this.studioModeLocked = false;
            }
        });
    }
    getCurrentTransition() {
        return obs.Global.getOutputSource(0);
    }
    createStudioModeTransition() {
        this.studioModeTransition = obs.TransitionFactory.create(ETransitionType.Cut, `studio_transition_${uuid()}`);
    }
    releaseStudioModeObjects() {
        if (this.studioModeTransition) {
            obs.Global.removeSceneFromBackstage(this.studioModeTransition);
            this.studioModeTransition.release();
            this.studioModeTransition = null;
        }
        if (this.sceneDuplicate) {
            this.sceneDuplicate.release();
            this.sceneDuplicate = null;
        }
    }
    getStudioTransitionName() {
        if (this.studioModeTransition) {
            return this.studioModeTransition.name;
        }
    }
    transition(sceneAId, sceneBId) {
        if (this.state.studioMode) {
            if (sceneAId && sceneAId !== this.currentSceneId) {
                const prevScene = this.scenesService.views.getScene(sceneAId);
                obs.Global.removeSceneFromBackstage(prevScene.getSource().getObsInput());
            }
            const scene = this.scenesService.views.getScene(sceneBId);
            if (this.currentSceneId !== sceneBId) {
                obs.Global.addSceneToBackstage(scene.getSource().getObsInput());
            }
            this.studioModeTransition.set(scene.getObsScene());
            return;
        }
        this.ensureTransition();
        const obsScene = this.scenesService.views.getScene(sceneBId).getObsScene();
        const transition = this.getConnectedTransition(sceneAId, sceneBId);
        const obsTransition = this.obsTransitions[transition.id];
        if (transition.type === ETransitionType.Motion) {
            this.usageStatisticsService.recordFeatureUsage('MotionTransition');
        }
        if (sceneAId) {
            obsTransition.set(this.scenesService.views.getScene(sceneAId).getObsScene());
            obs.Global.setOutputSource(0, obsTransition);
            obsTransition.start(Math.min(transition.duration, TRANSITION_DURATION_MAX), obsScene);
        }
        else {
            const defaultTransition = obs.TransitionFactory.create(ETransitionType.Cut, uuid());
            defaultTransition.set(obsScene);
            obs.Global.setOutputSource(0, defaultTransition);
            obsTransition.start(Math.min(transition.duration, TRANSITION_DURATION_MAX), obsScene);
            defaultTransition.release();
        }
    }
    getConnectedTransition(fromId, toId) {
        const matchedConnection = this.state.connections.find(connection => {
            return connection.fromSceneId === fromId && connection.toSceneId === toId;
        });
        if (matchedConnection && this.getTransition(matchedConnection.transitionId)) {
            return this.getTransition(matchedConnection.transitionId);
        }
        const wildcardConnection = this.getWildcardConnection(fromId, toId);
        if (wildcardConnection && this.getTransition(wildcardConnection.transitionId)) {
            return this.getTransition(wildcardConnection.transitionId);
        }
        return this.getDefaultTransition();
    }
    getWildcardConnection(fromId, toId) {
        const connection = this.state.connections.find(connect => connect.fromSceneId === 'ALL' && connect.toSceneId === toId);
        if (connection)
            return connection;
        return this.state.connections.find(connection => connection.fromSceneId === fromId && connection.toSceneId === 'ALL');
    }
    shutdown() {
        Object.values(this.obsTransitions).forEach(tran => tran.release());
        this.releaseStudioModeObjects();
        obs.Global.setOutputSource(0, null);
    }
    ensureTransition() {
        if (this.state.transitions.length === 0) {
            this.createTransition(ETransitionType.Cut, $t('Global Transition'));
        }
    }
    getDefaultTransition() {
        return this.state.transitions.find(tran => tran.id === this.state.defaultTransitionId);
    }
    getSettings(id) {
        return this.obsTransitions[id].settings;
    }
    getPropertiesManagerSettings(id) {
        return this.propertiesManagers[id].settings;
    }
    getPropertiesFormData(id) {
        return this.propertiesManagers[id].getPropertiesFormData() || [];
    }
    setPropertiesFormData(id, formData) {
        this.propertiesManagers[id].setPropertiesFormData(formData);
        this.transitionPropertiesChanged.next(id);
    }
    createTransition(type, name, options = {}) {
        if (!this.views.getTypes().find(t => t.value === type)) {
            type = ETransitionType.Cut;
        }
        const id = options.id || uuid();
        const transition = obs.TransitionFactory.create(type, id, options.settings || {});
        const manager = new DefaultManager(transition, options.propertiesManagerSettings || {});
        this.obsTransitions[id] = transition;
        this.propertiesManagers[id] = manager;
        if (!this.state.defaultTransitionId)
            this.MAKE_DEFAULT(id);
        this.ADD_TRANSITION(id, name, type, options.duration || 300);
        return this.getTransition(id);
    }
    changeTransitionType(id, newType) {
        const transition = this.getTransition(id);
        this.propertiesManagers[id].destroy();
        this.obsTransitions[id].release();
        this.obsTransitions[id] = obs.TransitionFactory.create(newType, id);
        this.propertiesManagers[id] = new DefaultManager(this.obsTransitions[id], {});
        this.UPDATE_TRANSITION(id, { type: newType });
        this.transitionPropertiesChanged.next(id);
    }
    renameTransition(id, newName) {
        this.UPDATE_TRANSITION(id, { name: newName });
    }
    deleteTransition(id) {
        this.propertiesManagers[id].destroy();
        delete this.propertiesManagers[id];
        this.obsTransitions[id].release();
        delete this.obsTransitions[id];
        this.DELETE_TRANSITION(id);
    }
    deleteAllTransitions() {
        this.state.transitions.forEach(transition => {
            this.deleteTransition(transition.id);
        });
    }
    deleteAllConnections() {
        this.state.connections.forEach(connection => {
            this.deleteConnection(connection.id);
        });
    }
    setDefaultTransition(id) {
        this.MAKE_DEFAULT(id);
    }
    getTransition(id) {
        return this.state.transitions.find(tran => tran.id === id);
    }
    addConnection(fromId, toId, transitionId, connectionId) {
        const id = connectionId || uuid();
        this.ADD_CONNECTION({
            id,
            transitionId,
            fromSceneId: fromId,
            toSceneId: toId,
        });
        return this.views.getConnection(id);
    }
    updateConnection(id, patch) {
        this.UPDATE_CONNECTION(id, patch);
    }
    deleteConnection(id) {
        this.DELETE_CONNECTION(id);
    }
    setDuration(id, duration) {
        this.UPDATE_TRANSITION(id, { duration });
    }
    showSceneTransitions() {
        this.windowsService.showWindow({
            componentName: 'SceneTransitions',
            title: $t('Scene Transitions'),
            size: {
                width: 800,
                height: 650,
            },
        });
    }
    clearPlatformAppTransitions(appId) {
        Object.entries(this.propertiesManagers)
            .filter(([_, manager]) => {
            return manager.settings && manager.settings.appId === appId;
        })
            .forEach(([propertyManagerId]) => {
            const formData = this.getPropertiesFormData(propertyManagerId);
            this.setPropertiesFormData(propertyManagerId, formData.map(setting => {
                if (setting.name && setting.name === 'path' && isUrl(setting.value)) {
                    return Object.assign(Object.assign({}, setting), { value: '' });
                }
                return setting;
            }));
        });
    }
    getLockedStates() {
        const states = {};
        this.state.transitions.forEach(transition => {
            states[transition.id] = this.getPropertiesManagerSettings(transition.id).locked;
        });
        return states;
    }
    inspectSource(sourceId) {
        const source = this.sourcesService.views.getSource(sourceId);
        if (!source)
            return;
        obs.Global.setOutputSource(0, source.getObsInput());
    }
    cancelInspectSource() {
        this.transition(null, this.scenesService.views.activeSceneId);
    }
    ADD_TRANSITION(id, name, type, duration) {
        this.state.transitions.push({
            id,
            name,
            type,
            duration,
        });
    }
    UPDATE_TRANSITION(id, patch) {
        const transition = this.state.transitions.find(tran => tran.id === id);
        if (transition) {
            Object.keys(patch).forEach(key => {
                transition[key] = patch[key];
            });
        }
    }
    DELETE_TRANSITION(id) {
        this.state.transitions = this.state.transitions.filter(tran => tran.id !== id);
        if (this.state.defaultTransitionId === id) {
            if (this.state.transitions.length > 0) {
                this.state.defaultTransitionId = this.state.transitions[0].id;
            }
            else {
                this.state.defaultTransitionId = null;
            }
        }
    }
    MAKE_DEFAULT(id) {
        this.state.defaultTransitionId = id;
    }
    ADD_CONNECTION(connection) {
        this.state.connections.push(connection);
    }
    UPDATE_CONNECTION(id, patch) {
        const connection = this.state.connections.find(conn => conn.id === id);
        if (connection) {
            Object.keys(patch).forEach(key => {
                connection[key] = patch[key];
            });
        }
    }
    DELETE_CONNECTION(id) {
        this.state.connections = this.state.connections.filter(conn => conn.id !== id);
    }
    SET_STUDIO_MODE(enabled) {
        this.state.studioMode = enabled;
    }
}
TransitionsService.initialState = {
    transitions: [],
    connections: [],
    defaultTransitionId: null,
    studioMode: false,
};
__decorate([
    Inject()
], TransitionsService.prototype, "windowsService", void 0);
__decorate([
    Inject()
], TransitionsService.prototype, "scenesService", void 0);
__decorate([
    Inject()
], TransitionsService.prototype, "sceneCollectionsService", void 0);
__decorate([
    Inject()
], TransitionsService.prototype, "usageStatisticsService", void 0);
__decorate([
    Inject()
], TransitionsService.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], TransitionsService.prototype, "videoSettingsService", void 0);
__decorate([
    Inject()
], TransitionsService.prototype, "dualOutputService", void 0);
__decorate([
    Inject()
], TransitionsService.prototype, "notificationsService", void 0);
__decorate([
    mutation()
], TransitionsService.prototype, "ADD_TRANSITION", null);
__decorate([
    mutation()
], TransitionsService.prototype, "UPDATE_TRANSITION", null);
__decorate([
    mutation()
], TransitionsService.prototype, "DELETE_TRANSITION", null);
__decorate([
    mutation()
], TransitionsService.prototype, "MAKE_DEFAULT", null);
__decorate([
    mutation()
], TransitionsService.prototype, "ADD_CONNECTION", null);
__decorate([
    mutation()
], TransitionsService.prototype, "UPDATE_CONNECTION", null);
__decorate([
    mutation()
], TransitionsService.prototype, "DELETE_CONNECTION", null);
__decorate([
    mutation()
], TransitionsService.prototype, "SET_STUDIO_MODE", null);
//# sourceMappingURL=transitions.js.map