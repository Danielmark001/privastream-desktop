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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { mutation, StatefulService } from 'services/core/stateful-service';
import { Inject } from 'services/core/injector';
import { authorizedHeaders, handleResponse, jfetch } from 'util/requests';
import { InitAfter } from '../core';
import { BehaviorSubject } from 'rxjs';
import { getPlatformService } from '../platforms';
function isDonationTrain(train) {
    return train.donationTrain;
}
const capitalize = (val) => val
    .split('_')
    .map(word => `${word[0].toLocaleUpperCase()}${word.slice(1)}`)
    .join(' ');
let StreamlabelsService = class StreamlabelsService extends StatefulService {
    constructor() {
        super(...arguments);
        this.output = new BehaviorSubject({});
        this.settings = {};
        this.subscriptions = {};
        this.trains = {
            donation: {
                mostRecentEventAt: null,
                mostRecentName: null,
                counter: 0,
                mostRecentAmount: null,
                totalAmount: 0,
                donationTrain: true,
                setting: 'train_tips',
            },
            subscription: {
                mostRecentEventAt: null,
                mostRecentName: null,
                counter: 0,
                setting: 'train_twitch_subscriptions',
            },
            trovo_subscription: {
                mostRecentEventAt: null,
                mostRecentName: null,
                counter: 0,
                setting: 'train_trovo_subscriptions',
            },
            youtube_subscriber: {
                mostRecentEventAt: null,
                mostRecentName: null,
                counter: 0,
                setting: 'train_youtube_subscribers',
            },
            follow: {
                mostRecentEventAt: null,
                mostRecentName: null,
                counter: 0,
                setting: 'train_twitch_follows',
            },
            facebook_follow: {
                mostRecentEventAt: null,
                mostRecentName: null,
                counter: 0,
                setting: 'train_facebook_follows',
            },
            trovo_follow: {
                mostRecentEventAt: null,
                mostRecentName: null,
                counter: 0,
                setting: 'train_trovo_follows',
            },
            support: {
                mostRecentEventAt: null,
                mostRecentName: null,
                counter: 0,
                setting: 'train_facebook_supports',
            },
            bits: {
                mostRecentEventAt: null,
                mostRecentName: null,
                counter: 0,
                setting: 'train_twitch_bits',
            },
            stars: {
                mostRecentEventAt: null,
                mostRecentName: null,
                counter: 0,
                setting: 'train_facebook_stars',
            },
            sponsor: {
                mostRecentEventAt: null,
                mostRecentName: null,
                counter: 0,
                setting: 'train_youtube_sponsors',
            },
            superchat: {
                mostRecentEventAt: null,
                mostRecentName: null,
                counter: 0,
                setting: 'train_youtube_superchats',
            },
        };
    }
    SET_DEFINITIONS(definitions) {
        this.state.definitions = definitions;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.initSocketConnection();
            this.initTrainClockInterval();
            this.userService.userLogin.subscribe(() => {
                this.onUserLogin();
            });
        });
    }
    onUserLogin() {
        const primaryPlatform = getPlatformService(this.userService.platform.type);
        if (!primaryPlatform.hasCapability('streamlabels'))
            return;
        this.fetchInitialData();
        this.fetchSettings();
        this.fetchDefinitions();
    }
    getSettingsForStat(statname) {
        const settings = Object.assign({}, this.settings[statname]);
        if (settings.format) {
            settings.format = this.escapeNewline(settings.format);
        }
        if (settings.item_separator) {
            settings.item_separator = this.escapeNewline(settings.item_separator);
        }
        return settings;
    }
    escapeNewline(text) {
        return text.replace(/\n/gi, '\\n');
    }
    unescapeNewline(text) {
        return text.replace(/\\n/gi, '\n');
    }
    setSettingsForStat(statname, settings) {
        if (settings.format) {
            settings.format = this.escapeNewline(settings.format);
        }
        if (settings.item_separator) {
            settings.item_separator = this.unescapeNewline(settings.item_separator);
        }
        this.settings[statname] = Object.assign(Object.assign({}, this.settings[statname]), settings);
        if ([
            'train_tips',
            'train_twitch_follows',
            'train_twitch_subscriptions',
            'train_facebook_supports',
            'train_twitch_bits',
            'train_facebook_stars',
            'train_youtube_sponsors',
            'train_youtube_superchats',
            'train_youtube_subscribers',
            'train_facebook_follows',
            'train_trovo_follows',
            'train_trovo_subscriptions',
        ].includes(statname)) {
            this.outputAllTrains();
        }
        const headers = authorizedHeaders(this.userService.apiToken);
        headers.append('Content-Type', 'application/json');
        const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/stream-labels/settings`;
        const request = new Request(url, {
            headers,
            method: 'POST',
            body: JSON.stringify(this.settings),
        });
        return fetch(request)
            .then(handleResponse)
            .then(() => true);
    }
    restartSession() {
        if (!this.userService.isLoggedIn)
            return;
        const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/stream-labels/restart-session`;
        const headers = authorizedHeaders(this.userService.apiToken);
        const request = new Request(url, { headers });
        return fetch(request)
            .then(handleResponse)
            .then(() => true);
    }
    log(message, ...args) {
        console.debug(`Streamlabels: ${message}`, ...args);
    }
    fetchInitialData() {
        if (!this.userService.isLoggedIn)
            return;
        const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/stream-labels/files`;
        const headers = authorizedHeaders(this.userService.apiToken);
        const request = new Request(url, { headers });
        jfetch(request).then(json => this.updateOutput(json.data));
    }
    fetchSettings() {
        if (!this.userService.isLoggedIn)
            return;
        const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/stream-labels/settings`;
        const headers = authorizedHeaders(this.userService.apiToken);
        const request = new Request(url, { headers });
        jfetch(request).then(settings => this.updateSettings(settings));
    }
    fetchDefinitions() {
        if (!this.userService.isLoggedIn)
            return;
        const platform = this.userService.platform.type;
        const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/stream-labels/app-settings/${platform}`;
        const headers = authorizedHeaders(this.userService.apiToken);
        const request = new Request(url, { headers });
        fetch(request)
            .then(handleResponse)
            .then((data) => {
            this.SET_DEFINITIONS(this.formatTrainDefinitions(data));
        });
    }
    formatTrainDefinitions(data) {
        const { trains_combos } = data, rest = __rest(data, ["trains_combos"]);
        const trainData = {};
        trains_combos.files.forEach(file => {
            trainData[file.name] = { label: file.label, files: this.trainFiles(file.name) };
        });
        return Object.assign(Object.assign({}, rest), trainData);
    }
    trainFiles(fileName) {
        const type = Object.keys(this.trains).find(key => this.trains[key].setting === fileName);
        const baseFiles = [
            {
                name: `${type}_train_counter`,
                label: capitalize(`${type}_train_counter`),
                settings: { settingsStat: fileName, settingsWhitelist: ['show_count'] },
            },
            {
                name: `${type}_train_latest_name`,
                label: capitalize(`${type}_train_latest_name`),
                settings: { settingsStat: fileName, settingsWhitelist: ['show_latest'] },
            },
            {
                name: `${type}_train_clock`,
                label: capitalize(`${type}_train_clock`),
                settings: { settingsStat: fileName, settingsWhitelist: ['duration', 'show_clock'] },
            },
        ];
        const donationFiles = [
            {
                name: `${type}_train_latest_amount`,
                label: capitalize(`${type}_train_latest_amount`),
                settings: { settingsStat: fileName, settingsWhitelist: [] },
            },
            {
                name: `${type}_train_total_amount`,
                label: capitalize(`${type}_train_total_amount`),
                settings: { settingsStat: fileName, settingsWhitelist: [] },
            },
        ];
        if (fileName !== 'train_tips')
            return baseFiles;
        return baseFiles.concat(donationFiles);
    }
    initSocketConnection() {
        this.websocketService.socketEvent.subscribe(e => this.onSocketEvent(e));
    }
    initTrainClockInterval() {
        this.trainInterval = window.setInterval(() => {
            Object.keys(this.trains).forEach((trainType) => {
                const train = this.trains[trainType];
                if (train.mostRecentEventAt == null)
                    return;
                const statname = `${trainType}_train_clock`;
                const settings = this.getSettingsForStat(train.setting);
                const duration = parseInt(settings.duration, 10) * 1000;
                const msRemaining = duration - (Date.now() - train.mostRecentEventAt);
                if (msRemaining < 0) {
                    this.clearTrain(trainType);
                    this.outputTrainInfo(trainType);
                }
                else {
                    const minutes = Math.floor(msRemaining / (60 * 1000));
                    const seconds = Math.floor((msRemaining % (60 * 1000)) / 1000);
                    const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    this.updateOutput({
                        [statname]: formatted,
                    });
                }
            });
        }, 1000);
    }
    clearTrain(trainType) {
        const train = this.trains[trainType];
        if (isDonationTrain(train)) {
            train.mostRecentAmount = null;
            train.totalAmount = 0;
        }
        train.counter = 0;
        train.mostRecentEventAt = null;
        train.mostRecentName = null;
    }
    outputAllTrains() {
        Object.keys(this.trains).forEach((train) => this.outputTrainInfo(train));
    }
    outputTrainInfo(trainType) {
        const train = this.trains[trainType];
        const settings = this.getSettingsForStat(train.setting);
        const output = {
            [`${trainType}_train_counter`]: train.counter || settings.show_count === 'always' ? train.counter.toString() : '',
            [`${trainType}_train_latest_name`]: settings.show_latest ? train.mostRecentName || '' : '',
        };
        if (isDonationTrain(train)) {
            const latestAmount = train.mostRecentAmount ? train.mostRecentAmount.toFixed(2) : '';
            const totalAmount = train.totalAmount ? train.totalAmount.toFixed(2) : '';
            output[`${trainType}_train_latest_amount`] = latestAmount;
            output[`${trainType}_train_total_amount`] = totalAmount;
        }
        if (train.mostRecentEventAt == null) {
            output[`${trainType}_train_clock`] = settings.show_clock === 'always' ? '0:00' : '';
        }
        this.updateOutput(output);
    }
    onSocketEvent(event) {
        this.log('Socket Event', event);
        if (event.type === 'streamlabels') {
            this.updateOutput(event.message.data);
        }
        else if (event.type === 'donation') {
            this.trains.donation.mostRecentEventAt = Date.now();
            this.trains.donation.counter += event.message.length;
            this.trains.donation.totalAmount += event.message.reduce((sum, donation) => {
                return sum + parseFloat(donation.amount);
            }, 0);
            const latest = event.message[event.message.length - 1];
            this.trains.donation.mostRecentName = latest.name;
            this.trains.donation.mostRecentAmount = parseFloat(latest.amount);
            this.outputTrainInfo('donation');
        }
        else if (event.type === 'follow') {
            if (event.for === 'twitch_account') {
                this.trains.follow.mostRecentEventAt = Date.now();
                this.trains.follow.counter += event.message.length;
                const latest = event.message[event.message.length - 1];
                this.trains.follow.mostRecentName = latest.name;
                this.outputTrainInfo('follow');
            }
            else if (event.for === 'facebook_account') {
                this.trains.facebook_follow.mostRecentEventAt = Date.now();
                this.trains.facebook_follow.counter += event.message.length;
                const latest = event.message[event.message.length - 1];
                this.trains.facebook_follow.mostRecentName = latest.name;
                this.outputTrainInfo('facebook_follow');
            }
            else if (event.for === 'youtube_account') {
                this.trains.youtube_subscriber.mostRecentEventAt = Date.now();
                this.trains.youtube_subscriber.counter += event.message.length;
                const latest = event.message[event.message.length - 1];
                this.trains.youtube_subscriber.mostRecentName = latest.name;
                this.outputTrainInfo('youtube_subscriber');
            }
            else if (event.for === 'trovo_account') {
                this.trains.trovo_follow.mostRecentEventAt = Date.now();
                this.trains.trovo_follow.counter += event.message.length;
                const latest = event.message[event.message.length - 1];
                this.trains.trovo_follow.mostRecentName = latest.name;
                this.outputTrainInfo('trovo_follow');
            }
        }
        else if (event.type === 'subscription') {
            if (event.for === 'twitch_account') {
                this.trains.subscription.mostRecentEventAt = Date.now();
                this.trains.subscription.counter += event.message.length;
                const latest = event.message[event.message.length - 1];
                this.trains.subscription.mostRecentName = latest.name;
                this.outputTrainInfo('subscription');
            }
            else if (event.for === 'youtube_account') {
                this.trains.sponsor.mostRecentEventAt = Date.now();
                this.trains.sponsor.counter += event.message.length;
                const latest = event.message[event.message.length - 1];
                this.trains.sponsor.mostRecentName = latest.name;
                this.outputTrainInfo('sponsor');
            }
            else if (event.for === 'trovo_account') {
                this.trains.trovo_subscription.mostRecentEventAt = Date.now();
                this.trains.trovo_subscription.counter += event.message.length;
                const latest = event.message[event.message.length - 1];
                this.trains.trovo_subscription.mostRecentName = latest.name;
                this.outputTrainInfo('trovo_subscription');
            }
        }
        else if (event.type === 'support') {
            this.trains.support.mostRecentEventAt = Date.now();
            this.trains.support.counter += event.message.length;
            const latest = event.message[event.message.length - 1];
            this.trains.support.mostRecentName = latest.name;
            this.outputTrainInfo('support');
        }
        else if (event.type === 'bits') {
            this.trains.bits.mostRecentEventAt = Date.now();
            this.trains.bits.counter += event.message.length;
            const latest = event.message[event.message.length - 1];
            this.trains.bits.mostRecentName = latest.name;
            this.outputTrainInfo('bits');
        }
        else if (event.type === 'superchat') {
            this.trains.superchat.mostRecentEventAt = Date.now();
            this.trains.superchat.counter += event.message.length;
            const latest = event.message[event.message.length - 1];
            this.trains.superchat.mostRecentName = latest.name;
            this.outputTrainInfo('superchat');
        }
        else if (event.type === 'stars') {
            this.trains.stars.mostRecentEventAt = Date.now();
            this.trains.stars.counter += event.message.length;
            const latest = event.message[event.message.length - 1];
            this.trains.stars.mostRecentName = latest.name;
            this.outputTrainInfo('stars');
        }
    }
    updateSettings(settingsPatch) {
        this.settings = Object.assign(Object.assign({}, this.settings), settingsPatch);
        this.outputAllTrains();
    }
    updateOutput(outputPatch) {
        const oldOutput = this.output.getValue();
        this.output.next(Object.assign(Object.assign({}, oldOutput), outputPatch));
    }
};
StreamlabelsService.initialState = {
    definitions: null,
};
__decorate([
    Inject()
], StreamlabelsService.prototype, "userService", void 0);
__decorate([
    Inject()
], StreamlabelsService.prototype, "hostsService", void 0);
__decorate([
    Inject()
], StreamlabelsService.prototype, "websocketService", void 0);
__decorate([
    Inject()
], StreamlabelsService.prototype, "appService", void 0);
__decorate([
    mutation()
], StreamlabelsService.prototype, "SET_DEFINITIONS", null);
StreamlabelsService = __decorate([
    InitAfter('UserService')
], StreamlabelsService);
export { StreamlabelsService };
//# sourceMappingURL=index.js.map