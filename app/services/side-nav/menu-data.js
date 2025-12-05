import { $t } from 'services/i18n';
import { ESettingsCategory } from 'services/settings';
export var EMenuItemKey;
(function (EMenuItemKey) {
    EMenuItemKey["Editor"] = "editor";
    EMenuItemKey["LayoutEditor"] = "layout-editor";
    EMenuItemKey["StudioMode"] = "studio-mode";
    EMenuItemKey["Themes"] = "themes";
    EMenuItemKey["AppStore"] = "app-store";
    EMenuItemKey["Highlighter"] = "highlighter";
    EMenuItemKey["RecordingHistory"] = "recording-history";
    EMenuItemKey["ThemeAudit"] = "theme-audit";
    EMenuItemKey["DevTools"] = "dev-tools";
    EMenuItemKey["GetPrime"] = "get-prime";
    EMenuItemKey["Dashboard"] = "dashboard";
    EMenuItemKey["GetHelp"] = "get-help";
    EMenuItemKey["Settings"] = "settings";
    EMenuItemKey["Login"] = "login";
    EMenuItemKey["AI"] = "ai";
    EMenuItemKey["Privacy"] = "privacy";
})(EMenuItemKey || (EMenuItemKey = {}));
export var ESubMenuItemKey;
(function (ESubMenuItemKey) {
    ESubMenuItemKey["Scene"] = "browse-overlays";
    ESubMenuItemKey["Widget"] = "browse-overlays-widgets";
    ESubMenuItemKey["Sites"] = "browse-overlays-sites";
    ESubMenuItemKey["Collectibles"] = "browse-overlays-collectibles";
    ESubMenuItemKey["AppsStoreHome"] = "platform-app-store-home";
    ESubMenuItemKey["AppsManager"] = "platform-app-store-manager";
    ESubMenuItemKey["DashboardHome"] = "dashboard-home";
    ESubMenuItemKey["Cloudbot"] = "dashboard-cloudbot";
    ESubMenuItemKey["AlertBoxSettings"] = "dashboard-alertbox";
    ESubMenuItemKey["Widgets"] = "dashboard-widgets";
    ESubMenuItemKey["TipSettings"] = "dashboard-tips";
    ESubMenuItemKey["Multistream"] = "dashboard-multistream";
})(ESubMenuItemKey || (ESubMenuItemKey = {}));
export const ESideNavKey = Object.assign(Object.assign({}, EMenuItemKey), ESubMenuItemKey);
export const ProtocolLinkKeyMap = {
    ['overlay']: ESubMenuItemKey.Scene,
    ['widget-theme']: ESubMenuItemKey.Widget,
    ['site-theme']: ESubMenuItemKey.Sites,
};
export var ENavName;
(function (ENavName) {
    ENavName["TopNav"] = "top-nav";
    ENavName["BottomNav"] = "bottom-nav";
})(ENavName || (ENavName = {}));
export const loggedOutMenuItems = [
    {
        key: EMenuItemKey.Editor,
        target: 'Studio',
    },
    { key: EMenuItemKey.RecordingHistory, target: 'RecordingHistory' },
];
export const compactMenuItemKeys = [
    EMenuItemKey.Editor,
    EMenuItemKey.Themes,
    EMenuItemKey.AppStore,
    EMenuItemKey.Highlighter,
    EMenuItemKey.RecordingHistory,
];
export const menuTitles = (item) => {
    return {
        [EMenuItemKey.Editor]: $t('Editor'),
        [EMenuItemKey.LayoutEditor]: $t('Layout Editor'),
        [EMenuItemKey.StudioMode]: $t('Studio Mode'),
        [EMenuItemKey.Themes]: $t('Overlays'),
        [EMenuItemKey.AppStore]: $t('App Store'),
        [EMenuItemKey.Highlighter]: $t('Highlighter'),
        [EMenuItemKey.RecordingHistory]: $t('Recordings'),
        [EMenuItemKey.ThemeAudit]: $t('Theme Audit'),
        [EMenuItemKey.DevTools]: 'Dev Tools',
        [EMenuItemKey.GetPrime]: $t('Get Ultra'),
        [EMenuItemKey.Dashboard]: $t('Dashboard'),
        [EMenuItemKey.GetHelp]: $t('Get Help'),
        [EMenuItemKey.Settings]: $t('Settings'),
        [EMenuItemKey.Login]: $t('Login'),
        [ESubMenuItemKey.Scene]: $t('Scene'),
        [ESubMenuItemKey.Widget]: $t('Alerts and Widgets'),
        [ESubMenuItemKey.Sites]: $t('Creator Sites'),
        [ESubMenuItemKey.Collectibles]: $t('Collectibles'),
        [ESubMenuItemKey.AppsStoreHome]: $t('Apps Store Home'),
        [ESubMenuItemKey.AppsManager]: $t('Apps Manager'),
        [ESubMenuItemKey.DashboardHome]: $t('Dashboard Home'),
        [ESubMenuItemKey.Cloudbot]: $t('Cloudbot'),
        [ESubMenuItemKey.AlertBoxSettings]: $t('Alert Box Settings'),
        [ESubMenuItemKey.Widgets]: $t('Widgets'),
        [ESubMenuItemKey.TipSettings]: $t('Tip Settings'),
        [ESubMenuItemKey.Multistream]: $t('Multistream'),
        [EMenuItemKey.AI]: $t(ESettingsCategory.AI),
        [EMenuItemKey.Privacy]: $t('Privacy'),
    }[item];
};
export const SideBarTopNavData = () => ({
    name: ENavName.TopNav,
    menuItems: [
        SideNavMenuItems()[EMenuItemKey.Editor],
        SideNavMenuItems()[EMenuItemKey.LayoutEditor],
        SideNavMenuItems()[EMenuItemKey.StudioMode],
        SideNavMenuItems()[EMenuItemKey.Themes],
        SideNavMenuItems()[EMenuItemKey.AppStore],
        SideNavMenuItems()[EMenuItemKey.Highlighter],
        SideNavMenuItems()[EMenuItemKey.RecordingHistory],
        SideNavMenuItems()[EMenuItemKey.ThemeAudit],
        SideNavMenuItems()[EMenuItemKey.Privacy],
    ],
});
export const SideBarBottomNavData = () => ({
    name: ENavName.BottomNav,
    menuItems: [
        SideNavMenuItems()[EMenuItemKey.DevTools],
        SideNavMenuItems()[EMenuItemKey.GetPrime],
        SideNavMenuItems()[EMenuItemKey.Dashboard],
        SideNavMenuItems()[EMenuItemKey.GetHelp],
        SideNavMenuItems()[EMenuItemKey.AI],
        SideNavMenuItems()[EMenuItemKey.Settings],
        SideNavMenuItems()[EMenuItemKey.Login],
    ],
});
export const SideNavMenuItems = () => ({
    [EMenuItemKey.Editor]: {
        key: EMenuItemKey.Editor,
        target: 'Studio',
        trackingTarget: 'editor',
        icon: 'icon-studio',
        isActive: true,
        isExpanded: false,
    },
    [EMenuItemKey.LayoutEditor]: {
        key: EMenuItemKey.LayoutEditor,
        target: 'LayoutEditor',
        trackingTarget: 'layout-editor',
        icon: 'fas fa-th-large',
        isActive: true,
        isExpanded: false,
    },
    [EMenuItemKey.StudioMode]: {
        key: EMenuItemKey.StudioMode,
        icon: 'icon-studio-mode-3',
        isActive: true,
        isExpanded: false,
    },
    [EMenuItemKey.Themes]: {
        key: EMenuItemKey.Themes,
        target: 'BrowseOverlays',
        trackingTarget: 'themes',
        icon: 'icon-themes',
        subMenuItems: [
            SideBarSubMenuItems()[ESubMenuItemKey.Scene],
            SideBarSubMenuItems()[ESubMenuItemKey.Widget],
            SideBarSubMenuItems()[ESubMenuItemKey.Collectibles],
        ],
        isActive: true,
        isExpanded: false,
    },
    [EMenuItemKey.AppStore]: {
        key: EMenuItemKey.AppStore,
        target: 'PlatformAppStore',
        trackingTarget: 'app-store',
        icon: 'icon-store',
        subMenuItems: [
            SideBarSubMenuItems()[ESubMenuItemKey.AppsStoreHome],
            SideBarSubMenuItems()[ESubMenuItemKey.AppsManager],
        ],
        isActive: true,
        isExpanded: false,
    },
    [EMenuItemKey.Highlighter]: {
        key: EMenuItemKey.Highlighter,
        target: 'Highlighter',
        icon: 'icon-highlighter',
        trackingTarget: 'highlighter',
        isActive: true,
        isExpanded: false,
    },
    [EMenuItemKey.RecordingHistory]: {
        key: EMenuItemKey.RecordingHistory,
        target: 'RecordingHistory',
        icon: 'icon-play-round',
        trackingTarget: 'recording-history',
        isActive: true,
        isExpanded: false,
    },
    [EMenuItemKey.ThemeAudit]: {
        key: EMenuItemKey.ThemeAudit,
        target: 'ThemeAudit',
        icon: 'fas fa-exclamation-triangle',
        trackingTarget: 'themeaudit',
        isExpanded: false,
        isActive: true,
    },
    [EMenuItemKey.DevTools]: {
        key: EMenuItemKey.DevTools,
        trackingTarget: 'devtools',
        icon: 'icon-developer',
        isExpanded: false,
    },
    [EMenuItemKey.GetPrime]: {
        key: EMenuItemKey.GetPrime,
        icon: 'icon-prime',
        isActive: true,
        isExpanded: false,
    },
    [EMenuItemKey.Dashboard]: {
        key: EMenuItemKey.Dashboard,
        icon: 'icon-dashboard',
        isActive: true,
        subMenuItems: [
            SideBarSubMenuItems()[ESubMenuItemKey.DashboardHome],
            SideBarSubMenuItems()[ESubMenuItemKey.Cloudbot],
            SideBarSubMenuItems()[ESubMenuItemKey.AlertBoxSettings],
            SideBarSubMenuItems()[ESubMenuItemKey.Widgets],
            SideBarSubMenuItems()[ESubMenuItemKey.TipSettings],
            SideBarSubMenuItems()[ESubMenuItemKey.Multistream],
        ],
        isExpanded: false,
    },
    [EMenuItemKey.GetHelp]: {
        key: EMenuItemKey.GetHelp,
        icon: 'icon-question',
        isActive: true,
        isExpanded: false,
    },
    [EMenuItemKey.AI]: {
        key: EMenuItemKey.AI,
        icon: 'icon-ai',
        isActive: true,
        isExpanded: false,
    },
    [EMenuItemKey.Settings]: {
        key: EMenuItemKey.Settings,
        icon: 'icon-settings',
        isActive: true,
        isExpanded: false,
    },
    [EMenuItemKey.Login]: {
        key: EMenuItemKey.Login,
        icon: 'icon-user',
        isActive: true,
        isExpanded: false,
    },
    [EMenuItemKey.Privacy]: {
        key: EMenuItemKey.Privacy,
        target: 'Privacy',
        icon: 'fas fa-lock',
        isActive: true,
        isExpanded: false,
    },
});
export const SideBarSubMenuItems = () => ({
    [ESubMenuItemKey.Scene]: {
        key: ESubMenuItemKey.Scene,
        target: 'BrowseOverlays',
        type: 'overlays',
        trackingTarget: 'themes',
        isExpanded: false,
    },
    [ESubMenuItemKey.Widget]: {
        key: ESubMenuItemKey.Widget,
        target: 'BrowseOverlays',
        type: 'widget-themes',
        trackingTarget: 'themes',
        isExpanded: false,
    },
    [ESubMenuItemKey.Sites]: {
        key: ESubMenuItemKey.Sites,
        target: 'BrowseOverlays',
        type: 'site-themes',
        trackingTarget: 'themes',
        isActive: false,
        isExpanded: false,
    },
    [ESubMenuItemKey.Collectibles]: {
        key: ESubMenuItemKey.Collectibles,
        target: 'BrowseOverlays',
        type: 'collectibles',
        trackingTarget: 'themes',
        isExpanded: false,
    },
    [ESubMenuItemKey.AppsStoreHome]: {
        key: ESubMenuItemKey.AppsStoreHome,
        target: 'PlatformAppStore',
        trackingTarget: 'app-store',
        isExpanded: false,
    },
    [ESubMenuItemKey.AppsManager]: {
        key: ESubMenuItemKey.AppsManager,
        target: 'PlatformAppStore',
        type: 'profile',
        trackingTarget: 'app-store',
        isExpanded: false,
    },
    [ESubMenuItemKey.DashboardHome]: {
        key: ESubMenuItemKey.DashboardHome,
        trackingTarget: 'dashboard',
        isExpanded: false,
    },
    [ESubMenuItemKey.Cloudbot]: {
        key: ESubMenuItemKey.Cloudbot,
        type: 'cloudbot',
        trackingTarget: 'dashboard',
        isExpanded: false,
    },
    [ESubMenuItemKey.AlertBoxSettings]: {
        key: ESubMenuItemKey.AlertBoxSettings,
        type: 'alertbox',
        trackingTarget: 'dashboard',
        isExpanded: false,
    },
    [ESubMenuItemKey.Widgets]: {
        key: ESubMenuItemKey.Widgets,
        type: 'widgets',
        trackingTarget: 'dashboard',
        isExpanded: false,
    },
    [ESubMenuItemKey.TipSettings]: {
        key: ESubMenuItemKey.TipSettings,
        type: 'tipping/settings',
        trackingTarget: 'dashboard',
        isExpanded: false,
    },
    [ESubMenuItemKey.Multistream]: {
        key: ESubMenuItemKey.Multistream,
        type: 'multistream',
        trackingTarget: 'dashboard',
        isExpanded: false,
    },
});
//# sourceMappingURL=menu-data.js.map