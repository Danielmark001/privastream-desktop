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
export class MediasoupEntity {
    constructor(sourceId) {
        this.sourceId = sourceId;
        this.destroyed = false;
    }
    sendWebRTCRequest(data) {
        return this.guestCamService.sendWebRTCRequest(data);
    }
    getSource() {
        return this.sourcesService.views.getSource(this.sourceId);
    }
    makeObsRequest(func, arg) {
        if (this.destroyed) {
            throw new Error('Attempted to make OBS request from destroyed entity');
        }
        const ret = this.guestCamService.makeObsRequest(this.sourceId, func, arg);
        this.log('OBS REQUEST', func, arg, ret);
        return ret;
    }
    log(...args) {
        this.guestCamService.log(...args);
    }
    withMutex(fun) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.mutexUnlockFunc) {
                this.mutexUnlockFunc = yield this.guestCamService.pluginMutex.wait();
            }
            try {
                const val = fun();
                if (val instanceof Promise) {
                    return yield val;
                }
                return val;
            }
            catch (e) {
                this.log('Got error executing within mutex, unlocking mutex', e);
                this.unlockMutex();
                throw e;
            }
        });
    }
    unlockMutex() {
        if (this.mutexUnlockFunc) {
            this.mutexUnlockFunc();
            this.mutexUnlockFunc = null;
        }
    }
    destroy() {
        this.destroyed = true;
        this.unlockMutex();
    }
}
__decorate([
    Inject()
], MediasoupEntity.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], MediasoupEntity.prototype, "scenesService", void 0);
__decorate([
    Inject()
], MediasoupEntity.prototype, "guestCamService", void 0);
//# sourceMappingURL=mediasoup-entity.js.map