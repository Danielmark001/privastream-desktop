var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { GenericGoalService } from './generic-goal';
import { WidgetDefinitions, WidgetType } from 'services/widgets';
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { InheritMutations } from 'services/core/stateful-service';
let SuperchatGoalService = class SuperchatGoalService extends GenericGoalService {
    getApiSettings() {
        return {
            type: WidgetType.SuperchatGoal,
            url: WidgetDefinitions[WidgetType.SuperchatGoal].url(this.getHost(), this.getWidgetToken()),
            previewUrl: `https://${this.getHost()}/widgets/super-chat-goal?token=${this.getWidgetToken()}`,
            dataFetchUrl: `https://${this.getHost()}/api/v5/slobs/widget/superchatgoal/settings`,
            settingsSaveUrl: `https://${this.getHost()}/api/v5/slobs/widget/superchatgoal/settings`,
            goalUrl: `https://${this.getHost()}/api/v5/slobs/widget/superchatgoal`,
            settingsUpdateEvent: 'superChatGoalSettingsUpdate',
            goalCreateEvent: 'superChatGoalStart',
            goalResetEvent: 'superChatGoalEnd',
            hasTestButtons: true,
            customCodeAllowed: true,
            customFieldsAllowed: true,
        };
    }
};
SuperchatGoalService.initialState = WIDGET_INITIAL_STATE;
SuperchatGoalService = __decorate([
    InheritMutations()
], SuperchatGoalService);
export { SuperchatGoalService };
//# sourceMappingURL=superchat-goal.js.map