var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Inject } from 'services/core/injector';
import { authorizedHeaders, jfetch } from 'util/requests';
import { mutation, StatefulService, ViewHandler } from 'services/core/stateful-service';
import Utils from 'services/utils';
import { InitAfter } from './core';
export var EAvailableFeatures;
(function (EAvailableFeatures) {
    EAvailableFeatures["platform"] = "slobs--platform";
    EAvailableFeatures["creatorSites"] = "slobs--creator-sites";
    EAvailableFeatures["facebookOnboarding"] = "slobs--facebook-onboarding";
    EAvailableFeatures["twitter"] = "slobs--twitter";
    EAvailableFeatures["restream"] = "slobs--restream";
    EAvailableFeatures["tiktok"] = "slobs--tiktok";
    EAvailableFeatures["highlighter"] = "slobs--highlighter";
    EAvailableFeatures["aiHighlighter"] = "slobs--ai-highlighter";
    EAvailableFeatures["growTab"] = "slobs--grow-tab";
    EAvailableFeatures["themeAudit"] = "slobs--theme-audit";
    EAvailableFeatures["reactWidgets"] = "slobs--react-widgets";
    EAvailableFeatures["sharedStorage"] = "slobs--shared-storage";
    EAvailableFeatures["dualOutputRecording"] = "slobs--dual-output-recording";
    EAvailableFeatures["streamShift"] = "slobs--stream-shift";
    EAvailableFeatures["guestCamBeta"] = "slobs--guest-join";
    EAvailableFeatures["guestCamProduction"] = "slobs--guest-join-prod";
    EAvailableFeatures["newChatBox"] = "core--widgets-v2--chat-box";
})(EAvailableFeatures || (EAvailableFeatures = {}));
let IncrementalRolloutService = class IncrementalRolloutService extends StatefulService {
    init() {
        this.featuresReady = new Promise(resolve => {
            this.featuresReadyResolve = resolve;
        });
        this.setCommandLineFeatures();
        this.userService.userLogin.subscribe(() => this.fetchAvailableFeatures());
        this.userService.userLogout.subscribe(() => this.resetAvailableFeatures());
    }
    get views() {
        return new IncrementalRolloutView(this.state);
    }
    SET_AVAILABLE_FEATURES(features) {
        this.state.availableFeatures = features;
    }
    fetchAvailableFeatures() {
        if (this.userService.isLoggedIn) {
            const host = this.hostsService.streamlabs;
            const url = `https://${host}/api/v5/slobs/available-features`;
            const headers = authorizedHeaders(this.userService.apiToken);
            const request = new Request(url, { headers });
            return jfetch(request).then(response => {
                this.SET_AVAILABLE_FEATURES([...this.state.availableFeatures, ...response.features]);
                this.featuresReadyResolve();
            });
        }
    }
    setCommandLineFeatures() {
        this.appService.state.argv.forEach(arg => {
            const match = arg.match(/^\-\-feature-enable\-([a-zA-Z\-]*)$/);
            if (match) {
                this.SET_AVAILABLE_FEATURES([...this.state.availableFeatures, match[1]]);
            }
        });
    }
    resetAvailableFeatures() {
        this.SET_AVAILABLE_FEATURES([]);
        this.setCommandLineFeatures();
    }
};
IncrementalRolloutService.initialState = {
    availableFeatures: [],
};
__decorate([
    Inject()
], IncrementalRolloutService.prototype, "userService", void 0);
__decorate([
    Inject()
], IncrementalRolloutService.prototype, "hostsService", void 0);
__decorate([
    Inject()
], IncrementalRolloutService.prototype, "appService", void 0);
__decorate([
    mutation()
], IncrementalRolloutService.prototype, "SET_AVAILABLE_FEATURES", null);
IncrementalRolloutService = __decorate([
    InitAfter('UserService')
], IncrementalRolloutService);
export { IncrementalRolloutService };
class IncrementalRolloutView extends ViewHandler {
    get availableFeatures() {
        return this.state.availableFeatures || [];
    }
    featureIsEnabled(feature) {
        if (Utils.isDevMode())
            return true;
        return this.availableFeatures.indexOf(feature) > -1;
    }
}
//# sourceMappingURL=incremental-rollout.js.map