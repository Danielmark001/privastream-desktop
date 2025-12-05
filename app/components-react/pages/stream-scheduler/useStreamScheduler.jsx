var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import cloneDeep from 'lodash/cloneDeep';
import { Services } from '../../service-provider';
import { getPlatformService } from '../../../services/platforms';
import { assertIsDefined, getDefined } from '../../../util/properties-type-guards';
import { message } from 'antd';
import { $t } from '../../../services/i18n';
import styles from './StreamScheduler.m.less';
import React from 'react';
import { initStore, useController } from '../../hooks/zustand';
export const StreamSchedulerCtx = React.createContext(null);
export function useStreamScheduler() {
    return useController(StreamSchedulerCtx);
}
export class StreamSchedulerController {
    constructor() {
        this.store = initStore({
            isLoading: false,
            isEventsLoaded: false,
            events: [],
            isModalVisible: false,
            selectedEventId: '',
            time: 0,
            selectedPlatform: this.platforms[0],
            platformSettings: this.defaultPlatformSettings,
            defaultPlatformSettings: this.defaultPlatformSettings,
        });
        this.getPlatformDisplayName = this.streamingView.getPlatformDisplayName;
    }
    init() {
        this.loadEvents();
    }
    get defaultPlatformSettings() {
        const defaultSettings = {
            facebook: cloneDeep(Services.FacebookService.state.settings),
            youtube: cloneDeep(Services.YoutubeService.state.settings),
        };
        defaultSettings.youtube.broadcastId = '';
        defaultSettings.facebook.liveVideoId = '';
        return defaultSettings;
    }
    setForm(form) {
        this.form = form;
    }
    get streamingView() {
        return Services.StreamingService.views;
    }
    get selectedEvent() {
        return this.store.events.find(ev => this.store.selectedEventId === ev.id);
    }
    loadEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            this.reset();
            const [fbEvents, ytEvents] = yield Promise.all([this.fetchFbEvents(), this.fetchYTBEvents()]);
            this.setEvents([...fbEvents, ...ytEvents]);
        });
    }
    fetchYTBEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.platforms.includes('youtube'))
                return [];
            const ytActions = Services.YoutubeService.actions;
            try {
                yield ytActions.return.prepopulateInfo();
                const broadcasts = yield ytActions.return.fetchBroadcasts();
                return broadcasts.map(broadcast => convertYTBroadcastToEvent(broadcast));
            }
            catch (e) {
                message.error({
                    content: $t('Failed to load YouTube events'),
                    className: styles.schedulerError,
                });
                return [];
            }
        });
    }
    fetchFbEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.platforms.includes('facebook'))
                return [];
            const fbActions = Services.FacebookService.actions;
            try {
                yield fbActions.return.prepopulateInfo();
                const liveVideos = yield fbActions.return.fetchAllVideos();
                return liveVideos.map(video => convertFBLiveVideoToEvent(video));
            }
            catch (e) {
                message.error({
                    content: $t('Failed to load Facebook events'),
                    className: styles.schedulerError,
                });
                return [];
            }
        });
    }
    get platforms() {
        return this.streamingView.linkedPlatforms.filter(platform => this.streamingView.supports('stream-schedule', [platform]));
    }
    get isUpdateMode() {
        return !!this.store.selectedEventId;
    }
    get fbSettings() {
        return getDefined(this.store.platformSettings.facebook);
    }
    get ytSettings() {
        return getDefined(this.store.platformSettings.youtube);
    }
    get primaryPlatform() {
        return getDefined(Services.UserService.views.platform).type;
    }
    recordFeatureUsage(featureName) {
        Services.UsageStatisticsService.actions.recordFeatureUsage(featureName);
    }
    showNewEventModal(platform, selectedTime) {
        const today = new Date().setHours(0, 0, 0, 0);
        const time = selectedTime || this.store.time;
        const isPastDate = time < today;
        if (isPastDate) {
            message.error({
                content: $t('You can not schedule to a past date'),
                className: styles.schedulerError,
            });
            return;
        }
        this.store.setState(s => {
            s.selectedPlatform = platform;
            s.isModalVisible = true;
        });
        this.setTime(time.valueOf());
    }
    showEditEventModal(eventId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.recordFeatureUsage('StreamSchedulerView');
            const event = getDefined(this.store.events.find(ev => eventId === ev.id));
            if (event.platform === 'youtube') {
                const ytSettings = yield Services.YoutubeService.actions.return.fetchStartStreamOptionsForBroadcast(event.id);
                this.SHOW_EDIT_EVENT_MODAL(event, ytSettings);
            }
            else {
                const fbDestination = getDefined(event.facebook);
                const fbSettings = yield Services.FacebookService.actions.return.fetchStartStreamOptionsForVideo(event.id, fbDestination.destinationType, fbDestination.destinationId);
                this.SHOW_EDIT_EVENT_MODAL(event, fbSettings);
            }
        });
    }
    submit() {
        return __awaiter(this, void 0, void 0, function* () {
            this.recordFeatureUsage('StreamSchedulerEdit');
            try {
                yield this.form.validateFields();
            }
            catch (e) {
                message.error({
                    content: $t('Invalid settings. Please check the form'),
                    className: styles.schedulerError,
                });
                return false;
            }
            this.showLoader();
            if (this.isUpdateMode) {
                yield this.saveExistingEvent();
            }
            else {
                yield this.saveNewEvent();
            }
            return true;
        });
    }
    saveExistingEvent() {
        return __awaiter(this, void 0, void 0, function* () {
            const { selectedPlatform, selectedEventId } = this.store;
            const streamSettings = getDefined(this.store.platformSettings[selectedPlatform]);
            if (selectedPlatform === 'youtube') {
                const ytSettings = cloneDeep(streamSettings);
                ytSettings.scheduledStartTime = this.store.time;
                const video = yield Services.YoutubeService.actions.return.updateBroadcast(selectedEventId, ytSettings);
                this.setEvent(video.id, convertYTBroadcastToEvent(video));
            }
            else {
                const event = getDefined(this.selectedEvent);
                const fbOptions = getDefined(event.facebook);
                let video;
                try {
                    video = yield Services.FacebookService.actions.return.updateLiveVideo(selectedEventId, streamSettings);
                }
                catch (e) {
                    this.handleError(e);
                    return;
                }
                this.setEvent(video.id, convertFBLiveVideoToEvent(Object.assign(Object.assign({}, video), fbOptions)));
                Services.UsageStatisticsService.actions.recordAnalyticsEvent('ScheduleStream', {
                    type: 'EditStream',
                    platform: selectedPlatform,
                    streamId: video.id,
                });
            }
            this.closeModal();
        });
    }
    saveNewEvent() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { selectedPlatform, time } = this.store;
            const streamSettings = getDefined(this.store.platformSettings[selectedPlatform]);
            const service = getPlatformService(selectedPlatform);
            assertIsDefined(service.scheduleStream);
            let video;
            try {
                video = yield service.scheduleStream(time, streamSettings);
            }
            catch (e) {
                const message = (e === null || e === void 0 ? void 0 : e.error)
                    ? e === null || e === void 0 ? void 0 : e.error.replace(/^Error: /, '')
                    : $t('Connection Failed');
                const error = Object.assign(Object.assign({}, e), { message, status: (_a = e === null || e === void 0 ? void 0 : e.status) !== null && _a !== void 0 ? _a : 423 });
                this.handleError(error);
                return;
            }
            let event;
            if (selectedPlatform === 'youtube') {
                event = convertYTBroadcastToEvent(video);
            }
            else {
                assertIsDefined(this.fbSettings);
                const fbSettings = getDefined(this.fbSettings);
                const destinationId = service.views.getDestinationId(fbSettings);
                event = convertFBLiveVideoToEvent(Object.assign(Object.assign({}, video), { destinationType: fbSettings.destinationType, destinationId }));
            }
            this.addEvent(event);
            Services.UsageStatisticsService.actions.recordAnalyticsEvent('ScheduleStream', {
                type: 'NewStream',
                platform: selectedPlatform,
                streamId: event.id,
            });
            this.closeModal();
        });
    }
    handleError(err) {
        console.error('Stream Scheduler Error: ', err);
        if (this.store.selectedPlatform === 'facebook') {
            message.error({
                content: $t('Please schedule no further than 7 days in advance and no sooner than 10 minutes in advance.'),
                className: styles.schedulerError,
            });
        }
        else if ((err === null || err === void 0 ? void 0 : err.status) === 423) {
            message.error({
                content: `${'Authentication Error'}: ${err.message}`,
                className: styles.schedulerError,
            });
        }
        else {
            message.error({
                content: $t('Can not schedule the stream for the given date/time'),
                className: styles.schedulerError,
            });
        }
        this.hideLoader();
    }
    goLive() {
        return __awaiter(this, void 0, void 0, function* () {
            this.recordFeatureUsage('StreamSchedulerGoLive');
            const event = getDefined(this.selectedEvent);
            const prepopulateOptions = {
                [event.platform]: this.store.platformSettings[event.platform],
            };
            if (!(yield this.submit()))
                return;
            yield Services.StreamingService.actions.showGoLiveWindow(prepopulateOptions);
        });
    }
    remove() {
        const { selectedPlatform, selectedEventId } = this.store;
        this.showLoader();
        if (selectedPlatform === 'youtube') {
            Services.YoutubeService.actions.return.removeBroadcast(selectedEventId);
        }
        else {
            const event = getDefined(this.selectedEvent);
            const fbOptions = getDefined(event.facebook);
            Services.FacebookService.actions.return.removeLiveVideo(selectedEventId, fbOptions);
        }
        this.REMOVE_EVENT(selectedEventId);
        this.closeModal();
    }
    SHOW_EDIT_EVENT_MODAL(event, platformSettings) {
        this.store.setState(s => {
            s.selectedEventId = event.id;
            s.selectedPlatform = event.platform;
            s.platformSettings[event.platform] = platformSettings;
            s.isModalVisible = true;
            s.time = event.date;
        });
    }
    closeModal() {
        this.store.setState(s => {
            s.selectedEventId = '';
            s.isModalVisible = false;
            s.platformSettings = this.defaultPlatformSettings;
            s.isLoading = false;
        });
    }
    updatePlatform(platform, patch) {
        this.store.setState(s => {
            Object.assign(s.platformSettings[platform], patch);
        });
    }
    setTime(time) {
        this.store.setState(s => {
            s.time = time;
            if (s.selectedPlatform === 'facebook') {
                getDefined(s.platformSettings.facebook).event_params.start_time = time;
            }
            else {
                getDefined(s.platformSettings.youtube).scheduledStartTime = time;
            }
        });
    }
    reset() {
        this.store.setState(s => {
            s.events = [];
            s.platformSettings = this.defaultPlatformSettings;
        });
    }
    setEvents(events) {
        this.store.setState(s => {
            s.isEventsLoaded = true;
            s.events = events;
        });
    }
    addEvent(event) {
        this.store.setState(s => {
            s.events.push(event);
        });
    }
    setEvent(id, event) {
        this.store.setState(s => {
            const ind = s.events.findIndex(ev => ev.id === id);
            s.events.splice(ind, 1, event);
        });
    }
    REMOVE_EVENT(id) {
        this.store.setState(s => {
            s.events = s.events.filter(ev => ev.id !== id);
        });
    }
    showLoader() {
        this.store.setState(s => {
            s.isLoading = true;
        });
    }
    hideLoader() {
        this.store.setState(s => {
            s.isLoading = false;
        });
    }
}
function convertYTBroadcastToEvent(ytBroadcast) {
    let status = 'completed';
    if (ytBroadcast.status.lifeCycleStatus === 'created' ||
        ytBroadcast.status.lifeCycleStatus === 'ready') {
        status = 'scheduled';
    }
    return {
        platform: 'youtube',
        id: ytBroadcast.id,
        date: new Date(ytBroadcast.snippet.scheduledStartTime || ytBroadcast.snippet.actualStartTime).valueOf(),
        title: ytBroadcast.snippet.title,
        status,
    };
}
function convertFBLiveVideoToEvent(fbLiveVideo) {
    const date = fbLiveVideo.broadcast_start_time || fbLiveVideo.planned_start_time;
    assertIsDefined(date);
    return {
        platform: 'facebook',
        id: fbLiveVideo.id,
        date: new Date(date).valueOf(),
        title: fbLiveVideo.title,
        status: 'scheduled',
        facebook: {
            destinationType: fbLiveVideo.destinationType,
            destinationId: fbLiveVideo.destinationId,
        },
    };
}
//# sourceMappingURL=useStreamScheduler.jsx.map