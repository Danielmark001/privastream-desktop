var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useMemo, useState } from 'react';
import cx from 'classnames';
import electron from 'electron';
import Utils from 'services/utils';
import { $t } from 'services/i18n';
import throttle from 'lodash/throttle';
import { Services } from '../service-provider';
import { useVuex } from '../hooks';
import styles from './NavTools.m.less';
import * as remote from '@electron/remote';
import { Badge, Menu } from 'antd';
import { EMenuItemKey, ENavName, menuTitles } from 'services/side-nav';
import SubMenu from 'components-react/shared/SubMenu';
import MenuItem from 'components-react/shared/MenuItem';
import UltraIcon from 'components-react/shared/UltraIcon';
import PlatformIndicator from './PlatformIndicator';
import { AuthModal } from 'components-react/shared/AuthModal';
import { ESettingsCategory } from 'services/settings';
import { getOS, OS } from 'util/operating-systems';
export default function NavTools(p) {
    const { UserService, SettingsService, MagicLinkService, UsageStatisticsService, SideNavService, WindowsService, UrlService, } = Services;
    const isDevMode = useMemo(() => Utils.isDevMode(), []);
    const showAiTab = useMemo(() => {
        return getOS() === OS.Windows || (getOS() === OS.Mac && isDevMode);
    }, [isDevMode]);
    const { isLoggedIn, isPrime, menuItems, isOpen, openMenuItems, expandMenuItem, updateStyleBlockers, } = useVuex(() => ({
        isLoggedIn: UserService.views.isLoggedIn,
        isPrime: UserService.views.isPrime,
        menuItems: SideNavService.views.state[ENavName.BottomNav].menuItems,
        isOpen: SideNavService.views.isOpen,
        openMenuItems: SideNavService.views.getExpandedMenuItems(ENavName.BottomNav),
        expandMenuItem: SideNavService.actions.expandMenuItem,
        updateStyleBlockers: WindowsService.actions.updateStyleBlockers,
    }), false);
    const [dashboardOpening, setDashboardOpening] = useState(false);
    const [showModal, setShowModal] = useState(false);
    function openSettingsWindow(category) {
        SettingsService.actions.showSettings(category);
    }
    function openDevTools() {
        electron.ipcRenderer.send('openDevTools');
    }
    function openDashboard(page) {
        return __awaiter(this, void 0, void 0, function* () {
            UsageStatisticsService.actions.recordClick('SideNav2', page || 'dashboard');
            if (dashboardOpening)
                return;
            setDashboardOpening(true);
            try {
                const link = yield MagicLinkService.getDashboardMagicLink(page);
                remote.shell.openExternal(link);
            }
            catch (e) {
                console.error('Error generating dashboard magic link', e);
            }
            setDashboardOpening(false);
        });
    }
    const throttledOpenDashboard = throttle(openDashboard, 2000, { trailing: false });
    const username = isLoggedIn && UserService.views.auth.primaryPlatform !== 'instagram'
        ? UserService.username
        : undefined;
    const confirmMsg = username
        ? $t('Are you sure you want to log out %{username}?', { username })
        : $t('Are you sure you want to log out?');
    function openHelp() {
        UsageStatisticsService.actions.recordClick('SideNav2', 'help');
        remote.shell.openExternal(UrlService.supportLink);
    }
    function upgradeToPrime() {
        return __awaiter(this, void 0, void 0, function* () {
            UsageStatisticsService.actions.recordClick('SideNav2', 'prime');
            MagicLinkService.linkToPrime('slobs-side-nav');
        });
    }
    const handleAuth = () => {
        if (isLoggedIn) {
            Services.DualOutputService.actions.setDualOutputModeIfPossible(false, true);
            UserService.actions.logOut();
        }
        else {
            WindowsService.actions.closeChildWindow();
            UserService.actions.showLogin();
        }
    };
    const handleShowModal = (status) => {
        updateStyleBlockers('main', status);
        setShowModal(status);
    };
    return (<>
      <Menu key={ENavName.BottomNav} forceSubMenuRender mode="inline" className={cx(styles.bottomNav, !isOpen && styles.closed, isOpen && styles.open)} defaultOpenKeys={openMenuItems && openMenuItems} getPopupContainer={triggerNode => triggerNode}>
        {menuItems.map((menuItem) => {
            if (isDevMode && menuItem.key === EMenuItemKey.DevTools) {
                return <NavToolsItem key={menuItem.key} menuItem={menuItem} onClick={openDevTools}/>;
            }
            else if (!isPrime && menuItem.key === EMenuItemKey.GetPrime) {
                return (<NavToolsItem key={menuItem.key} menuItem={menuItem} icon={<div>
                    <Badge count={<i className={cx('icon-pop-out-3', styles.linkBadge)}/>}>
                      <UltraIcon />
                    </Badge>
                  </div>} onClick={upgradeToPrime} className={styles.badgeScale}/>);
            }
            else if (isLoggedIn && menuItem.key === EMenuItemKey.Dashboard) {
                return (<SubMenu key={menuItem.key} title={menuTitles(menuItem.key)} icon={<div>
                    <Badge count={<i className={cx('icon-pop-out-3', styles.linkBadge)}/>}>
                      <i className={cx(menuItem.icon, 'small')}/>
                    </Badge>
                  </div>} onTitleClick={() => {
                        !isOpen && throttledOpenDashboard();
                        expandMenuItem(ENavName.BottomNav, menuItem.key);
                    }}>
                <DashboardSubMenu subMenuItems={menuItem === null || menuItem === void 0 ? void 0 : menuItem.subMenuItems} throttledOpenDashboard={throttledOpenDashboard} openSettingsWindow={openSettingsWindow}/>
              </SubMenu>);
            }
            else if (menuItem.key === EMenuItemKey.GetHelp) {
                return (<NavToolsItem key={menuItem.key} menuItem={menuItem} icon={<div>
                    <Badge count={<i className={cx('icon-pop-out-3', styles.linkBadge)}/>}>
                      <i className={menuItem === null || menuItem === void 0 ? void 0 : menuItem.icon}/>
                    </Badge>
                  </div>} onClick={() => openHelp()}/>);
            }
            else if (showAiTab && menuItem.key === EMenuItemKey.AI) {
                return (<NavToolsItem key={menuItem.key} menuItem={menuItem} className={cx({ [styles.vision]: p.isVisionRunning })} onClick={() => openSettingsWindow(ESettingsCategory.AI)}/>);
            }
            else if (menuItem.key === EMenuItemKey.Settings) {
                return (<NavToolsItem key={menuItem.key} menuItem={menuItem} onClick={() => openSettingsWindow()}/>);
            }
            else if (menuItem.key === EMenuItemKey.Login) {
                return (<LoginMenuItem key={menuItem.key} menuItem={menuItem} handleAuth={handleAuth} handleShowModal={handleShowModal}/>);
            }
        })}
      </Menu>
      <AuthModal title={$t('Confirm')} prompt={confirmMsg} showModal={showModal} handleAuth={handleAuth} handleShowModal={handleShowModal}/>
    </>);
}
function NavToolsItem(p) {
    const { menuItem, icon, className, onClick } = p;
    const title = useMemo(() => {
        return menuTitles(menuItem.key);
    }, [menuItem]);
    return (<MenuItem title={title} icon={icon !== null && icon !== void 0 ? icon : <i className={menuItem === null || menuItem === void 0 ? void 0 : menuItem.icon}/>} className={className} onClick={onClick}>
      {title}
    </MenuItem>);
}
function DashboardSubMenu(p) {
    const { subMenuItems, throttledOpenDashboard, openSettingsWindow } = p;
    function handleNavigation(type) {
        if (type === 'multistream') {
            openSettingsWindow('Multistreaming');
        }
        else {
            throttledOpenDashboard(type);
        }
    }
    return (<>
      {subMenuItems.map((subMenuItem) => (<MenuItem key={subMenuItem.key} title={menuTitles(subMenuItem.key)} onClick={() => handleNavigation(subMenuItem === null || subMenuItem === void 0 ? void 0 : subMenuItem.type)}>
          {menuTitles(subMenuItem.key)}
        </MenuItem>))}
    </>);
}
function LoginMenuItem(p) {
    const { menuItem, handleAuth, handleShowModal } = p;
    const { UserService, SideNavService } = Services;
    const { isLoggedIn, platform, isOpen } = useVuex(() => {
        var _a, _b;
        return ({
            isLoggedIn: UserService.views.isLoggedIn,
            platform: (_a = UserService.views.auth) === null || _a === void 0 ? void 0 : _a.platforms[(_b = UserService.views.auth) === null || _b === void 0 ? void 0 : _b.primaryPlatform],
            isOpen: SideNavService.views.isOpen,
        });
    }, false);
    return (<MenuItem data-testid="nav-auth" title={!isLoggedIn ? menuTitles(menuItem.key) : $t('Log Out')} className={cx(styles.login, !isOpen && styles.loginClosed)} icon={!isOpen && <i className="icon-user"/>} onClick={() => (isLoggedIn ? handleShowModal(true) : handleAuth())}>
      {!isLoggedIn ? (<span className={styles.loggedOut}>{menuTitles(menuItem.key)}</span>) : (isOpen && <PlatformIndicator platform={platform}/>)}
    </MenuItem>);
}
//# sourceMappingURL=NavTools.jsx.map