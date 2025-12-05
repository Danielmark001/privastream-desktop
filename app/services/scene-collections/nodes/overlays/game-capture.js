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
import { Node } from '../node';
import uniqueId from 'lodash/uniqueId';
import path from 'path';
import fs from 'fs';
import { Inject } from 'services/core';
export class GameCaptureNode extends Node {
    constructor() {
        super(...arguments);
        this.schemaVersion = 2;
    }
    save(context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            let placeholderFile;
            const settings = context.sceneItem.getObsInput().settings;
            if (settings.user_placeholder_image && settings.user_placeholder_use) {
                placeholderFile = `${uniqueId()}${path.parse(settings.user_placeholder_image).ext}`;
                const destination = path.join(context.assetsPath, placeholderFile);
                fs.writeFileSync(destination, fs.readFileSync(settings.user_placeholder_image));
            }
            const width = this.videoSettingsService.baseResolutions[(_a = context.sceneItem.display) !== null && _a !== void 0 ? _a : 'horizontal'].baseWidth;
            const height = this.videoSettingsService.baseResolutions[(_b = context.sceneItem.display) !== null && _b !== void 0 ? _b : 'vertical'].baseHeight;
            this.data = {
                placeholderFile,
                width,
                height,
            };
        });
    }
    load(context) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.data.placeholderFile) {
                return;
            }
            const filePath = path.join(context.assetsPath, this.data.placeholderFile);
            context.sceneItem.getObsInput().update({
                user_placeholder_image: filePath,
                user_placeholder_use: true,
            });
            context.sceneItem.getSource().replacePropertiesManager('default', {});
        });
    }
    migrate(version) {
        if (version === 1) {
            this.data.width = 1920;
            this.data.height = 1080;
        }
    }
}
__decorate([
    Inject()
], GameCaptureNode.prototype, "videoSettingsService", void 0);
//# sourceMappingURL=game-capture.js.map