var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { ETransitionType } from 'services/transitions';
import ModalLayout from 'components/ModalLayout.vue';
import TransitionSettings from 'components/TransitionSettings.vue';
import { $t } from 'services/i18n';
import Tabs from 'components/Tabs.vue';
import ConnectionSettings from 'components/ConnectionSettings';
import VModal from 'vue-js-modal';
import Scrollable from 'components/shared/Scrollable';
import * as remote from '@electron/remote';
Vue.use(VModal);
let SceneTransitions = class SceneTransitions extends Vue {
    constructor() {
        super(...arguments);
        this.inspectedTransition = '';
        this.inspectedConnection = '';
        this.tabs = [
            {
                name: 'Transitions',
                value: 'transitions',
            },
            {
                name: 'Connections',
                value: 'connections',
            },
        ];
        this.selectedTab = 'transitions';
        this.redundantConnectionTooltip = $t('This connection is redundant because another connection already connects these scenes.');
    }
    get transitionsEnabled() {
        return this.scenesService.views.scenes.length > 1;
    }
    isEditable(id) {
        if (!this.lockStates) {
            this.lockStates = this.transitionsService.getLockedStates();
        }
        return !this.lockStates[id];
    }
    getEditableMessage(id) {
        if (this.isEditable(id)) {
            return null;
        }
        return $t('This scene transition is managed by an App and cannot be edited.');
    }
    getClassNames(id) {
        return this.isEditable(id) ? 'icon-edit' : 'disabled icon-lock';
    }
    get transitions() {
        return this.transitionsService.state.transitions;
    }
    get defaultTransitionId() {
        return this.transitionsService.state.defaultTransitionId;
    }
    addTransition() {
        const transition = this.editorCommandsService.executeCommand('CreateTransitionCommand', ETransitionType.Cut, 'New Transition');
        this.editTransition(transition.id);
    }
    editTransition(id) {
        if (!this.isEditable(id)) {
            return;
        }
        this.inspectedTransition = id;
        this.$modal.show('transition-settings');
    }
    deleteTransition(id) {
        if (this.transitionsService.state.transitions.length === 1) {
            remote.dialog.showMessageBox({
                title: 'Streamlabs Desktop',
                message: $t('You need at least 1 transition.'),
            });
            return;
        }
        this.editorCommandsService.executeCommand('RemoveTransitionCommand', id);
    }
    makeDefault(id) {
        this.editorCommandsService.executeCommand('SetDefaultTransitionCommand', id);
    }
    get connections() {
        return this.transitionsService.state.connections;
    }
    addConnection() {
        const connection = this.editorCommandsService.executeCommand('CreateConnectionCommand', this.scenesService.views.scenes[0].id, this.scenesService.views.scenes[1].id, this.transitions[0].id);
        this.editConnection(connection.id);
    }
    editConnection(id) {
        this.inspectedConnection = id;
        this.$modal.show('connection-settings');
    }
    deleteConnection(id) {
        this.editorCommandsService.executeCommand('RemoveConnectionCommand', id);
    }
    getTransitionName(id) {
        const transition = this.transitionsService.getTransition(id);
        if (transition)
            return transition.name;
        return `<${$t('Deleted')}>`;
    }
    getSceneName(id) {
        if (id === 'ALL')
            return $t('All');
        const scene = this.scenesService.views.getScene(id);
        if (scene)
            return scene.name;
        return `<${$t('Deleted')}>`;
    }
    isConnectionRedundant(id) {
        return this.transitionsService.views.isConnectionRedundant(id);
    }
    nameForType(type) {
        return this.transitionsService.views.getTypes().find(t => t.value === type).title;
    }
    done() {
        this.windowsService.closeChildWindow();
    }
    dismissModal(modal) {
        this.$modal.hide(modal);
    }
};
__decorate([
    Inject()
], SceneTransitions.prototype, "transitionsService", void 0);
__decorate([
    Inject()
], SceneTransitions.prototype, "windowsService", void 0);
__decorate([
    Inject()
], SceneTransitions.prototype, "scenesService", void 0);
__decorate([
    Inject()
], SceneTransitions.prototype, "editorCommandsService", void 0);
SceneTransitions = __decorate([
    Component({
        components: {
            ModalLayout,
            TransitionSettings,
            Tabs,
            ConnectionSettings,
            Scrollable,
        },
    })
], SceneTransitions);
export default SceneTransitions;
//# sourceMappingURL=SceneTransitions.vue.js.map