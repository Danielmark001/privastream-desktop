var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Subject } from 'rxjs';
import { Inject, Service } from 'services/core';
import { RealmObject } from './realm';
class NavigationServiceEphemeralState extends RealmObject {
}
NavigationServiceEphemeralState.schema = {
    name: 'NavigationServiceEphemeralState',
    properties: {
        currentPage: { type: 'string', default: 'Studio' },
        params: { type: 'dictionary', default: {}, objectType: 'mixed' },
        currentSettingsTab: { type: 'string', default: 'General' },
    },
};
NavigationServiceEphemeralState.register();
export class NavigationService extends Service {
    constructor() {
        super(...arguments);
        this.state = NavigationServiceEphemeralState.inject();
        this.navigated = new Subject();
    }
    navigate(page, params = {}, setMenuItem = undefined) {
        if (setMenuItem) {
            this.sideNavService.setCurrentMenuItem(setMenuItem);
        }
        this.setPageNavigation(page, params);
        this.navigated.next(this.state);
    }
    navigateApp(appId, key) {
        this.navigate('PlatformAppMainPage', { appId });
        this.sideNavService.setCurrentMenuItem(key !== null && key !== void 0 ? key : appId);
    }
    setPageNavigation(page, params) {
        this.state.db.write(() => {
            this.state.currentPage = page;
            this.state.params = params;
        });
    }
    setSettingsNavigation(category) {
        this.state.db.write(() => {
            this.state.currentSettingsTab = category;
        });
    }
}
__decorate([
    Inject()
], NavigationService.prototype, "sideNavService", void 0);
//# sourceMappingURL=navigation.js.map