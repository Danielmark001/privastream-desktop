import React from 'react';
import styles from './SideNav.m.less';
import { useVuex } from 'components-react/hooks';
import { $t } from 'services/i18n';
import { Services } from 'components-react/service-provider';
import MenuItem from 'components-react/shared/MenuItem';
import { EAppPageSlot } from 'services/platform-apps';
import { Menu } from 'util/menus/Menu';
import cx from 'classnames';
import { EMenuItemKey } from 'services/side-nav';
export default function AppsNav(p) {
    const { NavigationService, PlatformAppsService, SideNavService, HighlighterService } = Services;
    const { type = 'selected' } = p;
    const aiHighlighterApp = {
        id: 'AiHighlighter',
        manifest: {
            name: 'AI Highlighter',
            version: 'xxx',
            buildPath: 'xxx',
            permissions: [],
            sources: [],
            pages: [
                {
                    slot: EAppPageSlot.TopNav,
                    file: 'xxx',
                },
            ],
            authorizationUrls: [],
            mediaDomains: [],
            icon: 'xxx',
        },
        unpacked: false,
        beta: true,
        appToken: 'xxx',
        poppedOutSlots: [],
        appPath: 'xxx',
        enabled: true,
        icon: 'xxx',
        highlyPrivileged: false,
    };
    const { currentMenuItem, apps, isOpen, navigateApp, enabledApps } = useVuex(() => ({
        currentMenuItem: SideNavService.views.currentMenuItem,
        apps: SideNavService.views.apps,
        isOpen: SideNavService.views.isOpen,
        navigateApp: NavigationService.actions.navigateApp,
        enabledApps: (HighlighterService.views.highlighterVersion !== ''
            ? [...PlatformAppsService.views.enabledApps, aiHighlighterApp]
            : PlatformAppsService.views.enabledApps)
            .filter(app => {
            var _a;
            return !!((_a = app === null || app === void 0 ? void 0 : app.manifest) === null || _a === void 0 ? void 0 : _a.pages.find(page => {
                return page.slot === EAppPageSlot.TopNav;
            }));
        })
            .sort((a, b) => { var _a, _b; return (((_a = a.manifest) === null || _a === void 0 ? void 0 : _a.name) > ((_b = b.manifest) === null || _b === void 0 ? void 0 : _b.name) ? 1 : -1); }),
    }));
    function iconSrc(appId, path) {
        return PlatformAppsService.views.getAssetUrl(appId, path) || undefined;
    }
    function isPopOutAllowed(appId) {
        const app = enabledApps.find(app => app.id === appId);
        const topNavPage = app === null || app === void 0 ? void 0 : app.manifest.pages.find(page => page.slot === EAppPageSlot.TopNav);
        if (!topNavPage)
            return false;
        return topNavPage.allowPopout == null ? true : topNavPage.allowPopout;
    }
    function popOut(appId) {
        if (!isPopOutAllowed(appId))
            return;
        PlatformAppsService.actions.popOutAppPage(appId, EAppPageSlot.TopNav);
    }
    function showContextMenu(e, appId) {
        e.preventDefault();
        e.stopPropagation();
        if (!isPopOutAllowed(appId))
            return;
        const menu = new Menu();
        menu.append({
            label: $t('Pop Out'),
            click: () => popOut(appId),
        });
        menu.popup();
    }
    return type === 'selected' ? (<>
      {apps.map(app => app &&
            (app === null || app === void 0 ? void 0 : app.isActive) && (<MenuItem key={app === null || app === void 0 ? void 0 : app.id} className={cx(!isOpen && styles.closed, isOpen && styles.open, currentMenuItem === (app === null || app === void 0 ? void 0 : app.id) && styles.active)} title={app === null || app === void 0 ? void 0 : app.name} icon={(app === null || app === void 0 ? void 0 : app.icon) && (app === null || app === void 0 ? void 0 : app.id) ? (<img src={iconSrc(app === null || app === void 0 ? void 0 : app.id, app === null || app === void 0 ? void 0 : app.icon)} className={styles.appIcons}/>) : (<i className="icon-integrations"/>)} onClick={() => (app === null || app === void 0 ? void 0 : app.id) && navigateApp(app === null || app === void 0 ? void 0 : app.id)} type="app" onContextMenu={e => showContextMenu(e, app === null || app === void 0 ? void 0 : app.id)} draggable onDragEnd={() => popOut(app === null || app === void 0 ? void 0 : app.id)}>
              {app === null || app === void 0 ? void 0 : app.name}
            </MenuItem>))}
    </>) : (<>
      {enabledApps.map(app => {
            var _a, _b;
            return app && (<MenuItem key={`sub-${app === null || app === void 0 ? void 0 : app.id}`} className={cx(styles.appMenuItem, currentMenuItem === `sub-${app === null || app === void 0 ? void 0 : app.id}` && styles.active)} title={(_a = app.manifest) === null || _a === void 0 ? void 0 : _a.name} onClick={() => {
                    if (app.id === 'AiHighlighter') {
                        NavigationService.navigate('Highlighter', { view: 'settings' }, EMenuItemKey.Highlighter);
                    }
                    else {
                        (app === null || app === void 0 ? void 0 : app.id) && navigateApp(app === null || app === void 0 ? void 0 : app.id, `sub-${app === null || app === void 0 ? void 0 : app.id}`);
                    }
                }} type="submenu" onContextMenu={e => showContextMenu(e, app === null || app === void 0 ? void 0 : app.id)} draggable onDragEnd={() => popOut(app === null || app === void 0 ? void 0 : app.id)}>
              {(_b = app.manifest) === null || _b === void 0 ? void 0 : _b.name}
            </MenuItem>);
        })}
    </>);
}
//# sourceMappingURL=AppsNav.jsx.map