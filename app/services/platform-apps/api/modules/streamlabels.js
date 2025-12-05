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
import { Inject } from 'services/core/injector';
export class StreamlabelsModule extends Module {
    constructor() {
        super(...arguments);
        this.moduleName = 'StreamLabels';
        this.permissions = [];
    }
    resetSession(_ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.streamlabelsService.restartSession();
        });
    }
}
__decorate([
    Inject()
], StreamlabelsModule.prototype, "streamlabelsService", void 0);
__decorate([
    apiMethod()
], StreamlabelsModule.prototype, "resetSession", null);
//# sourceMappingURL=streamlabels.js.map