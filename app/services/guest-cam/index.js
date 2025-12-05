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
import { authorizedHeaders, jfetch } from 'util/requests';
import { importSocketIOClient } from 'util/slow-imports';
import { InitAfter, Inject, mutation, StatefulService, Service, ViewHandler } from 'services/core';
import { SourcesService } from 'services/sources';
import { Subject } from 'rxjs';
import { Producer } from './producer';
import { Consumer } from './consumer';
import { byOS, OS } from 'util/operating-systems';
import { Mutex } from 'util/mutex';
import Utils from 'services/utils';
import { AudioService, E_AUDIO_CHANNELS } from 'services/audio';
import { ENotificationType } from 'services/notifications';
import { $t } from 'services/i18n';
import { EStreamingState } from 'services/streaming';
import Vue from 'vue';
import { EDismissable } from 'services/dismissables';
import { EAvailableFeatures } from 'services/incremental-rollout';
class GuestCamViews extends ViewHandler {
    get videoSourceId() {
        return this.state.videoSourceId;
    }
    get videoSource() {
        return this.getServiceViews(SourcesService).getSource(this.videoSourceId);
    }
    get audioSourceId() {
        return this.state.audioSourceId;
    }
    get audioSource() {
        return this.getServiceViews(SourcesService).getSource(this.audioSourceId);
    }
    get screenshareSourceId() {
        return this.state.screenshareSourceId;
    }
    get screenshareSource() {
        return this.getServiceViews(SourcesService).getSource(this.screenshareSourceId);
    }
    get sources() {
        return this.getServiceViews(SourcesService).getSourcesByType('mediasoupconnector');
    }
    get sourceId() {
        var _a;
        return (_a = this.sources[0]) === null || _a === void 0 ? void 0 : _a.sourceId;
    }
    get source() {
        return this.getServiceViews(SourcesService).getSource(this.sourceId);
    }
    get deflection() {
        return this.getServiceViews(AudioService).getSource(this.sourceId).fader.deflection;
    }
    get inviteUrl() {
        return `https://join.streamlabs.com/j/${this.state.inviteHash}`;
    }
    get guestVisible() {
        var _a;
        return !((_a = this.source) === null || _a === void 0 ? void 0 : _a.forceHidden);
    }
    get vacantSources() {
        return this.sources.filter(source => {
            return this.state.guests.every(guest => guest.sourceId !== source.sourceId);
        });
    }
    getGuestByStreamId(streamId) {
        return this.state.guests.find(g => g.remoteProducer.streamId === streamId);
    }
    getSourceForGuest(streamId) {
        const guest = this.getGuestByStreamId(streamId);
        if (!guest)
            return null;
        if (!guest.sourceId)
            return null;
        return this.getServiceViews(SourcesService).getSource(guest.sourceId);
    }
    getGuestBySourceId(sourceId) {
        return this.state.guests.find(g => g.sourceId === sourceId);
    }
}
let GuestCamService = class GuestCamService extends StatefulService {
    constructor() {
        super(...arguments);
        this.webrtcEvent = new Subject();
        this.pluginMutex = new Mutex();
        this.socketMutex = new Mutex();
        this.disconnectedStreamIds = [];
        this.streamRecorded = false;
    }
    get views() {
        return new GuestCamViews(this.state);
    }
    init() {
        super.init();
        this.sourcesService.sourceRemoved.subscribe(s => {
            if (s.type === 'mediasoupconnector') {
                const guest = this.views.getGuestBySourceId(s.sourceId);
                if (guest) {
                    this.setGuestSource(guest.remoteProducer.streamId, null);
                }
                if (this.sourcesService.views.getSourcesByType('mediasoupconnector').length)
                    return;
                this.cleanUpSocketConnection();
            }
        });
        this.sceneCollectionsService.collectionSwitched.subscribe(() => {
            this.findDefaultSources();
        });
        this.scenesService.sceneSwitched.subscribe(() => {
            if (this.views.screenshareSource) {
                this.setScreenshareSource(null);
            }
        });
        this.streamingService.streamingStatusChange.subscribe(status => {
            if ([EStreamingState.Live, EStreamingState.Offline].includes(status)) {
                this.emitStreamingStatus();
            }
            if (status === EStreamingState.Offline) {
                this.streamRecorded = false;
            }
            if (status === EStreamingState.Live) {
                this.recordStreamAnalytics();
            }
        });
        this.incrementalRolloutService.featuresReady.then(() => {
            if (this.appService.state.onboarded) {
                this.dismissablesService.dismiss(EDismissable.CollabCamRollout);
            }
            else if (this.incrementalRolloutService.views.featureIsEnabled(EAvailableFeatures.guestCamProduction) &&
                this.dismissablesService.views.shouldShow(EDismissable.CollabCamRollout)) {
                this.dismissablesService.dismiss(EDismissable.CollabCamRollout);
                this.notificationsService.push({
                    type: ENotificationType.SUCCESS,
                    lifeTime: -1,
                    message: $t('You now have access to Collab Cam!'),
                    action: this.jsonrpcService.createRequest(Service.getResourceId(this.sourcesService), 'showGuestCamProperties'),
                });
            }
        });
        this.userService.userLogout.subscribe(() => {
            this.SET_MAX_GUESTS(2);
            this.SET_PRODUCE_OK(false);
            this.cleanUpSocketConnection();
        });
    }
    findDefaultSources() {
        if (!this.state.audioSourceId ||
            !this.sourcesService.views.getSource(this.state.audioSourceId)) {
            let audioSource = [
                E_AUDIO_CHANNELS.INPUT_1,
                E_AUDIO_CHANNELS.INPUT_2,
                E_AUDIO_CHANNELS.INPUT_3,
            ]
                .map(channel => {
                return this.sourcesService.views.getSourceByChannel(channel);
            })
                .find(s => s);
            if (!audioSource) {
                const sourceType = byOS({
                    [OS.Windows]: 'wasapi_input_capture',
                    [OS.Mac]: 'coreaudio_input_capture',
                });
                audioSource = this.sourcesService.views.sources.find(s => s.type === sourceType);
            }
            if (audioSource)
                this.SET_AUDIO_SOURCE(audioSource.sourceId);
        }
        if (!this.state.videoSourceId ||
            !this.sourcesService.views.getSource(this.state.videoSourceId)) {
            const sourceType = byOS({ [OS.Windows]: 'dshow_input', [OS.Mac]: 'av_capture_input' });
            const videoSource = this.sourcesService.views.sources.find(s => s.type === sourceType);
            if (videoSource)
                this.SET_VIDEO_SOURCE(videoSource.sourceId);
        }
    }
    emitStreamingStatus() {
        if (!this.socket)
            return;
        this.socket.emit('message', {
            target: '*',
            type: 'streamingStatusChange',
            data: {
                live: this.streamingService.views.streamingStatus === EStreamingState.Live,
                chatUrl: this.streamingService.views.chatUrl,
            },
        });
    }
    emitGuestStatus(streamId, visible) {
        this.socket.emit('message', {
            target: '*',
            type: 'guestStatus',
            data: {
                streamId,
                visible,
            },
        });
    }
    getSocketConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const roomUrl = this.urlService.getStreamlabsApi('streamrooms/current');
            const roomResult = yield jfetch(roomUrl, {
                headers: authorizedHeaders(this.userService.views.auth.apiToken),
            });
            this.log('Room result', roomResult);
            this.SET_INVITE_HASH(roomResult.hash);
            this.room = roomResult.room;
            let ioConfigResult;
            if ((_a = Utils.env.SLD_GUEST_CAM_HASH) !== null && _a !== void 0 ? _a : this.state.joinAsGuestHash) {
                const url = this.urlService.getStreamlabsApi(`streamrooms/io/config/${(_b = Utils.env.SLD_GUEST_CAM_HASH) !== null && _b !== void 0 ? _b : this.state.joinAsGuestHash}`);
                ioConfigResult = yield jfetch(url);
            }
            else {
                const ioConfigUrl = this.urlService.getStreamlabsApi('streamrooms/io/config');
                ioConfigResult = yield jfetch(ioConfigUrl, {
                    headers: authorizedHeaders(this.userService.views.auth.apiToken),
                });
            }
            this.log('io Config Result', ioConfigResult);
            this.SET_HOST_NAME(ioConfigResult.host.name);
            this.SET_MAX_GUESTS(ioConfigResult.host.maxGuests);
            return ioConfigResult;
        });
    }
    startListeningForGuests() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.socketMutex.do(() => __awaiter(this, void 0, void 0, function* () {
                if (!this.state.produceOk && !this.state.joinAsGuestHash)
                    return;
                if (this.socket)
                    return;
                if (!this.userService.views.isLoggedIn)
                    return;
                const ioConfigResult = yield this.getSocketConfig();
                yield this.openSocketConnection(ioConfigResult.url, ioConfigResult.token);
            }));
        });
    }
    regenerateInviteLink() {
        return __awaiter(this, void 0, void 0, function* () {
            const regenerateUrl = this.urlService.getStreamlabsApi('streamrooms/regenerate');
            const regenerateResult = yield jfetch(regenerateUrl, {
                headers: authorizedHeaders(this.userService.views.auth.apiToken),
                method: 'POST',
            });
            this.SET_INVITE_HASH(regenerateResult.hash);
        });
    }
    joinAsGuest(inviteHash) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!inviteHash)
                return;
            yield this.cleanUpSocketConnection();
            this.SET_JOIN_AS_GUEST(inviteHash);
            this.SET_PRODUCE_OK(false);
            if (this.views.sourceId) {
                yield this.startListeningForGuests();
                this.sourcesService.showGuestCamPropertiesBySourceId(this.views.sourceId);
            }
            else {
                this.sourcesService.showGuestCamProperties();
            }
        });
    }
    setProduceOk() {
        return __awaiter(this, void 0, void 0, function* () {
            this.SET_PRODUCE_OK(true);
            if (!this.state.inviteHash) {
                yield this.cleanUpSocketConnection();
                yield this.startListeningForGuests();
            }
            if (!this.producer && (this.consumer || this.state.joinAsGuestHash)) {
                this.startProducing();
            }
        });
    }
    startProducing() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.producer)
                return;
            try {
                this.ensureSourceAndFilters();
            }
            catch (e) {
                this.log('Unable to ensure filters but continuing with producer creation', e);
            }
            this.producer = new Producer(this.views.sources[0].sourceId);
            yield this.producer.addStream('camera', this.views.videoSourceId, this.views.audioSourceId);
            if (this.views.screenshareSource) {
                yield this.producer.addStream('screenshare', this.views.screenshareSourceId);
            }
        });
    }
    stopProducing() {
        this.producer.destroy();
        this.producer = null;
    }
    ensureSourceAndFilters() {
        if (!this.views.sourceId) {
            throw new Error('Tried to start producer but mediasoup source does not exist');
        }
        Object.keys(this.sourceFiltersService.state.filters).forEach(sourceId => {
            this.sourceFiltersService.views.filtersBySourceId(sourceId, true).forEach(filter => {
                if (['mediasoupconnector_afilter', 'mediasoupconnector_vfilter'].includes(filter.type)) {
                    this.sourceFiltersService.remove(sourceId, filter.name);
                }
            });
        });
    }
    getTurnConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (this.turnConfig && this.turnConfig.expires_at > Date.now()) {
                return this.turnConfig;
            }
            let turnConfigResult;
            if ((_a = Utils.env.SLD_GUEST_CAM_HASH) !== null && _a !== void 0 ? _a : this.state.joinAsGuestHash) {
                const url = this.urlService.getStreamlabsApi(`streamrooms/turn/config/${(_b = Utils.env.SLD_GUEST_CAM_HASH) !== null && _b !== void 0 ? _b : this.state.joinAsGuestHash}`);
                turnConfigResult = yield jfetch(url);
            }
            else {
                const turnConfigUrl = this.urlService.getStreamlabsApi('streamrooms/turn/config');
                turnConfigResult = yield jfetch(turnConfigUrl, {
                    headers: authorizedHeaders(this.userService.views.auth.apiToken),
                });
            }
            this.log('Fetched new TURN config', turnConfigResult);
            return turnConfigResult;
        });
    }
    openSocketConnection(url, token) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.io) {
                this.io = (yield importSocketIOClient()).default;
            }
            if (this.socket) {
                this.socket.disconnect();
            }
            this.socket = this.io(url, {
                transports: ['websocket'],
                reconnectionDelay: 5000,
                reconnectionDelayMax: 20000,
                timeout: 5000,
            });
            this.socket.on('connect', () => __awaiter(this, void 0, void 0, function* () {
                this.log('Socket Connected');
                this.auth = yield this.authenticateSocket(token);
                this.log('Socket Authenticated', this.auth);
                this.views.sources.forEach(source => {
                    source.updateSettings({ room: this.room });
                });
                this.makeObsRequest(this.views.sources[0].sourceId, 'func_load_device', this.auth.rtpCapabilities);
            }));
            this.socket.on('connect_error', (e) => this.log('Connection Error', e));
            this.socket.on('connect_timeout', () => this.log('Connection Timeout'));
            this.socket.on('error', () => this.log('Socket Error'));
            this.socket.on('disconnect', this.handleDisconnect.bind(this));
            this.socket.on('webrtc', (e) => this.onWebRTC(e));
        });
    }
    handleDisconnect(reason) {
        this.log('Socket Disconnected!', 'reason: ', reason);
        if (reason === 'io server disconnect') {
            this.getSocketConfig().then(ioConfigResult => {
                this.openSocketConnection(ioConfigResult.url, ioConfigResult.token);
            });
            return;
        }
        if (this.consumer) {
            this.consumer.destroy();
            this.consumer = null;
        }
        if (this.producer) {
            this.producer.destroy();
            this.producer = null;
        }
        this.CLEAR_GUESTS();
    }
    onWebRTC(event) {
        this.log('WebRTC Event', event);
        this.webrtcEvent.next(event);
        if (event.type === 'producerCreated') {
            this.onGuestJoin(event);
        }
        else if (event.type === 'consumerDestroyed') {
            this.onGuestLeave(event);
        }
    }
    onGuestJoin(event) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.socket.id === event.data.socketId) {
                this.log('onProducerCreated fired - ignoring our own producer');
                return;
            }
            if (this.disconnectedStreamIds.includes(event.data.streamId)) {
                this.log(`Ignoring previously disconnected stream id ${event.data.streamId}`);
                return;
            }
            this.log('New guest joined', event);
            const vacantSources = this.views.vacantSources;
            const sourceId = vacantSources.length ? vacantSources[0].sourceId : undefined;
            const notif = this.notificationsService.push({
                type: ENotificationType.SUCCESS,
                lifeTime: -1,
                message: $t('A guest has joined - click to show'),
                action: this.jsonrpcService.createRequest(Service.getResourceId(this.sourcesService), 'showGuestCamPropertiesBySourceId', this.views.sourceId),
            });
            this.ADD_GUEST({
                remoteProducer: event.data,
                sourceId,
                showOnStream: false,
                notificationId: notif.id,
            });
            if (!this.producer && this.state.produceOk) {
                this.startProducing();
            }
            if (!this.consumer) {
                this.consumer = new Consumer(this.views.sources[0].sourceId);
            }
            this.consumer.addGuest(event.data);
            if (sourceId) {
                this.setGuestSource(event.data.streamId, sourceId);
            }
            this.emitStreamingStatus();
            this.recordStreamAnalytics();
            this.recordGuestAnalytics();
            this.usageStatisticsService.recordFeatureUsage('CollabCam');
        });
    }
    markGuestAsRead(streamId) {
        const guest = this.views.getGuestByStreamId(streamId);
        if (!guest)
            return;
        this.notificationsService.markAsRead(guest.notificationId);
    }
    setGuestSource(streamId, sourceId) {
        const guest = this.views.getGuestByStreamId(streamId);
        if (!guest)
            return;
        const guestConsumer = this.consumer.guests.find(g => g.opts.remoteProducer.streamId === streamId);
        if (!guestConsumer)
            return;
        const source = this.sourcesService.views.getSource(sourceId);
        if (source) {
            const existingGuest = this.views.getGuestBySourceId(sourceId);
            if (existingGuest) {
                const existingConsumer = this.consumer.findGuestByStreamId(existingGuest.remoteProducer.streamId);
                if (existingConsumer) {
                    existingConsumer.setSource();
                }
                this.UPDATE_GUEST(existingGuest.remoteProducer.streamId, { sourceId: null });
            }
            source.setForceHidden(!guest.showOnStream);
            source.setForceMuted(!guest.showOnStream);
        }
        guestConsumer.setSource(sourceId);
        this.UPDATE_GUEST(streamId, { sourceId });
    }
    disconnectGuest(streamId_1) {
        return __awaiter(this, arguments, void 0, function* (streamId, kick = false) {
            const guest = this.views.getGuestByStreamId(streamId);
            if (guest) {
                if (kick) {
                    this.socket.emit('message', {
                        target: '*',
                        type: 'kick',
                        data: { streamId },
                    });
                    this.disconnectedStreamIds.push(guest.remoteProducer.streamId);
                }
                if (this.consumer) {
                    this.consumer.removeGuest(guest.remoteProducer.streamId);
                }
                this.REMOVE_GUEST(guest.remoteProducer.streamId);
            }
            if (this.state.guests.length === 0) {
                yield this.cleanUpSocketConnection();
                yield this.startListeningForGuests();
            }
        });
    }
    disconnectFromHost() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.state.joinAsGuestHash)
                return;
            this.SET_JOIN_AS_GUEST(null);
            yield this.cleanUpSocketConnection();
            yield this.startListeningForGuests();
        });
    }
    cleanUpSocketConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.socketMutex.synchronize();
            if (!this.socket)
                return;
            if (this.consumer) {
                this.consumer.destroy();
                this.consumer = null;
            }
            if (this.producer) {
                this.producer.destroy();
                this.producer = null;
            }
            this.socket.disconnect();
            this.socket = null;
            this.CLEAR_GUESTS();
        });
    }
    setVisibility(sourceId, visible) {
        const source = this.sourcesService.views.getSource(sourceId);
        if (!source)
            return;
        source.setForceHidden(!visible);
        source.setForceMuted(!visible);
        const guest = this.views.getGuestBySourceId(sourceId);
        this.UPDATE_GUEST(guest.remoteProducer.streamId, { showOnStream: visible });
        this.emitGuestStatus(guest.remoteProducer.streamId, visible);
    }
    onGuestLeave(event) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log('Guest left', event);
            this.disconnectGuest(event.data.streamId);
        });
    }
    authenticateSocket(token) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(r => {
                this.socket.emit('authenticate', { token, username: this.userService.views.platform.username }, r);
            });
        });
    }
    sendWebRTCRequest(data) {
        return new Promise(resolve => {
            this.socket.emit('webrtc', data, (result) => {
                if (result && result['error']) {
                    this.error(`Got error response from request ${data['type']}`);
                }
                resolve(result);
            });
        });
    }
    makeObsRequest(sourceId, func, arg) {
        let stringArg = arg !== null && arg !== void 0 ? arg : '';
        if (typeof stringArg === 'object') {
            stringArg = JSON.stringify(arg);
        }
        if (typeof stringArg !== 'string') {
            throw new Error(`Unsupported arg type for OBS call ${arg}`);
        }
        const source = this.sourcesService.views.getSource(sourceId);
        if (!source) {
            this.log(`Ignoring OBS call ${func} due to source not existing`);
            return;
        }
        let result = source.getObsInput().callHandler(func, stringArg).output;
        if (result !== '') {
            result = JSON.parse(result);
        }
        Object.keys(result).forEach(k => {
            if (typeof result[k] === 'string') {
                try {
                    result[k] = JSON.parse(result[k]);
                }
                catch (_a) { }
            }
        });
        return result;
    }
    log(...msgs) {
        console.log('[Guest Cam]', ...msgs);
    }
    error(...msgs) {
        console.error('[Guest Cam]', ...msgs);
    }
    setVideoSource(sourceId) {
        if (!this.sourcesService.views.getSource(sourceId))
            return;
        this.SET_VIDEO_SOURCE(sourceId);
        if (this.producer && this.views.sourceId) {
            this.producer.setStreamSource(sourceId, this.producer.cameraStreamId, 'video');
        }
    }
    setAudioSource(sourceId) {
        if (!this.sourcesService.views.getSource(sourceId))
            return;
        this.SET_AUDIO_SOURCE(sourceId);
        if (this.producer && this.views.sourceId) {
            this.producer.setStreamSource(sourceId, this.producer.cameraStreamId, 'audio');
        }
    }
    setScreenshareSource(sourceId) {
        this.SET_SCREENSHARE_SOURCE(sourceId !== null && sourceId !== void 0 ? sourceId : '');
        if (this.producer && this.views.sourceId) {
            if (sourceId) {
                if (this.producer.screenshareStreamId) {
                    this.producer.setStreamSource(sourceId, this.producer.screenshareStreamId, 'video');
                }
                else {
                    this.producer.addStream('screenshare', sourceId);
                }
            }
            else {
                if (this.producer.screenshareStreamId) {
                    this.producer.stopStream(this.producer.screenshareStreamId);
                }
            }
        }
    }
    recordStreamAnalytics() {
        if (this.streamingService.views.streamingStatus === EStreamingState.Live &&
            this.state.guests.length &&
            !this.streamRecorded) {
            this.usageStatisticsService.recordAnalyticsEvent('GuestCam', {
                type: 'stream',
                platforms: this.streamingService.views.enabledPlatforms,
            });
            this.streamRecorded = true;
        }
    }
    recordGuestAnalytics() {
        this.usageStatisticsService.recordAnalyticsEvent('GuestCam', {
            type: 'guestJoin',
            numGuests: this.state.guests.length,
        });
    }
    SET_PRODUCE_OK(val) {
        this.state.produceOk = val;
    }
    SET_VIDEO_SOURCE(sourceId) {
        this.state.videoSourceId = sourceId;
    }
    SET_AUDIO_SOURCE(sourceId) {
        this.state.audioSourceId = sourceId;
    }
    SET_SCREENSHARE_SOURCE(sourceId) {
        this.state.screenshareSourceId = sourceId;
    }
    SET_INVITE_HASH(hash) {
        this.state.inviteHash = hash;
    }
    ADD_GUEST(guest) {
        this.state.guests.push(guest);
    }
    UPDATE_GUEST(streamId, patch) {
        const guest = this.state.guests.find(g => g.remoteProducer.streamId === streamId);
        Object.keys(patch).forEach(key => {
            Vue.set(guest, key, patch[key]);
        });
    }
    REMOVE_GUEST(streamId) {
        this.state.guests = this.state.guests.filter(g => g.remoteProducer.streamId !== streamId);
    }
    CLEAR_GUESTS() {
        this.state.guests = [];
    }
    SET_JOIN_AS_GUEST(inviteHash) {
        this.state.joinAsGuestHash = inviteHash;
    }
    SET_HOST_NAME(name) {
        this.state.hostName = name;
    }
    SET_MAX_GUESTS(maxGuests) {
        this.state.maxGuests = maxGuests;
    }
};
GuestCamService.initialState = {
    produceOk: false,
    videoSourceId: '',
    audioSourceId: '',
    screenshareSourceId: '',
    inviteHash: '',
    guests: [],
    joinAsGuestHash: null,
    hostName: null,
    maxGuests: 2,
};
__decorate([
    Inject()
], GuestCamService.prototype, "userService", void 0);
__decorate([
    Inject()
], GuestCamService.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], GuestCamService.prototype, "scenesService", void 0);
__decorate([
    Inject()
], GuestCamService.prototype, "sourceFiltersService", void 0);
__decorate([
    Inject()
], GuestCamService.prototype, "hardwareService", void 0);
__decorate([
    Inject()
], GuestCamService.prototype, "sceneCollectionsService", void 0);
__decorate([
    Inject()
], GuestCamService.prototype, "notificationsService", void 0);
__decorate([
    Inject()
], GuestCamService.prototype, "jsonrpcService", void 0);
__decorate([
    Inject()
], GuestCamService.prototype, "urlService", void 0);
__decorate([
    Inject()
], GuestCamService.prototype, "streamingService", void 0);
__decorate([
    Inject()
], GuestCamService.prototype, "usageStatisticsService", void 0);
__decorate([
    Inject()
], GuestCamService.prototype, "appService", void 0);
__decorate([
    Inject()
], GuestCamService.prototype, "dismissablesService", void 0);
__decorate([
    Inject()
], GuestCamService.prototype, "incrementalRolloutService", void 0);
__decorate([
    mutation()
], GuestCamService.prototype, "SET_PRODUCE_OK", null);
__decorate([
    mutation()
], GuestCamService.prototype, "SET_VIDEO_SOURCE", null);
__decorate([
    mutation()
], GuestCamService.prototype, "SET_AUDIO_SOURCE", null);
__decorate([
    mutation()
], GuestCamService.prototype, "SET_SCREENSHARE_SOURCE", null);
__decorate([
    mutation()
], GuestCamService.prototype, "SET_INVITE_HASH", null);
__decorate([
    mutation()
], GuestCamService.prototype, "ADD_GUEST", null);
__decorate([
    mutation()
], GuestCamService.prototype, "UPDATE_GUEST", null);
__decorate([
    mutation()
], GuestCamService.prototype, "REMOVE_GUEST", null);
__decorate([
    mutation()
], GuestCamService.prototype, "CLEAR_GUESTS", null);
__decorate([
    mutation()
], GuestCamService.prototype, "SET_JOIN_AS_GUEST", null);
__decorate([
    mutation()
], GuestCamService.prototype, "SET_HOST_NAME", null);
__decorate([
    mutation()
], GuestCamService.prototype, "SET_MAX_GUESTS", null);
GuestCamService = __decorate([
    InitAfter('SceneCollectionsService')
], GuestCamService);
export { GuestCamService };
//# sourceMappingURL=index.js.map