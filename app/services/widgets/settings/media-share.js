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
import { WidgetDefinitions, WidgetSettingsService, WIDGET_INITIAL_STATE, } from '../index';
import { WidgetType } from 'services/widgets';
import { InheritMutations } from 'services/core/stateful-service';
import { $t } from 'services/i18n';
import { metadata } from 'components/widgets/inputs';
let MediaShareService = class MediaShareService extends WidgetSettingsService {
    getApiSettings() {
        return {
            type: WidgetType.MediaShare,
            url: WidgetDefinitions[WidgetType.MediaShare].url(this.getHost(), this.getWidgetToken()),
            previewUrl: `https://${this.getHost()}/widgets/media/v1/${this.getWidgetToken()}`,
            settingsUpdateEvent: 'mediaSharingSettingsUpdate',
            goalCreateEvent: 'newmediaShare',
            goalResetEvent: 'mediaShareEnd',
            dataFetchUrl: `https://${this.getHost()}/api/v5/slobs/widget/media`,
            settingsSaveUrl: `https://${this.getHost()}/api/v5/slobs/widget/media`,
            testers: ['Follow', 'Subscription', 'Donation', 'Bits'],
            customCodeAllowed: false,
            customFieldsAllowed: false,
        };
    }
    getMetadata() {
        return {
            pricePerSecond: {
                title: $t('Price Per Second'),
                tooltip: $t('In order to control length, you can decide how much it costs per second to share media. Setting this to 0.30' +
                    ' would mean that for $10, media would play for 30 seconds. The default value is 0.10.'),
            },
            minAmount: {
                title: $t('Min. Amount to Share'),
                tooltip: $t('The minimum amount a donor must donate in order to share media. The default value is $5.00 USD'),
            },
            maxDuration: {
                title: $t('Max Duration'),
                tooltip: $t('The maximum duration in seconds that media can be played, regardless of amount donated.' +
                    ' The default value is 60 seconds.'),
                isInteger: true,
            },
            buffer: metadata.slider({
                tooltip: $t('The time between videos the next video has to buffer.'),
                max: 30,
                interval: 1,
                title: $t('Buffer Time'),
            }),
            security: metadata.spamSecurity({
                title: $t('Spam Security'),
                tooltip: $t('This slider helps you filter shared media before it can be submitted.\n' +
                    'Off: No security\n' +
                    'Low: 65%+ rating, 5k+ views\n' +
                    'Medium: 75%+ rating, 40k+ views\n' +
                    'High: 80%+ rating, 300k+ views\n' +
                    'Very High: 85%+ rating, 900k+ views'),
            }),
        };
    }
    unbanMedia(media) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${this.getApiSettings().dataFetchUrl}/unban`;
            yield this.request({
                url,
                method: 'POST',
                body: { media },
            });
            return this.refreshData();
        });
    }
    patchAfterFetch(response) {
        response.settings.advanced_settings.buffer_time = Math.round(response.settings.advanced_settings.buffer_time / 1000);
        return Object.assign(Object.assign({}, response), { settings: Object.assign(Object.assign({}, response.settings), response.settings.advanced_settings) });
    }
    patchBeforeSend(settings) {
        delete settings.advanced_settings;
        settings.buffer_time = settings.buffer_time * 1000;
        return { settings };
    }
};
MediaShareService.initialState = WIDGET_INITIAL_STATE;
MediaShareService = __decorate([
    InheritMutations()
], MediaShareService);
export { MediaShareService };
//# sourceMappingURL=media-share.js.map