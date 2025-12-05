var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ViewHandler, InitAfter, PersistentStatefulService, Inject } from 'services/core';
import { mutation } from 'services/core/stateful-service';
import { EDismissable } from 'services/dismissables';
import { EMenuItemKey, SideNavMenuItems, ENavName, SideBarTopNavData, SideBarBottomNavData, loggedOutMenuItems, } from './menu-data';
class SideNavViews extends ViewHandler {
    get isOpen() {
        return this.state.isOpen;
    }
    get compactView() {
        return this.state.compactView;
    }
    get menuItemStatus() {
        return this.state[ENavName.TopNav].menuItems.reduce((menuItems, menuItem) => {
            return Object.assign(Object.assign({}, menuItems), { [menuItem.key]: menuItem.isActive });
        }, {});
    }
    get hasLegacyMenu() {
        return this.state.hasLegacyMenu;
    }
    get currentMenuItem() {
        return this.state.currentMenuItem;
    }
    get apps() {
        return this.state.apps;
    }
    get showCustomEditor() {
        return this.state.showCustomEditor;
    }
    get loggedOutMenuItemKeys() {
        return loggedOutMenuItems.map(item => item.key);
    }
    get loggedOutMenuItemTargets() {
        return loggedOutMenuItems.map(item => item === null || item === void 0 ? void 0 : item.target).filter(target => target);
    }
    getExpandedMenuItems(name) {
        if (!name)
            return;
        return this.state[name].menuItems.reduce((keys, menuItem) => {
            if (menuItem.isExpanded) {
                keys.push(menuItem.key);
            }
            return keys;
        }, []);
    }
    getMenuItemData(name, menuItemKey) {
        return this.state[name].menuItems.find(item => item.key === menuItemKey);
    }
}
let SideNavService = class SideNavService extends PersistentStatefulService {
    constructor() {
        super(...arguments);
        this.version = '3';
    }
    init() {
        super.init();
        if (this.state.version !== this.version) {
            this.UPDATE_MENU_ITEMS(ENavName.TopNav, SideBarTopNavData().menuItems);
            this.UPDATE_MENU_ITEMS(ENavName.BottomNav, SideBarBottomNavData().menuItems);
            this.SET_VERSION(this.version);
        }
        this.userService.userLoginFinished.subscribe(() => this.handleUserLogin());
        this.handleDismissables();
        const hasRecordingHistory = this.state[ENavName.TopNav].menuItems.find(item => item.key === EMenuItemKey.RecordingHistory);
        if (!hasRecordingHistory) {
            const index = this.state[ENavName.TopNav].menuItems.length - 2;
            const menuItems = [...this.state[ENavName.TopNav].menuItems];
            menuItems.splice(index, 0, SideNavMenuItems()[EMenuItemKey.RecordingHistory]);
            this.UPDATE_MENU_ITEMS(ENavName.TopNav, menuItems);
        }
        this.state.currentMenuItem =
            this.layoutService.state.currentTab !== 'default'
                ? this.layoutService.state.currentTab
                : EMenuItemKey.Editor;
    }
    get views() {
        return new SideNavViews(this.state);
    }
    toggleMenuStatus() {
        this.OPEN_CLOSE_MENU();
    }
    setCurrentMenuItem(key) {
        this.SET_CURRENT_MENU_ITEM(key);
    }
    setCompactView(isCompact) {
        this.SET_COMPACT_VIEW(isCompact);
    }
    handleUserLogin() {
        const registrationDate = this.userService.state.createdAt;
        const legacyMenu = registrationDate < new Date('December 8, 2022').valueOf();
        if (!(legacyMenu && this.dismissablesService.views.shouldShow(EDismissable.NewSideNav)) &&
            !legacyMenu &&
            this.state.hasLegacyMenu) {
            this.SET_NEW_USER_LOGIN();
        }
        if (this.state.currentMenuItem !== this.layoutService.state.currentTab) {
            this.SET_CURRENT_MENU_ITEM(this.layoutService.state.currentTab);
        }
        this.dismissablesService.dismiss(EDismissable.LoginPrompt);
    }
    handleDismissables() {
        const loggedIn = this.userService.views.isLoggedIn;
        const registrationDate = this.userService.state.createdAt;
        const legacyMenu = registrationDate < new Date('December 8, 2022').valueOf();
        if (loggedIn) {
            this.dismissablesService.dismiss(EDismissable.LoginPrompt);
            if (legacyMenu && !this.appService.state.onboarded) {
                this.dismissablesService.views.shouldShow(EDismissable.NewSideNav);
                this.dismissablesService.views.shouldShow(EDismissable.CustomMenuSettings);
            }
            else {
                this.dismissablesService.dismiss(EDismissable.NewSideNav);
                this.dismissablesService.dismiss(EDismissable.CustomMenuSettings);
            }
        }
        else {
            if (legacyMenu) {
                this.dismissablesService.dismiss(EDismissable.LoginPrompt);
                if (!this.appService.state.onboarded) {
                    this.dismissablesService.views.shouldShow(EDismissable.NewSideNav);
                    this.dismissablesService.views.shouldShow(EDismissable.CustomMenuSettings);
                }
                else {
                    this.dismissablesService.dismiss(EDismissable.NewSideNav);
                    this.dismissablesService.dismiss(EDismissable.CustomMenuSettings);
                }
            }
            else {
                this.dismissablesService.views.shouldShow(EDismissable.LoginPrompt);
                this.dismissablesService.dismiss(EDismissable.NewSideNav);
                this.dismissablesService.dismiss(EDismissable.CustomMenuSettings);
            }
        }
    }
    expandMenuItem(navName, key) {
        this.EXPAND_MENU_ITEM(navName, key);
    }
    toggleSidebarSubmenu(status) {
        this.TOGGLE_SIDEBAR_SUBMENU(status);
    }
    setMenuItemStatus(navName, menuItemKey, status) {
        this.SET_MENU_ITEM_STATUS(navName, menuItemKey, status);
    }
    toggleMenuItem(navName, menuItemKey, status) {
        this.TOGGLE_MENU_ITEM(navName, menuItemKey, status);
    }
    updateAllApps(loadedApps) {
        this.UPDATE_ALL_APPS(loadedApps);
    }
    toggleApp(appId) {
        this.TOGGLE_APP(appId);
    }
    replaceApp(newApp, index) {
        this.REPLACE_APP(newApp, index);
    }
    SET_COMPACT_VIEW(isCompact) {
        this.state.compactView = isCompact;
    }
    SET_NEW_USER_LOGIN() {
        this.state = Object.assign(Object.assign({}, this.state), { isOpen: true, hasLegacyMenu: false, compactView: true, showCustomEditor: false, [ENavName.TopNav]: Object.assign(Object.assign({}, this.state[ENavName.TopNav]), { menuItems: [
                    Object.assign(Object.assign({}, SideNavMenuItems()[EMenuItemKey.Editor]), { isActive: true }),
                    Object.assign(Object.assign({}, SideNavMenuItems()[EMenuItemKey.LayoutEditor]), { isActive: false }),
                    Object.assign(Object.assign({}, SideNavMenuItems()[EMenuItemKey.StudioMode]), { isActive: false }),
                    Object.assign(Object.assign({}, SideNavMenuItems()[EMenuItemKey.Themes]), { isActive: true }),
                    Object.assign(Object.assign({}, SideNavMenuItems()[EMenuItemKey.AppStore]), { isActive: true }),
                    Object.assign(Object.assign({}, SideNavMenuItems()[EMenuItemKey.Highlighter]), { isActive: true }),
                    Object.assign(Object.assign({}, SideNavMenuItems()[EMenuItemKey.RecordingHistory]), { isActive: true }),
                    Object.assign(Object.assign({}, SideNavMenuItems()[EMenuItemKey.ThemeAudit]), { isActive: true }),
                ] }), [ENavName.BottomNav]: Object.assign(Object.assign({}, this.state[ENavName.BottomNav]), { menuItems: this.state[ENavName.BottomNav].menuItems.map((menuItem) => {
                    if (menuItem.key === EMenuItemKey.Dashboard) {
                        return Object.assign(Object.assign({}, this.state[ENavName.BottomNav].menuItems[EMenuItemKey.Dashboard]), { isExpanded: true });
                    }
                    return menuItem;
                }) }) });
    }
    OPEN_CLOSE_MENU() {
        this.state.isOpen = !this.state.isOpen;
    }
    TOGGLE_SIDEBAR_SUBMENU(status) {
        this.state.showCustomEditor = status !== null && status !== void 0 ? status : !this.state.showCustomEditor;
    }
    TOGGLE_MENU_ITEM(navName, menuItemKey, status) {
        this.state[navName] = Object.assign(Object.assign({}, this.state[navName]), { menuItems: [
                ...this.state[navName].menuItems.map(menuItem => {
                    if (menuItem.key === menuItemKey) {
                        return Object.assign(Object.assign({}, menuItem), { isActive: status !== null && status !== void 0 ? status : !(menuItem === null || menuItem === void 0 ? void 0 : menuItem.isActive) });
                    }
                    return menuItem;
                }),
            ] });
    }
    SET_MENU_ITEM_STATUS(navName, menuItemKey, status) {
        this.state[navName] = Object.assign(Object.assign({}, this.state[navName]), { menuItems: [
                ...this.state[navName].menuItems.map(menuItem => {
                    if (menuItem.key === menuItemKey) {
                        return Object.assign(Object.assign({}, menuItem), { isActive: status });
                    }
                    return menuItem;
                }),
            ] });
    }
    UPDATE_ALL_APPS(currentApps) {
        this.state.apps = this.state.apps.map(app => {
            const activeApp = currentApps.find(currentApp => currentApp.id === (app === null || app === void 0 ? void 0 : app.id));
            if (!activeApp)
                return null;
            return app;
        });
    }
    TOGGLE_APP(appId) {
        this.state.apps = this.state.apps.map(app => {
            if (!app)
                return null;
            if (app.id === appId) {
                return Object.assign(Object.assign({}, app), { isActive: !app.isActive });
            }
            return app;
        });
    }
    REPLACE_APP(newApp, index) {
        const updatedApps = this.state.apps.map((app, i) => {
            if (i === index)
                return newApp;
            if (!app || (app === null || app === void 0 ? void 0 : app.id) === newApp.id) {
                return null;
            }
            return app;
        });
        this.state.apps = updatedApps;
    }
    EXPAND_MENU_ITEM(navName, key) {
        this.state[navName] = Object.assign(Object.assign({}, this.state[navName]), { menuItems: [
                ...this.state[navName].menuItems.map(menuItem => {
                    if (menuItem.key === key) {
                        return Object.assign(Object.assign({}, menuItem), { isExpanded: !menuItem.isExpanded });
                    }
                    return menuItem;
                }),
            ] });
    }
    SET_CURRENT_MENU_ITEM(key) {
        this.state.currentMenuItem = key;
    }
    UPDATE_MENU_ITEMS(navName, menuItems) {
        this.state[navName] = {
            name: navName,
            menuItems: [...menuItems],
        };
    }
    SET_VERSION(version) {
        this.state.version = version;
    }
};
SideNavService.defaultState = {
    version: '0',
    isOpen: false,
    showCustomEditor: true,
    hasLegacyMenu: true,
    currentMenuItem: EMenuItemKey.Editor,
    compactView: false,
    apps: [null, null, null, null, null],
    [ENavName.TopNav]: SideBarTopNavData(),
    [ENavName.BottomNav]: SideBarBottomNavData(),
};
__decorate([
    Inject()
], SideNavService.prototype, "userService", void 0);
__decorate([
    Inject()
], SideNavService.prototype, "appService", void 0);
__decorate([
    Inject()
], SideNavService.prototype, "dismissablesService", void 0);
__decorate([
    Inject()
], SideNavService.prototype, "layoutService", void 0);
__decorate([
    Inject()
], SideNavService.prototype, "platformAppsService", void 0);
__decorate([
    mutation()
], SideNavService.prototype, "SET_COMPACT_VIEW", null);
__decorate([
    mutation()
], SideNavService.prototype, "SET_NEW_USER_LOGIN", null);
__decorate([
    mutation()
], SideNavService.prototype, "OPEN_CLOSE_MENU", null);
__decorate([
    mutation()
], SideNavService.prototype, "TOGGLE_SIDEBAR_SUBMENU", null);
__decorate([
    mutation()
], SideNavService.prototype, "TOGGLE_MENU_ITEM", null);
__decorate([
    mutation()
], SideNavService.prototype, "SET_MENU_ITEM_STATUS", null);
__decorate([
    mutation()
], SideNavService.prototype, "UPDATE_ALL_APPS", null);
__decorate([
    mutation()
], SideNavService.prototype, "TOGGLE_APP", null);
__decorate([
    mutation()
], SideNavService.prototype, "REPLACE_APP", null);
__decorate([
    mutation()
], SideNavService.prototype, "EXPAND_MENU_ITEM", null);
__decorate([
    mutation()
], SideNavService.prototype, "SET_CURRENT_MENU_ITEM", null);
__decorate([
    mutation()
], SideNavService.prototype, "UPDATE_MENU_ITEMS", null);
__decorate([
    mutation()
], SideNavService.prototype, "SET_VERSION", null);
SideNavService = __decorate([
    InitAfter('UserService'),
    InitAfter('PlatformAppsService')
], SideNavService);
export { SideNavService };
//# sourceMappingURL=menu.js.map