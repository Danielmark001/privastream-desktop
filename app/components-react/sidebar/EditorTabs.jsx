import React, { useMemo } from 'react';
import { Services } from 'components-react/service-provider';
import styles from './SideNav.m.less';
import MenuItem from 'components-react/shared/MenuItem';
import { useVuex } from 'components-react/hooks';
import cx from 'classnames';
import { EMenuItemKey, ENavName } from 'services/side-nav';
import { $t } from 'services/i18n';
export default function EditorTabs(p) {
    const { NavigationService, SideNavService, LayoutService } = Services;
    const { type = 'root' } = p;
    const defaultTitle = $t('Editor');
    const { currentMenuItem, setCurrentMenuItem, studioTabs, isOpen, showCustomEditor, toggleSidebarSubmenu, toggleMenuItem, editorToggled, } = useVuex(() => {
        var _a;
        return ({
            currentMenuItem: SideNavService.views.currentMenuItem === 'editor'
                ? 'default'
                : SideNavService.views.currentMenuItem,
            setCurrentMenuItem: SideNavService.actions.setCurrentMenuItem,
            studioTabs: LayoutService.views.studioTabs,
            compactView: SideNavService.views.compactView,
            isOpen: SideNavService.views.isOpen,
            showCustomEditor: SideNavService.views.showCustomEditor,
            toggleSidebarSubmenu: SideNavService.actions.toggleSidebarSubmenu,
            toggleMenuItem: SideNavService.actions.toggleMenuItem,
            editorToggled: (_a = SideNavService.views.getMenuItemData(ENavName.TopNav, EMenuItemKey.Editor)) === null || _a === void 0 ? void 0 : _a.isActive,
        });
    });
    function navigateToStudioTab(tabId, trackingTarget, key) {
        if (currentMenuItem !== key) {
            LayoutService.actions.setCurrentTab(tabId);
            setCurrentMenuItem(key);
            NavigationService.actions.navigate('Studio', { trackingTarget });
            if (tabId !== 'default' && !showCustomEditor) {
                toggleSidebarSubmenu(true);
            }
            else if (tabId === 'default' && !editorToggled && isOpen) {
                toggleMenuItem(ENavName.TopNav, EMenuItemKey.Editor, true);
            }
        }
    }
    const rootTabs = useMemo(() => {
        return editorToggled ? studioTabs : studioTabs.filter(tab => tab.key !== 'default');
    }, [editorToggled, studioTabs]);
    return type === 'root' ? (<>
      {rootTabs.map(tab => {
            var _a;
            return (<MenuItem key={tab.key} className={cx(!isOpen && styles.closed, (currentMenuItem === EMenuItemKey.Editor ||
                    currentMenuItem === tab.key ||
                    currentMenuItem === `sub-${tab.key}`) &&
                    styles.active)} title={(_a = tab.title) !== null && _a !== void 0 ? _a : defaultTitle} icon={<i className={tab.icon}/>} onClick={() => navigateToStudioTab(tab.target, tab.trackingTarget, tab.key)}>
          {tab.title}
        </MenuItem>);
        })}
    </>) : (<>
      {studioTabs.map(tab => {
            var _a, _b;
            return (<MenuItem key={`sub-${tab.key}`} className={cx((currentMenuItem === tab.key || currentMenuItem === `sub-${tab.key}`) && styles.active)} title={(_a = tab === null || tab === void 0 ? void 0 : tab.title) !== null && _a !== void 0 ? _a : defaultTitle} icon={<i className={tab.icon}/>} onClick={() => navigateToStudioTab(tab.target, tab.trackingTarget, `sub-${tab.key}`)} type="submenu">
          {(_b = tab === null || tab === void 0 ? void 0 : tab.title) !== null && _b !== void 0 ? _b : defaultTitle}
        </MenuItem>);
        })}
    </>);
}
//# sourceMappingURL=EditorTabs.jsx.map