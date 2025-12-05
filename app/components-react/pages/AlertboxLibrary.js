var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useEffect, useState } from 'react';
import urlLib from 'url';
import * as remote from '@electron/remote';
import { Service } from 'services';
import { ENotificationType } from 'services/notifications';
import { $t } from 'services/i18n';
import BrowserView from 'components-react/shared/BrowserView';
import { GuestApiHandler } from 'util/guest-api-handler';
import { Services } from 'components-react/service-provider';
export default function AlertboxLibrary(p) {
    var _a;
    const { NotificationsService, JsonrpcService, UserService, NavigationService, OverlaysPersistenceService, WidgetsService, ScenesService, MagicLinkService, } = Services;
    const [libraryUrl, setLibraryUrl] = useState('');
    useEffect(() => {
        function getLibraryUrl() {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                const url = yield UserService.actions.return.alertboxLibraryUrl((_a = p.params) === null || _a === void 0 ? void 0 : _a.id);
                if (!url)
                    return;
                setLibraryUrl(url);
            });
        }
        getLibraryUrl();
    }, [(_a = p.params) === null || _a === void 0 ? void 0 : _a.id]);
    function onBrowserViewReady(view) {
        new GuestApiHandler().exposeApi(view.webContents.id, {
            installWidgets,
        });
        view.webContents.setWindowOpenHandler(details => {
            const protocol = urlLib.parse(details.url).protocol;
            if (protocol === 'http:' || protocol === 'https:') {
                remote.shell.openExternal(details.url);
            }
            return { action: 'deny' };
        });
    }
    function installWidgets(urls, progressCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const url of urls) {
                const host = new urlLib.URL(url).hostname;
                const trustedHosts = ['cdn.streamlabs.com'];
                if (!trustedHosts.includes(host)) {
                    console.error(`Ignoring widget install from untrusted host: ${host}`);
                    return;
                }
                const path = yield OverlaysPersistenceService.downloadOverlay(url, progressCallback);
                yield WidgetsService.loadWidgetFile(path, ScenesService.views.activeSceneId);
            }
            NavigationService.actions.navigate('Studio');
            NotificationsService.actions.push({
                type: ENotificationType.SUCCESS,
                lifeTime: 8000,
                showTime: false,
                message: $t('Alert Box Theme installed & activated. Click here to manage your Widget Profiles.'),
                action: JsonrpcService.createRequest(Service.getResourceId(MagicLinkService), 'openWidgetThemesMagicLink'),
            });
        });
    }
    if (!libraryUrl)
        return React.createElement(React.Fragment, null);
    return (React.createElement(BrowserView, { className: p.className, style: { position: 'absolute', top: '0', left: '0', right: '0', bottom: '0' }, src: libraryUrl, enableGuestApi: true, setLocale: true, onReady: onBrowserViewReady }));
}
//# sourceMappingURL=AlertboxLibrary.js.map