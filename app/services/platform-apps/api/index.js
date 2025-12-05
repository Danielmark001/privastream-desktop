var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { SourcesModule } from './modules/sources';
import { ScenesModule } from './modules/scenes';
import { ObsSettingsModule } from './modules/obs-settings';
import { StreamingRecordingModule } from './modules/streaming-recording';
import { AuthorizationModule } from './modules/authorization';
import { ThemeModule } from './modules/theme';
import { SceneCollectionsModule } from './modules/scene-collections';
import { ExternalModule } from './modules/external';
import { AppModule } from './modules/app';
import { NotificationsModule } from './modules/notifications';
import { HotkeysModule } from './modules/hotkeys';
import { ObsPluginsModule } from './modules/obs-plugins';
import { DisplayModule } from './modules/display';
import { SceneTransitionsModule } from './modules/scene-transitions';
import { ReplayModule } from './modules/replay';
import { StreamlabelsModule } from './modules/streamlabels';
import { TwitchModule } from './modules/twitch';
import { VisionModule } from './modules/vision';
import { NativeComponentsModule } from './modules/native-components';
export class PlatformAppsApi {
    constructor() {
        this.modules = {};
        this.registerModule(new SourcesModule());
        this.registerModule(new ScenesModule());
        this.registerModule(new ObsSettingsModule());
        this.registerModule(new StreamingRecordingModule());
        this.registerModule(new AuthorizationModule());
        this.registerModule(new ThemeModule());
        this.registerModule(new SceneCollectionsModule());
        this.registerModule(new ExternalModule());
        this.registerModule(new AppModule());
        this.registerModule(new NotificationsModule());
        this.registerModule(new HotkeysModule());
        this.registerModule(new ObsPluginsModule());
        this.registerModule(new DisplayModule());
        this.registerModule(new SceneTransitionsModule());
        this.registerModule(new ReplayModule());
        this.registerModule(new StreamlabelsModule());
        this.registerModule(new TwitchModule());
        this.registerModule(new VisionModule());
        this.registerModule(new NativeComponentsModule());
    }
    registerModule(module) {
        this.modules[module.moduleName] = module;
    }
    getApi(app, webContentsId, pageTransform) {
        const api = {};
        const context = {
            app,
            webContentsId,
            pageTransform,
        };
        Object.keys(this.modules).forEach(moduleName => {
            api[moduleName] = {};
            let authorized = true;
            for (const permission of this.modules[moduleName].permissions) {
                authorized = app.manifest.permissions.includes(permission);
                if (!authorized)
                    break;
            }
            if (this.modules[moduleName].requiresHighlyPrivileged) {
                authorized = app.highlyPrivileged;
            }
            (this.modules[moduleName].constructor.apiMethods || []).forEach(methodName => {
                api[moduleName][methodName] = (...args) => __awaiter(this, void 0, void 0, function* () {
                    if (authorized) {
                        return yield this.modules[moduleName][methodName](context, ...args);
                    }
                    throw new Error('This app does not have permission to access this API. ' +
                        `Required permissions: ${this.modules[moduleName].permissions}`);
                });
            });
            (this.modules[moduleName].constructor.apiEvents || []).forEach(eventName => {
                if (authorized) {
                    api[moduleName][eventName] = this.modules[moduleName][eventName];
                }
                else {
                    api[moduleName][eventName] = () => __awaiter(this, void 0, void 0, function* () {
                        throw new Error('This app does not have permission to access this API. ' +
                            `Required permissions: ${this.modules[moduleName].permissions}`);
                    });
                }
            });
        });
        return api;
    }
}
//# sourceMappingURL=index.js.map