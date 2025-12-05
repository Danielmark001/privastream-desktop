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
import { PropertiesManager } from './properties-manager';
import { Inject } from 'services/core/injector';
import * as fi from 'node-fontinfo';
import fs from 'fs';
import path from 'path';
import { $t } from 'services/i18n';
import { getSharedResource } from 'util/get-shared-resource';
import * as remote from '@electron/remote';
export class DefaultManager extends PropertiesManager {
    init() {
        if (!this.settings.mediaBackup)
            this.applySettings({ mediaBackup: {} });
        this.initializeMediaBackup();
        this.downloadGoogleFont();
        this.setupAutomaticGameCapture();
    }
    handleSettingsChange(settings) {
        if (this.obsSource.settings[this.mediaBackupFileSetting] !== this.currentMediaPath) {
            this.currentMediaPath = this.obsSource.settings[this.mediaBackupFileSetting];
            this.uploadNewMediaFile();
        }
    }
    initializeMediaBackup() {
        if (this.customizationService.state.mediaBackupOptOut) {
            this.applySettings({ mediaBackup: {} });
            return;
        }
        if (!this.userService.isLoggedIn)
            return;
        if (this.obsSource.id === 'ffmpeg_source') {
            this.mediaBackupFileSetting = 'local_file';
        }
        else if (this.obsSource.id === 'image_source') {
            this.mediaBackupFileSetting = 'file';
        }
        else if (this.obsSource.id === 'obs_stinger_transition') {
            this.mediaBackupFileSetting = 'path';
        }
        else if (this.obsSource.id === 'game_capture') {
            this.mediaBackupFileSetting = 'user_placeholder_image';
        }
        else {
            return;
        }
        this.ensureMediaBackupId();
        this.currentMediaPath = this.obsSource.settings[this.mediaBackupFileSetting];
        if (this.settings.mediaBackup.serverId && this.settings.mediaBackup.originalPath) {
            this.mediaBackupService
                .syncFile(this.settings.mediaBackup.localId, this.settings.mediaBackup.serverId, this.settings.mediaBackup.originalPath)
                .then(file => {
                if (file && !this.destroyed) {
                    this.currentMediaPath = file.filePath;
                    this.obsSource.update({ [this.mediaBackupFileSetting]: file.filePath });
                }
            });
        }
        else {
            this.uploadNewMediaFile();
        }
    }
    uploadNewMediaFile() {
        if (!this.mediaBackupFileSetting)
            return;
        if (!this.obsSource.settings[this.mediaBackupFileSetting])
            return;
        this.applySettings({
            mediaBackup: Object.assign(Object.assign({}, this.settings.mediaBackup), { serverId: null, originalPath: null }),
        });
        this.mediaBackupService
            .createNewFile(this.settings.mediaBackup.localId, this.obsSource.settings[this.mediaBackupFileSetting])
            .then(file => {
            if (file) {
                this.applySettings({
                    mediaBackup: {
                        localId: file.id,
                        serverId: file.serverId,
                        originalPath: this.obsSource.settings[this.mediaBackupFileSetting],
                    },
                });
            }
        });
    }
    ensureMediaBackupId() {
        if (this.settings.mediaBackup.localId)
            return;
        this.applySettings({
            mediaBackup: Object.assign(Object.assign({}, this.settings.mediaBackup), { localId: this.mediaBackupService.getLocalFileId() }),
        });
    }
    isMediaBackupSource() {
        return this.obsSource.id === 'ffmpeg_source';
    }
    downloadGoogleFont() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!['text_gdiplus', 'text_ft2_source'].includes(this.obsSource.id))
                return;
            const settings = this.obsSource.settings;
            const newSettings = {};
            if (!settings['custom_font'])
                return;
            if (fs.existsSync(settings.custom_font))
                return;
            const filename = path.parse(settings['custom_font']).base;
            const fontPath = yield this.fontLibraryService.downloadFont(filename);
            if (this.destroyed)
                return;
            const fontInfo = fi.getFontInfo(fontPath);
            if (!fontInfo) {
                newSettings['custom_font'] = null;
                newSettings['font'] = {
                    face: 'Arial',
                    flags: 0,
                };
                this.obsSource.update(newSettings);
                return;
            }
            newSettings['custom_font'] = fontPath;
            newSettings['font'] = Object.assign({}, settings['font']);
            newSettings['font'] = newSettings['font'] || {};
            newSettings['font']['face'] = fontInfo.family_name;
            newSettings['font']['flags'] =
                (fontInfo.italic ? 2 : 0) | (fontInfo.bold ? 1 : 0);
            this.obsSource.update(newSettings);
        });
    }
    setupAutomaticGameCapture() {
        var _a;
        if (!['game_capture', 'screen_capture'].includes(this.obsSource.id))
            return;
        this.obsSource.update({
            auto_capture_rules_path: path.join(remote.app.getPath('userData'), 'game_capture_list.json'),
            auto_placeholder_image: getSharedResource('capture-placeholder.png'),
            auto_placeholder_message: $t('Looking for a game to capture'),
            window_placeholder_image: getSharedResource('capture-placeholder.png'),
            window_placeholder_waiting_message: $t('Looking for a game to capture'),
            window_placeholder_missing_message: $t('Specified window is not a game'),
            capture_overlays: (_a = this.obsSource.settings.capture_overlays) !== null && _a !== void 0 ? _a : true,
        });
    }
}
__decorate([
    Inject()
], DefaultManager.prototype, "mediaBackupService", void 0);
__decorate([
    Inject()
], DefaultManager.prototype, "fontLibraryService", void 0);
__decorate([
    Inject()
], DefaultManager.prototype, "userService", void 0);
__decorate([
    Inject()
], DefaultManager.prototype, "customizationService", void 0);
//# sourceMappingURL=default-manager.js.map