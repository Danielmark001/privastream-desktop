var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Component } from 'vue-property-decorator';
import { inputComponents } from 'components/widgets/inputs';
import WidgetEditor from 'components/windows/WidgetEditor.vue';
import WidgetSettings from 'components/widgets/WidgetSettings.vue';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { $t } from 'services/i18n';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
let GenericGoal = class GenericGoal extends WidgetSettings {
    constructor() {
        super(...arguments);
        this.goalCreateOptions = {
            title: '',
            goal_amount: 100,
            manual_goal_amount: 0,
            ends_at: '',
        };
    }
    get navItems() {
        const baseNavItems = [
            { value: 'visual', label: $t('Visual Settings') },
            { value: 'source', label: $t('Source') },
        ];
        return this.isCharity
            ? baseNavItems
            : [{ value: 'goal', label: $t('Goal') }].concat(baseNavItems);
    }
    get hasGoal() {
        return this.loaded && this.wData.goal;
    }
    get isCharity() {
        return this.props.goalType === 'charity';
    }
    saveGoal() {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield this.$refs.form.validateAndGetErrorsCount())
                return;
            this.requestState = 'pending';
            try {
                yield this.service.saveGoal(this.goalCreateOptions);
                this.requestState = 'success';
            }
            catch (e) {
                this.failHandler(e['message']);
                this.requestState = 'fail';
            }
        });
    }
    resetGoal() {
        this.service.resetGoal();
    }
};
GenericGoal = __decorate([
    Component({
        components: Object.assign({ WidgetEditor,
            VFormGroup,
            ValidatedForm }, inputComponents),
    })
], GenericGoal);
export default GenericGoal;
//# sourceMappingURL=GenericGoal.vue.js.map