var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as remote from '@electron/remote';
import path from 'path';
import cloneDeep from 'lodash/cloneDeep';
import { I18nService } from 'services/i18n';
import Utils from 'services/utils';
import Spinner from 'components-react/shared/Spinner';
import { Services } from 'components-react/service-provider';
import electron from 'electron';
import { onUnload } from 'util/unload';
export default function BrowserView(p) {
    const { WindowsService, AppService, CustomizationService } = Services;
    const [loading, setLoading] = useState(true);
    const sizeContainer = useRef(null);
    const { hideStyleBlockers } = WindowsService.state[Utils.getWindowId()];
    const { theme } = CustomizationService.state;
    let currentPosition;
    let currentSize;
    const options = useMemo(() => {
        const opts = p.options ? cloneDeep(p.options) : { webPreferences: {} };
        if (!opts.webPreferences)
            opts.webPreferences = {};
        opts.webPreferences.nodeIntegration = false;
        if (p.enableGuestApi) {
            opts.webPreferences.contextIsolation = true;
            opts.webPreferences.preload = path.resolve(remote.app.getAppPath(), 'bundles', 'guest-api.js');
            opts.webPreferences.sandbox = false;
        }
        return opts;
    }, [p.options]);
    const browserView = useRef(null);
    function urlChange(_, url) {
        if (p.emitUrlChange) {
            p.emitUrlChange(url);
        }
    }
    useEffect(() => {
        browserView.current = new remote.BrowserView(options);
        const webContents = browserView.current.webContents;
        if (p.enableGuestApi) {
            electron.ipcRenderer.sendSync('webContents-enableRemote', webContents.id);
        }
        if (p.onReady)
            p.onReady(browserView.current);
        if (p.setLocale)
            I18nService.setBrowserViewLocale(browserView.current);
        webContents.on('did-finish-load', () => setLoading(false));
        webContents.on('did-navigate', urlChange);
        webContents.on('did-navigate-in-page', urlChange);
        remote.getCurrentWindow().addBrowserView(browserView.current);
        const shutdownSubscription = AppService.shutdownStarted.subscribe(destroyBrowserView);
        const cancelUnload = onUnload(() => destroyBrowserView());
        return () => {
            webContents.removeListener('did-navigate', urlChange);
            webContents.removeListener('did-navigate-in-page', urlChange);
            cancelUnload();
            destroyBrowserView();
            shutdownSubscription.unsubscribe();
        };
    }, []);
    useEffect(() => {
        const resizeInterval = window.setInterval(checkResize, 100);
        return () => clearInterval(resizeInterval);
    }, [loading]);
    useEffect(() => {
        loadUrl();
    }, [theme, p.src]);
    function destroyBrowserView() {
        if (browserView.current) {
            remote.getCurrentWindow().removeBrowserView(browserView.current);
            if (!browserView.current.webContents) {
                browserView.current = null;
                return;
            }
            browserView.current.webContents.close();
            if (!browserView.current.webContents) {
                browserView.current = null;
                return;
            }
            browserView.current.webContents.destroy();
            browserView.current = null;
        }
    }
    useEffect(() => {
        if (!loading && browserView.current && hideStyleBlockers) {
            remote.getCurrentWindow().removeBrowserView(browserView.current);
        }
        else if (!loading && browserView.current && !hideStyleBlockers) {
            remote.getCurrentWindow().addBrowserView(browserView.current);
        }
    }, [hideStyleBlockers]);
    function checkResize() {
        if (loading)
            return;
        if (!sizeContainer.current)
            return;
        if (!browserView.current)
            return;
        const rect = p.hidden || hideStyleBlockers
            ? { left: 0, top: 0, width: 0, height: 0 }
            : sizeContainer.current.getBoundingClientRect();
        if (currentPosition == null || currentSize == null || rectChanged(rect)) {
            currentPosition = { x: rect.left, y: rect.top };
            currentSize = { x: rect.width, y: rect.height };
            if (currentPosition && currentSize && browserView.current) {
                browserView.current.setBounds({
                    x: Math.round(currentPosition.x),
                    y: Math.round(currentPosition.y),
                    width: Math.round(currentSize.x),
                    height: Math.round(currentSize.y),
                });
            }
        }
    }
    function loadUrl() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (!browserView.current)
                return;
            try {
                yield browserView.current.webContents.loadURL(p.src);
            }
            catch (e) {
                if (e && typeof e === 'object') {
                    if ((e.hasOwnProperty('code') &&
                        ((_a = Object.getOwnPropertyDescriptor(e, 'code')) === null || _a === void 0 ? void 0 : _a.value) === 'ERR_ABORTED') ||
                        (e.hasOwnProperty('message') &&
                            ((_b = Object.getOwnPropertyDescriptor(e, 'code')) === null || _b === void 0 ? void 0 : _b.value.match(/\(\-3\) loading/)))) {
                        return;
                    }
                }
                throw e;
            }
        });
    }
    function rectChanged(rect) {
        if (!currentSize || !currentPosition)
            return false;
        return (rect.left !== currentPosition.x ||
            rect.top !== currentPosition.y ||
            rect.width !== currentSize.x ||
            rect.height !== currentSize.y);
    }
    if (loading) {
        return (<div style={{
                display: 'flex',
                flexGrow: 1,
                alignItems: 'center',
                justifyContent: 'center',
            }}>
        <Spinner visible pageLoader/>
      </div>);
    }
    function getCurrentUrl() {
        if (!browserView.current) {
            return '';
        }
        return browserView.current.webContents.getURL();
    }
    return <div style={Object.assign({ height: '100%' }, p.style)} ref={sizeContainer} className={p.className}/>;
}
//# sourceMappingURL=BrowserView.jsx.map