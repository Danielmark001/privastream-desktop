var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component } from 'vue-property-decorator';
import WidgetEditor from 'components/windows/WidgetEditor.vue';
import WidgetSettings from './WidgetSettings.vue';
import { inputComponents } from 'components/widgets/inputs';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { $t } from 'services/i18n';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import { Inject } from 'services/core/injector';
import { alertNameMap } from '../../services/widgets/settings/alert-box/alert-box-data';
const triggerAmountMap = {
    bits: 'bits_alert_min_amount',
    donations: 'donation_alert_min_amount',
    raids: 'raid_raider_minimum',
};
const HAS_ALERT_SETTINGS = ['donations', 'bits', 'effects', 'raids', 'stickers'];
const HAS_DONOR_MESSAGE = [
    'donations',
    'bits',
    'subs',
    'merch',
    'patreon',
    'extraLife',
    'donordrive',
    'justGiving',
    'tiltify',
    'treat',
    'stars',
];
let AlertBox = class AlertBox extends WidgetSettings {
    constructor() {
        super(...arguments);
        this.alertTypes = this.alertBoxService.apiNames();
        this.addAlertMenuOpen = false;
        this.selectedAlert = 'general';
        this.selectedId = 'default';
        this.editingName = null;
        this.languages = [];
    }
    afterFetch() {
        this.alertTypes = this.alertTypes.filter(type => this.wData.settings[type]);
        const languages = this.wData.tts_languages;
        this.languages = Object.keys(languages)
            .map(category => ({
            label: category,
            options: Object.keys(languages[category]).map(key => ({
                value: key,
                label: languages[category][key],
            })),
        }))
            .sort((a, _b) => (a.label === 'Legacy Voice' ? -1 : 0));
    }
    alertName(alertType) {
        return alertNameMap()[alertType];
    }
    get metadata() {
        return this.service.getMetadata(this.selectedAlert, this.languages, this.selectedVariation.condition);
    }
    get selectedVariation() {
        if (this.selectedAlert === 'general') {
            return this.wData;
        }
        return this.wData.settings[this.selectedAlert].variations.find((variation) => variation.id === this.selectedId);
    }
    get navItems() {
        if (this.selectedAlert === 'general') {
            return [
                { value: 'general', label: $t('General Settings') },
                { value: 'moderation', label: $t('Moderator Tools') },
                { value: 'source', label: $t('Source') },
            ];
        }
        const baseItems = [
            { value: 'title', label: $t('Title Message') },
            { value: 'media', label: $t('Media') },
            { value: 'animation', label: $t('Animation') },
        ];
        if (HAS_DONOR_MESSAGE.includes(this.selectedAlert)) {
            baseItems.push({
                value: 'message',
                label: this.selectedAlert === 'subs' ? $t('Resub Message') : $t('Donor Message'),
            });
        }
        if (HAS_ALERT_SETTINGS.includes(this.selectedAlert) || !this.selectedId.match('default')) {
            baseItems.push({ value: 'alert', label: $t('Alert Settings') });
        }
        return baseItems;
    }
    get conditions() {
        return this.alertBoxService.conditionsByType(this.selectedAlert);
    }
    get conditionData() {
        return this.alertBoxService.conditionDataByCondition(this.selectedVariation);
    }
    get minTriggerAmount() {
        return this.wData.settings[triggerAmountMap[this.selectedAlert]];
    }
    set minTriggerAmount(value) {
        this.wData.settings[triggerAmountMap[this.selectedAlert]] = value;
    }
    get minRecentEvents() {
        return this.selectedAlert === 'donation'
            ? this.wData.settings.recent_events_donation_min_amount
            : this.wData.settings.recent_events_host_min_viewer_count;
    }
    set minRecentEvents(value) {
        if (this.selectedAlert === 'donation') {
            this.wData.settings.recent_events_donation_min_amount = value;
        }
        else {
            this.wData.settings.recent_events_host_min_viewer_count = value;
        }
    }
    handleUnlimitedModerationDelay(value) {
        if (value) {
            this.wData.settings.moderation_delay = -1;
        }
        else {
            this.wData.settings.moderation_delay = 0;
        }
    }
    selectAlertType(alertName) {
        this.selectedAlert = this.selectedAlert === alertName ? 'general' : alertName;
        this.selectedId = `default-${this.selectedAlert}`;
    }
    selectVariation(id) {
        this.selectedId = id;
    }
    toggleAddAlertMenu() {
        this.addAlertMenuOpen = !this.addAlertMenuOpen;
    }
    addAlert(type) {
        const newVariation = this.alertBoxService.newVariation(type);
        this.wData.settings[type].variations.push(newVariation);
        this.selectedAlert = type;
        this.addAlertMenuOpen = false;
        this.save();
        this.$nextTick(() => this.editName(newVariation.id));
    }
    removeVariation(id) {
        this.selectedId = `default-${this.selectedAlert}`;
        this.wData.settings[this.selectedAlert].variations = this.wData.settings[this.selectedAlert].variations.filter((variation) => variation.id !== id);
        this.save();
    }
    editName(id) {
        this.editingName = id;
        this.selectedId = id;
        const field = this.$refs[`${id}-name-input`][0];
        this.$nextTick(() => field.focus());
    }
    nameInputHandler(eventData) {
        this.selectedVariation.name = eventData;
    }
    nameBlurHandler(id) {
        this.save();
        this.editingName = null;
    }
};
__decorate([
    Inject()
], AlertBox.prototype, "alertBoxService", void 0);
AlertBox = __decorate([
    Component({
        components: Object.assign({ WidgetEditor,
            VFormGroup,
            ValidatedForm }, inputComponents),
    })
], AlertBox);
export default AlertBox;
//# sourceMappingURL=AlertBox.vue.js.map