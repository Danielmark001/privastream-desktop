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
import { StatefulService, Inject, mutation, InitAfter, ViewHandler } from 'services/core';
import { authorizedHeaders, handleResponse, jfetch } from 'util/requests';
import { $t } from 'services/i18n';
import cloneDeep from 'lodash/cloneDeep';
import pick from 'lodash/pick';
import uuid from 'uuid/v4';
import { Subject } from 'rxjs';
import mapValues from 'lodash/mapValues';
import { WidgetType } from './widgets';
var ESafeModeStatus;
(function (ESafeModeStatus) {
    ESafeModeStatus["Enabled"] = "enabled";
    ESafeModeStatus["Disabled"] = "disabled";
})(ESafeModeStatus || (ESafeModeStatus = {}));
const subscriptionMap = (subPlan) => {
    return {
        '1000': $t('Tier 1'),
        '2000': $t('Tier 2'),
        '3000': $t('Tier 3'),
        Prime: $t('Prime'),
    }[subPlan];
};
const filterName = (key) => {
    return {
        donation: $t('Donations'),
        redemption: $t('Redemptions'),
        merch: $t('Merch'),
        follow: $t('Follows'),
        subscription: $t('Subs'),
        subscription_tier_1: $t('Tier 1'),
        subscription_tier_2: $t('Tier 2'),
        subscription_tier_3: $t('Tier 3'),
        filter_subscription_3_months: $t('3 Months'),
        filter_subscription_6_months: $t('6 Months'),
        filter_subscription_9_months: $t('9 Months'),
        filter_subscription_12_months: $t('12 Months'),
        filter_subscription_minimum_enabled: $t('Min. Months'),
        primesub: $t('Prime'),
        resub: $t('Resubs'),
        resub_tier_1: $t('Tier 1'),
        resub_tier_2: $t('Tier 2'),
        resub_tier_3: $t('Tier 3'),
        resub_prime: $t('Prime'),
        gifted_sub: $t('Gifted'),
        bits: $t('Bits'),
        raid: $t('Raids'),
        subscriber: $t('Subscribers'),
        sponsor: $t('Members'),
        superchat: $t('Super Chats'),
        sticker: $t('Stickers'),
        effect: $t('Effects'),
        facebook_support: $t('Supports'),
        facebook_like: $t('Likes'),
        facebook_share: $t('Shares'),
        facebook_stars: $t('Stars'),
    }[key];
};
function getHashForRecentEvent(event) {
    switch (event.type) {
        case 'donation':
            return [event.type, event.name, event.message, parseInt(event.amount, 10)].join(':');
        case 'bits':
            return [event.type, event.name, event.message, parseInt(event.amount, 10)].join(':');
        case 'donordrivedonation':
            return [event.type, event.name, event.message, parseInt(event.amount, 10)].join(':');
        case 'eldonation':
            return [event.type, event.name, event.message, parseInt(event.amount, 10)].join(':');
        case 'follow':
            return [event.type, event.name, event.message].join(':');
        case 'justgivingdonation':
            return [event.type, event.name, event.message, parseInt(event.amount, 10)].join(':');
        case 'loyalty_store_redemption':
            return [event.type, event.from, event.message].join(':');
        case 'pledge':
            return [event.type, event.name, parseInt(event.amount, 10), event.from].join(':');
        case 'prime_sub_gift':
            return [event.type, event.name, event.streamer, event.giftType].join(':');
        case 'redemption':
            return [event.type, event.name, event.message].join(':');
        case 'sticker':
            return [event.name, event.type, event.currency].join(':');
        case 'raid':
            return [event.type, event.name, event.from].join(':');
        case 'subscription':
            return [event.type, event.name.toLowerCase(), event.message].join(':');
        case 'superchat':
            return [event.type, event.name, event.message].join(':');
        case 'superheart':
            return [event.type, event.name, event.message, parseInt(event.amount, 10)].join(':');
        case 'tiltifydonation':
            return [event.type, event.name, event.message, parseInt(event.amount, 10)].join(':');
        case 'treat':
            return [event.type, event.name, event.title, event.message, event.createdAt].join(':');
        case 'like':
            return [event.type, event.name, event._id].join(':');
        case 'share':
            return [event.type, event.name, event._id].join(':');
        case 'stars':
            return [event.type, event.name, event.message, parseInt(event.amount, 10)].join(':');
        case 'support':
            return [event.type, event.name, event._id].join(':');
        case 'merch':
            return [event.type, event.message, event.createdAt].join(':');
        default:
            return [event.type, event._id].join(':');
    }
}
const SUPPORTED_EVENTS = [
    'merch',
    'donation',
    'streamlabscharitydonation',
    'follow',
    'subscription',
    'bits',
    'sticker',
    'effect',
    'like',
    'raid',
    'stars',
    'support',
    'share',
    'superchat',
    'pledge',
    'eldonation',
    'tiltifydonation',
    'donordrivedonation',
    'justgivingdonation',
    'treat',
];
class RecentEventsViews extends ViewHandler {
    getEventString(event) {
        return {
            donation: this.getDonoString(event),
            merch: $t('has purchased %{product} from the store', { product: event.product }),
            streamlabscharitydonation: $t('has donated via Streamlabs Charity'),
            follow: event.platform === 'youtube_account' ? $t('has subscribed') : $t('has followed'),
            subscription: this.getSubString(event),
            bits: $t('has used'),
            raid: $t('has raided you with a party of %{viewers}', { viewers: event.raiders }),
            sticker: $t('has used %{skill} for', { skill: event.skill }),
            effect: $t('has used %{skill} for', { skill: event.skill }),
            like: $t('has liked'),
            stars: $t('has used'),
            support: this.getSubString(event),
            share: $t('has shared'),
            superchat: $t('has superchatted'),
            pledge: $t('has pledged on Patreon'),
            eldonation: $t('has donated to Extra Life'),
            tiltifydonation: $t('has donated to Tiltify'),
            donordrivedonation: $t('has donated to Donor Drive'),
            justgivingdonation: $t('has donated to Just Giving'),
            treat: $t('has given a treat %{title}', { title: event.title }),
        }[event.type];
    }
    getDonoString(event) {
        var _a;
        if (event.crate_item) {
            return $t('has tipped with %{itemName}', { itemName: event.crate_item.name });
        }
        if (((_a = event.recurring_donation) === null || _a === void 0 ? void 0 : _a.months) > 1) {
            return $t('has tipped %{months} months in a row', {
                months: event.recurring_donation.months,
            });
        }
        if (event.recurring_donation) {
            return $t('has set up a monthly tip');
        }
        return $t('has tipped');
    }
    getSubString(event) {
        if (event.platform === 'facebook_account') {
            if (event.months > 1) {
                return $t('has been a supporter for %{months} months', { months: event.months });
            }
            return $t('has become a supporter');
        }
        if (event.platform === 'youtube_account') {
            if (event.months > 1) {
                return $t('has been a member for %{months} months', { months: event.months });
            }
            return $t('has become a member');
        }
        if (event.platform === 'trovo_account') {
            if (event.gifter) {
                return $t('has gifted a sub to');
            }
            if (event.months > 1 && event.streak_months && event.streak_months > 1) {
                return $t('has resubscribed for %{streak} months in a row! (%{months} total)', {
                    streak: event.streak_months,
                    months: event.months,
                });
            }
            if (event.months > 1) {
                return $t('has resubscribed for %{months} months', {
                    months: event.months,
                });
            }
            return $t('has subscribed');
        }
        if (event.gifter) {
            return $t('has gifted a sub (%{tier}) to', {
                tier: subscriptionMap(event.sub_plan),
            });
        }
        if (event.months > 1 && event.streak_months && event.streak_months > 1) {
            return $t('has resubscribed (%{tier}) for %{streak} months in a row! (%{months} total)', {
                tier: subscriptionMap(event.sub_plan),
                streak: event.streak_months,
                months: event.months,
            });
        }
        if (event.months > 1) {
            return $t('has resubscribed (%{tier}) for %{months} months', {
                tier: subscriptionMap(event.sub_plan),
                months: event.months,
            });
        }
        if (event.sub_type === 'primepaidupgrade') {
            return $t('has converted from a Prime Gaming sub to a %{tier} sub', {
                tier: subscriptionMap(event.sub_plan),
            });
        }
        return $t('has subscribed (%{tier})', { tier: subscriptionMap(event.sub_plan) });
    }
    getEvent(uuid) {
        return this.state.recentEvents.find(event => {
            return event.uuid === uuid;
        });
    }
    get spinWheelExists() {
        return !!this.widgetsService.views.widgetSources.find(source => source.type === WidgetType.SpinWheel);
    }
}
__decorate([
    Inject()
], RecentEventsViews.prototype, "widgetsService", void 0);
let RecentEventsService = class RecentEventsService extends StatefulService {
    constructor() {
        super(...arguments);
        this.safeModeStatusChanged = new Subject();
        this.socketConnection = null;
        this.safeModeTimeout = null;
    }
    get views() {
        return new RecentEventsViews(this.state);
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.lifecycle = yield this.userService.withLifecycle({
                init: this.syncEventsState,
                destroy: () => Promise.resolve(this.onLogout()),
                context: this,
            });
        });
    }
    syncEventsState() {
        return __awaiter(this, void 0, void 0, function* () {
            const config = yield this.fetchConfig();
            if (config)
                this.applyConfig(config);
            this.formEventsArray();
            this.fetchMediaShareState();
            this.subscribeToSocketConnection();
            this.fetchSafeModeStatus();
            this.fetchMuteChatNotifs();
        });
    }
    subscribeToSocketConnection() {
        this.socketConnection = this.websocketService.socketEvent.subscribe(ev => this.onSocketEvent(ev));
    }
    unsubscribeFromSocketConnection() {
        if (this.socketConnection)
            this.socketConnection.unsubscribe();
    }
    onLogout() {
        this.SET_RECENT_EVENTS([]);
        this.unsubscribeFromSocketConnection();
    }
    fetchRecentEvents() {
        const typeString = this.getEventTypesString();
        const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/recentevents/${this.userService.widgetToken}?types=${typeString}`;
        const headers = authorizedHeaders(this.userService.apiToken);
        const request = new Request(url, { headers });
        return jfetch(request).catch(() => {
            console.warn('Error fetching recent events');
        });
    }
    fetchConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/widget/config?widget=recent_events`;
            const headers = authorizedHeaders(this.userService.apiToken);
            return jfetch(url, { headers }).catch(() => {
                console.warn('Error fetching recent events config');
            });
        });
    }
    fetchMediaShareState() {
        const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/widget/config?widget=media-sharing`;
        const headers = authorizedHeaders(this.userService.apiToken);
        return jfetch(url, {
            headers,
        }).then(resp => this.SET_MEDIA_SHARE(resp.settings.advanced_settings.enabled));
    }
    refresh() {
        return this.formEventsArray();
    }
    formEventsArray() {
        return __awaiter(this, void 0, void 0, function* () {
            const events = yield this.fetchRecentEvents();
            let eventArray = [];
            if (!events ||
                !events.data ||
                (this.state.safeMode.enabled && this.state.safeMode.clearRecentEvents)) {
                return;
            }
            Object.keys(events.data).forEach(key => {
                const fortifiedEvents = events.data[key].map(event => {
                    event.hash = getHashForRecentEvent(event);
                    event.uuid = uuid();
                    return event;
                });
                const culledEvents = fortifiedEvents.map(event => {
                    return pick(event, [
                        'name',
                        'from',
                        'type',
                        'platform',
                        'created_at',
                        'display_name',
                        'from_display_name',
                        'amount',
                        'crate_item',
                        'message',
                        'product',
                        'viewers',
                        'host_type',
                        'raiders',
                        'formatted_amount',
                        'sub_plan',
                        'sub_type',
                        'months',
                        'streak_months',
                        'gifter',
                        'currency',
                        'skill',
                        'since',
                        'displayString',
                        'comment',
                        'title',
                        'read',
                        'hash',
                        'uuid',
                    ]);
                });
                eventArray = eventArray.concat(culledEvents);
            });
            const hashValues = eventArray.map(event => event.hash).join('|##|');
            const readReceipts = yield this.fetchReadReceipts(hashValues);
            eventArray.forEach(event => {
                event.read = readReceipts[event.hash] ? readReceipts[event.hash] : false;
                if (new Date(event.created_at).getTime() < new Date().getTime() - 1000 * 60 * 60 * 24 * 30) {
                    event.read = true;
                }
            });
            eventArray.sort((a, b) => {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
            if (this.state.safeMode.enabled && this.state.safeMode.clearRecentEvents)
                return;
            this.SET_RECENT_EVENTS(eventArray);
        });
    }
    fetchReadReceipts(hashValues) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/readreceipts`;
            const headers = authorizedHeaders(this.userService.apiToken, new Headers({ 'Content-Type': 'application/json' }));
            const request = new Request(url, { headers });
            const body = JSON.stringify({
                hashValues,
            });
            return yield jfetch(url, { headers, body, method: 'POST' });
        });
    }
    repeatAlert(event) {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = authorizedHeaders(this.userService.apiToken, new Headers({ 'Content-Type': 'application/json' }));
            const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/widget/repeatalert`;
            const body = JSON.stringify({
                data: event,
                type: event.type,
                token: this.userService.widgetToken,
            });
            return yield fetch(new Request(url, { headers, body, method: 'POST' })).then(handleResponse);
        });
    }
    readAlert(event) {
        return __awaiter(this, void 0, void 0, function* () {
            this.TOGGLE_RECENT_EVENT_READ(event.uuid);
            const newEvent = this.views.getEvent(event.uuid);
            const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/widget/readalert`;
            const headers = authorizedHeaders(this.userService.apiToken, new Headers({ 'Content-Type': 'application/json' }));
            const body = JSON.stringify({
                eventHash: newEvent.hash,
                read: newEvent.read,
            });
            const request = new Request(url, { headers, body, method: 'POST' });
            return yield fetch(request).then(handleResponse);
        });
    }
    postUpdateFilterPreferences() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/widget/recentevents`;
            const headers = authorizedHeaders(this.userService.apiToken, new Headers({ 'Content-Type': 'application/json' }));
            const body = JSON.stringify(this.state.filterConfig);
            const request = new Request(url, { headers, body, method: 'POST' });
            return yield fetch(request).then(handleResponse);
        });
    }
    skipAlert() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/alerts/skip`;
            const headers = authorizedHeaders(this.userService.apiToken);
            const request = new Request(url, { headers, method: 'POST' });
            return yield fetch(request).then(handleResponse);
        });
    }
    pauseAlertQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/alerts/pause_queue`;
            const headers = authorizedHeaders(this.userService.apiToken);
            const request = new Request(url, { headers, method: 'POST' });
            return fetch(request).then(handleResponse);
        });
    }
    unpauseAlertQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/alerts/unpause_queue`;
            const headers = authorizedHeaders(this.userService.apiToken);
            const request = new Request(url, { headers, method: 'POST' });
            return fetch(request).then(handleResponse);
        });
    }
    get filters() {
        const mainFilters = pick(this.state.filterConfig, [
            'donation',
            'merch',
            'follow',
            'host',
            'bits',
            'raid',
            'subscriber',
            'sponsor',
            'superchat',
            'sticker',
            'effect',
            'facebook_support',
            'facebook_like',
            'facebook_share',
            'facebook_stars',
        ]);
        const subFilters = pick(this.state.filterConfig, [
            'subscription',
            'subscription_tier_1',
            'subscription_tier_2',
            'subscription_tier_3',
            'primesub',
            'gifted_sub',
        ]);
        const resubFilters = pick(this.state.filterConfig, [
            'resub',
            'resub_tier_1',
            'resub_tier_2',
            'resub_tier_3',
            'resub_prime',
            'filter_subscription_3_months',
            'filter_subscription_6_months',
            'filter_subscription_9_months',
            'filter_subscription_12_months',
            'filter_subscription_minimum_enabled',
        ]);
        const minimumMonths = pick(this.state.filterConfig, ['filter_subscription_minimum_months']);
        const main = mapValues(mainFilters, (value, key) => {
            return {
                value,
                name: filterName(key),
            };
        });
        const sub = mapValues(subFilters, (value, key) => {
            return {
                value,
                name: filterName(key),
            };
        });
        const resub = mapValues(resubFilters, (value, key) => {
            return {
                value,
                name: filterName(key),
            };
        });
        const minMonths = mapValues(minimumMonths, (value, key) => {
            return {
                value,
                name: filterName(key),
            };
        });
        return {
            main,
            sub,
            resub,
            minMonths,
        };
    }
    updateFilterPreference(key, value) {
        this.SET_SINGLE_FILTER_CONFIG(key, value);
        this.postUpdateFilterPreferences().then(() => {
            this.formEventsArray();
        });
    }
    getEventTypesString() {
        return (Object.keys(this.state.filterConfig)
            .filter((type) => this.state.filterConfig[type] === true)
            .join(','));
    }
    applyConfig(config) {
        if (!config)
            return;
        this.SET_MUTED(config.eventsPanelMuted);
        this.SET_FILTER_CONFIG(config.settings);
    }
    onSocketEvent(e) {
        if (e.type === 'eventsPanelSettingsUpdate') {
            if (e.message.muted != null) {
                this.SET_MUTED(e.message.muted);
            }
        }
        if (e.type === 'pauseQueue') {
            this.SET_PAUSED(true);
        }
        if (e.type === 'unpauseQueue') {
            this.SET_PAUSED(false);
        }
        if (e.type === 'mediaSharingSettingsUpdate') {
            if (e.message.advanced_settings.enabled != null) {
                this.SET_MEDIA_SHARE(e.message.advanced_settings.enabled);
            }
        }
        if (e.type === 'safeModeEnabled') {
            this.updateSafeModeSettingsFromServer(e.message);
            this.onSafeModeEnabled(e.message.ends_at);
        }
        if (e.type === 'safeModeDisabled') {
            this.onSafeModeDisabled();
        }
        if (SUPPORTED_EVENTS.includes(e.type)) {
            this.onEventSocket(e);
        }
    }
    shouldFilterSubscription(event) {
        if (!this.state.filterConfig.subscription) {
            return false;
        }
        if (this.userService.platform.type === 'trovo')
            return true;
        if (!this.state.filterConfig.subscription_tier_1 && event.sub_plan.toString() === '1000') {
            return false;
        }
        if (!this.state.filterConfig.subscription_tier_2 && event.sub_plan.toString() === '2000') {
            return false;
        }
        if (!this.state.filterConfig.subscription_tier_3 && event.sub_plan.toString() === '3000') {
            return false;
        }
        if (!this.state.filterConfig.primesub && event.sub_plan.toString() === 'Prime') {
            return false;
        }
        if (!this.state.filterConfig.gifted_sub && event.gifter) {
            return false;
        }
        return true;
    }
    shouldFilterResub(event) {
        if (!this.state.filterConfig.resub) {
            return false;
        }
        if (this.userService.platform.type === 'trovo')
            return true;
        if (!this.state.filterConfig.resub_tier_1 && event.sub_plan.toString() === '1000') {
            return false;
        }
        if (!this.state.filterConfig.resub_tier_2 && event.sub_plan.toString() === '2000') {
            return false;
        }
        if (!this.state.filterConfig.resub_tier_3 && event.sub_plan.toString() === '3000') {
            return false;
        }
        if (!this.state.filterConfig.resub_prime && event.sub_plan.toString() === 'Prime') {
            return false;
        }
        if (!this.state.filterConfig.gifted_sub && event.gifter) {
            return false;
        }
        if (this.state.filterConfig.filter_subscription_minimum_enabled &&
            event.months < this.state.filterConfig.filter_subscription_minimum_months) {
            return false;
        }
        return true;
    }
    isAllowed(event) {
        if (this.state.safeMode.enabled) {
            if (['follow', 'host'].includes(event.type))
                return false;
        }
        if (event.type === 'subscription' && this.userService.platform.type !== 'youtube') {
            if (event.months > 1) {
                return this.shouldFilterResub(event);
            }
            return this.shouldFilterSubscription(event);
        }
        return this.transformFilterForPlatform()[event.type];
    }
    transformFilterForPlatform() {
        const filterMap = cloneDeep(this.state.filterConfig);
        filterMap['support'] = filterMap['facebook_support'];
        filterMap['like'] = filterMap['facebook_like'];
        filterMap['share'] = filterMap['facebook_share'];
        filterMap['stars'] = filterMap['facebook_stars'];
        if (this.userService.platform.type === 'youtube') {
            filterMap['subscription'] = filterMap['membership_level_1'];
            filterMap['follow'] = filterMap['subscriber'];
        }
        return filterMap;
    }
    onEventSocket(e) {
        const messages = e.message
            .filter(msg => !msg.isTest && !msg.isPreview && !msg.repeat)
            .map(msg => {
            msg.platform = e.for;
            msg.type = e.type;
            msg.hash = getHashForRecentEvent(msg);
            msg.uuid = uuid();
            msg.read = false;
            msg.iso8601Created = new Date().toISOString();
            if (msg.type === 'sticker' || msg.type === 'effect') {
                msg.amount = msg.skill_amount;
                msg.name = msg.sender_name;
                msg.currency = msg.skill_currency;
                msg.skill = msg.skill_name;
            }
            return msg;
        })
            .filter(msg => this.isAllowed(msg));
        this.ADD_RECENT_EVENT(messages);
    }
    toggleMuteChatNotifs() {
        return __awaiter(this, void 0, void 0, function* () {
            const val = !this.state.enableChatNotifs;
            const headers = authorizedHeaders(this.userService.apiToken, new Headers({ 'Content-Type': 'application/json' }));
            const url = `https://${this.hostsService.streamlabs}/api/v5/widgets/desktop/chat-box/notifications`;
            const body = JSON.stringify({ enable: val });
            try {
                yield jfetch(new Request(url, { headers, body, method: 'POST' }));
                this.SET_MUTE_CHAT_NOTIFS(val);
            }
            catch (e) {
                return;
            }
        });
    }
    fetchMuteChatNotifs() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const headers = authorizedHeaders(this.userService.apiToken, new Headers({ 'Content-Type': 'application/json' }));
            const url = `https://${this.hostsService.streamlabs}/api/v5/widgets/desktop/chat-box`;
            try {
                const resp = yield jfetch(new Request(url, { headers, method: 'GET' }));
                if (!((_a = resp === null || resp === void 0 ? void 0 : resp.data) === null || _a === void 0 ? void 0 : _a.settings))
                    return;
                this.SET_MUTE_CHAT_NOTIFS((_b = resp.settings.global) === null || _b === void 0 ? void 0 : _b.alert_enabled);
            }
            catch (e) {
                return;
            }
        });
    }
    toggleMuteEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = authorizedHeaders(this.userService.apiToken, new Headers({ 'Content-Type': 'application/json' }));
            const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/widget/recentevents/eventspanel`;
            const body = JSON.stringify({ muted: !this.state.muted });
            return yield fetch(new Request(url, { headers, body, method: 'POST' })).then(handleResponse);
        });
    }
    toggleQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.state.queuePaused ? yield this.unpauseAlertQueue() : yield this.pauseAlertQueue();
            }
            catch (e) { }
        });
    }
    openRecentEventsWindow(isMediaShare) {
        this.windowsService.createOneOffWindow({
            componentName: 'RecentEvents',
            queryParams: { isMediaShare },
            title: $t('Recent Events'),
            size: { width: 800, height: 600 },
        }, 'RecentEvents');
    }
    showFilterMenu() {
        this.windowsService.showWindow({
            componentName: 'EventFilterMenu',
            title: $t('Event Filters'),
            queryParams: {},
            size: {
                width: 450,
                height: 480,
            },
        });
    }
    showSafeModeWindow() {
        this.windowsService.showWindow({
            componentName: 'SafeMode',
            title: $t('Safe Mode'),
            queryParams: {},
            size: {
                width: 450,
                height: 700,
            },
        });
    }
    fetchSafeModeStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/safemode`;
            const headers = authorizedHeaders(this.userService.apiToken);
            return jfetch(url, {
                headers,
            })
                .then(data => {
                this.updateSafeModeSettingsFromServer(data.safe_mode_settings.data);
                if (data.safe_mode_settings.active) {
                    this.onSafeModeEnabled(data.safe_mode_settings.ends_at);
                }
                else {
                    this.onSafeModeDisabled();
                }
            })
                .catch(error => {
                console.warn('Error fetching safe mode settings', error);
                this.onSafeModeDisabled();
            });
        });
    }
    updateSafeModeSettingsFromServer(data) {
        this.SET_SAFE_MODE_SETTINGS({
            clearChat: data.clear_chat,
            clearQueuedAlerts: data.clear_queued_alerts,
            clearRecentEvents: data.clear_recent_events,
            disableChatAlerts: data.disable_chat_alerts,
            disableFollowerAlerts: data.disable_follower_alerts,
            emoteOnly: data.emote_only,
            followerOnly: data.follower_only,
            subOnly: data.sub_only,
            enableTimer: data.enable_timer,
            timeInMinutes: data.time_in_minutes,
        });
    }
    setSafeModeTimeout(ms) {
        if (this.safeModeTimeout)
            clearTimeout(this.safeModeTimeout);
        this.safeModeTimeout = window.setTimeout(() => this.disableSafeMode(), ms);
    }
    setSafeModeSettings(patch) {
        this.SET_SAFE_MODE_SETTINGS(patch);
    }
    activateSafeMode() {
        if (this.state.safeMode.enabled)
            return;
        const headers = authorizedHeaders(this.userService.apiToken, new Headers({ 'Content-Type': 'application/json' }));
        const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/safemode`;
        const sm = this.state.safeMode;
        const body = JSON.stringify({
            clear_chat: sm.clearChat,
            clear_queued_alerts: sm.clearQueuedAlerts,
            clear_recent_events: sm.clearRecentEvents,
            disable_chat_alerts: sm.disableChatAlerts,
            disable_follower_alerts: sm.disableFollowerAlerts,
            emote_only: sm.emoteOnly,
            follower_only: sm.followerOnly,
            sub_only: sm.subOnly,
            enable_timer: sm.enableTimer,
            time_in_minutes: sm.timeInMinutes,
        });
        this.SET_SAFE_MODE_SETTINGS({ loading: true });
        const promise = jfetch(new Request(url, { headers, body, method: 'POST' }));
        promise.then(resp => {
            this.safeModeStatusChanged.next(ESafeModeStatus.Enabled);
            return resp;
        });
        promise.finally(() => this.SET_SAFE_MODE_SETTINGS({ loading: false }));
        return promise;
    }
    disableSafeMode() {
        if (!this.state.safeMode.enabled)
            return;
        const headers = authorizedHeaders(this.userService.apiToken);
        const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/safemode`;
        this.SET_SAFE_MODE_SETTINGS({ loading: true });
        const promise = jfetch(new Request(url, { headers, method: 'DELETE' }));
        promise.then(resp => {
            this.safeModeStatusChanged.next(ESafeModeStatus.Disabled);
        });
        promise.finally(() => this.SET_SAFE_MODE_SETTINGS({ loading: false }));
        return promise;
    }
    onSafeModeEnabled(endsAt) {
        this.SET_SAFE_MODE_SETTINGS({ enabled: true });
        if (endsAt)
            this.setSafeModeTimeout(Math.max(endsAt - Date.now(), 0));
        if (this.state.safeMode.clearRecentEvents) {
            this.SET_RECENT_EVENTS([]);
        }
        this.safeModeStatusChanged.next(ESafeModeStatus.Enabled);
    }
    onSafeModeDisabled() {
        this.SET_SAFE_MODE_SETTINGS({ enabled: false });
        this.safeModeStatusChanged.next(ESafeModeStatus.Disabled);
    }
    setMuteChatNotifs(val) {
        this.SET_MUTE_CHAT_NOTIFS(val);
    }
    ADD_RECENT_EVENT(events) {
        this.state.recentEvents = events.concat(this.state.recentEvents);
    }
    TOGGLE_RECENT_EVENT_READ(uuid) {
        this.state.recentEvents.forEach(event => {
            if (event.uuid === uuid) {
                event.read = !event.read;
            }
        });
    }
    SET_RECENT_EVENTS(eventArray) {
        this.state.recentEvents = eventArray;
    }
    SET_MUTED(muted) {
        this.state.muted = muted;
    }
    SET_MEDIA_SHARE(enabled) {
        this.state.mediaShareEnabled = enabled;
    }
    SET_FILTER_CONFIG(settings) {
        this.state.filterConfig = settings;
    }
    SET_SINGLE_FILTER_CONFIG(key, value) {
        this.state.filterConfig[key] = value;
    }
    SET_PAUSED(queuePaused) {
        this.state.queuePaused = queuePaused;
    }
    SET_SAFE_MODE_SETTINGS(patch) {
        this.state.safeMode = Object.assign(Object.assign({}, this.state.safeMode), patch);
    }
    SET_MUTE_CHAT_NOTIFS(val) {
        this.state.enableChatNotifs = val;
    }
};
RecentEventsService.initialState = {
    recentEvents: [],
    muted: false,
    enableChatNotifs: false,
    mediaShareEnabled: false,
    filterConfig: {
        donation: false,
        merch: false,
    },
    queuePaused: false,
    safeMode: {
        enabled: false,
        loading: false,
        clearChat: true,
        clearQueuedAlerts: true,
        clearRecentEvents: true,
        disableChatAlerts: true,
        disableFollowerAlerts: true,
        emoteOnly: true,
        followerOnly: true,
        subOnly: true,
        enableTimer: false,
        timeInMinutes: 60,
    },
};
__decorate([
    Inject()
], RecentEventsService.prototype, "hostsService", void 0);
__decorate([
    Inject()
], RecentEventsService.prototype, "userService", void 0);
__decorate([
    Inject()
], RecentEventsService.prototype, "windowsService", void 0);
__decorate([
    Inject()
], RecentEventsService.prototype, "websocketService", void 0);
__decorate([
    mutation()
], RecentEventsService.prototype, "ADD_RECENT_EVENT", null);
__decorate([
    mutation()
], RecentEventsService.prototype, "TOGGLE_RECENT_EVENT_READ", null);
__decorate([
    mutation()
], RecentEventsService.prototype, "SET_RECENT_EVENTS", null);
__decorate([
    mutation()
], RecentEventsService.prototype, "SET_MUTED", null);
__decorate([
    mutation()
], RecentEventsService.prototype, "SET_MEDIA_SHARE", null);
__decorate([
    mutation()
], RecentEventsService.prototype, "SET_FILTER_CONFIG", null);
__decorate([
    mutation()
], RecentEventsService.prototype, "SET_SINGLE_FILTER_CONFIG", null);
__decorate([
    mutation()
], RecentEventsService.prototype, "SET_PAUSED", null);
__decorate([
    mutation()
], RecentEventsService.prototype, "SET_SAFE_MODE_SETTINGS", null);
__decorate([
    mutation()
], RecentEventsService.prototype, "SET_MUTE_CHAT_NOTIFS", null);
RecentEventsService = __decorate([
    InitAfter('UserService')
], RecentEventsService);
export { RecentEventsService };
//# sourceMappingURL=recent-events.js.map