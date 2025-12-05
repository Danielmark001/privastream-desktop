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
import uuid from 'uuid/v4';
import { Subject } from 'rxjs';
import { WidgetDefinitions, WidgetSettingsService, WidgetType, } from 'services/widgets';
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { InheritMutations } from 'services/core/stateful-service';
import { formMetadata, metadata } from 'components/shared/inputs';
import { authorizedHeaders, jfetch } from 'util/requests';
import { $t } from 'services/i18n';
let ChatHighlightService = class ChatHighlightService extends WidgetSettingsService {
    constructor() {
        super(...arguments);
        this.hasPinnedMessage = new Subject();
    }
    getApiSettings() {
        return {
            type: WidgetType.ChatHighlight,
            url: WidgetDefinitions[WidgetType.ChatHighlight].url(this.getHost(), this.getWidgetToken()),
            previewUrl: `https://${this.getHost()}/widgets/chat-highlight?token=${this.getWidgetToken()}`,
            dataFetchUrl: `https://${this.getHost()}/api/v5/slobs/widget/chat-highlight`,
            settingsSaveUrl: `https://${this.getHost()}/api/v5/slobs/widget/chat-highlight`,
            settingsUpdateEvent: 'chatHighlightSettingsUpdate',
            customCodeAllowed: false,
            customFieldsAllowed: false,
        };
    }
    pinMessage(messageData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.state.data)
                yield this.loadData();
            const headers = authorizedHeaders(this.getApiToken());
            headers.append('Content-Type', 'application/json');
            const url = `https://${this.getHost()}/api/v5/slobs/widget/chat-highlight/pin`;
            messageData.messageToPin.tags.id = uuid();
            const highlightDuration = this.state.data.settings.highlight_duration;
            const request = new Request(url, {
                headers,
                method: 'POST',
                body: JSON.stringify(Object.assign(Object.assign({}, messageData), { highlightDuration: highlightDuration > 0 ? highlightDuration * 1000 : 0 })),
            });
            fetch(request).then(resp => {
                if (resp.ok && highlightDuration === 0)
                    this.hasPinnedMessage.next(true);
            });
        });
    }
    unpinMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = authorizedHeaders(this.getApiToken());
            headers.append('Content-Type', 'application/json');
            const url = `https://${this.getHost()}/api/v5/slobs/widget/chat-highlight/clear-pin`;
            const request = new Request(url, {
                headers,
                method: 'POST',
            });
            fetch(request).then(resp => {
                if (resp.ok)
                    this.hasPinnedMessage.next(false);
            });
        });
    }
    getCurrentPin() {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = authorizedHeaders(this.getApiToken());
            headers.append('Content-Type', 'application/json');
            const url = `https://${this.getHost()}/api/v5/slobs/widget/chat-highlight/get-existing-pin`;
            const request = new Request(url, {
                headers,
            });
            jfetch(request).then(message => {
                if (message && this.state.data.settings.highlight_duration === 0) {
                    this.hasPinnedMessage.next(true);
                }
            });
        });
    }
    patchAfterFetch(data) {
        data.settings.highlight_duration = data.settings.highlight_duration / 1000;
        return data;
    }
    patchBeforeSend(settings) {
        settings.enabled = true;
        settings.highlight_duration =
            settings.highlight_duration > 0 ? settings.highlight_duration * 1000 : 0;
        return settings;
    }
    getMetadata() {
        return formMetadata({
            duration: metadata.slider({
                title: $t('Duration'),
                tooltip: $t('A duration of 0 is indefinite'),
            }),
            fontFamily: metadata.fontFamily({ title: $t('Font Family') }),
            messageFontSize: metadata.slider({
                title: $t('Message Font Size'),
                min: 12,
                max: 48,
                interval: 2,
            }),
            messageFontWeight: metadata.slider({
                title: $t('Message Font Weight'),
                interval: 100,
                min: 100,
                max: 900,
            }),
            messageTextColor: metadata.color({ title: $t('Message Text Color') }),
            messageBackgroundColor: metadata.color({ title: $t('Message Background Color') }),
            nameFontSize: metadata.slider({
                title: $t('Name Font Size'),
                min: 12,
                max: 48,
                interval: 2,
            }),
            nameFontWeight: metadata.slider({
                title: $t('Name Font Weight'),
                interval: 100,
                min: 100,
                max: 900,
            }),
            nameTextColor: metadata.color({ title: $t('Name Text Color') }),
            nameBackgroundColor: metadata.color({ title: $t('Name Background Color') }),
        });
    }
};
ChatHighlightService.initialState = WIDGET_INITIAL_STATE;
ChatHighlightService = __decorate([
    InheritMutations()
], ChatHighlightService);
export { ChatHighlightService };
//# sourceMappingURL=chat-highlight.js.map