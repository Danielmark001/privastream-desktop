var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { PersistentStatefulService } from 'services/core/persistent-stateful-service';
import { mutation, ViewHandler } from './core/stateful-service';
import Vue from 'vue';
import { Inject } from 'services/core';
export var EDismissable;
(function (EDismissable) {
    EDismissable["SceneCollectionsHelpTip"] = "scene_collections_help_tip";
    EDismissable["RecentEventsHelpTip"] = "recent_events_help_tip";
    EDismissable["FacebookNeedPermissionsTip"] = "facebook_need_permissions_tip";
    EDismissable["HighlighterNotification"] = "highlighter_notification";
    EDismissable["GuestCamFirstTimeModal"] = "guest_cam_first_time";
    EDismissable["SourceSelectorFolders"] = "source_selector_folders";
    EDismissable["CollabCamRollout"] = "collab_cam_rollout";
    EDismissable["NewSideNav"] = "new_side_nav";
    EDismissable["CustomMenuSettings"] = "custom_menu_settings";
    EDismissable["LoginPrompt"] = "login_prompt";
    EDismissable["TikTokRejected"] = "tiktok_rejected";
    EDismissable["TikTokEligible"] = "tiktok_eligible";
    EDismissable["TikTokReapply"] = "tiktok_reapply";
    EDismissable["EnhancedBroadcasting"] = "enhanced_broadcasting";
})(EDismissable || (EDismissable = {}));
class DismissablesViews extends ViewHandler {
    shouldShow(key) {
        return !this.state[key];
    }
}
export class DismissablesService extends PersistentStatefulService {
    initialize() {
        Object.values(EDismissable).forEach(key => {
            if (key === EDismissable.RecentEventsHelpTip && !this.state[key]) {
                if (this.appService.state.onboarded) {
                    this.dismiss(key);
                }
            }
        });
    }
    get views() {
        return new DismissablesViews(this.state);
    }
    dismiss(key) {
        this.DISMISS(key);
    }
    dismissAll() {
        Object.keys(EDismissable).forEach((key) => this.dismiss(EDismissable[key]));
    }
    reset() {
        this.RESET();
    }
    DISMISS(key) {
        Vue.set(this.state, key, true);
    }
    RESET() {
        this.state = {};
    }
}
__decorate([
    Inject()
], DismissablesService.prototype, "appService", void 0);
__decorate([
    mutation()
], DismissablesService.prototype, "DISMISS", null);
__decorate([
    mutation()
], DismissablesService.prototype, "RESET", null);
//# sourceMappingURL=dismissables.js.map