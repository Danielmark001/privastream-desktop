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
import uuid from 'uuid/v4';
import electron from 'electron';
import defer from 'lodash/defer';
import URI from 'urijs';
import http from 'http';
import Utils from 'services/utils';
import * as remote from '@electron/remote';
import crypto from 'crypto';
import { Inject } from 'services/core';
import { jfetch } from 'util/requests';
export class AuthModule {
    startPkceAuth(authUrl_1, onWindowShow_1) {
        return __awaiter(this, arguments, void 0, function* (authUrl, onWindowShow, onWindowClose = () => { }, merge = false, external = true, windowOptions = {}) {
            const codeVerifier = crypto.randomBytes(64).toString('hex');
            const hash = crypto.createHash('sha256');
            hash.update(codeVerifier);
            const codeChallenge = hash
                .digest('base64')
                .replace(/\=/g, '')
                .replace(/\+/g, '-')
                .replace(/\//g, '_');
            const partition = `persist:${uuid()}`;
            let code = '';
            if (external) {
                code = yield this.externalLogin(authUrl, codeChallenge, merge, onWindowShow);
            }
            else {
                code = yield this.internalLogin(authUrl, codeChallenge, merge, partition, windowOptions, onWindowShow, onWindowClose);
            }
            try {
                const host = this.hostsService.streamlabs;
                const url = `https://${host}/api/v5/slobs/auth/data?code_verifier=${codeVerifier}&code=${code}`;
                const resp = yield jfetch(url);
                if (resp.data.platform === 'slid') {
                    return {
                        widgetToken: resp.data.token,
                        apiToken: resp.data.oauth_token,
                        primaryPlatform: null,
                        platforms: {},
                        slid: {
                            id: resp.data.platform_id,
                            username: resp.data.platform_username,
                        },
                        hasRelogged: true,
                    };
                }
                return {
                    widgetToken: resp.data.token,
                    apiToken: resp.data.oauth_token,
                    primaryPlatform: resp.data.platform,
                    platforms: {
                        [resp.data.platform]: {
                            type: resp.data.platform,
                            username: resp.data.platform_username,
                            token: resp.data.platform_token,
                            id: resp.data.platform_id,
                        },
                    },
                    partition,
                    hasRelogged: true,
                };
            }
            catch (error) {
                console.error('Authentication Error: ', error);
                return;
            }
        });
    }
    externalLogin(authUrl, codeChallenge, merge, onWindowShow) {
        return __awaiter(this, void 0, void 0, function* () {
            const code = yield new Promise(resolve => {
                if (this.authServer) {
                    this.authServer.close();
                    this.authServer.unref();
                }
                this.authServer = http.createServer((request, response) => {
                    const query = URI.parseQuery(URI.parse(request.url).query);
                    if (query['success']) {
                        if (query['success'] === 'false' ||
                            ['connected_with_another_account', 'unknown'].includes(query['reason'])) {
                            response.writeHead(302, {
                                Location: `https://${this.hostsService.streamlabs}/dashboard#/settings/account-settings/platforms`,
                            });
                            response.end();
                        }
                        else {
                            response.writeHead(302, {
                                Location: `https://${this.hostsService.streamlabs}/streamlabs-obs/login-success`,
                            });
                            response.end();
                        }
                        this.authServer.close();
                        this.authServer.unref();
                        this.authServer = null;
                        resolve(query['code']);
                    }
                    else {
                        response.writeHead(200);
                        response.write('Success');
                        response.end();
                    }
                });
                this.authServer.on('listening', () => {
                    const address = this.authServer.address();
                    if (address && typeof address !== 'string') {
                        const paramSeparator = merge ? '?' : '&';
                        const url = `${authUrl}${paramSeparator}port=${address.port}&code_challenge=${codeChallenge}&code_flow=true`;
                        electron.shell.openExternal(url);
                        onWindowShow();
                    }
                });
                this.authServer.listen(0, '127.0.0.1');
            });
            const win = Utils.getMainWindow();
            win.setAlwaysOnTop(true);
            win.show();
            win.focus();
            win.setAlwaysOnTop(false);
            return code;
        });
    }
    internalLogin(authUrl, codeChallenge, merge, partition, windowOptions, onWindowShow, onWindowClose) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => {
                let completed = false;
                const authWindow = new remote.BrowserWindow(Object.assign(Object.assign({}, windowOptions), { alwaysOnTop: false, show: false, webPreferences: {
                        partition,
                        nodeIntegration: false,
                    } }));
                authWindow.webContents.on('did-navigate', (e, url) => __awaiter(this, void 0, void 0, function* () {
                    const query = URI.parseQuery(URI.parse(url).query);
                    if (query['success']) {
                        completed = true;
                        authWindow.close();
                        resolve(query['code']);
                    }
                }));
                authWindow.once('ready-to-show', () => {
                    authWindow.show();
                    defer(onWindowShow);
                });
                authWindow.on('close', () => {
                    if (!completed)
                        onWindowClose();
                });
                const paramSeparator = merge ? '?' : '&';
                const url = `${authUrl}${paramSeparator}code_challenge=${codeChallenge}`;
                authWindow.removeMenu();
                authWindow.loadURL(url);
            });
        });
    }
}
__decorate([
    Inject()
], AuthModule.prototype, "hostsService", void 0);
//# sourceMappingURL=auth-module.js.map