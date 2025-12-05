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
import { Node } from './node';
import { Inject } from 'services/core';
export class NodeMapNode extends Node {
    constructor() {
        super(...arguments);
        this.schemaVersion = 1;
    }
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const activeCollection = this.sceneCollectionsService.activeCollection;
            if (activeCollection === null || activeCollection === void 0 ? void 0 : activeCollection.sceneNodeMaps) {
                this.data = {
                    sceneNodeMaps: (_a = this.sceneCollectionsService) === null || _a === void 0 ? void 0 : _a.sceneNodeMaps,
                };
            }
        });
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if ((_a = this.data) === null || _a === void 0 ? void 0 : _a.sceneNodeMaps) {
                this.sceneCollectionsService.initNodeMaps(this.data.sceneNodeMaps);
            }
        });
    }
}
__decorate([
    Inject()
], NodeMapNode.prototype, "sceneCollectionsService", void 0);
//# sourceMappingURL=node-map.js.map