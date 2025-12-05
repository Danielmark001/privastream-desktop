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
import { injectState, useModule, mutation } from 'slap';
import { alertAsync } from 'components-react/modals';
import { Services } from 'components-react/service-provider';
import AutoProgressBar from 'components-react/shared/AutoProgressBar';
import { ListInput } from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
import KevinSvg from 'components-react/shared/KevinSvg';
import React from 'react';
import { $t } from 'services/i18n';
import commonStyles from './Common.m.less';
import styles from './ObsImport.m.less';
import { OnboardingModule } from './Onboarding';
export function ObsImport() {
    const { importing, percent, isObs } = useModule(ObsImportModule);
    return (React.createElement("div", { style: { width: '100%' } },
        React.createElement("h1", { className: commonStyles.titleContainer }, $t(`Importing Your Existing Settings From ${isObs ? 'OBS' : 'Twitch Studio'}`)),
        !importing && React.createElement(PreImport, null),
        importing && (React.createElement("div", { className: styles.progressBar },
            React.createElement(AutoProgressBar, { percent: percent, timeTarget: 10 * 1000 }))),
        React.createElement("div", { className: styles.textContainer },
            React.createElement(KevinSvg, null),
            React.createElement("div", null, $t('While we import your settings and scenes, check out these great features unique to Streamlabs'))),
        React.createElement(FeatureCards, null)));
}
function PreImport() {
    const { setProcessing, next } = useModule(OnboardingModule);
    const { profiles, selectedProfile, setSelectedProfile, startImport, isObs } = useModule(ObsImportModule);
    return (React.createElement("div", null,
        profiles.length > 1 && (React.createElement("div", { style: { width: 400, margin: 'auto', textAlign: 'center' } },
            React.createElement("span", { className: styles.profileSelectTitle }, $t('Select an OBS profile to import')),
            React.createElement(Form, { layout: "inline" },
                React.createElement(ListInput, { style: { width: '100%' }, options: profiles.map(p => ({ label: p, value: p })), value: selectedProfile, onChange: setSelectedProfile, allowClear: false })))),
        React.createElement("button", { className: commonStyles.optionCard, style: { margin: 'auto', marginTop: 24 }, onClick: () => __awaiter(this, void 0, void 0, function* () {
                setProcessing(true);
                if (!isObs) {
                    yield alertAsync({
                        title: $t('Twitch Studio Import'),
                        content: (React.createElement("p", null, $t('Importing from Twitch Studio is an experimental feature under active development. Some source types are unable to be imported, and not all settings will be carried over.'))),
                        okText: $t('Start'),
                        okType: 'primary',
                    });
                }
                startImport()
                    .then(() => {
                    setProcessing(false);
                    next();
                })
                    .catch(() => {
                    setProcessing(false);
                    alertAsync($t('Something went wrong while importing. Please try again or skip to the next step.'));
                });
            }) },
            React.createElement("h2", { style: { color: 'var(--action-button-text)' } }, $t('Start')))));
}
function FeatureCards() {
    const featuresMetadata = {
        appStore: {
            title: $t('App Store'),
            description: $t('Check out 50+ amazing apps from independent developers, ranging from DMCA-compliant music ' +
                'to stunning overlays to more tools to engage with your community. Head over to the app store in the left ' +
                'navigation to browse our selection of free and paid apps.'),
            image: 'app-store',
        },
        gameOverlay: {
            title: $t('In-game Overlay'),
            description: $t('Only have one screen? Perfect! Enable our in-game overlay to make sure you catch every chat message and ' +
                'stream event that happens while you get your game on. You can enable this feature in the ‘Game Overlay’ ' +
                'tab of the settings menu.'),
            image: 'game-overlay',
        },
    };
    return (React.createElement("div", { className: styles.container }, Object.keys(featuresMetadata).map(feature => {
        const data = featuresMetadata[feature];
        return (React.createElement("div", { className: styles.card, key: feature },
            React.createElement("div", null,
                React.createElement("h3", null, data.title),
                React.createElement("div", null, data.description)),
            React.createElement("img", { src: require(`../../../../media/images/onboarding/${data.image}.png`) })));
    })));
}
class ObsImportModule {
    constructor() {
        this.state = injectState({
            profiles: [],
            selectedProfile: '',
            importing: false,
            percent: 0,
        });
    }
    init() {
        var _a;
        if (this.isObs) {
            const service = this.importService;
            const profiles = service.getProfiles();
            this.setProfiles(profiles);
            this.setSelectedProfile((_a = profiles[0]) !== null && _a !== void 0 ? _a : null);
        }
    }
    get importService() {
        if (this.isObs) {
            return Services.ObsImporterService;
        }
        else {
            return Services.TwitchStudioImporterService;
        }
    }
    get isObs() {
        return Services.OnboardingService.state.importedFrom === 'obs';
    }
    startImport() {
        if (this.state.importing)
            return Promise.resolve();
        if (this.isObs && !this.state.selectedProfile)
            return Promise.resolve();
        this.setImporting(true);
        return this.importService
            .load(this.state.selectedProfile)
            .then(r => {
            this.setImporting(false);
            return r;
        })
            .catch(e => {
            this.setImporting(false);
            throw e;
        });
    }
    setProfiles(profiles) {
        this.state.profiles = profiles;
    }
    setSelectedProfile(profile) {
        this.state.selectedProfile = profile;
    }
    setImporting(val) {
        this.state.importing = val;
    }
    setPercent(val) {
        this.state.percent = val;
    }
}
__decorate([
    mutation()
], ObsImportModule.prototype, "setProfiles", null);
__decorate([
    mutation()
], ObsImportModule.prototype, "setSelectedProfile", null);
__decorate([
    mutation()
], ObsImportModule.prototype, "setImporting", null);
__decorate([
    mutation()
], ObsImportModule.prototype, "setPercent", null);
//# sourceMappingURL=ObsImport.js.map