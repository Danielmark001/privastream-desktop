var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { createAlertsMap, useWidget, WidgetModule, } from './common/useWidget';
import values from 'lodash/values';
import cloneDeep from 'lodash/cloneDeep';
import intersection from 'lodash/intersection';
import { createBinding } from '../shared/inputs';
import { Services } from '../service-provider';
import { metadata } from '../shared/inputs/metadata';
import { $t } from '../../services/i18n';
import { getDefined } from '../../util/properties-type-guards';
import * as remote from '@electron/remote';
import { injectFormBinding, mutation } from 'slap';
export class AlertBoxModule extends WidgetModule {
    constructor() {
        super(...arguments);
        this.generalMetadata = getGeneralSettingsMetadata();
        this.variationsMetadata = getVariationsMetadata();
        this.bind = injectFormBinding(() => this.settings, statePatch => this.updateSettings(statePatch), fieldName => this.generalMetadata[fieldName]);
    }
    get alerts() {
        return this.widgetState.availableAlerts.map(alertType => this.eventsConfig[alertType]);
    }
    getVariationSettings(alertType, variationId = 'default') {
        const variations = this.widgetData.variations;
        if (!variations)
            return null;
        return this.widgetData.variations[alertType][variationId];
    }
    createVariationBinding(alertType, variationId = 'default', forceUpdate, hiddenFields = []) {
        return createBinding(() => this.getVariationSettings(alertType, variationId), newSettings => {
            this.updateVariationSettings(alertType, variationId, newSettings);
            forceUpdate();
        }, fieldName => (Object.assign(Object.assign({}, this.variationsMetadata[alertType][fieldName]), { hidden: hiddenFields.includes(fieldName) })));
    }
    setEnabled(type, enabled) {
        this.updateVariationSettings(type, 'default', { enabled });
    }
    get enabledAlerts() {
        return Object.keys(this.widgetData.variations).filter(alertType => this.widgetData.variations[alertType].default.enabled);
    }
    get animationOptions() {
        return this.widgetData.animationOptions;
    }
    get layout() {
        return Services.UserService.views.linkedPlatforms.length < 3 ? 'basic' : 'long-menu';
    }
    switchToLegacyAlertbox() {
        const { SourcesService, CustomizationService } = Services;
        CustomizationService.actions.setSettings({ legacyAlertbox: true });
        SourcesService.actions.showSourceProperties(this.state.sourceId);
    }
    patchAfterFetch(data) {
        const settings = data.settings;
        Object.keys(settings).forEach(key => {
            settings[key] = this.sanitizeValue(settings[key], key, this.generalMetadata[key]);
        });
        data.animationOptions = {};
        data.animationOptions.show = [];
        Object.keys(data.show_animations).forEach(groupName => {
            Object.keys(data.show_animations[groupName]).forEach(value => {
                data.animationOptions.show.push({ value, label: data.show_animations[groupName][value] });
            });
        });
        data.animationOptions.hide = [];
        Object.keys(data.hide_animations).forEach(groupName => {
            Object.keys(data.hide_animations[groupName]).forEach(value => {
                data.animationOptions.hide.push({ value, label: data.hide_animations[groupName][value] });
            });
        });
        data.animationOptions.text = [];
        Object.keys(data.text_animations).forEach(value => {
            data.animationOptions.text.push({ value, label: data.text_animations[value] });
        });
        return data;
    }
    setData(data) {
        super.setData(data);
        const allAlerts = values(this.eventsConfig).filter(x => x);
        this.state.mutate(state => {
            const settings = this.state.widgetData.data.settings;
            allAlerts.map(alertEvent => {
                const apiKey = alertEvent.apiKey || alertEvent.type;
                const alertFields = Object.keys(settings).filter(key => key.startsWith(`${apiKey}_`));
                const variationSettings = {};
                alertFields.forEach(key => {
                    let value = settings[key];
                    const targetKey = key.replace(`${apiKey}_`, '');
                    value = this.sanitizeValue(value, targetKey, this.variationsMetadata[alertEvent.type][targetKey]);
                    settings[key] = value;
                    variationSettings[targetKey] = value;
                });
                this.setVariationSettings(alertEvent.type, 'default', variationSettings);
            });
        });
        const userPlatforms = Object.keys(Services.UserService.views.platforms);
        const availableAlerts = allAlerts
            .filter(alertConfig => {
            if (alertConfig.platforms && !intersection(alertConfig.platforms, userPlatforms).length) {
                return false;
            }
            return !!this.widgetData.variations[alertConfig.type];
        })
            .map(alertConfig => alertConfig.type);
        this.setAvailableAlerts(availableAlerts);
    }
    patchBeforeSend(settings) {
        const keys = Object.keys(settings);
        const newSettings = Object.assign({}, settings);
        keys.forEach(key => {
            if ([
                'alert_delay',
                'moderation_delay',
                'sponsor_text_delay',
                'text_delay',
                'interrupt_mode_delay',
                'alert_duration',
            ].find(keyToPatch => key.includes(keyToPatch))) {
                newSettings[key] = Math.floor(settings[key] / 1000);
            }
            if (key.endsWith('font_weight')) {
                newSettings[key] = String(settings[key]);
            }
            if (key.endsWith('font_size')) {
                newSettings[key] = `${settings[key]}px`;
            }
        });
        return newSettings;
    }
    sanitizeValue(value, name, fieldMetadata) {
        if (fieldMetadata) {
            if (fieldMetadata.min !== undefined && value < fieldMetadata.min) {
                return fieldMetadata.min;
            }
            if (fieldMetadata.max !== undefined && value > fieldMetadata.max) {
                return fieldMetadata.max;
            }
            if (name === 'font_weight') {
                return Number(value);
            }
            if (name === 'font_size') {
                return parseInt(value, 10);
            }
        }
        return value;
    }
    updateVariationSettings(type, variationId, variationPatch) {
        const event = this.eventsConfig[type];
        const apiKey = event.apiKey || event.type;
        const currentVariationSettings = getDefined(this.getVariationSettings(type));
        const newVariationSettings = Object.assign(Object.assign({}, currentVariationSettings), variationPatch);
        this.setVariationSettings(type, variationId, newVariationSettings);
        const settingsPatch = {};
        Object.keys(variationPatch).forEach(key => {
            settingsPatch[`${apiKey}_${key}`] = variationPatch[key];
        });
        if (type === 'bits') {
            const newBitsVariations = this.widgetData.settings.bit_variations.map((variation) => {
                const newVariation = cloneDeep(variation);
                newVariation.settings.text.format = newVariationSettings.message_template;
                return newVariation;
            });
            settingsPatch.bit_variations = newBitsVariations;
        }
        this.updateSettings(Object.assign(Object.assign({}, this.widgetData.settings), settingsPatch));
    }
    openAlertInfo(alertType) {
        const url = getDefined(this.eventsConfig[alertType].tooltipLink);
        remote.shell.openExternal(url);
    }
    get selectedAlert() {
        const selectedTab = this.state.selectedTab;
        if (this.eventsConfig[selectedTab]) {
            return selectedTab;
        }
        return null;
    }
    get customCode() {
        if (!this.selectedAlert)
            return null;
        const variationSettings = this.getVariationSettings(this.selectedAlert);
        if (!variationSettings)
            return null;
        const { custom_html_enabled, custom_html, custom_css, custom_js, custom_json, } = variationSettings;
        return {
            custom_enabled: custom_html_enabled,
            custom_css,
            custom_js,
            custom_html,
            custom_json,
        };
    }
    updateCustomCode(patch) {
        const selectedAlert = getDefined(this.selectedAlert);
        const newPatch = cloneDeep(patch);
        if (newPatch.custom_enabled !== undefined) {
            newPatch.custom_html_enabled = patch.custom_enabled;
            delete newPatch.custom_enabled;
        }
        this.updateVariationSettings(selectedAlert, 'default', newPatch);
    }
    setVariationSettings(type, variationId, settings) {
        const state = this.widgetState;
        if (!state.data.variations)
            state.data.variations = {};
        if (!state.data.variations[type])
            state.data.variations[type] = {};
        state.data.variations[type][variationId] = settings;
    }
    setAvailableAlerts(alerts) {
        const topAlerts = ['donation'];
        alerts = topAlerts.concat(alerts.sort().filter(alert => !topAlerts.includes(alert)));
        alerts = alerts.filter(alert => alert !== 'facebook_support_gifter');
        this.widgetState.availableAlerts = alerts;
    }
}
__decorate([
    mutation()
], AlertBoxModule.prototype, "setVariationSettings", null);
__decorate([
    mutation()
], AlertBoxModule.prototype, "setAvailableAlerts", null);
export function useAlertBox() {
    return useWidget();
}
function getGeneralSettingsMetadata() {
    return {
        alert_delay: metadata.seconds({
            label: $t('Global Alert Delay'),
            max: 30000,
        }),
        interrupt_mode: metadata.bool({
            label: $t('Alert Parries'),
            tooltip: $t('When enabled new alerts will interrupt the on screen alert'),
        }),
        interrupt_mode_delay: metadata.seconds({
            label: $t('Parry Alert Delay'),
            min: 0,
            max: 20000,
        }),
        moderation_delay: metadata.seconds({
            label: $t('Alert Moderation delay'),
            min: -1,
            max: 600000,
        }),
    };
}
function getVariationsMetadata() {
    const commonMetadata = {
        alert_duration: metadata.seconds({
            label: $t('Alert Duration'),
            min: 2000,
            max: 30000,
            tooltip: $t('How many seconds to show this alert before hiding it'),
        }),
        image_href: metadata.text({ label: $t('Image') }),
        sound_href: metadata.text({ label: $t('Sound') }),
        sound_volume: metadata.slider({ label: $t('Sound Volume'), min: 0, max: 100 }),
        message_template: getMessageTemplateMetadata(),
        layout: metadata.list({ label: $t('Layout') }),
        text_delay: metadata.seconds({
            label: $t('Text Delay'),
            max: 60000,
            tooltip: $t('How many seconds after your image/video/audios to show the alert text. This is useful if you want to wait a few seconds for an animation to finish before your alert text appears.'),
        }),
        font: metadata.text({ label: $t('Font Family') }),
        font_size: metadata.number({ label: $t('Font Size') }),
        font_weight: metadata.number({ label: $t('Font Weight') }),
        font_color: metadata.text({ label: $t('Text Color') }),
        font_color2: metadata.text({ label: $t('Text Highlight Color') }),
        show_animation: metadata.text({ label: $t('Show Animation') }),
        hide_animation: metadata.text({ label: $t('Hide Animation') }),
        text_animation: metadata.text({ label: $t('Text Animation') }),
        enabled: metadata.bool({}),
        custom_html_enabled: metadata.bool({}),
        custom_html: metadata.text({}),
        custom_css: metadata.text({}),
        custom_js: metadata.text({}),
        custom_json: metadata.any({}),
    };
    const specificMetadata = createAlertsMap({
        donation: {
            message_template: getMessageTemplateMetadata('donation'),
            alert_message_min_amount: metadata.number({
                label: $t('Min. Amount to Trigger Alert'),
                min: 0,
            }),
        },
        follow: {},
        facebook_follow: {},
        raid: {
            message_template: getMessageTemplateMetadata('raid'),
        },
        sub: {},
        bits: {
            message_template: getMessageTemplateMetadata('bits'),
            alert_message_min_amount: metadata.number({
                label: $t('Min. Amount to Trigger Alert'),
                min: 0,
            }),
        },
        fanfunding: {
            alert_message_min_amount: metadata.number({
                label: $t('Min. Amount to Trigger Alert'),
                min: 0,
            }),
        },
        facebook_stars: {
            message_template: getMessageTemplateMetadata('facebook_stars'),
            alert_message_min_amount: metadata.number({
                label: $t('Min. Amount to Trigger Alert'),
                min: 0,
            }),
        },
        facebook_support: {
            message_template: getMessageTemplateMetadata('facebook_support'),
        },
        facebook_support_gifter: {},
        facebook_share: {},
        facebook_like: {},
        merch: {
            message_template: getMessageTemplateMetadata('merch'),
            use_custom_image: metadata.bool({
                label: $t('Replace product image with custom image'),
            }),
        },
        subscriber: {},
        sponsor: {},
        trovo_follow: {},
        trovo_sub: {},
        trovo_raid: {},
        donordrive_donation: undefined,
        eldonation: undefined,
        justgiving_donation: undefined,
        loyalty_store_redemption: undefined,
        membershipGift: undefined,
        pledge: undefined,
        resub: undefined,
        streamlabscharitydonation: undefined,
        tiltify_donation: undefined,
        treat: undefined,
        twitchcharitydonation: undefined,
    });
    Object.keys(specificMetadata).forEach(alertType => {
        specificMetadata[alertType] = Object.assign(Object.assign({}, commonMetadata), specificMetadata[alertType]);
    });
    return specificMetadata;
}
function getMessageTemplateMetadata(alert) {
    const tooltipTextHeader = $t('When an alert shows up, this will be the format of the message.') +
        '\n' +
        $t('Available Tokens: ') +
        '\n';
    let tooltipTokens = ' {name} ';
    switch (alert) {
        case 'donation':
        case 'bits':
        case 'facebook_stars':
        case 'facebook_support':
            tooltipTokens =
                ' {name} ' +
                    $t('The name of the donator') +
                    ', {amount} ' +
                    $t('The amount that was donated');
            break;
        case 'merch':
            tooltipTokens = '{name}, {product}';
            break;
        case 'raid':
            tooltipTokens =
                ' {name} ' +
                    $t('The name of the streamer raiding you') +
                    ', {amount} ' +
                    $t('The number of viewers who joined the raid');
            break;
    }
    const tooltip = tooltipTextHeader + tooltipTokens;
    return metadata.text({
        label: $t('Message Template'),
        tooltip,
    });
}
//# sourceMappingURL=useAlertBox.jsx.map