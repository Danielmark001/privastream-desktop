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
import { Inject } from 'services/core';
import { Module, apiEvent, apiMethod } from './module';
import { Subject } from 'rxjs';
export class TwitchModule extends Module {
    constructor() {
        super(...arguments);
        this.moduleName = 'Twitch';
        this.permissions = [];
        this.requiresHighlyPrivileged = true;
        this.onChat = new Subject();
    }
    hasSendChatScope() {
        return this.twitchService.state.hasChatWritePermission;
    }
    sendChatMessage(ctx, msg) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.twitchService.sendChatMessage(msg);
        });
    }
    requestNewScopes() {
        this.userService.startAuth('twitch', 'external', false, true);
    }
    subscribeToChat(ctx, channel) {
        const TWITCH_IRC_URL = 'wss://irc-ws.chat.twitch.tv';
        const BOT_USERNAME = 'StreamCoach';
        const OAUTH_TOKEN = `oauth:${this.userService.state.auth.platforms.twitch.token}`;
        const CHANNEL = channel || this.userService.state.auth.platforms.twitch.username;
        if (this.twitchChatSocket && this.twitchChatSocket.readyState === WebSocket.OPEN) {
            console.log('Twitch chat is already connected.');
            return;
        }
        if (this.twitchChatSocket && this.twitchChatSocket.readyState !== WebSocket.CLOSED) {
            this.twitchChatSocket.close();
        }
        const ws = new WebSocket(TWITCH_IRC_URL);
        this.twitchChatSocket = ws;
        ws.onopen = () => {
            console.log('Connected to Twitch IRC');
            ws.send(`PASS ${OAUTH_TOKEN}`);
            ws.send(`NICK ${BOT_USERNAME}`);
            ws.send(`JOIN #${CHANNEL}`);
        };
        ws.onmessage = event => {
            const message = event.data;
            if (message.startsWith('PING')) {
                ws.send('PONG :tmi.twitch.tv');
                return;
            }
            const chatMessageRegex = /:(\w+)!\w+@\w+\.tmi\.twitch\.tv PRIVMSG #\w+ :(.+)/;
            const match = message.match(chatMessageRegex);
            if (match) {
                const username = match[1];
                const chatMessage = match[2];
                console.log(`[${username}]: ${chatMessage}`);
                this.onChat.next({ username, message: chatMessage });
            }
        };
        ws.onclose = () => {
            console.log('Disconnected from Twitch IRC');
            if (this.twitchChatSocket === ws) {
                this.twitchChatSocket = undefined;
            }
        };
        ws.onerror = error => {
            console.error('WebSocket error:', error);
        };
    }
    unsubscribeFromChat() {
        if (this.twitchChatSocket) {
            this.twitchChatSocket.close();
            this.twitchChatSocket = undefined;
        }
    }
}
__decorate([
    Inject()
], TwitchModule.prototype, "twitchService", void 0);
__decorate([
    Inject()
], TwitchModule.prototype, "userService", void 0);
__decorate([
    apiMethod()
], TwitchModule.prototype, "hasSendChatScope", null);
__decorate([
    apiMethod()
], TwitchModule.prototype, "sendChatMessage", null);
__decorate([
    apiMethod()
], TwitchModule.prototype, "requestNewScopes", null);
__decorate([
    apiMethod()
], TwitchModule.prototype, "subscribeToChat", null);
__decorate([
    apiMethod()
], TwitchModule.prototype, "unsubscribeFromChat", null);
__decorate([
    apiEvent()
], TwitchModule.prototype, "onChat", void 0);
//# sourceMappingURL=twitch.js.map