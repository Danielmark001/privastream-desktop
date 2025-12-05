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
export class ObsPluginsModule extends Module {
    constructor() {
        super(...arguments);
        this.moduleName = 'ObsPlugins';
        this.permissions = [];
    }
    initializeModule(ctx, dllFile) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.obsUserPluginsService.initializeModule(dllFile);
        });
    }
}
__decorate([
    Inject()
], ObsPluginsModule.prototype, "obsUserPluginsService", void 0);
__decorate([
    apiMethod()
], ObsPluginsModule.prototype, "initializeModule", null);
//# sourceMappingURL=obs-plugins.js.map