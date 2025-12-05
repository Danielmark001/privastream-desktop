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
import { Service } from './core/service';
import { Inject } from 'services/core/injector';
import { authorizedHeaders, jfetch } from 'util/requests';
import { Subject } from 'rxjs';
import { importSocketIOClient } from '../util/slow-imports';
export class WebsocketService extends Service {
    constructor() {
        super(...arguments);
        this.socketEvent = new Subject();
    }
    init() {
        this.sceneCollectionsService.collectionInitialized.subscribe(() => {
            this.openSocketConnection();
        });
    }
    openSocketConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.userService.isLoggedIn) {
                console.warn('User must be logged in to make a socket connection');
                return;
            }
            if (!this.io) {
                this.io = (yield importSocketIOClient()).default;
            }
            if (this.socket) {
                this.socket.disconnect();
            }
            const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/socket-token`;
            const headers = authorizedHeaders(this.userService.apiToken);
            const request = new Request(url, { headers });
            jfetch(request)
                .then(json => json.socket_token)
                .then(token => {
                const url = `${this.hostsService.io}?token=${token}`;
                this.socket = this.io(url, { transports: ['websocket'] });
                this.socket.on('connect', () => this.log('Connection Opened'));
                this.socket.on('connect_error', (e) => this.log('Connection Error', e));
                this.socket.on('connect_timeout', () => this.log('Connection Timeout'));
                this.socket.on('error', () => this.log('Error'));
                this.socket.on('disconnect', () => this.log('Connection Closed'));
                this.socket.on('event', (e) => {
                    this.log('event', e);
                    this.socketEvent.next(e);
                });
            });
        });
    }
    log(message, ...args) {
        console.debug(`WS: ${message}`, ...args);
        if (this.appService.state.argv.includes('--network-logging')) {
            console.log(`WS: ${message}`);
        }
    }
}
__decorate([
    Inject()
], WebsocketService.prototype, "userService", void 0);
__decorate([
    Inject()
], WebsocketService.prototype, "hostsService", void 0);
__decorate([
    Inject()
], WebsocketService.prototype, "appService", void 0);
__decorate([
    Inject()
], WebsocketService.prototype, "sceneCollectionsService", void 0);
//# sourceMappingURL=websocket.js.map