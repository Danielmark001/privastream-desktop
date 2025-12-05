var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component } from 'vue-property-decorator';
import { inputComponents } from 'components/widgets/inputs';
import WidgetEditor from 'components/windows/WidgetEditor.vue';
import WidgetSettings from './WidgetSettings.vue';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { $t } from 'services/i18n/index';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
let Credits = class Credits extends WidgetSettings {
    get themeOptions() {
        return Object.keys(this.wData.themes).map(theme => ({
            title: this.wData.themes[theme].label,
            value: theme,
        }));
    }
    optionIterable(map) {
        return Object.keys(map).filter(option => this.wData.settings[option] != null);
    }
    get shownCreditOptions() {
        return {
            followers: $t('Show Followers'),
            subscribers: $t('Show Subscribers'),
            bits: $t('Show Cheers'),
            moderators: $t('Show Moderators'),
            subscriptions: $t('Show Subscriptions'),
            sponsors: $t('Show Members'),
            superchats: $t('Show Super Chats'),
        };
    }
    get creditNameOptions() {
        return {
            followers_change: $t('Followers'),
            subscribers_change: $t('Subscribers & Resubs'),
            bits_change: $t('Cheers'),
            mods_change: $t('Moderators'),
            subscriptions_change: $t('Subscriptions'),
            sponsors_change: $t('Members'),
            superchats_change: $t('Super Chats'),
        };
    }
    rollCredits() {
        this.service.testRollCredits();
    }
    get metadata() {
        return this.service.getMetadata(this.themeOptions);
    }
    get navItems() {
        return [
            { value: 'manage-credits', label: $t('Manage Credits') },
            { value: 'visual', label: $t('Visual Settings') },
            { value: 'source', label: $t('Source') },
        ];
    }
};
Credits = __decorate([
    Component({
        components: Object.assign({ WidgetEditor,
            VFormGroup,
            ValidatedForm }, inputComponents),
    })
], Credits);
export default Credits;
//# sourceMappingURL=Credits.vue.js.map