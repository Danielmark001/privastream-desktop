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
import { Module, apiMethod } from './module';
import { Inject } from 'services';
export class NativeComponentsModule extends Module {
    constructor() {
        super(...arguments);
        this.moduleName = 'NativeComponents';
        this.permissions = [];
        this.requiresHighlyPrivileged = true;
    }
    isAvatarUpdateAvailable() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.streamAvatarService.isAvatarUpdateAvailable();
        });
    }
    updateAvatar(ctx, progressCb, handler) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.streamAvatarService.updateAvatar(progressCb, handler);
        });
    }
    getAssets() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.streamAvatarService.getAssets();
        });
    }
    startAvatarProcess(ctx, renderOffscreen, handler) {
        this.streamAvatarService.startAvatarProcess(renderOffscreen, handler);
    }
    stopAvatarProcess() {
        this.streamAvatarService.stopAvatarProcess();
    }
}
__decorate([
    Inject()
], NativeComponentsModule.prototype, "streamAvatarService", void 0);
__decorate([
    apiMethod()
], NativeComponentsModule.prototype, "isAvatarUpdateAvailable", null);
__decorate([
    apiMethod()
], NativeComponentsModule.prototype, "updateAvatar", null);
__decorate([
    apiMethod()
], NativeComponentsModule.prototype, "getAssets", null);
__decorate([
    apiMethod()
], NativeComponentsModule.prototype, "startAvatarProcess", null);
__decorate([
    apiMethod()
], NativeComponentsModule.prototype, "stopAvatarProcess", null);
//# sourceMappingURL=native-components.js.map