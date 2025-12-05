var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { DefaultManager } from './default-manager';
import { Inject } from 'services/core/injector';
import { byOS, OS } from 'util/operating-systems';
export class StreamlabelsManager extends DefaultManager {
    constructor() {
        super(...arguments);
        this.oldOutput = null;
        this.customUIComponent = 'StreamlabelProperties';
    }
    init() {
        super.init();
        this.subscription = this.streamlabelsService.output.subscribe(output => {
            if (output[this.settings.statname] !== this.oldOutput) {
                this.oldOutput = output[this.settings.statname];
                this.obsSource.update(Object.assign(Object.assign({}, this.obsSource.settings), { text: this.normalizeText(output[this.settings.statname]), read_from_file: false }));
            }
        });
    }
    get denylist() {
        return byOS({
            [OS.Windows]: ['read_from_file', 'text'],
            [OS.Mac]: ['from_file', 'text', 'text_file', 'log_mode', 'log_lines'],
        });
    }
    destroy() {
        if (this.subscription)
            this.subscription.unsubscribe();
    }
    normalizeSettings(settings) {
        const youtubeKeys = {
            most_recent_follower: 'most_recent_youtube_subscriber',
            session_followers: 'session_youtube_subscribers',
            session_follower_count: 'session_youtube_subscriber_count',
            session_most_recent_follower: 'session_most_recent_youtube_subscriber',
            total_subscriber_count: 'total_youtube_sponsor_count',
            most_recent_subscriber: 'most_recent_youtube_sponsor',
            session_subscribers: 'session_youtube_sponsors',
            session_subscriber_count: 'session_youtube_sponsor_count',
            session_most_recent_subscriber: 'session_most_recent_youtube_sponsor',
        };
        if (this.userService.platform) {
            if (this.userService.platform.type === 'youtube') {
                if (youtubeKeys[settings.statname]) {
                    settings.statname = youtubeKeys[settings.statname];
                }
            }
        }
    }
    normalizeText(text) {
        return text === null || text === void 0 ? void 0 : text.replace('\\n', '\n');
    }
    applySettings(settings) {
        if (settings.statname !== this.settings.statname) {
            this.obsSource.update({
                text: this.normalizeText(this.streamlabelsService.output.getValue()[settings.statname]),
            });
        }
        const newSettings = Object.assign(Object.assign({ statname: 'all_time_top_donator' }, this.settings), settings);
        this.normalizeSettings(newSettings);
        super.applySettings(newSettings);
    }
}
__decorate([
    Inject()
], StreamlabelsManager.prototype, "streamlabelsService", void 0);
__decorate([
    Inject()
], StreamlabelsManager.prototype, "userService", void 0);
//# sourceMappingURL=streamlabels-manager.js.map