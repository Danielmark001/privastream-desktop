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
import { VideoSettingsService } from '../../../settings-v2/video';
import { SourcesService } from '../../../sources';
import sortBy from 'lodash/sortBy';
import { ScalableRectangle } from '../../../../util/ScalableRectangle';
import { Inject } from 'services/core';
import { byOS, OS } from 'util/operating-systems';
export class WebcamNode extends Node {
    constructor() {
        super(...arguments);
        this.schemaVersion = 1;
        this.videoSettingsService = VideoSettingsService.instance;
        this.sourcesService = SourcesService.instance;
    }
    save(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const rect = new ScalableRectangle(context.sceneItem.rectangle);
            this.data = {
                width: rect.scaledWidth / this.videoSettingsService.baseWidth,
                height: rect.scaledHeight / this.videoSettingsService.baseHeight,
            };
        });
    }
    load(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const targetWidth = this.data.width * this.videoSettingsService.baseWidth;
            const targetHeight = this.data.height * this.videoSettingsService.baseHeight;
            const targetAspect = targetWidth / targetHeight;
            const input = context.sceneItem.getObsInput();
            let resolution;
            if (context.existing) {
                resolution = byOS({
                    [OS.Windows]: () => this.resStringToResolution(input.settings['resolution'], input.settings['resolution'], context.sceneItem),
                    [OS.Mac]: () => {
                        const selectedResolution = input.properties.get('preset').details.items.find(i => i.value === input.settings['preset']);
                        return this.resStringToResolution(selectedResolution.name, selectedResolution.value, context.sceneItem);
                    },
                });
            }
            else {
                resolution = this.performInitialSetup(context.sceneItem);
            }
            if (!resolution)
                return;
            const currentAspect = resolution.width / resolution.height;
            const crop = {
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
            };
            let scale;
            if (currentAspect >= targetAspect) {
                scale = targetHeight / resolution.height;
                const deltaWidth = (resolution.width * scale - targetWidth) / scale;
                crop.left = Math.floor(deltaWidth / 2);
                crop.right = Math.floor(deltaWidth / 2);
            }
            else {
                scale = targetWidth / resolution.width;
                const deltaHeight = (resolution.height * scale - targetHeight) / scale;
                crop.top = Math.floor(deltaHeight / 2);
                crop.bottom = Math.floor(deltaHeight / 2);
            }
            this.applyScaleAndCrop(context.sceneItem, scale, crop);
        });
    }
    performInitialSetup(item) {
        var _a;
        const targetWidth = this.data.width * this.videoSettingsService.baseWidth;
        const targetHeight = this.data.height * this.videoSettingsService.baseHeight;
        const targetAspect = targetWidth / targetHeight;
        const input = item.getObsInput();
        const deviceProperty = byOS({
            [OS.Windows]: () => input.properties.get('video_device_id'),
            [OS.Mac]: () => input.properties.get('device'),
        });
        if (deviceProperty.details.items.length === 0)
            return;
        const device = this.defaultHardwareService.state.defaultVideoDevice
            ? this.defaultHardwareService.state.defaultVideoDevice
            : (_a = deviceProperty.details.items.find(i => i.value)) === null || _a === void 0 ? void 0 : _a.value;
        if (!device)
            return;
        const resolutionOptions = byOS({
            [OS.Windows]: () => {
                input.update({ video_device_id: device, res_type: 1 });
                return input.properties.get('resolution').details.items.map(resString => {
                    return this.resStringToResolution(resString.value, resString.value, item);
                });
            },
            [OS.Mac]: () => {
                input.update({ device, use_preset: true });
                return input.properties.get('preset').details.items.map(resString => {
                    return this.resStringToResolution(resString.name, resString.value, item);
                });
            },
        });
        const grouped = new Map();
        resolutionOptions.forEach(res => {
            const ratio = res.width / res.height;
            const values = grouped.get(ratio) || [];
            values.push(res);
            grouped.set(ratio, values);
        });
        let possibleRatios = Array.from(grouped.keys());
        const biggerRatios = possibleRatios.filter(ratio => {
            return ratio >= targetAspect;
        });
        if (biggerRatios.length > 0)
            possibleRatios = biggerRatios;
        let possibleResolutions = [];
        possibleRatios.forEach(ratio => {
            const resolutions = grouped.get(ratio);
            possibleResolutions = possibleResolutions.concat(resolutions);
        });
        const sorted = sortBy(possibleResolutions, 'width');
        let bestResolution = sorted.find(res => {
            return res.width > targetWidth;
        });
        if (!bestResolution)
            bestResolution = sorted.reverse()[0];
        this.applyResolution(item, bestResolution.value);
        return bestResolution;
    }
    applyResolution(sceneItem, resolution) {
        const input = sceneItem.getObsInput();
        byOS({
            [OS.Windows]: () => input.update({ resolution }),
            [OS.Mac]: () => input.update({ preset: resolution }),
        });
    }
    applyScaleAndCrop(item, scale, crop) {
        item.setTransform({
            crop,
            position: {
                x: item.transform.position.x,
                y: item.transform.position.y,
            },
            scale: {
                x: scale,
                y: scale,
            },
        });
    }
    resStringToResolution(resString, value, sceneItem) {
        if (!resString) {
            console.error('No resolution string found.  Performing initial setup instead.');
            return this.performInitialSetup(sceneItem);
        }
        const parts = resString.split('x');
        return {
            value,
            width: parseInt(parts[0], 10),
            height: parseInt(parts[1], 10),
        };
    }
}
__decorate([
    Inject()
], WebcamNode.prototype, "defaultHardwareService", void 0);
//# sourceMappingURL=webcam.js.map