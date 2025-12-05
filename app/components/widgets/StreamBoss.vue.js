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
import WidgetEditor from 'components/windows/WidgetEditor.vue';
import WidgetSettings from 'components/widgets/WidgetSettings.vue';
import { inputComponents } from 'components/widgets/inputs';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { $t } from 'services/i18n/index';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
let StreamBoss = class StreamBoss extends WidgetSettings {
    constructor() {
        super(...arguments);
        this.bossCreateOptions = {
            mode: 'fixed',
            total_health: 4800,
        };
        this.textColorTooltip = $t('A hex code for the base text color.');
    }
    get hasGoal() {
        return this.loaded && this.wData.goal;
    }
    get multipliersForPlatform() {
        const baseEvents = [
            { key: 'donation_multiplier', title: $t('Damage Per Dollar Donation'), isInteger: true },
        ];
        return this.service.multipliersByPlatform().concat(baseEvents);
    }
    saveGoal() {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield this.$refs.form.validateAndGetErrorsCount())
                return;
            yield this.service.saveGoal(this.bossCreateOptions);
        });
    }
    get navItems() {
        return [
            { value: 'goal', label: $t('Goal') },
            { value: 'manage-battle', label: $t('Manage Battle') },
            { value: 'visual', label: $t('Visual Settings') },
            { value: 'source', label: $t('Source') },
        ];
    }
    resetGoal() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.service.resetGoal();
        });
    }
};
StreamBoss = __decorate([
    Component({
        components: Object.assign({ WidgetEditor,
            VFormGroup,
            ValidatedForm }, inputComponents),
    })
], StreamBoss);
export default StreamBoss;
//# sourceMappingURL=StreamBoss.vue.js.map