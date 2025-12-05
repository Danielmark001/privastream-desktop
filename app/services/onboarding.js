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
import * as remote from '@electron/remote';
import { Subject } from 'rxjs';
import { StatefulService, mutation } from 'services/core/stateful-service';
import { UserService } from 'services/user';
import { Inject, ViewHandler } from 'services/core/';
import { OS } from 'util/operating-systems';
import { $t } from './i18n';
import { jfetch } from 'util/requests';
import { getPlatformService } from './platforms';
import { ObsImporterService } from './obs-importer';
import Utils from './utils';
import { RecordingModeService } from './recording-mode';
import { THEME_METADATA } from './onboarding/theme-metadata';
import { TwitchStudioImporterService } from './ts-importer';
export var EOnboardingSteps;
(function (EOnboardingSteps) {
    EOnboardingSteps["MacPermissions"] = "MacPermissions";
    EOnboardingSteps["StreamingOrRecording"] = "StreamingOrRecording";
    EOnboardingSteps["Connect"] = "Connect";
    EOnboardingSteps["PrimaryPlatformSelect"] = "PrimaryPlatformSelect";
    EOnboardingSteps["FreshOrImport"] = "FreshOrImport";
    EOnboardingSteps["ObsImport"] = "ObsImport";
    EOnboardingSteps["HardwareSetup"] = "HardwareSetup";
    EOnboardingSteps["ThemeSelector"] = "ThemeSelector";
    EOnboardingSteps["Prime"] = "Prime";
})(EOnboardingSteps || (EOnboardingSteps = {}));
const isMac = () => process.platform === OS.Mac;
export const ONBOARDING_STEPS = () => ({
    [EOnboardingSteps.MacPermissions]: {
        component: 'MacPermissions',
        hideButton: true,
        isPreboarding: true,
        cond: isMac,
        isSkippable: true,
    },
    [EOnboardingSteps.StreamingOrRecording]: {
        component: 'StreamingOrRecording',
        hideButton: true,
        isPreboarding: true,
        isSkippable: false,
    },
    [EOnboardingSteps.Connect]: {
        component: 'Connect',
        isSkippable: true,
        hideButton: true,
        isPreboarding: true,
    },
    [EOnboardingSteps.PrimaryPlatformSelect]: {
        component: 'PrimaryPlatformSelect',
        hideButton: true,
        isPreboarding: true,
        cond: ({ isPartialSLAuth }) => isPartialSLAuth,
    },
    [EOnboardingSteps.FreshOrImport]: {
        component: 'FreshOrImport',
        hideButton: true,
        isPreboarding: true,
        cond: ({ isObsInstalled, isTwitchStudioInstalled, recordingModeEnabled, }) => (isObsInstalled || isTwitchStudioInstalled) && !recordingModeEnabled,
    },
    [EOnboardingSteps.ObsImport]: {
        component: 'ObsImport',
        hideButton: true,
        label: $t('Import'),
        cond: ({ importedFrom, isObsInstalled, isTwitchStudioInstalled }) => importedFrom && (isObsInstalled || isTwitchStudioInstalled),
    },
    [EOnboardingSteps.HardwareSetup]: {
        component: 'HardwareSetup',
        label: $t('Set Up Mic and Webcam'),
        cond: ({ importedFrom }) => !importedFrom,
        isSkippable: true,
    },
    [EOnboardingSteps.ThemeSelector]: {
        component: 'ThemeSelector',
        hideButton: true,
        label: $t('Add a Theme'),
        cond: ({ isLoggedIn, existingSceneCollections, importedFrom, recordingModeEnabled, platformSupportsThemes, }) => !existingSceneCollections &&
            !importedFrom &&
            !recordingModeEnabled &&
            ((isLoggedIn && platformSupportsThemes) || !isLoggedIn),
        isSkippable: true,
    },
    [EOnboardingSteps.Prime]: {
        component: 'Prime',
        hideButton: true,
        label: $t('Ultra'),
        cond: ({ isUltra }) => !isUltra,
        isSkippable: true,
    },
});
class OnboardingViews extends ViewHandler {
    get singletonStep() {
        if (this.state.options.isLogin) {
            if (this.getServiceViews(UserService).isPartialSLAuth) {
                return ONBOARDING_STEPS()[EOnboardingSteps.PrimaryPlatformSelect];
            }
            return ONBOARDING_STEPS()[EOnboardingSteps.Connect];
        }
        if (this.state.options.isHardware)
            return ONBOARDING_STEPS()[EOnboardingSteps.HardwareSetup];
        if (this.state.options.isImport)
            return ONBOARDING_STEPS()[EOnboardingSteps.ObsImport];
    }
    get steps() {
        var _a, _b;
        const userViews = this.getServiceViews(UserService);
        const isOBSinstalled = this.getServiceViews(ObsImporterService).isOBSinstalled();
        const isTwitchStudioInstalled = this.getServiceViews(TwitchStudioImporterService).isTwitchStudioInstalled();
        const recordingModeEnabled = this.getServiceViews(RecordingModeService).isRecordingModeEnabled;
        const { existingSceneCollections, importedFrom } = this.state;
        const { isLoggedIn, isPrime: isUltra } = userViews;
        const ctx = {
            recordingModeEnabled,
            existingSceneCollections,
            importedFrom,
            isTwitchStudioInstalled,
            isLoggedIn,
            isUltra,
            isObsInstalled: isOBSinstalled,
            isPartialSLAuth: userViews.auth && userViews.isPartialSLAuth,
            platformSupportsThemes: isLoggedIn && ((_b = getPlatformService((_a = userViews.platform) === null || _a === void 0 ? void 0 : _a.type)) === null || _b === void 0 ? void 0 : _b.hasCapability('themes')),
        };
        return this.makeSteps(ctx);
    }
    get totalSteps() {
        return this.steps.length;
    }
    makeSteps(ctx) {
        const { getSteps } = this;
        return getSteps([
            EOnboardingSteps.MacPermissions,
            EOnboardingSteps.StreamingOrRecording,
            EOnboardingSteps.Connect,
            EOnboardingSteps.PrimaryPlatformSelect,
            EOnboardingSteps.FreshOrImport,
            EOnboardingSteps.ObsImport,
            EOnboardingSteps.HardwareSetup,
            EOnboardingSteps.ThemeSelector,
            EOnboardingSteps.Prime,
        ])(ctx);
    }
    getSteps(stepNames) {
        return (ctx) => {
            const steps = stepNames.map(step => ONBOARDING_STEPS()[step]);
            return steps.reduce((acc, step) => {
                if (!step.cond || (step.cond && step.cond(ctx))) {
                    const isSkippable = typeof step.isSkippable === 'function' ? step.isSkippable(ctx) : step.isSkippable;
                    acc.push(Object.assign(Object.assign({}, step), { isSkippable }));
                }
                return acc;
            }, []);
        };
    }
}
export class OnboardingService extends StatefulService {
    constructor() {
        super(...arguments);
        this.localStorageKey = 'UserHasBeenOnboarded';
        this.onboardingCompleted = new Subject();
    }
    SET_OPTIONS(options) {
        Object.assign(this.state.options, options);
    }
    SET_OBS_IMPORTED(val) {
        this.state.importedFrom = val;
    }
    SET_EXISTING_COLLECTIONS(val) {
        this.state.existingSceneCollections = val;
    }
    fetchThemeData(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `https://overlays.streamlabs.com/api/overlay/${id}`;
            return jfetch(url);
        });
    }
    fetchThemes() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Promise.all(Object.keys(this.themeMetadata).map(id => this.fetchThemeData(id)));
        });
    }
    get themeMetadata() {
        return this.userService.views.isPrime ? THEME_METADATA.PAID : THEME_METADATA.FREE;
    }
    themeUrl(id) {
        return this.themeMetadata[id];
    }
    get views() {
        return new OnboardingViews(this.state);
    }
    get options() {
        return this.state.options;
    }
    get existingSceneCollections() {
        return !(this.sceneCollectionsService.loadableCollections.length === 1 &&
            this.sceneCollectionsService.loadableCollections[0].auto);
    }
    get shouldAddDefaultSources() {
        var _a;
        if (!this.existingSceneCollections)
            return true;
        if (Utils.isTestMode())
            return false;
        const creationDate = (_a = this.userService.state) === null || _a === void 0 ? void 0 : _a.createdAt;
        if (!creationDate && !this.existingSceneCollections) {
            return true;
        }
        const now = new Date().getTime();
        const creationTime = new Date(creationDate).getTime();
        const millisecondsInAnHour = 1000 * 60 * 60;
        const isWithinCreationDateRange = creationTime < now && creationTime - now < millisecondsInAnHour * 6;
        return isWithinCreationDateRange && !this.existingSceneCollections;
    }
    init() {
        this.setExistingCollections();
    }
    setImport(val) {
        this.SET_OBS_IMPORTED(val);
    }
    setExistingCollections() {
        this.SET_EXISTING_COLLECTIONS(this.existingSceneCollections);
    }
    start(options = {}) {
        const actualOptions = Object.assign({ isLogin: false, isOptimize: false, isHardware: false, isImport: false }, options);
        this.SET_OPTIONS(actualOptions);
        this.navigationService.navigate('Onboarding');
    }
    finish() {
        var _a;
        localStorage.setItem(this.localStorageKey, 'true');
        remote.session.defaultSession.flushStorageData();
        console.log('Set onboarding key successful.');
        const platformService = getPlatformService((_a = this.userService.views.platform) === null || _a === void 0 ? void 0 : _a.type);
        if (platformService && platformService.hasCapability('resolutionPreset')) {
            const { inputResolution, outputResolution } = platformService;
            this.outputSettingsService.setSettings({
                mode: 'Advanced',
                inputResolution,
                streaming: { outputResolution },
            });
        }
        if (this.sceneCollectionsService.newUserFirstLogin) {
            this.sceneCollectionsService.setupDefaultSources(this.shouldAddDefaultSources);
        }
        this.navigationService.navigate('Studio');
        this.onboardingCompleted.next();
    }
    get isTwitchAuthed() {
        return this.userService.isLoggedIn && this.userService.platform.type === 'twitch';
    }
    get isFacebookAuthed() {
        return this.userService.isLoggedIn && this.userService.platform.type === 'facebook';
    }
    startOnboardingIfRequired() {
        if (Utils.env.SLD_FORCE_ONBOARDING_STEP) {
            this.start();
            return true;
        }
        if (localStorage.getItem(this.localStorageKey)) {
            return false;
        }
        this.start();
        return true;
    }
}
OnboardingService.initialState = {
    options: {
        isLogin: false,
        isOptimize: false,
        isHardware: false,
        isImport: false,
    },
    importedFrom: null,
    existingSceneCollections: false,
};
__decorate([
    Inject()
], OnboardingService.prototype, "navigationService", void 0);
__decorate([
    Inject()
], OnboardingService.prototype, "userService", void 0);
__decorate([
    Inject()
], OnboardingService.prototype, "sceneCollectionsService", void 0);
__decorate([
    Inject()
], OnboardingService.prototype, "outputSettingsService", void 0);
__decorate([
    Inject()
], OnboardingService.prototype, "dualOutputService", void 0);
__decorate([
    mutation()
], OnboardingService.prototype, "SET_OPTIONS", null);
__decorate([
    mutation()
], OnboardingService.prototype, "SET_OBS_IMPORTED", null);
__decorate([
    mutation()
], OnboardingService.prototype, "SET_EXISTING_COLLECTIONS", null);
//# sourceMappingURL=onboarding.js.map