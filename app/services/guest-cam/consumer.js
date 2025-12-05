var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Guest } from './guest';
import { MediasoupEntity } from './mediasoup-entity';
export class Consumer extends MediasoupEntity {
    constructor() {
        super(...arguments);
        this.transportCreated = false;
        this.transportConnected = false;
        this.guests = [];
    }
    findGuestByStreamId(streamId) {
        return this.guests.find(g => g.streamId === streamId);
    }
    addGuest(remoteProducer) {
        const guest = new Guest({ remoteProducer });
        this.guests.push(guest);
        guest.connect();
        this.setConsumerPreferredLayers();
    }
    removeGuest(streamId) {
        const idx = this.guests.findIndex(guest => guest.streamId === streamId);
        if (idx > -1) {
            this.guests[idx].destroy();
            this.guests.splice(idx, 1);
        }
        this.setConsumerPreferredLayers();
    }
    setConsumerPreferredLayers() {
        this.guests.forEach(guest => {
            if (!guest.videoTrack)
                return;
            guest.videoTrack.setConsumerPreferredLayers();
        });
    }
    createTransport(event) {
        return __awaiter(this, void 0, void 0, function* () {
            this.transportCreated = true;
            const turnConfig = yield this.guestCamService.getTurnConfig();
            event.data['iceServers'] = [turnConfig];
            this.makeObsRequest('func_create_receive_transport', event.data);
        });
    }
    connectTransport(connectParams) {
        return __awaiter(this, void 0, void 0, function* () {
            this.sendWebRTCRequest({
                type: 'connectReceiveTransport',
                data: Object.assign({}, connectParams),
            });
            this.makeObsRequest('func_connect_result', 'true');
            this.transportConnected = true;
            this.log('Connected Receive Transport');
        });
    }
    destroy() {
        this.guests.forEach(guest => guest.destroy());
        this.makeObsRequest('func_stop_receiver');
        super.destroy();
    }
}
//# sourceMappingURL=consumer.js.map