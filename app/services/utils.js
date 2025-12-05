import URI from 'urijs';
import isEqual from 'lodash/isEqual';
import electron from 'electron';
import cloneDeep from 'lodash/cloneDeep';
import fs from 'fs';
import path from 'path';
import * as remote from '@electron/remote';
export default class Utils {
    static get env() {
        if (!Utils._env)
            Utils._env = remote.process.env;
        return Utils._env;
    }
    static applyProxy(target, source) {
        if (!source)
            return;
        const sourceObj = typeof source === 'function' ? source() : source;
        Object.keys(sourceObj).forEach(propName => {
            Object.defineProperty(target, propName, {
                configurable: true,
                get() {
                    return sourceObj[propName];
                },
            });
        });
    }
    static getCurrentUrlParams() {
        return this.getUrlParams(window.location.href);
    }
    static getWindowId() {
        return this.getCurrentUrlParams().windowId;
    }
    static getUrlParams(url) {
        return URI.parseQuery(URI.parse(url).query);
    }
    static isWorkerWindow() {
        return this.getWindowId() === 'worker';
    }
    static isMainWindow() {
        return this.getWindowId() === 'main';
    }
    static isChildWindow() {
        return this.getWindowId() === 'child';
    }
    static isOneOffWindow() {
        return !['worker', 'main', 'child'].includes(this.getWindowId());
    }
    static getMainWindow() {
        return remote.BrowserWindow.getAllWindows().find(win => Utils.getUrlParams(win.webContents.getURL()).windowId === 'main');
    }
    static getChildWindow() {
        return remote.BrowserWindow.getAllWindows().find(win => Utils.getUrlParams(win.webContents.getURL()).windowId === 'child');
    }
    static get isProduction() {
        return Utils.env.NODE_ENV === 'production';
    }
    static isDevMode() {
        return Utils.env.NODE_ENV !== 'production';
    }
    static getHighlighterEnvironment() {
        if (remote.process.argv.includes('--bundle-qa')) {
            return 'staging';
        }
        if (process.env.HIGHLIGHTER_ENV !== 'staging' && process.env.HIGHLIGHTER_ENV !== 'local') {
            return 'production';
        }
        return process.env.HIGHLIGHTER_ENV;
    }
    static isTestMode() {
        return Utils.env.NODE_ENV === 'test';
    }
    static isPreview() {
        return Utils.env.SLOBS_PREVIEW;
    }
    static isIpc() {
        return Utils.env.SLOBS_IPC;
    }
    static shouldUseLocalHost() {
        return Utils.env.SLOBS_USE_LOCAL_HOST;
    }
    static shouldUseBeta() {
        return (process.env.SLD_COMPILE_FOR_BETA || Utils.env.SLD_USE_BETA);
    }
    static rgbaToInt(r, g, b, a) {
        let value = r;
        value |= g << 8;
        value |= b << 16;
        value |= a << 24;
        return value;
    }
    static intToRgba(value) {
        return {
            r: value & 0x000000ff,
            g: (value & 0x0000ff00) >>> 8,
            b: (value & 0x00ff0000) >>> 16,
            a: (value & 0xff000000) >>> 24,
        };
    }
    static numberToBinnaryArray(num, size) {
        const result = [];
        num = Math.round(num);
        size = Math.round(size);
        while (size--) {
            result.unshift(num & 1);
            num = num >> 1;
        }
        return result;
    }
    static binnaryArrayToNumber(arr) {
        let result = 0;
        let ind = arr.length;
        let pow = 0;
        while (ind--) {
            result += arr[ind] * (1 << pow);
            pow++;
        }
        return result;
    }
    static getChangedParams(obj, patch) {
        const result = {};
        Object.keys(patch).forEach(key => {
            if (!isEqual(obj[key], patch[key]))
                result[key] = cloneDeep(patch[key]);
        });
        return result;
    }
    static getDeepChangedParams(obj, patch) {
        const result = {};
        if (obj == null)
            return patch;
        Object.keys(patch).forEach(key => {
            if (!isEqual(obj[key], patch[key])) {
                if (patch[key] && typeof patch[key] === 'object' && !Array.isArray(patch[key])) {
                    result[key] = this.getDeepChangedParams(obj[key], patch[key]);
                }
                else {
                    result[key] = patch[key];
                }
            }
        });
        return result;
    }
    static applyMixins(derivedCtor, baseCtors) {
        baseCtors.forEach(baseCtor => {
            Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
                const baseDescriptor = Object.getOwnPropertyDescriptor(baseCtor.prototype, name);
                const derivedDescriptor = Object.getOwnPropertyDescriptor(derivedCtor.prototype, name);
                if ((baseDescriptor && baseDescriptor.get) ||
                    (derivedDescriptor && derivedDescriptor.get)) {
                    return;
                }
                if (derivedCtor.prototype[name])
                    return;
                derivedCtor.prototype[name] = baseCtor.prototype[name];
            });
        });
    }
    static measure(msg, timestamp) {
        electron.ipcRenderer.send('measure-time', msg, timestamp || Date.now());
    }
    static copyToClipboard(str) {
        const el = document.createElement('textarea');
        el.value = str;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    }
    static sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
    static getReadableFileSizeString(fileSizeInBytes) {
        let i = -1;
        const byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
        do {
            fileSizeInBytes = fileSizeInBytes / 1024;
            i++;
        } while (fileSizeInBytes > 1024);
        return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
    }
    static propertyExists(prop) {
        return (obj) => obj[prop] != null;
    }
}
export function keys(target) {
    return Object.keys(target);
}
let appPath;
export function getAppPath() {
    appPath = appPath !== null && appPath !== void 0 ? appPath : remote.app.getAppPath();
    return appPath;
}
export function $i(mediaPath) {
    try {
        if (Utils.env.SLOBS_USE_CDN_MEDIA)
            throw new Error('Using CDN');
        const localMediaPath = require(`../../media/${mediaPath}`);
        if (!fs.existsSync(path.resolve(getAppPath(), localMediaPath)))
            throw new Error('Using CDN');
        return localMediaPath;
    }
    catch (e) {
        return `https://slobs-cdn.streamlabs.com/media/${mediaPath}`;
    }
}
//# sourceMappingURL=utils.js.map