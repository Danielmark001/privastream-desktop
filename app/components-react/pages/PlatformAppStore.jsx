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
import cx from 'classnames';
import Utils from 'services/utils';
import urlLib from 'url';
import BrowserView from 'components-react/shared/BrowserView';
import { GuestApiHandler } from 'util/guest-api-handler';
import * as remote from '@electron/remote';
import { Services } from 'components-react/service-provider';
import { Button } from 'antd';
import { EMenuItemKey } from 'services/side-nav';
import { $t } from 'services/i18n';
import styles from './PlatformAppStore.m.less';
import { useVuex } from 'components-react/hooks';
export default function PlatformAppStore(p) {
    const { UserService, PlatformAppsService, PlatformAppStoreService, NavigationService, HighlighterService, WindowsService, } = Services;
    const [highlighterInstalled, setHighlighterInstalled] = useState(HighlighterService.views.highlighterVersion !== '');
    const { hideStyleBlockers } = useVuex(() => ({
        hideStyleBlockers: WindowsService.state[Utils.getCurrentUrlParams().windowId].hideStyleBlockers,
    }));
    const [platformAppsUrl, setPlatformAppsUrl] = useState('');
    const [currentUrl, setCurrentUrl] = useState('');
    useEffect(() => {
        function getPlatformAppsUrl() {
            return __awaiter(this, void 0, void 0, function* () {
                const url = yield UserService.views.appStoreUrl(p.params);
                if (!url)
                    return;
                setPlatformAppsUrl(url);
            });
        }
        getPlatformAppsUrl();
    }, [p.params]);
    function onBrowserViewReady(view) {
        new GuestApiHandler().exposeApi(view.webContents.id, {
            reloadProductionApps,
            openLinkInBrowser,
            onPaypalAuthSuccess,
            navigateToApp,
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
        view.webContents.session.webRequest.onCompleted({ urls: ['https://platform.streamlabs.com/api/v1/app/*/uninstall'] }, () => Promise.resolve(() => PlatformAppsService.actions.refreshProductionApps()));
    }
    function onPaypalAuthSuccess(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            PlatformAppStoreService.actions.bindsPaypalSuccessCallback(callback);
        });
    }
    function openLinkInBrowser(url) {
        return __awaiter(this, void 0, void 0, function* () {
            remote.shell.openExternal(url);
        });
    }
    function reloadProductionApps() {
        return __awaiter(this, void 0, void 0, function* () {
            PlatformAppsService.actions.loadProductionApps();
        });
    }
    function navigateToApp(appId) {
        return __awaiter(this, void 0, void 0, function* () {
            NavigationService.actions.navigate('PlatformAppMainPage', { appId });
        });
    }
    if (!platformAppsUrl)
        return <></>;
    const heightDiff = currentUrl.includes('installed-apps') && HighlighterService.views.highlighterVersion !== ''
        ? '72'
        : '0';
    return (<>
      <BrowserView className={cx(styles.browserView, p.className)} style={{
            height: `calc(100% - ${heightDiff}px)`,
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
        }} src={platformAppsUrl} onReady={onBrowserViewReady} enableGuestApi emitUrlChange={url => {
            setCurrentUrl(url);
        }} hidden={hideStyleBlockers}/>
      {currentUrl.includes('installed-apps') && highlighterInstalled && (<div className={styles.otherInstalledAppsWrapper}>
          <div>{$t('Other installed apps:')}</div>
          <div className={styles.otherAppWrapper}>
            <div className={styles.textWrapper}>
              <h3 style={{ margin: 0 }}>AI Highlighter</h3>
              <p style={{ opacity: 0.3, margin: 0 }}>by Streamlabs</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button size="middle" type="default" onClick={() => {
                setHighlighterInstalled(false);
                HighlighterService.uninstallAiHighlighter();
            }}>
                {$t('Uninstall')}
              </Button>

              <Button size="middle" type="primary" onClick={() => {
                NavigationService.actions.navigate('Highlighter', { view: 'settings' }, EMenuItemKey.Highlighter);
            }}>
                {$t('Open')}
              </Button>
            </div>
          </div>
        </div>)}
    </>);
}
//# sourceMappingURL=PlatformAppStore.jsx.map