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
import { MediasoupEntity } from './mediasoup-entity';
import uuid from 'uuid/v4';
import { Inject } from 'services/core';
import { EFilterDisplayType } from 'services/source-filters';
export class Producer extends MediasoupEntity {
    constructor() {
        super(...arguments);
        this.streams = [];
    }
    get cameraStreamId() {
        var _a;
        return (_a = this.streams.find(s => s.type === 'camera')) === null || _a === void 0 ? void 0 : _a.id;
    }
    get screenshareStreamId() {
        var _a;
        return (_a = this.streams.find(s => s.type === 'screenshare')) === null || _a === void 0 ? void 0 : _a.id;
    }
    addStream(type, videoSourceId, audioSourceId) {
        return this.withMutex(() => __awaiter(this, void 0, void 0, function* () {
            const videoSource = this.sourcesService.views.getSource(videoSourceId);
            const videoFilterId = uuid();
            const audioFilterId = uuid();
            const streamId = uuid();
            this.streams.push({
                id: streamId,
                type,
                videoFilterId,
                audioFilterId,
            });
            if (videoSourceId)
                this.setStreamSource(videoSourceId, streamId, 'video');
            if (audioSourceId)
                this.setStreamSource(audioSourceId, streamId, 'audio');
            const result = yield this.sendWebRTCRequest({
                type: 'createProducer',
                data: {
                    streamId,
                    type: type === 'camera' ? 'stream' : 'screenshare',
                    name: this.userService.views.platform.username,
                    tracks: audioSourceId ? 2 : 1,
                },
            });
            if (!this.transportId) {
                const turnConfig = yield this.guestCamService.getTurnConfig();
                result['iceServers'] = [turnConfig];
                this.makeObsRequest('func_create_send_transport', result);
            }
            let encodings;
            if (videoSource) {
                encodings =
                    type === 'camera'
                        ? this.getCameraEncodingParameters(videoSource.height)
                        : this.getScreenshareEncodingParameters(videoSource.height);
            }
            else {
                this.log('WARNING: Video source was not available at stream creation. Simulcast was not enabled.');
            }
            const videoProduceResult = this.makeObsRequest('func_create_video_producer', {
                id: videoFilterId,
                encodings,
            });
            this.log('Got Video Produce Result', videoProduceResult);
            if (!this.transportId) {
                if (!videoProduceResult.connect_params) {
                    throw new Error('Did not receive connect params, yet send transport is not yet connected!');
                }
                yield this.sendWebRTCRequest({
                    type: 'connectSendTransport',
                    data: videoProduceResult.connect_params,
                });
                this.log('Connected Send Transport');
                videoProduceResult.produce_params = this.makeObsRequest('func_connect_result', 'true').produce_params;
                this.transportId = videoProduceResult.produce_params.transportId;
            }
            const r = yield this.sendWebRTCRequest({
                type: 'addProducerTrack',
                data: {
                    streamId,
                    producerTransportId: videoProduceResult.produce_params.transportId,
                    kind: videoProduceResult.produce_params.kind,
                    rtpParameters: videoProduceResult.produce_params.rtpParameters,
                },
            });
            if (type === 'screenshare') {
                const stream = this.streams.find(s => s.id === streamId);
                stream.screenShareId = r.id;
            }
            this.makeObsRequest('func_produce_result', 'true');
            if (audioSourceId) {
                const audioProduceParams = this.makeObsRequest('func_create_audio_producer', {
                    id: audioFilterId,
                }).produce_params;
                this.log('Got Audio Produce Params', audioProduceParams);
                yield this.sendWebRTCRequest({
                    type: 'addProducerTrack',
                    data: {
                        streamId,
                        producerTransportId: audioProduceParams.transportId,
                        kind: audioProduceParams.kind,
                        rtpParameters: audioProduceParams.rtpParameters,
                    },
                });
                this.makeObsRequest('func_produce_result', 'true');
            }
            this.unlockMutex();
        }));
    }
    setStreamSource(sourceId, streamId, type) {
        const stream = this.streams.find(s => s.id === streamId);
        const existingSourceId = type === 'video' ? stream.videoSourceId : stream.audioSourceId;
        if (existingSourceId) {
            this.removeFiltersFromSource(existingSourceId);
        }
        this.removeFiltersFromSource(sourceId);
        this.setupFiltersOnSource(sourceId, type, type === 'video' ? stream.videoFilterId : stream.audioFilterId);
        const key = type === 'video' ? 'videoSourceId' : 'audioSourceId';
        stream[key] = sourceId;
    }
    setupFiltersOnSource(sourceId, type, filterId) {
        let filterType = 'mediasoupconnector_afilter';
        const source = this.sourcesService.views.getSource(sourceId);
        if (!source) {
            this.log('Tried to set up filter on source that does not exist!');
            return;
        }
        if (type === 'video') {
            if (['dshow_input', 'av_capture_input'].includes(source.type)) {
                filterType = 'mediasoupconnector_vfilter';
            }
            else {
                filterType = 'mediasoupconnector_vsfilter';
            }
        }
        this.sourceFiltersService.add(sourceId, filterType, uuid(), { room: this.guestCamService.room, producerId: filterId }, EFilterDisplayType.Hidden);
    }
    removeFiltersFromSource(sourceId) {
        this.sourceFiltersService.views.filtersBySourceId(sourceId, true).forEach(filter => {
            if ([
                'mediasoupconnector_afilter',
                'mediasoupconnector_vfilter',
                'mediasoupconnector_vsfilter',
            ].includes(filter.type)) {
                this.sourceFiltersService.remove(sourceId, filter.name);
            }
        });
    }
    getCameraEncodingParameters(height) {
        if (height > 720) {
            return [
                { maxBitrate: 256000, scaleResolutionDownBy: 4 },
                { maxBitrate: 1200000, scaleResolutionDownBy: 2 },
                { maxBitrate: 2400000, scaleResolutionDownBy: 1 },
            ];
        }
        if (height > 480) {
            return [
                { maxBitrate: 256000, scaleResolutionDownBy: 4 },
                { maxBitrate: 512000, scaleResolutionDownBy: 2 },
                { maxBitrate: 1500000, scaleResolutionDownBy: 1 },
            ];
        }
        if (height > 360) {
            return [
                { maxBitrate: 300000, scaleResolutionDownBy: 2 },
                { maxBitrate: 600000, scaleResolutionDownBy: 1 },
                { maxBitrate: 600000, scaleResolutionDownBy: 1 },
            ];
        }
        return [
            { maxBitrate: 200000, scaleResolutionDownBy: 2 },
            { maxBitrate: 500000, scaleResolutionDownBy: 1 },
            { maxBitrate: 500000, scaleResolutionDownBy: 1 },
        ];
    }
    getScreenshareEncodingParameters(height) {
        if (height > 720) {
            return [{ maxBitrate: 2600000, scaleResolutionDownBy: 1 }];
        }
        if (height > 480) {
            return [{ maxBitrate: 2000000, scaleResolutionDownBy: 1 }];
        }
        if (height > 360) {
            return [{ maxBitrate: 1500000, scaleResolutionDownBy: 2 }];
        }
        return [{ maxBitrate: 1000000, scaleResolutionDownBy: 3 }];
    }
    stopStream(streamId) {
        const stream = this.streams.find(s => s.id === streamId);
        if (!stream)
            return;
        this.makeObsRequest('func_stop_producer', stream.videoFilterId);
        if (stream.audioSourceId)
            this.makeObsRequest('func_stop_producer', stream.audioFilterId);
        if (stream.screenShareId) {
            this.sendWebRTCRequest({
                type: 'closeProducerTrack',
                data: {
                    streamId: stream.id,
                    producerTransportId: this.transportId,
                    trackId: stream.screenShareId,
                },
            });
        }
        else {
            this.sendWebRTCRequest({
                type: 'closeProducerTrack',
                data: { streamId: stream.id, producerTransportId: this.transportId },
            });
        }
        this.streams = this.streams.filter(s => s.id !== streamId);
    }
    destroy() {
        this.makeObsRequest('func_stop_sender');
        this.streams.forEach(stream => {
            this.stopStream(stream.id);
        });
        super.destroy();
    }
}
__decorate([
    Inject()
], Producer.prototype, "userService", void 0);
__decorate([
    Inject()
], Producer.prototype, "guestCamService", void 0);
__decorate([
    Inject()
], Producer.prototype, "sourceFiltersService", void 0);
__decorate([
    Inject()
], Producer.prototype, "sourcesService", void 0);
//# sourceMappingURL=producer.js.map