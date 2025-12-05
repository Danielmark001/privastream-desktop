var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Subject } from 'rxjs';
import { $t } from 'services/i18n';
import { Inject, Service } from 'services/core';
import fs from 'fs-extra';
import path from 'path';
import * as obs from '../../obs-api';
import { RealmObject } from './realm';
const THEME_BACKGROUNDS = {
    'night-theme': { r: 23, g: 36, b: 45 },
    'prime-dark': { r: 17, g: 17, b: 17 },
    'day-theme': { r: 245, g: 248, b: 250 },
    'prime-light': { r: 243, g: 243, b: 243 },
};
const SECTION_BACKGROUNDS = {
    'night-theme': { r: 11, g: 22, b: 29 },
    'prime-dark': { r: 0, g: 0, b: 0 },
    'day-theme': { r: 227, g: 232, b: 235 },
    'prime-light': { r: 255, g: 255, b: 255 },
};
const DISPLAY_BACKGROUNDS = {
    'night-theme': { r: 11, g: 22, b: 29 },
    'prime-dark': { r: 37, g: 37, b: 37 },
    'day-theme': { r: 227, g: 232, b: 235 },
    'prime-light': { r: 255, g: 255, b: 255 },
};
class PinnedStatistics extends RealmObject {
}
PinnedStatistics.schema = {
    name: 'PinnedStatistics',
    embedded: true,
    properties: {
        cpu: { type: 'bool', default: false },
        fps: { type: 'bool', default: false },
        droppedFrames: { type: 'bool', default: false },
        bandwidth: { type: 'bool', default: false },
    },
};
PinnedStatistics.register({ persist: true });
export class CustomizationState extends RealmObject {
    onCreated() {
        const data = localStorage.getItem('PersistentStatefulService-CustomizationService');
        if (data) {
            const parsed = JSON.parse(data);
            this.db.write(() => {
                Object.assign(this, parsed);
            });
        }
    }
    get isDarkTheme() {
        return ['night-theme', 'prime-dark'].includes(this.theme);
    }
    get displayBackground() {
        return DISPLAY_BACKGROUNDS[this.theme];
    }
}
CustomizationState.schema = {
    name: 'CustomizationState',
    properties: {
        theme: { type: 'string', default: 'night-theme' },
        updateStreamInfoOnLive: { type: 'bool', default: true },
        livePreviewEnabled: { type: 'bool', default: true },
        leftDock: { type: 'bool', default: false },
        hideViewerCount: { type: 'bool', default: false },
        folderSelection: { type: 'bool', default: false },
        legacyAlertbox: { type: 'bool', default: false },
        livedockCollapsed: { type: 'bool', default: true },
        livedockSize: { type: 'double', default: 0 },
        eventsSize: { type: 'double', default: 156 },
        controlsSize: { type: 'double', default: 240 },
        performanceMode: { type: 'bool', default: false },
        chatZoomFactor: { type: 'double', default: 1 },
        enableBTTVEmotes: { type: 'bool', default: false },
        enableFFZEmotes: { type: 'bool', default: false },
        mediaBackupOptOut: { type: 'bool', default: false },
        navigateToLiveOnStreamStart: { type: 'bool', default: true },
        legacyEvents: { type: 'bool', default: false },
        designerMode: { type: 'bool', default: false },
        pinnedStatistics: { type: 'object', objectType: 'PinnedStatistics', default: {} },
        enableCrashDumps: { type: 'bool', default: true },
        enableAnnouncements: { type: 'bool', default: true },
    },
};
CustomizationState.register({ persist: true });
export class CustomizationService extends Service {
    constructor() {
        super(...arguments);
        this.settingsChanged = new Subject();
        this.state = CustomizationState.inject();
    }
    init() {
        super.init();
        this.setLiveDockCollapsed(true);
        this.ensureCrashDumpFolder();
        this.setObsTheme();
        this.userService.userLoginFinished.subscribe(() => this.setInitialLegacyAlertboxState());
        if (this.state.pinnedStatistics.cpu ||
            this.state.pinnedStatistics.fps ||
            this.state.pinnedStatistics.droppedFrames ||
            this.state.pinnedStatistics.bandwidth) {
            this.usageStatisticsService.recordFeatureUsage('PinnedPerformanceStatistics');
        }
    }
    setInitialLegacyAlertboxState() {
        if (!this.userService.views.isLoggedIn)
            return;
        if (this.state.legacyAlertbox === null) {
            const registrationDate = this.userService.state.createdAt;
            const legacyAlertbox = registrationDate < new Date('October 26, 2021').valueOf();
            this.setSettings({ legacyAlertbox });
        }
    }
    setSettings(settingsPatch) {
        this.state.db.write(() => {
            this.state.deepPatch(settingsPatch);
        });
        if (settingsPatch.enableCrashDumps != null)
            this.ensureCrashDumpFolder();
        this.settingsChanged.next(settingsPatch);
    }
    get currentTheme() {
        return this.state.theme;
    }
    setTheme(theme) {
        obs.NodeObs.OBS_content_setDayTheme(['day-theme', 'prime-light'].includes(theme));
        return this.setSettings({ theme });
    }
    get themeBackground() {
        return THEME_BACKGROUNDS[this.currentTheme];
    }
    get sectionBackground() {
        return SECTION_BACKGROUNDS[this.currentTheme];
    }
    get isDarkTheme() {
        return this.state.isDarkTheme;
    }
    setUpdateStreamInfoOnLive(update) {
        this.setSettings({ updateStreamInfoOnLive: update });
    }
    setLivePreviewEnabled(enabled) {
        this.setSettings({ livePreviewEnabled: enabled });
    }
    setLeftDock(enabled) {
        this.setSettings({ leftDock: enabled });
    }
    setLiveDockCollapsed(collapsed) {
        this.setSettings({ livedockCollapsed: collapsed });
    }
    setHiddenViewerCount(hidden) {
        this.setSettings({ hideViewerCount: hidden });
    }
    setMediaBackupOptOut(optOut) {
        this.setSettings({ mediaBackupOptOut: optOut });
    }
    togglePerformanceMode() {
        this.setSettings({ performanceMode: !this.state.performanceMode });
    }
    setObsTheme() {
        obs.NodeObs.OBS_content_setDayTheme(!this.isDarkTheme);
    }
    get themeOptions() {
        const options = [
            { value: 'night-theme', label: $t('Night') },
            { value: 'day-theme', label: $t('Day') },
        ];
        if (this.userService.isPrime) {
            options.push({ value: 'prime-dark', label: $t('Obsidian Ultra') }, { value: 'prime-light', label: $t('Alabaster Ultra') });
        }
        return options;
    }
    restoreDefaults() {
        this.state.reset();
    }
    ensureCrashDumpFolder() {
        const crashDumpDirectory = path.join(this.appService.appDataDirectory, 'CrashMemoryDump');
        if (this.state.enableCrashDumps) {
            fs.ensureDir(crashDumpDirectory);
        }
        else {
            fs.remove(crashDumpDirectory);
        }
    }
}
__decorate([
    Inject()
], CustomizationService.prototype, "userService", void 0);
__decorate([
    Inject()
], CustomizationService.prototype, "usageStatisticsService", void 0);
__decorate([
    Inject()
], CustomizationService.prototype, "appService", void 0);
//# sourceMappingURL=customization.js.map