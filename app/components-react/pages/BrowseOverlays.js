var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useState, useEffect } from 'react';
import path from 'path';
import urlLib from 'url';
import { Service } from 'services';
import Utils from 'services/utils';
import { ENotificationType } from 'services/notifications';
import { $t } from 'services/i18n';
import BrowserView from 'components-react/shared/BrowserView';
import { GuestApiHandler } from 'util/guest-api-handler';
import { downloadFile } from 'util/requests';
import * as remote from '@electron/remote';
import { Services } from 'components-react/service-provider';
export default function BrowseOverlays(p) {
    var _a, _b;
    const { UserService, SceneCollectionsService, NavigationService, OverlaysPersistenceService, WidgetsService, ScenesService, MagicLinkService, NotificationsService, JsonrpcService, RestreamService, MediaBackupService, } = Services;
    const [downloading, setDownloading] = useState(false);
    const [overlaysUrl, setOverlaysUrl] = useState('');
    useEffect(() => {
        function getOverlaysUrl() {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const url = yield UserService.actions.return.overlaysUrl(p.params.type, (_a = p.params) === null || _a === void 0 ? void 0 : _a.id, (_b = p.params) === null || _b === void 0 ? void 0 : _b.install);
                if (!url)
                    return;
                setOverlaysUrl(url);
            });
        }
        getOverlaysUrl();
    }, [p.params.type, (_a = p.params) === null || _a === void 0 ? void 0 : _a.id, (_b = p.params) === null || _b === void 0 ? void 0 : _b.install]);
    function onBrowserViewReady(view) {
        new GuestApiHandler().exposeApi(view.webContents.id, {
            installOverlay,
            installWidgets,
            installOverlayAndWidgets,
            getScenes,
            addCollectibleToScene,
            eligibleToRestream: () => {
                return Promise.resolve(true);
            },
        });
        view.webContents.setWindowOpenHandler(details => {
            const protocol = urlLib.parse(details.url).protocol;
            if (protocol === 'http:' || protocol === 'https:') {
                remote.shell.openExternal(details.url);
            }
            return { action: 'deny' };
        });
        view.webContents.on('did-finish-load', () => {
            if (Utils.isDevMode()) {
                view.webContents.openDevTools();
            }
        });
    }
    function installOverlay(url_1, name_1, progressCallback_1) {
        return __awaiter(this, arguments, void 0, function* (url, name, progressCallback, mergePlatform = false) {
            try {
                yield installOverlayBase(url, name, progressCallback, mergePlatform);
                NavigationService.actions.navigate('Studio');
            }
            catch (e) {
                if (e instanceof Error && e.message === 'REQUIRES_PLATFORM_MERGE') {
                    NavigationService.actions.navigate('PlatformMerge', { overlayUrl: url, overlayName: name });
                }
                else {
                    console.error(e);
                }
            }
        });
    }
    function getScenes() {
        return __awaiter(this, void 0, void 0, function* () {
            return ScenesService.views.scenes.map(scene => ({
                id: scene.id,
                name: scene.name,
                isActiveScene: scene.id === ScenesService.views.activeSceneId,
            }));
        });
    }
    function addCollectibleToScene(name, sceneId, assetURL, type) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!['image', 'video'].includes(type)) {
                throw new Error("Unsupported type. Use 'image' or 'video'");
            }
            if (!hasValidHost(assetURL, [
                'cdn.streamlabs.com',
                'streamlabs-marketplace-staging.streamlabs.com',
            ])) {
                throw new Error('Invalid asset URL');
            }
            const sourceType = type === 'video' ? 'ffmpeg_source' : 'image_source';
            const sourceName = name;
            const filename = path.basename(assetURL);
            yield MediaBackupService.actions.return.ensureMediaDirectory();
            const dest = path.join(MediaBackupService.mediaDirectory, filename);
            let localFile;
            try {
                yield downloadFile(assetURL, dest);
                localFile = dest;
            }
            catch (_a) {
                throw new Error('Error downloading file to local system');
            }
            const sourceSettings = type === 'video'
                ? { looping: true, local_file: localFile, display: 'horizontal' }
                : { file: localFile, display: 'horizontal' };
            return ScenesService.actions.return.createAndAddSource(sceneId, sourceName, sourceType, sourceSettings);
        });
    }
    function hasValidHost(url, trustedHosts) {
        const host = new urlLib.URL(url).hostname;
        return trustedHosts.includes(host);
    }
    function installOverlayBase(url_1, name_1, progressCallback_1) {
        return __awaiter(this, arguments, void 0, function* (url, name, progressCallback, mergePlatform = false) {
            return new Promise((resolve, reject) => {
                var _a;
                const host = new urlLib.URL(url).hostname;
                const trustedHosts = ['cdn.streamlabs.com'];
                if (!trustedHosts.includes(host)) {
                    reject(new Error(`Ignoring overlay install from untrusted host: ${host}`));
                }
                if (downloading) {
                    reject(new Error('Already installing a theme'));
                }
                if (mergePlatform &&
                    ((_a = UserService.state.auth) === null || _a === void 0 ? void 0 : _a.platforms.facebook) &&
                    RestreamService.views.canEnableRestream &&
                    !RestreamService.shouldGoLiveWithRestream) {
                    reject(new Error('REQUIRES_PLATFORM_MERGE'));
                }
                else {
                    setDownloading(true);
                    const sub = SceneCollectionsService.downloadProgress.subscribe(progressCallback);
                    SceneCollectionsService.actions.return
                        .installOverlay(url, name)
                        .then(() => {
                        sub.unsubscribe();
                        setDownloading(false);
                        resolve();
                    })
                        .catch((e) => {
                        sub.unsubscribe();
                        setDownloading(false);
                        reject(e);
                    });
                }
            });
        });
    }
    function installWidgets(urls) {
        return __awaiter(this, void 0, void 0, function* () {
            yield installWidgetsBase(urls);
            NavigationService.actions.navigate('Studio');
            NotificationsService.actions.push({
                type: ENotificationType.SUCCESS,
                lifeTime: 8000,
                showTime: false,
                message: $t('Widget Theme installed & activated. Click here to manage your Widget Profiles.'),
                action: JsonrpcService.createRequest(Service.getResourceId(MagicLinkService), 'openWidgetThemesMagicLink'),
            });
        });
    }
    function installWidgetsBase(urls) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const url of urls) {
                const host = new urlLib.URL(url).hostname;
                const trustedHosts = ['cdn.streamlabs.com'];
                if (!trustedHosts.includes(host)) {
                    console.error(`Ignoring widget install from untrusted host: ${host}`);
                    return;
                }
                const path = yield OverlaysPersistenceService.actions.return.downloadOverlay(url);
                yield WidgetsService.actions.return.loadWidgetFile(path, ScenesService.views.activeSceneId);
            }
        });
    }
    function installOverlayAndWidgets(overlayUrl, overlayName, widgetUrls) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield installOverlayBase(overlayUrl, overlayName);
                yield installWidgetsBase(widgetUrls);
                NavigationService.actions.navigate('Studio');
            }
            catch (e) {
                console.error(e);
            }
        });
    }
    if (!overlaysUrl)
        return React.createElement(React.Fragment, null);
    return (React.createElement(BrowserView, { className: p.className, onReady: onBrowserViewReady, src: overlaysUrl, style: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }, enableGuestApi: true, setLocale: true }));
}
//# sourceMappingURL=BrowseOverlays.js.map