var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { GenericGoalService } from './generic-goal';
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { WidgetDefinitions, WidgetType } from 'services/widgets';
import { InheritMutations } from 'services/core/stateful-service';
let DonationGoalService = class DonationGoalService extends GenericGoalService {
    getApiSettings() {
        return {
            type: WidgetType.DonationGoal,
            url: WidgetDefinitions[WidgetType.DonationGoal].url(this.getHost(), this.getWidgetToken()),
            previewUrl: `https://${this.getHost()}/widgets/donation-goal?token=${this.getWidgetToken()}`,
            dataFetchUrl: `https://${this.getHost()}/api/v5/slobs/widget/donationgoal/settings/new`,
            settingsSaveUrl: `https://${this.getHost()}/api/v5/slobs/widget/donationgoal/settings/new`,
            goalUrl: `https://${this.getHost()}/api/v5/slobs/widget/donationgoal/new`,
            settingsUpdateEvent: 'donationGoalSettingsUpdate',
            goalCreateEvent: 'donationGoalStart',
            goalResetEvent: 'donationGoalEnd',
            hasTestButtons: true,
            customCodeAllowed: true,
            customFieldsAllowed: true,
        };
    }
};
DonationGoalService.initialState = WIDGET_INITIAL_STATE;
DonationGoalService = __decorate([
    InheritMutations()
], DonationGoalService);
export { DonationGoalService };
//# sourceMappingURL=donation-goal.js.map