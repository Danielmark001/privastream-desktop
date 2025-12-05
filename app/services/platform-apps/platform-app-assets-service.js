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
import Vue from 'vue';
import path from 'path';
import util from 'util';
import { tmpdir } from 'os';
import { mutation } from '../core/stateful-service';
import { PersistentStatefulService } from '../core/persistent-stateful-service';
import { Inject } from 'services/core/injector';
import { downloadFile, getChecksum } from 'util/requests';
import { InitAfter } from 'services/core/service-initialization-observer';
import url from 'url';
import fs from 'fs-extra';
const mkdtemp = util.promisify(fs.mkdtemp);
const copyFile = util.promisify(fs.copyFile);
let PlatformAppAssetsService = class PlatformAppAssetsService extends PersistentStatefulService {
    init() {
        super.init();
        Object.keys(this.state).forEach(appId => {
            Object.keys(this.state[appId]).forEach(assetPathOrUrl => {
                const assetUrl = this.assetPathOrUrlToUrl(appId, assetPathOrUrl);
                if (assetUrl !== assetPathOrUrl || this.state[appId][assetPathOrUrl].resourceId == null) {
                    this.REMOVE_ASSET(appId, assetPathOrUrl);
                }
            });
        });
        this.platformAppsService.appLoad.subscribe((app) => {
            this.updateAppAssets(app.id);
        });
    }
    getAsset(appId, assetUrl) {
        const appAssets = this.state[appId];
        return appAssets ? appAssets[assetUrl] : null;
    }
    hasAsset(appId, assetUrl) {
        return !!this.getAsset(appId, assetUrl);
    }
    addPlatformAppAsset(appId, assetUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const { originalUrl, filePath } = yield this.getAssetDiskInfo(appId, assetUrl);
            yield downloadFile(originalUrl, filePath);
            const checksum = yield getChecksum(filePath);
            this.ADD_ASSET(appId, assetUrl, checksum);
            return filePath;
        });
    }
    getAssetDiskInfo(appId, assetUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const assetsDir = yield this.getAssetsTargetDirectory(appId);
            const filePath = path.join(assetsDir, path.basename(assetUrl));
            return { filePath, originalUrl: assetUrl };
        });
    }
    updateAppAssets(appId) {
        return __awaiter(this, void 0, void 0, function* () {
            const assets = this.state[appId];
            if (!assets) {
                return;
            }
            const files = Object.keys(assets).map(assetUrl => {
                const oldChecksum = assets[assetUrl].checksum;
                return {
                    oldChecksum,
                    assetUrl,
                };
            });
            const tmpDir = yield mkdtemp(path.join(tmpdir(), `slobs-${appId}-`));
            const assetsToUpdate = yield Promise.all(files.map((asset) => __awaiter(this, void 0, void 0, function* () {
                const assetName = path.basename(asset.assetUrl);
                const tmpFile = path.join(tmpDir, assetName);
                yield downloadFile(asset.assetUrl, tmpFile);
                return Object.assign(Object.assign({}, assets[asset.assetUrl]), { assetUrl: asset.assetUrl, newChecksum: yield getChecksum(tmpFile), oldFile: path.join(yield this.getAssetsTargetDirectory(appId), assetName), newFile: tmpFile });
            }))).then(([...assets]) => assets.filter(asset => asset.checksum !== asset.newChecksum));
            assetsToUpdate.forEach((asset) => __awaiter(this, void 0, void 0, function* () {
                yield this.updateAssetResource(appId, asset);
            }));
            yield fs.remove(tmpDir);
        });
    }
    getAssetsTargetDirectory(appId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.ensureAssetsDir(this.getApp(appId));
        });
    }
    ensureAssetsDir(app) {
        const appAssetsDir = path.join(this.appService.appDataDirectory, 'Media', 'Apps', app.id);
        return fs.ensureDir(appAssetsDir).then(() => appAssetsDir);
    }
    linkAsset(appId, assetUrl, resourceType, resourceId) {
        this.LINK_ASSET(appId, assetUrl, resourceType, resourceId);
    }
    assetPathOrUrlToUrl(appId, assetPathOrUrl) {
        if (url.parse(assetPathOrUrl).protocol)
            return assetPathOrUrl;
        return this.platformAppsService.views.getAssetUrl(appId, assetPathOrUrl);
    }
    ADD_ASSET(appId, assetName, checksum) {
        if (!this.state[appId]) {
            Vue.set(this.state, appId, {});
        }
        Vue.set(this.state[appId], assetName, { checksum });
    }
    LINK_ASSET(appId, assetUrl, resourceType, resourceId) {
        const asset = this.getAsset(appId, assetUrl);
        if (asset) {
            Vue.set(asset, 'resourceId', resourceId);
            Vue.set(asset, 'resourceType', resourceType);
        }
    }
    updateChecksum(appId, assetUrl, checksum) {
        this.UPDATE_CHECKSUM(appId, assetUrl, checksum);
    }
    UPDATE_CHECKSUM(appId, assetId, checksum) {
        this.state[appId][assetId].checksum = checksum;
    }
    REMOVE_ASSET(appId, assetUrl) {
        Vue.delete(this.state[appId], assetUrl);
    }
    getApp(appId) {
        const app = this.platformAppsService.views.getApp(appId);
        if (!app) {
            throw new Error(`Invalid app: ${appId}`);
        }
        return app;
    }
    updateAssetResource(appId, asset) {
        return __awaiter(this, void 0, void 0, function* () {
            if (asset.resourceType !== 'transition') {
                throw new Error('Not implemented');
            }
            this.updateTransitionPath(asset.resourceId, '');
            yield copyFile(asset.newFile, asset.oldFile);
            this.updateTransitionPath(asset.resourceId, asset.oldFile);
            this.updateChecksum(appId, asset.assetUrl, asset.newChecksum);
        });
    }
    updateTransitionPath(transitionId, path) {
        const settings = this.transitionsService
            .getPropertiesFormData(transitionId)
            .map(setting => (setting.name === 'path' ? Object.assign(Object.assign({}, setting), { path }) : setting));
        this.transitionsService.setPropertiesFormData(transitionId, settings);
    }
};
PlatformAppAssetsService.defaultState = {};
__decorate([
    Inject()
], PlatformAppAssetsService.prototype, "platformAppsService", void 0);
__decorate([
    Inject()
], PlatformAppAssetsService.prototype, "transitionsService", void 0);
__decorate([
    Inject()
], PlatformAppAssetsService.prototype, "appService", void 0);
__decorate([
    mutation()
], PlatformAppAssetsService.prototype, "ADD_ASSET", null);
__decorate([
    mutation({ unsafe: true })
], PlatformAppAssetsService.prototype, "LINK_ASSET", null);
__decorate([
    mutation()
], PlatformAppAssetsService.prototype, "UPDATE_CHECKSUM", null);
__decorate([
    mutation()
], PlatformAppAssetsService.prototype, "REMOVE_ASSET", null);
PlatformAppAssetsService = __decorate([
    InitAfter('PlatformAppsService')
], PlatformAppAssetsService);
export { PlatformAppAssetsService };
//# sourceMappingURL=platform-app-assets-service.js.map