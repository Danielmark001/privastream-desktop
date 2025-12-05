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
import { getDefined } from 'util/properties-type-guards';
import { EPlatformCallResult, } from '.';
import { BasePlatformService } from './base-platform';
import { InheritMutations } from 'services/core';
let InstagramService = class InstagramService extends BasePlatformService {
    constructor() {
        super(...arguments);
        this.apiBase = '';
        this.platform = 'instagram';
        this.displayName = 'Instagram';
        this.capabilities = new Set(['resolutionPreset', 'title']);
        this.liveDockFeatures = new Set();
        this.authWindowOptions = {};
        this.authUrl = '';
    }
    fetchNewToken() {
        return Promise.resolve();
    }
    init() {
        this.syncSettingsWithLocalStorage();
        this.state.settings.streamKey = '';
    }
    beforeGoLive(goLiveSettings, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const settings = getDefined(goLiveSettings.platforms.instagram);
            if (goLiveSettings.streamShift && this.streamingService.views.shouldSwitchStreams) {
                this.setPlatformContext('instagram');
                return;
            }
            if (!this.streamingService.views.isMultiplatformMode) {
                this.streamSettingsService.setSettings({
                    streamType: 'rtmp_custom',
                    key: settings.streamKey,
                    server: settings.streamUrl,
                }, context);
            }
            this.SET_STREAM_KEY(settings.streamKey);
            this.UPDATE_STREAM_SETTINGS(settings);
            this.setPlatformContext('instagram');
        });
    }
    prepopulateInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            this.SET_PREPOPULATED(true);
        });
    }
    validatePlatform() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.state.settings.streamKey.length || !this.state.settings.streamUrl.length) {
                return EPlatformCallResult.Error;
            }
            return EPlatformCallResult.Success;
        });
    }
    putChannelInfo() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    get chatUrl() {
        return '';
    }
    get liveDockEnabled() {
        return this.streamingService.views.isMultiplatformMode;
    }
    afterStopStream() {
        this.SET_STREAM_SETTINGS(Object.assign(Object.assign({}, this.state.settings), { streamKey: '' }));
        return Promise.resolve();
    }
    unlink() {
        this.userService.UNLINK_PLATFORM('instagram');
    }
    updateSettings(settings) {
        this.UPDATE_STREAM_SETTINGS(settings);
    }
};
InstagramService.initialState = Object.assign(Object.assign({}, BasePlatformService.initialState), { settings: { title: '', streamUrl: '', streamKey: '' } });
InstagramService = __decorate([
    InheritMutations()
], InstagramService);
export { InstagramService };
//# sourceMappingURL=instagram.js.map