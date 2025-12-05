var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component } from 'vue-property-decorator';
import ReactComponent from './ReactComponent';
let AddSource = class AddSource extends ReactComponent {
};
AddSource = __decorate([
    Component({
        props: {
            name: { default: 'AddSource' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], AddSource);
export { AddSource };
let AdvancedAudio = class AdvancedAudio extends ReactComponent {
};
AdvancedAudio = __decorate([
    Component({
        props: {
            name: { default: 'AdvancedAudio' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], AdvancedAudio);
export { AdvancedAudio };
let AdvancedStatistics = class AdvancedStatistics extends ReactComponent {
};
AdvancedStatistics = __decorate([
    Component({
        props: {
            name: { default: 'AdvancedStatistics' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], AdvancedStatistics);
export { AdvancedStatistics };
let Blank = class Blank extends ReactComponent {
};
Blank = __decorate([
    Component({ props: { name: { default: 'Blank' } } })
], Blank);
export { Blank };
let Browser = class Browser extends ReactComponent {
};
Browser = __decorate([
    Component({
        props: { name: { default: 'Browser' }, wrapperStyles: { default: () => ({ height: '100%' }) } },
    })
], Browser);
export { Browser };
let BrowserView = class BrowserView extends ReactComponent {
};
BrowserView = __decorate([
    Component({
        props: {
            name: { default: 'BrowserView' },
            componentProps: { default: () => ({ src: '' }) },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], BrowserView);
export { BrowserView };
let Display = class Display extends ReactComponent {
};
Display = __decorate([
    Component({
        props: {
            name: { default: 'Display' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
            componentProps: {
                default: () => ({
                    paddingSize: 0,
                    drawUI: false,
                }),
            },
        },
    })
], Display);
export { Display };
let EditStreamWindow = class EditStreamWindow extends ReactComponent {
};
EditStreamWindow = __decorate([
    Component({
        props: {
            name: { default: 'EditStreamWindow' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], EditStreamWindow);
export { EditStreamWindow };
let EditTransform = class EditTransform extends ReactComponent {
};
EditTransform = __decorate([
    Component({
        props: {
            name: { default: 'EditTransform' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], EditTransform);
export { EditTransform };
let GoLiveWindow = class GoLiveWindow extends ReactComponent {
};
GoLiveWindow = __decorate([
    Component({
        props: {
            name: { default: 'GoLiveWindow' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], GoLiveWindow);
export { GoLiveWindow };
let GuestCamProperties = class GuestCamProperties extends ReactComponent {
};
GuestCamProperties = __decorate([
    Component({
        props: {
            name: { default: 'GuestCamProperties' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], GuestCamProperties);
export { GuestCamProperties };
let IconLibraryProperties = class IconLibraryProperties extends ReactComponent {
};
IconLibraryProperties = __decorate([
    Component({
        props: {
            name: { default: 'IconLibraryProperties' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], IconLibraryProperties);
export { IconLibraryProperties };
let InstalledApps = class InstalledApps extends ReactComponent {
};
InstalledApps = __decorate([
    Component({
        props: {
            name: { default: 'InstalledApps' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], InstalledApps);
export { InstalledApps };
let Loader = class Loader extends ReactComponent {
};
Loader = __decorate([
    Component({ props: { name: { default: 'Loader' } } })
], Loader);
export { Loader };
let Main = class Main extends ReactComponent {
};
Main = __decorate([
    Component({
        props: {
            name: { default: 'Main' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], Main);
export { Main };
let LiveDock = class LiveDock extends ReactComponent {
};
LiveDock = __decorate([
    Component({
        props: {
            name: { default: 'LiveDock' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
            componentProps: { default: () => ({ onLeft: false }) },
        },
    })
], LiveDock);
export { LiveDock };
let ManageSceneCollections = class ManageSceneCollections extends ReactComponent {
};
ManageSceneCollections = __decorate([
    Component({
        props: {
            name: { default: 'ManageSceneCollections' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], ManageSceneCollections);
export { ManageSceneCollections };
let MarketingModal = class MarketingModal extends ReactComponent {
};
MarketingModal = __decorate([
    Component({
        props: {
            name: { default: 'MarketingModal' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], MarketingModal);
export { MarketingModal };
let MediaGallery = class MediaGallery extends ReactComponent {
};
MediaGallery = __decorate([
    Component({
        props: {
            name: { default: 'MediaGallery' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], MediaGallery);
export { MediaGallery };
let NameFolder = class NameFolder extends ReactComponent {
};
NameFolder = __decorate([
    Component({
        props: {
            name: { default: 'NameFolder' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], NameFolder);
export { NameFolder };
let NameScene = class NameScene extends ReactComponent {
};
NameScene = __decorate([
    Component({
        props: {
            name: { default: 'NameScene' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], NameScene);
export { NameScene };
let NotificationsAndNews = class NotificationsAndNews extends ReactComponent {
};
NotificationsAndNews = __decorate([
    Component({
        props: {
            name: { default: 'NotificationsAndNews' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], NotificationsAndNews);
export { NotificationsAndNews };
let PerformanceMetrics = class PerformanceMetrics extends ReactComponent {
};
PerformanceMetrics = __decorate([
    Component({
        props: {
            name: { default: 'PerformanceMetrics' },
            componentProps: { default: () => ({ mode: 'limited' }) },
        },
    })
], PerformanceMetrics);
export { PerformanceMetrics };
let PlatformAppPageView = class PlatformAppPageView extends ReactComponent {
};
PlatformAppPageView = __decorate([
    Component({ props: { name: { default: 'PlatformAppPageView' } } })
], PlatformAppPageView);
export { PlatformAppPageView };
let PlatformAppMainPage = class PlatformAppMainPage extends ReactComponent {
};
PlatformAppMainPage = __decorate([
    Component({ props: { name: { default: 'PlatformAppMainPage' } } })
], PlatformAppMainPage);
export { PlatformAppMainPage };
let PlatformAppPopOut = class PlatformAppPopOut extends ReactComponent {
};
PlatformAppPopOut = __decorate([
    Component({
        props: {
            name: { default: 'PlatformAppPopOut' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], PlatformAppPopOut);
export { PlatformAppPopOut };
let PlatformAppStore = class PlatformAppStore extends ReactComponent {
};
PlatformAppStore = __decorate([
    Component({ props: { name: { default: 'PlatformAppStore' } } })
], PlatformAppStore);
export { PlatformAppStore };
let PlatformLogo = class PlatformLogo extends ReactComponent {
};
PlatformLogo = __decorate([
    Component({ props: { name: { default: 'PlatformLogo' } } })
], PlatformLogo);
export { PlatformLogo };
let PlatformMerge = class PlatformMerge extends ReactComponent {
};
PlatformMerge = __decorate([
    Component({
        props: {
            name: { default: 'PlatformMerge' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], PlatformMerge);
export { PlatformMerge };
let Projector = class Projector extends ReactComponent {
};
Projector = __decorate([
    Component({
        props: { name: { default: 'Projector' }, wrapperStyles: { default: () => ({ height: '100%' }) } },
    })
], Projector);
export { Projector };
let RecentEvents = class RecentEvents extends ReactComponent {
};
RecentEvents = __decorate([
    Component({
        props: {
            name: { default: 'RecentEvents' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
            componentProps: { default: () => ({ isOverlay: false }) },
        },
    })
], RecentEvents);
export { RecentEvents };
let RecentEventsWindow = class RecentEventsWindow extends ReactComponent {
};
RecentEventsWindow = __decorate([
    Component({
        props: {
            name: { default: 'RecentEventsWindow' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], RecentEventsWindow);
export { RecentEventsWindow };
let RenameSource = class RenameSource extends ReactComponent {
};
RenameSource = __decorate([
    Component({
        props: {
            name: { default: 'RenameSource' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], RenameSource);
export { RenameSource };
let SafeMode = class SafeMode extends ReactComponent {
};
SafeMode = __decorate([
    Component({
        props: {
            name: { default: 'SafeMode' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], SafeMode);
export { SafeMode };
let Settings = class Settings extends ReactComponent {
};
Settings = __decorate([
    Component({
        props: {
            name: { default: 'Settings' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], Settings);
export { Settings };
let SourceProperties = class SourceProperties extends ReactComponent {
};
SourceProperties = __decorate([
    Component({
        props: {
            name: { default: 'SourceProperties' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], SourceProperties);
export { SourceProperties };
let ScreenCaptureProperties = class ScreenCaptureProperties extends ReactComponent {
};
ScreenCaptureProperties = __decorate([
    Component({
        props: {
            name: { default: 'ScreenCaptureProperties' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], ScreenCaptureProperties);
export { ScreenCaptureProperties };
let SharedComponentsLibrary = class SharedComponentsLibrary extends ReactComponent {
};
SharedComponentsLibrary = __decorate([
    Component({
        props: {
            name: { default: 'SharedComponentsLibrary' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], SharedComponentsLibrary);
export { SharedComponentsLibrary };
let SourceFilters = class SourceFilters extends ReactComponent {
};
SourceFilters = __decorate([
    Component({
        props: {
            name: { default: 'SourceFilters' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], SourceFilters);
export { SourceFilters };
let SourceShowcase = class SourceShowcase extends ReactComponent {
};
SourceShowcase = __decorate([
    Component({
        props: {
            name: { default: 'SourceShowcase' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], SourceShowcase);
export { SourceShowcase };
let StartStreamingButton = class StartStreamingButton extends ReactComponent {
};
StartStreamingButton = __decorate([
    Component({ props: { name: { default: 'StartStreamingButton' } } })
], StartStreamingButton);
export { StartStreamingButton };
let TestWidgets = class TestWidgets extends ReactComponent {
};
TestWidgets = __decorate([
    Component({
        props: {
            name: { default: 'TestWidgets' },
            componentProps: { default: () => ({ testers: null }) },
        },
    })
], TestWidgets);
export { TestWidgets };
let TitleBar = class TitleBar extends ReactComponent {
};
TitleBar = __decorate([
    Component({
        props: {
            name: { default: 'TitleBar' },
            componentProps: { default: () => ({ windowId: '' }) },
        },
    })
], TitleBar);
export { TitleBar };
let Troubleshooter = class Troubleshooter extends ReactComponent {
};
Troubleshooter = __decorate([
    Component({
        props: {
            name: { default: 'Troubleshooter' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], Troubleshooter);
export { Troubleshooter };
let WelcomeToPrime = class WelcomeToPrime extends ReactComponent {
};
WelcomeToPrime = __decorate([
    Component({
        props: {
            name: { default: 'WelcomeToPrime' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], WelcomeToPrime);
export { WelcomeToPrime };
let WidgetWindow = class WidgetWindow extends ReactComponent {
};
WidgetWindow = __decorate([
    Component({
        props: {
            name: { default: 'WidgetWindow' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], WidgetWindow);
export { WidgetWindow };
let CustomCodeWindow = class CustomCodeWindow extends ReactComponent {
};
CustomCodeWindow = __decorate([
    Component({
        props: {
            name: { default: 'CustomCodeWindow' },
            wrapperStyles: { default: () => ({ height: '100%' }) },
        },
    })
], CustomCodeWindow);
export { CustomCodeWindow };
let DismissableBadge = class DismissableBadge extends ReactComponent {
};
DismissableBadge = __decorate([
    Component({ props: { name: { default: 'DismissableBadge' } } })
], DismissableBadge);
export { DismissableBadge };
let UltraIcon = class UltraIcon extends ReactComponent {
};
UltraIcon = __decorate([
    Component({ props: { name: { default: 'UltraIcon' } } })
], UltraIcon);
export { UltraIcon };
let AuthModal = class AuthModal extends ReactComponent {
};
AuthModal = __decorate([
    Component({ props: { name: { default: 'AuthModal' } } })
], AuthModal);
export { AuthModal };
let Hotkeys = class Hotkeys extends ReactComponent {
};
Hotkeys = __decorate([
    Component({
        props: {
            name: { default: 'Hotkeys' },
            componentProps: {
                default: () => ({
                    globalSearchStr: '',
                    highlightSearch: () => { },
                    scanning: false,
                }),
            },
        },
    })
], Hotkeys);
export { Hotkeys };
let GLVolmeters = class GLVolmeters extends ReactComponent {
};
GLVolmeters = __decorate([
    Component({
        props: {
            name: { default: 'GLVolmeters' },
            wrapperStyles: {
                default: () => ({ position: 'absolute', left: '17px', right: '17px', height: '100%' }),
            },
        },
    })
], GLVolmeters);
export { GLVolmeters };
let MultistreamChatInfo = class MultistreamChatInfo extends ReactComponent {
};
MultistreamChatInfo = __decorate([
    Component({
        props: {
            name: { default: 'MultistreamChatInfo' },
            wrapperStyles: {
                default: () => ({ width: '100%', height: '100%', minWidth: '748px', minHeight: '635px' }),
            },
        },
    })
], MultistreamChatInfo);
export { MultistreamChatInfo };
//# sourceMappingURL=ReactComponentList.js.map