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
import { Service, Inject } from 'services';
import { RootNode } from './nodes/overlays/root';
import { ScenesNode } from './nodes/overlays/scenes';
import { SlotsNode } from './nodes/overlays/slots';
import { ImageNode } from './nodes/overlays/image';
import { TextNode } from './nodes/overlays/text';
import { WebcamNode } from './nodes/overlays/webcam';
import { VideoNode } from './nodes/overlays/video';
import { TransitionNode } from './nodes/overlays/transition';
import { GameCaptureNode } from './nodes/overlays/game-capture';
import { parse } from './parse';
import { StreamlabelNode } from './nodes/overlays/streamlabel';
import { WidgetNode } from './nodes/overlays/widget';
import { IconLibraryNode } from './nodes/overlays/icon-library';
import fs from 'fs';
import os from 'os';
import path from 'path';
import uuid from 'uuid/v4';
import { SceneSourceNode } from './nodes/overlays/scene';
import { importExtractZip } from '../../util/slow-imports';
import { downloadFile } from 'util/requests';
import { NodeMapNode } from './nodes/node-map';
import { SmartBrowserNode } from './nodes/overlays/smartBrowserSource';
const NODE_TYPES = {
    RootNode,
    ScenesNode,
    SlotsNode,
    ImageNode,
    TextNode,
    WebcamNode,
    VideoNode,
    StreamlabelNode,
    WidgetNode,
    TransitionNode,
    SceneSourceNode,
    GameCaptureNode,
    IconLibraryNode,
    NodeMapNode,
    SmartBrowserNode,
};
export class OverlaysPersistenceService extends Service {
    downloadOverlay(url, progressCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            const overlayFilename = `${uuid()}.overlay`;
            const overlayPath = path.join(os.tmpdir(), overlayFilename);
            yield downloadFile(url, overlayPath, progressCallback);
            return overlayPath;
        });
    }
    loadOverlay(overlayFilePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const overlayName = path.parse(overlayFilePath).name;
            const assetsPath = path.join(this.overlaysDirectory, overlayName);
            this.ensureOverlaysDirectory();
            yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const extractZip = (yield importExtractZip()).default;
                extractZip(overlayFilePath, { dir: assetsPath }, err => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            }));
            const configPath = path.join(assetsPath, 'config.json');
            const data = fs.readFileSync(configPath).toString();
            const root = parse(data, NODE_TYPES);
            yield root.load({ assetsPath });
            this.scenesService.makeSceneActive(this.scenesService.views.scenes[0].id);
            this.selectionService.views.globalSelection.reset();
        });
    }
    saveOverlay(overlayFilePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const root = new RootNode();
            const assetsPath = fs.mkdtempSync(path.join(os.tmpdir(), 'overlay-assets'));
            yield root.save({ assetsPath });
            const config = JSON.stringify(root, null, 2);
            const configPath = path.join(assetsPath, 'config.json');
            fs.writeFileSync(configPath, config);
            const output = fs.createWriteStream(overlayFilePath);
            const archiver = (yield import('archiver')).default;
            const archive = archiver('zip', { zlib: { level: 9 } });
            yield new Promise(resolve => {
                output.on('close', (err) => {
                    resolve();
                });
                archive.pipe(output);
                archive.directory(assetsPath, false);
                archive.finalize();
            });
        });
    }
    ensureOverlaysDirectory() {
        if (!fs.existsSync(this.overlaysDirectory)) {
            fs.mkdirSync(this.overlaysDirectory);
        }
    }
    get overlaysDirectory() {
        return path.join(this.appService.appDataDirectory, 'Overlays');
    }
}
__decorate([
    Inject()
], OverlaysPersistenceService.prototype, "scenesService", void 0);
__decorate([
    Inject()
], OverlaysPersistenceService.prototype, "selectionService", void 0);
__decorate([
    Inject()
], OverlaysPersistenceService.prototype, "appService", void 0);
//# sourceMappingURL=overlays.js.map