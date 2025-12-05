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
import { promises as fs, createReadStream, existsSync } from 'fs';
import path from 'path';
import { downloadFile, jfetch } from 'util/requests';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { importExtractZip } from 'util/slow-imports';
import { spawn } from 'child_process';
import { AI_HIGHLIGHTER_BUILDS_URL_PRODUCTION, AI_HIGHLIGHTER_BUILDS_URL_STAGING, FFMPEG_EXE, } from './constants';
import Utils from '../utils';
import * as remote from '@electron/remote';
import { Inject } from 'services';
export class AiHighlighterUpdater {
    constructor() {
        this.isCurrentlyUpdating = false;
        this.versionChecked = false;
        this.currentUpdate = null;
        this.manifestPath = path.resolve(AiHighlighterUpdater.basepath, 'manifest.json');
    }
    static startHighlighterProcess(videoUri, userId, milestonesPath, game) {
        const runHighlighterFromRepository = Utils.getHighlighterEnvironment() === 'local';
        if (runHighlighterFromRepository) {
            return AiHighlighterUpdater.startHighlighterFromRepository(videoUri, userId, milestonesPath, game);
        }
        const highlighterBinaryPath = path.resolve(path.join(remote.app.getPath('userData'), '..', 'streamlabs-highlighter'), 'bin', 'app.exe');
        const command = [videoUri, '--ffmpeg_path', FFMPEG_EXE];
        if (milestonesPath) {
            command.push('--milestones_file');
            command.push(milestonesPath);
        }
        if (game) {
            command.push('--game');
            command.push(game);
        }
        command.push('--use_sentry');
        command.push('--user_id', userId);
        return spawn(highlighterBinaryPath, command);
    }
    static startHighlighterFromRepository(videoUri, userId, milestonesPath, game) {
        const rootPath = '../highlighter-api/';
        const command = [
            'run',
            'python',
            `${rootPath}/highlighter_api/cli.py`,
            videoUri,
            '--ffmpeg_path',
            FFMPEG_EXE,
            '--loglevel',
            'debug',
            '--user_id',
            userId,
        ];
        if (milestonesPath) {
            command.push('--milestones_file');
            command.push(milestonesPath);
        }
        if (game) {
            command.push('--game');
            command.push(game);
        }
        return spawn('poetry', command, {
            cwd: rootPath,
        });
    }
    get updateInProgress() {
        return this.isCurrentlyUpdating;
    }
    get version() {
        var _a;
        return ((_a = this.manifest) === null || _a === void 0 ? void 0 : _a.version) || null;
    }
    getManifestUrl() {
        if (Utils.getHighlighterEnvironment() === 'staging') {
            const cacheBuster = Math.floor(Date.now() / 1000);
            return `${AI_HIGHLIGHTER_BUILDS_URL_STAGING}?t=${cacheBuster}`;
        }
        else {
            return AI_HIGHLIGHTER_BUILDS_URL_PRODUCTION;
        }
    }
    isNewVersionAvailable() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.versionChecked || Utils.getHighlighterEnvironment() === 'local') {
                return false;
            }
            this.versionChecked = true;
            console.log('checking for highlighter updates...');
            const manifestUrl = this.getManifestUrl();
            const newManifest = yield jfetch(new Request(manifestUrl));
            this.manifest = newManifest;
            if (!existsSync(this.manifestPath)) {
                console.log('manifest.json not found, initial download required');
                return true;
            }
            const currentManifest = JSON.parse(yield fs.readFile(this.manifestPath, 'utf-8'));
            if (newManifest.version !== currentManifest.version ||
                newManifest.timestamp > currentManifest.timestamp) {
                console.log(`new highlighter version available. ${currentManifest.version} -> ${newManifest.version}`);
                return true;
            }
            console.log('highlighter is up to date');
            return false;
        });
    }
    update(progressCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.isCurrentlyUpdating = true;
                this.currentUpdate = this.performUpdate(progressCallback);
                yield this.currentUpdate;
            }
            finally {
                this.isCurrentlyUpdating = false;
            }
        });
    }
    uninstall() {
        return __awaiter(this, void 0, void 0, function* () {
            if (existsSync(AiHighlighterUpdater.basepath)) {
                console.log('uninstalling AI Highlighter...');
                yield fs.rm(AiHighlighterUpdater.basepath, { recursive: true });
            }
        });
    }
    performUpdate(progressCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.manifest) {
                throw new Error('Manifest not found, cannot update');
            }
            this.usageStatisticsService.recordAnalyticsEvent('AIHighlighter', {
                type: 'performUpdateStart',
                version: this.manifest.version,
                timeStamp: Date.now(),
            });
            if (!existsSync(AiHighlighterUpdater.basepath)) {
                yield fs.mkdir(AiHighlighterUpdater.basepath);
            }
            const zipPath = path.resolve(AiHighlighterUpdater.basepath, 'ai-highlighter.zip');
            console.log('downloading new version of AI Highlighter...');
            if (existsSync(zipPath)) {
                yield fs.rm(zipPath);
            }
            yield downloadFile(this.manifest.url, zipPath, progressCallback);
            console.log('download complete');
            const checksum = yield this.sha256(zipPath);
            if (checksum !== this.manifest.checksum) {
                throw new Error('Checksum verification failed');
            }
            console.log('unzipping archive...');
            const unzipPath = path.resolve(AiHighlighterUpdater.basepath, 'bin-' + this.manifest.version);
            if (existsSync(unzipPath)) {
                yield fs.rm(unzipPath, { recursive: true });
            }
            yield this.unzip(zipPath, unzipPath);
            yield fs.rm(zipPath);
            console.log('unzip complete');
            const binPath = path.resolve(AiHighlighterUpdater.basepath, 'bin');
            const outdateVersionPresent = existsSync(binPath);
            if (outdateVersionPresent) {
                console.log('backing up outdated version...');
                const backupPath = path.resolve(AiHighlighterUpdater.basepath, 'bin.bkp');
                if (existsSync(backupPath)) {
                    yield fs.rm(backupPath, { recursive: true });
                }
                yield fs.rename(binPath, backupPath);
            }
            console.log('swapping new version...');
            yield fs.rename(unzipPath, binPath);
            console.log('cleaning up...');
            if (outdateVersionPresent) {
                yield fs.rm(path.resolve(AiHighlighterUpdater.basepath, 'bin.bkp'), { recursive: true });
            }
            console.log('updating manifest...');
            yield fs.writeFile(this.manifestPath, JSON.stringify(this.manifest));
            console.log('update complete');
            this.usageStatisticsService.recordAnalyticsEvent('AIHighlighter', {
                type: 'performUpdateComplete',
                version: this.manifest.version,
                timeStamp: Date.now(),
            });
        });
    }
    sha256(file) {
        return __awaiter(this, void 0, void 0, function* () {
            const hash = crypto.createHash('sha256');
            const stream = createReadStream(file);
            yield pipeline(stream, hash);
            return hash.digest('hex');
        });
    }
    unzip(zipPath, unzipPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const extractZip = (yield importExtractZip()).default;
            return new Promise((resolve, reject) => {
                extractZip(zipPath, { dir: unzipPath }, err => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    }
}
AiHighlighterUpdater.basepath = path.join(remote.app.getPath('userData'), '..', 'streamlabs-highlighter');
__decorate([
    Inject()
], AiHighlighterUpdater.prototype, "usageStatisticsService", void 0);
//# sourceMappingURL=ai-highlighter-updater.js.map