var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { GuestTrack } from './guest-track';
import { MediasoupEntity } from './mediasoup-entity';
export class Guest extends MediasoupEntity {
    constructor(opts) {
        super(undefined);
        this.opts = opts;
        this.consumerCreatedPromise = new Promise(r => (this.consumerCreatedReady = r));
    }
    connect() {
        this.webrtcSubscription = this.guestCamService.webrtcEvent.subscribe(event => {
            if (event.type === 'consumerCreated' &&
                event.data.streamId === this.opts.remoteProducer.streamId) {
                this.onConsumerCreated(event);
            }
        });
        this.sendWebRTCRequest({
            type: 'createConsumer',
            data: this.opts.remoteProducer,
        });
    }
    onConsumerCreated(event) {
        this.log('Consumer Created', event);
        this.transportId = event.data.id;
        this.withMutex(() => __awaiter(this, void 0, void 0, function* () {
            if (!this.guestCamService.consumer.transportCreated) {
                yield this.guestCamService.consumer.createTransport(event);
            }
            if (this.opts.remoteProducer.type === 'screenshare') {
                this.screenshareTrack = new GuestTrack({
                    kind: 'video',
                    trackId: this.opts.remoteProducer.videoId,
                    socketId: this.opts.remoteProducer.socketId,
                    streamId: this.opts.remoteProducer.streamId,
                    transportId: this.transportId,
                    sourceId: this.sourceId,
                });
                this.screenshareTrack.requestTrack();
            }
            this.consumerCreatedReady();
            this.unlockMutex();
        }));
    }
    createTracks() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.opts.remoteProducer.audioId) {
                this.audioTrack = new GuestTrack({
                    kind: 'audio',
                    trackId: this.opts.remoteProducer.audioId,
                    socketId: this.opts.remoteProducer.socketId,
                    streamId: this.opts.remoteProducer.streamId,
                    transportId: this.transportId,
                    sourceId: this.sourceId,
                });
                yield this.audioTrack.connect();
            }
            if (this.opts.remoteProducer.videoId && this.opts.remoteProducer.type !== 'screenshare') {
                this.videoTrack = new GuestTrack({
                    kind: 'video',
                    trackId: this.opts.remoteProducer.videoId,
                    socketId: this.opts.remoteProducer.socketId,
                    streamId: this.opts.remoteProducer.streamId,
                    transportId: this.transportId,
                    sourceId: this.sourceId,
                });
                yield this.videoTrack.connect();
            }
            if (this.opts.remoteProducer.type === 'screenshare') {
                this.screenshareTrack = new GuestTrack({
                    kind: 'video',
                    trackId: this.opts.remoteProducer.videoId,
                    socketId: this.opts.remoteProducer.socketId,
                    streamId: this.opts.remoteProducer.streamId,
                    transportId: this.transportId,
                    sourceId: this.sourceId,
                });
                yield this.screenshareTrack.connect();
            }
        });
    }
    get streamId() {
        return this.opts.remoteProducer.streamId;
    }
    setSource(sourceId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.consumerCreatedPromise;
            this.withMutex(() => __awaiter(this, void 0, void 0, function* () {
                this.sourceId = sourceId;
                if (this.audioTrack) {
                    this.audioTrack.destroy();
                    this.audioTrack = null;
                }
                if (this.videoTrack) {
                    this.videoTrack.destroy();
                    this.videoTrack = null;
                }
                if (this.screenshareTrack) {
                    this.screenshareTrack.destroy();
                    this.screenshareTrack = null;
                }
                if (sourceId)
                    yield this.createTracks();
                this.unlockMutex();
            }));
        });
    }
    destroy() {
        if (this.webrtcSubscription) {
            this.webrtcSubscription.unsubscribe();
            this.webrtcSubscription = null;
        }
        [this.audioTrack, this.videoTrack, this.screenshareTrack].forEach(track => {
            if (track) {
                track.destroy();
            }
        });
        super.destroy();
    }
}
//# sourceMappingURL=guest.js.map