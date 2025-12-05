import React, { useCallback, useEffect, useRef } from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import cx from 'classnames';
import { EMenuItemKey, ESubMenuItemKey } from 'services/side-nav';
import { EDismissable } from 'services/dismissables';
import { $t } from 'services/i18n';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import NavTools from './NavTools';
import styles from './SideNav.m.less';
import { Layout, Button } from 'antd';
import Scrollable from 'components-react/shared/Scrollable';
import HelpTip from 'components-react/shared/HelpTip';
import FeaturesNav from './FeaturesNav';
import { useRealmObject } from 'components-react/hooks/realm';
const { Sider } = Layout;
export default function SideNav(p) {
    const { CustomizationService, SideNavService, WindowsService } = Services;
    const { currentMenuItem, setCurrentMenuItem, isOpen, toggleMenuStatus, updateStyleBlockers, hideStyleBlockers, } = useVuex(() => ({
        currentMenuItem: SideNavService.views.currentMenuItem,
        setCurrentMenuItem: SideNavService.actions.setCurrentMenuItem,
        isOpen: SideNavService.views.isOpen,
        toggleMenuStatus: SideNavService.actions.toggleMenuStatus,
        updateStyleBlockers: WindowsService.actions.updateStyleBlockers,
        hideStyleBlockers: WindowsService.state.main.hideStyleBlockers,
    }));
    const sider = useRef(null);
    const isMounted = useRef(false);
    const leftDock = useRealmObject(CustomizationService.state).leftDock;
    const siderMinWidth = 50;
    const siderMaxWidth = 200;
    let lastHeight = 0;
    const resizeObserver = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
            var _a, _b;
            const width = Math.floor((_a = entry === null || entry === void 0 ? void 0 : entry.contentRect) === null || _a === void 0 ? void 0 : _a.width);
            const height = Math.floor((_b = entry === null || entry === void 0 ? void 0 : entry.contentRect) === null || _b === void 0 ? void 0 : _b.height);
            if (lastHeight === height && (width === siderMinWidth || width === siderMaxWidth)) {
                updateStyleBlockers('main', false);
            }
            lastHeight = height;
        });
    });
    useEffect(() => {
        isMounted.current = true;
        if (!sider || !sider.current)
            return;
        if (sider && (sider === null || sider === void 0 ? void 0 : sider.current)) {
            resizeObserver.observe(sider === null || sider === void 0 ? void 0 : sider.current);
            if (hideStyleBlockers) {
                updateStyleBlockers('main', false);
            }
        }
        return () => {
            if (sider && (sider === null || sider === void 0 ? void 0 : sider.current)) {
                resizeObserver.disconnect();
            }
            isMounted.current = false;
        };
    }, [sider]);
    const updateSubMenu = useCallback(() => {
        const subMenuItems = {
            [EMenuItemKey.Themes]: ESubMenuItemKey.Scene,
            [ESubMenuItemKey.Scene]: EMenuItemKey.Themes,
            [EMenuItemKey.AppStore]: ESubMenuItemKey.AppsStoreHome,
            [ESubMenuItemKey.AppsStoreHome]: EMenuItemKey.AppStore,
        };
        if (Object.keys(subMenuItems).includes(currentMenuItem)) {
            setCurrentMenuItem(subMenuItems[currentMenuItem]);
        }
    }, [currentMenuItem]);
    return (React.createElement(Layout, { hasSider: true, className: "side-nav" },
        React.createElement(Sider, { collapsible: true, collapsed: !isOpen, trigger: null, className: cx(styles.sidenavSider, !isOpen && styles.siderClosed, !leftDock && styles.noLeftDock), ref: sider },
            React.createElement(Scrollable, { className: cx(styles.sidenavScroll) },
                React.createElement(FeaturesNav, null),
                React.createElement(NavTools, { isVisionRunning: p.isVisionRunning })),
            React.createElement(LoginHelpTip, null)),
        React.createElement(Button, { type: "primary", className: cx(styles.sidenavButton, !isOpen && styles.flipped, isOpen && styles.siderOpen, leftDock && styles.leftDock), onClick: () => {
                updateSubMenu();
                toggleMenuStatus();
                updateStyleBlockers('main', true);
            } },
            React.createElement("i", { className: "icon-back" }))));
}
function LoginHelpTip() {
    return (React.createElement(HelpTip, { title: $t('Login'), dismissableKey: EDismissable.LoginPrompt, position: { top: 'calc(100vh - 175px)', left: '80px' }, arrowPosition: "bottom", style: { position: 'absolute' } },
        React.createElement("div", null, $t('Gain access to additional features by logging in with your preferred streaming platform.'))));
}
//# sourceMappingURL=SideNav.js.map