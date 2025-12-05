var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Component } from 'vue-property-decorator';
import WidgetEditor from 'components/windows/WidgetEditor.vue';
import WidgetSettings from './WidgetSettings.vue';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import NumberInput from 'components/shared/inputs/NumberInput.vue';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import { $t } from 'services/i18n';
import styles from './MedaShare.m.less';
import Scrollable from 'components/shared/Scrollable';
let MediaShare = class MediaShare extends WidgetSettings {
    get metadata() {
        return this.service.getMetadata();
    }
    get navItems() {
        return [
            { value: 'media', label: $t('Manage Media Settings') },
            { value: 'source', label: $t('Source') },
        ];
    }
    unbanMedia(media) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.service.unbanMedia(media);
        });
    }
    get banList() {
        if (this.wData && !this.wData.banned_media.length) {
            return React.createElement("span", { class: styles.whisper }, $t('No banned media found'));
        }
        return (this.wData &&
            this.wData.banned_media.map(media => (React.createElement("div", { vTooltip: $t('Banned by %{user}', { user: media.action_by }), class: styles.banlistCell },
                React.createElement("span", null, media.media_title),
                React.createElement("button", { class: "button button--default", onClick: () => this.unbanMedia(media.media) }, $t('Unban'))))));
    }
    get form() {
        return (this.loaded && (React.createElement(ValidatedForm, { slot: "media-properties", onInput: () => this.save() },
            React.createElement(VFormGroup, { metadata: this.metadata.pricePerSecond },
                React.createElement(NumberInput, { vModel: this.wData.settings.price_per_second, metadata: {} }),
                React.createElement("span", null, $t('USD'))),
            React.createElement(VFormGroup, { metadata: this.metadata.minAmount },
                React.createElement(NumberInput, { vModel: this.wData.settings.min_amount_to_share, metadata: {} }),
                React.createElement("span", null, $t('USD'))),
            React.createElement(VFormGroup, { metadata: this.metadata.maxDuration },
                React.createElement(NumberInput, { vModel: this.wData.settings.max_duration, metadata: {} }),
                React.createElement("span", null, $t('seconds'))),
            React.createElement(VFormGroup, { vModel: this.wData.settings.buffer_time, metadata: this.metadata.buffer }),
            React.createElement(VFormGroup, { vModel: this.wData.settings.security, metadata: this.metadata.security }))));
    }
    render() {
        return (this.wData && (React.createElement(WidgetEditor, { slots: [{ value: 'banlist', label: $t('Banned Media') }], navItems: this.navItems },
            React.createElement(Scrollable, { slot: "banlist", className: styles.banlist }, this.banList),
            this.form)));
    }
};
MediaShare = __decorate([
    Component({})
], MediaShare);
export default MediaShare;
//# sourceMappingURL=MediaShare.js.map