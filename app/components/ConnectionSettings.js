var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import TsxComponent, { createProps } from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { $t } from 'services/i18n';
import { metadata } from './shared/inputs';
class SceneTransitionProps {
    constructor() {
        this.connectionId = '';
    }
}
let SceneTransitions = class SceneTransitions extends TsxComponent {
    get fromSceneModel() {
        return this.connection.fromSceneId;
    }
    setFromSceneModel(value) {
        this.editorCommandsService.executeCommand('EditConnectionCommand', this.props.connectionId, {
            fromSceneId: value,
        });
    }
    get toSceneModel() {
        return this.connection.toSceneId;
    }
    setToSceneModel(value) {
        this.editorCommandsService.executeCommand('EditConnectionCommand', this.props.connectionId, {
            toSceneId: value,
        });
    }
    get transitionModel() {
        return this.connection.transitionId;
    }
    setTransitionModel(value) {
        this.editorCommandsService.executeCommand('EditConnectionCommand', this.props.connectionId, {
            transitionId: value,
        });
    }
    get connection() {
        return this.transitionsService.state.connections.find(conn => conn.id === this.props.connectionId);
    }
    get sceneOptions() {
        return [
            { title: $t('All'), value: 'ALL' },
            ...this.scenesService.views.scenes.map(scene => ({
                title: scene.name,
                value: scene.id,
            })),
        ];
    }
    get transitionOptions() {
        return this.transitionsService.state.transitions.map(transition => ({
            title: transition.name,
            value: transition.id,
        }));
    }
    render() {
        return (React.createElement("div", null,
            React.createElement(VFormGroup, { value: this.fromSceneModel, onInput: this.setFromSceneModel, metadata: metadata.list({
                    title: $t('Beginning Scene'),
                    name: 'from',
                    options: this.sceneOptions,
                }) }),
            React.createElement(VFormGroup, { value: this.transitionModel, onInput: this.setTransitionModel, metadata: metadata.list({
                    title: $t('Scene Transition'),
                    name: 'transition',
                    options: this.transitionOptions,
                }) }),
            React.createElement(VFormGroup, { value: this.toSceneModel, onInput: this.setToSceneModel, metadata: metadata.list({
                    title: $t('Ending Scene'),
                    name: 'to',
                    options: this.sceneOptions,
                }) })));
    }
};
__decorate([
    Inject()
], SceneTransitions.prototype, "transitionsService", void 0);
__decorate([
    Inject()
], SceneTransitions.prototype, "scenesService", void 0);
__decorate([
    Inject()
], SceneTransitions.prototype, "editorCommandsService", void 0);
SceneTransitions = __decorate([
    Component({ props: createProps(SceneTransitionProps) })
], SceneTransitions);
export default SceneTransitions;
//# sourceMappingURL=ConnectionSettings.js.map