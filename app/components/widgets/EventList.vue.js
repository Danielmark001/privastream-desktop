var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component } from 'vue-property-decorator';
import WidgetEditor from 'components/windows/WidgetEditor.vue';
import WidgetSettings from './WidgetSettings.vue';
import { inputComponents } from 'components/shared/inputs';
import { AnimationInput } from './inputs';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { $t } from 'services/i18n';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import { Inject } from 'services/core/injector';
let EventList = class EventList extends WidgetSettings {
    constructor() {
        super(...arguments);
        this.textColorTooltip = $t('A hex code for the base text color.');
        this.backgroundColorTooltip = $t('A hex code for the widget background. This is for preview purposes only. It will not be shown in your stream.');
        this.fontSizeTooltip = $t('The font size in pixels. Reasonable size typically ranges between 24px and 48px.');
    }
    get themeMetadata() {
        return Object.keys(this.wData.themes).map(theme => ({
            title: this.wData.themes[theme].label,
            value: theme,
        }));
    }
    get eventsForPlatform() {
        const baseEvents = [
            { key: 'show_donations', title: $t('Donations') },
            { key: 'show_merch', title: $t('Merch') },
        ];
        return this.service.eventsByPlatform().concat(baseEvents);
    }
    get minsForPlatform() {
        return this.service.minsByPlatform();
    }
    valueForEvent(event) {
        return this.wData.settings[event.key];
    }
    setEvent(event, value) {
        this.wData.settings[event.key] = value;
    }
    get navItems() {
        return [
            { value: 'manage-list', label: $t('Manage List') },
            { value: 'font', label: $t('Font Settings') },
            { value: 'visual', label: $t('Visual Settings') },
            { value: 'source', label: $t('Source') },
        ];
    }
};
__decorate([
    Inject()
], EventList.prototype, "userService", void 0);
EventList = __decorate([
    Component({
        components: Object.assign({ WidgetEditor,
            VFormGroup,
            AnimationInput,
            ValidatedForm }, inputComponents),
    })
], EventList);
export default EventList;
//# sourceMappingURL=EventList.vue.js.map