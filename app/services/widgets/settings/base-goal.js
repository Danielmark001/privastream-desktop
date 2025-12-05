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
import { WidgetSettingsService } from 'services/widgets';
import { InheritMutations } from 'services/core/stateful-service';
let BaseGoalService = class BaseGoalService extends WidgetSettingsService {
    subToWebsocket() {
        super.subToWebsocket();
        this.websocketService.socketEvent.subscribe(event => {
            const apiSettings = this.getApiSettings();
            if (event.type === apiSettings.goalCreateEvent || event.type === apiSettings.goalResetEvent) {
                this.refreshData();
            }
        });
    }
    patchAfterFetch(data) {
        if (Array.isArray(data.goal))
            data.goal = null;
        return data;
    }
    saveGoal(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const apiSettings = this.getApiSettings();
            return yield this.request({
                url: apiSettings.goalUrl,
                method: 'POST',
                body: options,
            });
        });
    }
    resetGoal() {
        return __awaiter(this, void 0, void 0, function* () {
            const apiSettings = this.getApiSettings();
            return yield this.request({
                url: apiSettings.goalUrl,
                method: 'DELETE',
            });
        });
    }
};
BaseGoalService = __decorate([
    InheritMutations()
], BaseGoalService);
export { BaseGoalService };
//# sourceMappingURL=base-goal.js.map