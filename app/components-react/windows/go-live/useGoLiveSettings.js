var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { StreamInfoView } from '../../../services/streaming';
import { platformList } from '../../../services/platforms';
import { Services } from '../../service-provider';
import cloneDeep from 'lodash/cloneDeep';
import { message } from 'antd';
import { $t } from '../../../services/i18n';
import { injectState, useModule } from 'slap';
import { useForm } from '../../shared/inputs/Form';
import { getDefined } from '../../../util/properties-type-guards';
import isEqual from 'lodash/isEqual';
import partition from 'lodash/partition';
class GoLiveSettingsState extends StreamInfoView {
    constructor() {
        super(...arguments);
        this.state = Object.assign({ optimizedProfile: undefined, tweetText: '', isUpdateMode: false, needPrepopulate: true, prepopulateOptions: undefined }, this.savedSettings);
    }
    get settings() {
        return this.state;
    }
    updateSettings(patch) {
        var _a;
        if ((_a = patch.platforms) === null || _a === void 0 ? void 0 : _a.twitch) {
            Services.SettingsService.actions.setEnhancedBroadcasting(patch.platforms.twitch.isEnhancedBroadcasting);
        }
        const newSettings = Object.assign(Object.assign({}, this.state), patch);
        const platforms = this.getViewFromState(newSettings).applyCommonFields(newSettings.platforms);
        const customDestinations = newSettings === null || newSettings === void 0 ? void 0 : newSettings.customDestinations;
        Object.assign(this.state, Object.assign(Object.assign({}, newSettings), { platforms, customDestinations }));
    }
    updatePlatform(platform, patch) {
        const updated = {
            platforms: Object.assign(Object.assign({}, this.state.platforms), { [platform]: Object.assign(Object.assign({}, this.state.platforms[platform]), patch) }),
        };
        this.updateSettings(updated);
    }
    getCanDualStream(platform) {
        return Services.StreamingService.views.supports('dualStream', [platform]);
    }
    switchPlatforms(enabledPlatforms) {
        this.linkedPlatforms.forEach(platform => {
            this.updatePlatform(platform, { enabled: enabledPlatforms.includes(platform) });
        });
    }
    switchCustomDestination(destInd, enabled) {
        const customDestinations = cloneDeep(this.getView().customDestinations);
        customDestinations[destInd].enabled = enabled;
        this.updateSettings({ customDestinations });
    }
    updateCustomDestinationDisplay(destInd, display) {
        const customDestinations = cloneDeep(this.getView().customDestinations);
        customDestinations[destInd].display = display;
        this.updateSettings({ customDestinations });
    }
    toggleDestination(index, enabled) {
        setTimeout(() => this.switchCustomDestination(index, enabled), 500);
    }
    isEnabled(platform) {
        return this.enabledPlatforms.includes(platform);
    }
    switchAdvancedMode(enabled) {
        this.updateSettings({ advancedMode: enabled });
        if (!enabled)
            this.updateCommonFields(this.getView().commonFields);
    }
    toggleRecordingDisplay(display, radioBtn = false) {
        if (radioBtn) {
            this.updateSettings({ recording: [display] });
            return;
        }
        if (this.state.recording.includes(display)) {
            this.updateSettings({ recording: this.state.recording.filter(d => d !== display) });
        }
        else {
            this.updateSettings({ recording: [...this.state.recording, display] });
        }
    }
    toggleStreamShift(status) {
        this.updateSettings({ streamShift: status });
    }
    updateCommonFields(fields, shouldChangeAllPlatforms = false) {
        Object.keys(fields).forEach((fieldName) => {
            const view = this.getView();
            const value = fields[fieldName];
            const platforms = shouldChangeAllPlatforms
                ? view.platformsWithoutCustomFields
                : view.enabledPlatforms;
            platforms.forEach(platform => {
                if (!view.supports(fieldName, [platform]))
                    return;
                const platformSettings = getDefined(this.state.platforms[platform]);
                platformSettings[fieldName] = value;
            });
        });
    }
    get isLoading() {
        const state = this.state;
        return state.needPrepopulate || this.getViewFromState(state).isLoading || this.isUpdating;
    }
    getView() {
        return this;
    }
    getViewFromState(state) {
        return new StreamInfoView(state);
    }
}
export class GoLiveSettingsModule {
    constructor(form, isUpdateMode) {
        this.form = form;
        this.isUpdateMode = isUpdateMode;
        this.state = injectState(GoLiveSettingsState);
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const windowParams = Services.WindowsService.state.child.queryParams;
            if (windowParams && !isEqual(windowParams, {})) {
                getDefined(this.state.setPrepopulateOptions)(windowParams);
            }
            Services.TikTokService.actions.handleApplyPrompt();
            yield this.prepopulate();
        });
    }
    prepopulate() {
        return __awaiter(this, void 0, void 0, function* () {
            const { StreamingService, RestreamService, DualOutputService } = Services;
            const { isMultiplatformMode } = StreamingService.views;
            this.state.setNeedPrepopulate(true);
            yield StreamingService.actions.return.prepopulateInfo();
            yield new Promise(r => setTimeout(r, 100));
            const prepopulateOptions = this.state.prepopulateOptions;
            const view = new StreamInfoView({});
            const settings = Object.assign(Object.assign({}, view.savedSettings), { tweetText: view.getTweetText(view.commonFields.title), needPrepopulate: false });
            if (this.state.isUpdateMode && !view.isMidStreamMode) {
                Object.keys(settings.platforms).forEach((platform) => {
                    if (!isMultiplatformMode && this.state.isPrimaryPlatform(platform)) {
                        return;
                    }
                    delete settings.platforms[platform];
                });
            }
            if (prepopulateOptions) {
                Object.keys(prepopulateOptions).forEach(platform => {
                    Object.assign(settings.platforms[platform], prepopulateOptions[platform]);
                });
            }
            const { dualOutputMode } = DualOutputService.state;
            if (dualOutputMode && settings.streamShift) {
                settings.streamShift = false;
            }
            this.state.updateSettings(settings);
            const { canEnableRestream } = RestreamService.views;
            const enabledPlatforms = this.state.enabledPlatforms.filter(platform => !this.state.alwaysEnabledPlatforms.includes(platform));
            if (!dualOutputMode && !canEnableRestream && enabledPlatforms.length > 1) {
                const platform = enabledPlatforms.find(platform => platform === this.primaryChat) ||
                    enabledPlatforms[enabledPlatforms.length - 1];
                this.switchPlatforms([platform]);
            }
        });
    }
    get isPrime() {
        return Services.UserService.isPrime;
    }
    getSettings() {
        return this.state.settings;
    }
    save(settings) {
        Services.StreamSettingsService.actions.return.setGoLiveSettings(settings);
    }
    switchPlatforms(enabledPlatforms, skipPrepopulate) {
        this.state.linkedPlatforms.forEach(platform => {
            this.state.updatePlatform(platform, { enabled: enabledPlatforms.includes(platform) });
        });
        if (skipPrepopulate)
            return;
        if (this.state.enabledPlatforms.length === 1) {
            this.setPrimaryChat(this.state.enabledPlatforms[0]);
        }
        if (this.state.enabledPlatforms.length === 2 &&
            this.state.enabledPlatforms.includes('tiktok')) {
            const otherPlatform = this.state.enabledPlatforms.find(platform => platform !== 'tiktok');
            if (otherPlatform) {
                this.setPrimaryChat(otherPlatform);
            }
        }
        this.save(this.state.settings);
        this.prepopulate();
    }
    switchCustomDestination(destInd, enabled) {
        this.state.switchCustomDestination(destInd, enabled);
        this.save(this.state.settings);
    }
    updatePlatformDisplayAndSaveSettings(platform, display) {
        this.state.updatePlatform(platform, { display });
        this.save(this.state.settings);
    }
    updateCustomDestinationDisplayAndSaveSettings(destId, display) {
        this.state.updateCustomDestinationDisplay(destId, display);
        this.save(this.state.settings);
    }
    get enabledDestinations() {
        return this.state.customDestinations.reduce((enabled, dest, index) => {
            if (dest.enabled)
                enabled.push(index);
            return enabled;
        }, []);
    }
    get unlinkedPlatforms() {
        const platforms = platformList.filter(p => !this.state.linkedPlatforms.includes(p));
        const [alwaysShown, unlinked] = partition(platforms, p => this.state.alwaysShownPlatforms.includes(p));
        return [...alwaysShown, ...unlinked];
    }
    get primaryChat() {
        const primaryPlatform = Services.UserService.views.platform;
        if (!this.state.enabledPlatforms.includes(primaryPlatform.type)) {
            return this.state.enabledPlatforms[0];
        }
        return Services.UserService.views.platform.type;
    }
    setPrimaryChat(platform) {
        Services.UserService.actions.setPrimaryPlatform(platform);
    }
    setStreamShift(status) {
        this.state.toggleStreamShift(status);
        this.save(this.state.settings);
    }
    getCanStreamDualOutput() {
        return this.state.getCanStreamDualOutput(this.state);
    }
    getIsInvalidDualStream() {
        if (this.isPrime) {
            return false;
        }
        const willDualStream = this.state.enabledPlatforms.some((platform) => {
            var _a;
            return this.state.getCanDualStream(platform) &&
                ((_a = this.state.settings.platforms[platform]) === null || _a === void 0 ? void 0 : _a.display) === 'both';
        });
        const numTargets = this.state.enabledPlatforms.length + this.state.enabledCustomDestinationHosts.length;
        return this.state.isDualOutputMode && willDualStream && numTargets !== 1;
    }
    validate() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.state.isEnabled('tiktok') &&
                (Services.TikTokService.neverApplied || Services.TikTokService.denied)) {
                message.info($t("Couldn't confirm TikTok Live Access. Apply for Live Permissions below"), 2, () => true);
            }
            if (this.getIsInvalidDualStream()) {
                message.info($t('Upgrade to Ultra to allow more than two outputs'), 2, () => true);
                return;
            }
            try {
                yield getDefined(this.form).validateFields();
                return true;
            }
            catch (e) {
                message.error($t('Invalid settings. Please check the form'));
                return false;
            }
        });
    }
    goLive() {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield this.validate()) {
                Services.StreamingService.actions.goLive(this.state.settings);
            }
        });
    }
    updateStream() {
        return __awaiter(this, void 0, void 0, function* () {
            if ((yield this.validate()) &&
                (yield Services.StreamingService.actions.return.updateStreamSettings(this.state.settings))) {
                message.success($t('Successfully updated'));
            }
        });
    }
    get hasDestinations() {
        return this.state.enabledPlatforms.length > 0 || this.state.customDestinations.length > 0;
    }
    get hasMultiplePlatforms() {
        return this.state.enabledPlatforms.length > 1;
    }
    get isRestreamEnabled() {
        return Services.RestreamService.views.canEnableRestream;
    }
    get recommendedColorSpaceWarnings() {
        return Services.SettingsService.views.recommendedColorSpaceWarnings;
    }
}
export function useGoLiveSettings() {
    return useModule(GoLiveSettingsModule);
}
export function useGoLiveSettingsRoot(params) {
    const form = useForm();
    const useModuleResult = useModule(GoLiveSettingsModule, [form, !!(params === null || params === void 0 ? void 0 : params.isUpdateMode)]);
    return useModuleResult;
}
//# sourceMappingURL=useGoLiveSettings.js.map