var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ModalLayout from 'components/ModalLayout.vue';
import TsxComponent from 'components/tsx-component';
import { $t } from 'services/i18n';
import { BoolInput, NumberInput } from 'components/shared/inputs/inputs';
import styles from './EventFilterMenu.m.less';
let EventFilterMenu = class EventFilterMenu extends TsxComponent {
    cancel() {
        this.windowsService.closeChildWindow();
    }
    get mainFilters() {
        return this.recentEventsService.filters.main;
    }
    get subFilters() {
        return this.recentEventsService.filters.sub;
    }
    get resubFilters() {
        return this.recentEventsService.filters.resub;
    }
    get minMonthsFilter() {
        return this.recentEventsService.filters.minMonths;
    }
    get subsEnabled() {
        return this.subFilters.hasOwnProperty('subscription') && this.subFilters['subscription'].value;
    }
    get resubsEnabled() {
        return this.resubFilters.hasOwnProperty('resub') && this.resubFilters['resub'].value;
    }
    get isTwitch() {
        return this.userService.platform.type === 'twitch';
    }
    get isTrovo() {
        return this.userService.platform.type === 'trovo';
    }
    updateFilter(filter, value) {
        this.recentEventsService.updateFilterPreference(filter, value);
    }
    renderBooleanInput(key, filter, header = false) {
        return (React.createElement(BoolInput, { value: filter.value, metadata: { title: $t(filter.name) }, onInput: (value) => this.updateFilter(key, value), class: header ? styles.categoryHeader : '' }));
    }
    get renderGeneralFilters() {
        return (React.createElement("div", { class: styles.generalFilters }, Object.entries(this.mainFilters).map(([name, filter]) => (React.createElement("div", null, this.renderBooleanInput(name, filter))))));
    }
    get renderSubFilters() {
        return (React.createElement("div", { class: styles.halfWidth },
            React.createElement("div", null, this.renderBooleanInput('subscription', this.subFilters['subscription'], true)),
            this.subsEnabled &&
                Object.entries(this.subFilters)
                    .filter(([name]) => name !== 'subscription')
                    .map(([name, filter]) => React.createElement("div", null, this.renderBooleanInput(name, filter)))));
    }
    get renderResubFilters() {
        return (React.createElement("div", { class: styles.halfWidth },
            React.createElement("div", null, this.renderBooleanInput('resub', this.resubFilters['resub'], true)),
            React.createElement("div", { class: styles.resubOptions }, this.resubsEnabled &&
                Object.entries(this.resubFilters)
                    .filter(([name]) => !/months/.test(name) &&
                    name !== 'resub' &&
                    name !== 'filter_subscription_minimum_enabled')
                    .map(([name, filter]) => React.createElement("div", null, this.renderBooleanInput(name, filter)))),
            this.renderResubMonthsFilter));
    }
    get renderResubMonthsFilter() {
        if (!this.isTwitch) {
            return;
        }
        const minEnabledFilter = this.resubFilters['filter_subscription_minimum_enabled'];
        const minMonthsFilter = this.minMonthsFilter['filter_subscription_minimum_months'];
        return (React.createElement("div", { class: styles.minimum },
            this.resubsEnabled &&
                this.renderBooleanInput('filter_subscription_minimum_enabled', minEnabledFilter),
            this.resubsEnabled && (minEnabledFilter === null || minEnabledFilter === void 0 ? void 0 : minEnabledFilter.value) && (React.createElement("div", { class: styles.monthsInputContainer },
                React.createElement(NumberInput, { value: minMonthsFilter.value, metadata: { min: 1, max: 120, isInteger: true }, onInput: (value) => this.updateFilter('filter_subscription_minimum_months', value), class: styles.monthsInput })))));
    }
    render() {
        return (React.createElement(ModalLayout, { customControls: true, showControls: false },
            React.createElement("div", { slot: "content", class: styles.flexColumn },
                this.renderGeneralFilters,
                (this.isTwitch || this.isTrovo) && (React.createElement("div", { class: styles.subFilters },
                    this.renderSubFilters,
                    this.renderResubFilters))),
            React.createElement("div", { slot: "controls" },
                React.createElement("button", { class: "button button--action", onClick: this.cancel }, $t('Done')))));
    }
};
__decorate([
    Inject()
], EventFilterMenu.prototype, "windowsService", void 0);
__decorate([
    Inject()
], EventFilterMenu.prototype, "recentEventsService", void 0);
__decorate([
    Inject()
], EventFilterMenu.prototype, "userService", void 0);
EventFilterMenu = __decorate([
    Component({})
], EventFilterMenu);
export default EventFilterMenu;
//# sourceMappingURL=EventFilterMenu.js.map