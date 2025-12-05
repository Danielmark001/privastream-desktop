var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LayoutService_1;
import Vue from 'vue';
import isEqual from 'lodash/isEqual';
import { Inject, ViewHandler, InitAfter } from 'services/core';
import { PersistentStatefulService } from 'services/core/persistent-stateful-service';
import { mutation } from 'services/core/stateful-service';
import { $t } from 'services/i18n';
import uuid from 'uuid/v4';
import { LAYOUT_DATA, ELEMENT_DATA, ELayout, ELayoutElement, } from './layout-data';
import { menuTitles } from 'services/side-nav/menu-data';
export { ELayout, ELayoutElement };
class LayoutViews extends ViewHandler {
    get currentTab() {
        return this.state.tabs[this.state.currentTab];
    }
    get component() {
        return LAYOUT_DATA[this.currentTab.currentLayout].component;
    }
    get elementsToRender() {
        return Object.keys(this.currentTab.slottedElements).filter((key) => this.currentTab.slottedElements[key].slot);
    }
    get studioTabs() {
        return Object.keys(this.state.tabs).map((tab, i) => ({
            key: tab,
            target: tab,
            title: i === 0 || !this.state.tabs[tab].name ? menuTitles('Editor') : this.state.tabs[tab].name,
            icon: this.state.tabs[tab].icon,
            trackingTarget: tab === 'default' ? 'editor' : 'custom',
        }));
    }
    elementTitle(element) {
        if (!element)
            return;
        return ELEMENT_DATA()[element].title;
    }
    elementComponent(element) {
        return ELEMENT_DATA()[element].component;
    }
    className(layout) {
        return LAYOUT_DATA[layout].className;
    }
    calculateColumnTotal(slots) {
        let totalWidth = 0;
        slots.forEach(slot => {
            if (Array.isArray(slot)) {
                totalWidth += this.calculateMinimum('x', slot);
            }
            else if (slot) {
                totalWidth += slot.x;
            }
        });
        return totalWidth;
    }
    calculateMinimum(orientation, slots) {
        const aggregateMins = [];
        const minimums = [];
        slots.forEach(slot => {
            if (Array.isArray(slot)) {
                aggregateMins.push(this.aggregateMinimum(orientation, slot));
            }
            else {
                minimums.push(slot[orientation]);
            }
        });
        if (!minimums.length)
            minimums.push(10);
        return Math.max(...minimums, ...aggregateMins);
    }
    aggregateMinimum(orientation, slots) {
        const minimums = slots.map(mins => {
            if (mins)
                return mins[orientation];
            return 10;
        });
        if (!minimums.length)
            minimums.push(10);
        return minimums.reduce((a, b) => a + b);
    }
}
let LayoutService = LayoutService_1 = class LayoutService extends PersistentStatefulService {
    init() {
        super.init();
        this.migrateSlots();
        if (!this.state.tabs.default.name) {
            this.SET_TAB_NAME('default', $t('Editor'));
        }
        if (this.customizationService.state.legacyEvents &&
            isEqual(this.state, LayoutService_1.defaultState)) {
            this.setSlots({
                [ELayoutElement.Display]: { slot: '1' },
                [ELayoutElement.LegacyEvents]: { slot: '2' },
                [ELayoutElement.Scenes]: { slot: '3' },
                [ELayoutElement.Sources]: { slot: '4' },
                [ELayoutElement.Mixer]: { slot: '5' },
            });
            this.customizationService.setSettings({ legacyEvents: false });
        }
        this.checkUsage();
    }
    checkUsage() {
        if (Object.keys(this.state.tabs).length > 1) {
            this.usageStatisticsService.recordFeatureUsage('LayoutEditorTabs');
            this.usageStatisticsService.recordFeatureUsage('LayoutEditor');
        }
        else if (this.state.tabs.default.currentLayout !== ELayout.Default) {
            this.usageStatisticsService.recordFeatureUsage('LayoutEditor');
        }
    }
    migrateSlots() {
        const slottedElements = {};
        if (this.state.currentTab !== 'default')
            return;
        Object.keys(this.state.tabs.default.slottedElements).forEach(el => {
            if (typeof this.state.tabs.default.slottedElements[el] === 'string') {
                slottedElements[el] = { slot: this.state.tabs.default.slottedElements[el] };
            }
            else if (this.state.tabs.default.slottedElements[el]) {
                slottedElements[el] = this.state.tabs.default.slottedElements[el];
            }
        });
        this.SET_SLOTS(slottedElements);
    }
    get views() {
        return new LayoutViews(this.state);
    }
    setCurrentTab(id) {
        this.SET_CURRENT_TAB(id);
    }
    setBarResize(bar, size) {
        this.SET_RESIZE(bar, size);
    }
    changeLayout(layout) {
        this.CHANGE_LAYOUT(layout);
        this.checkUsage();
    }
    setSlots(slottedElements) {
        this.SET_SLOTS(slottedElements);
    }
    setUrl(url) {
        this.SET_URL(url);
    }
    addTab(name, icon) {
        const id = uuid();
        this.ADD_TAB(name, icon, id);
        this.checkUsage();
        return id;
    }
    removeCurrentTab() {
        this.REMOVE_TAB(this.state.currentTab);
    }
    CHANGE_LAYOUT(layout) {
        Vue.set(this.state.tabs[this.state.currentTab], 'currentLayout', layout);
        Vue.set(this.state.tabs[this.state.currentTab], 'slottedElements', {});
        Vue.set(this.state.tabs[this.state.currentTab], 'resizes', LAYOUT_DATA[layout].resizeDefaults);
    }
    SET_SLOTS(slottedElements) {
        if (LayoutService_1.defaultState.tabs[this.state.currentTab]) {
            Object.keys(LayoutService_1.defaultState.tabs[this.state.currentTab].slottedElements).forEach(el => {
                if (!slottedElements[el]) {
                    slottedElements[el] = { slot: null };
                }
            });
        }
        Vue.set(this.state.tabs[this.state.currentTab], 'slottedElements', slottedElements);
    }
    SET_URL(url) {
        Vue.set(this.state.tabs[this.state.currentTab].slottedElements[ELayoutElement.Browser], 'src', url);
    }
    SET_RESIZE(bar, size) {
        Vue.set(this.state.tabs[this.state.currentTab].resizes, bar, size);
    }
    SET_TAB_NAME(id, name) {
        Vue.set(this.state.tabs[id], 'name', name);
    }
    SET_CURRENT_TAB(id) {
        this.state.currentTab = id;
    }
    REMOVE_TAB(id) {
        if (this.state.currentTab === id) {
            this.state.currentTab = 'default';
        }
        Vue.delete(this.state.tabs, id);
    }
    ADD_TAB(name, icon, id) {
        Vue.set(this.state.tabs, id, {
            name,
            icon,
            currentLayout: ELayout.Default,
            slottedElements: {
                [ELayoutElement.Display]: { slot: '1' },
                [ELayoutElement.Minifeed]: { slot: '2' },
                [ELayoutElement.Scenes]: { slot: '3' },
                [ELayoutElement.Sources]: { slot: '4' },
                [ELayoutElement.Mixer]: { slot: '5' },
            },
            resizes: {
                bar1: 156,
                bar2: 240,
            },
        });
        this.state.currentTab = id;
    }
};
LayoutService.defaultState = {
    currentTab: 'default',
    tabs: {
        default: {
            name: null,
            icon: 'icon-studio',
            currentLayout: ELayout.Default,
            slottedElements: {
                [ELayoutElement.Display]: { slot: '1' },
                [ELayoutElement.Minifeed]: { slot: '2' },
                [ELayoutElement.Scenes]: { slot: '3' },
                [ELayoutElement.Sources]: { slot: '4' },
                [ELayoutElement.Mixer]: { slot: '5' },
            },
            resizes: {
                bar1: 156,
                bar2: 240,
            },
        },
    },
};
__decorate([
    Inject()
], LayoutService.prototype, "customizationService", void 0);
__decorate([
    Inject()
], LayoutService.prototype, "usageStatisticsService", void 0);
__decorate([
    mutation()
], LayoutService.prototype, "CHANGE_LAYOUT", null);
__decorate([
    mutation()
], LayoutService.prototype, "SET_SLOTS", null);
__decorate([
    mutation()
], LayoutService.prototype, "SET_URL", null);
__decorate([
    mutation()
], LayoutService.prototype, "SET_RESIZE", null);
__decorate([
    mutation()
], LayoutService.prototype, "SET_TAB_NAME", null);
__decorate([
    mutation()
], LayoutService.prototype, "SET_CURRENT_TAB", null);
__decorate([
    mutation()
], LayoutService.prototype, "REMOVE_TAB", null);
__decorate([
    mutation()
], LayoutService.prototype, "ADD_TAB", null);
LayoutService = LayoutService_1 = __decorate([
    InitAfter('UserService')
], LayoutService);
export { LayoutService };
//# sourceMappingURL=index.js.map