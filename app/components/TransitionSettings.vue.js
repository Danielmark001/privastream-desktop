var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { TRANSITION_DURATION_MAX } from 'services/transitions';
import * as inputComponents from 'components/obs/inputs';
import GenericForm from 'components/obs/inputs/GenericForm';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { debounce } from 'lodash-decorators';
import isEqual from 'lodash/isEqual';
let SceneTransitions = class SceneTransitions extends Vue {
    constructor() {
        super(...arguments);
        this.properties = this.transitionsService.getPropertiesFormData(this.transitionId);
    }
    mounted() {
        this.propertiesChanged = this.transitionsService.transitionPropertiesChanged.subscribe(id => {
            if (id === this.transitionId) {
                this.properties = this.transitionsService.getPropertiesFormData(this.transitionId);
            }
        });
    }
    get typeModel() {
        return this.transitionsService.state.transitions.find(tran => tran.id === this.transitionId)
            .type;
    }
    set typeModel(value) {
        this.editorCommandsService.executeCommand('EditTransitionCommand', this.transitionId, {
            type: value,
        });
    }
    get typeOptions() {
        return this.transitionsService.views.getTypes();
    }
    get durationModel() {
        return this.transitionsService.state.transitions.find(tran => tran.id === this.transitionId)
            .duration;
    }
    set durationModel(value) {
        this.editorCommandsService.executeCommand('EditTransitionCommand', this.transitionId, {
            duration: Math.min(value, TRANSITION_DURATION_MAX),
        });
    }
    get nameModel() {
        return this.transitionsService.state.transitions.find(tran => tran.id === this.transitionId)
            .name;
    }
    set nameModel(name) {
        this.editorCommandsService.executeCommand('EditTransitionCommand', this.transitionId, { name });
    }
    get transition() {
        return this.transitionsService.getTransition(this.transitionId);
    }
    saveProperties(props) {
        if (isEqual(this.properties, props))
            return;
        this.properties = props;
        this.debouncedSaveProperties(props);
    }
    debouncedSaveProperties(props) {
        this.editorCommandsService.executeCommand('EditTransitionCommand', this.transitionId, {
            formData: props,
        });
    }
};
__decorate([
    Inject()
], SceneTransitions.prototype, "transitionsService", void 0);
__decorate([
    Inject()
], SceneTransitions.prototype, "editorCommandsService", void 0);
__decorate([
    Prop()
], SceneTransitions.prototype, "transitionId", void 0);
__decorate([
    debounce(500)
], SceneTransitions.prototype, "durationModel", null);
__decorate([
    debounce(500)
], SceneTransitions.prototype, "nameModel", null);
__decorate([
    debounce(500)
], SceneTransitions.prototype, "debouncedSaveProperties", null);
SceneTransitions = __decorate([
    Component({
        components: Object.assign({ GenericForm,
            HFormGroup }, inputComponents),
    })
], SceneTransitions);
export default SceneTransitions;
//# sourceMappingURL=TransitionSettings.vue.js.map