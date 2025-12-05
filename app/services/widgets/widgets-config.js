import { AnchorPoint } from '../../util/ScalableRectangle';
import { WidgetType } from './widgets-data';
export function getWidgetsConfig(host, token, widgetsWithNewAPI = []) {
    return {
        [WidgetType.AlertBox]: {
            type: WidgetType.AlertBox,
            defaultTransform: {
                width: 800,
                height: 600,
                x: 0.5,
                y: 0,
                anchor: AnchorPoint.North,
            },
            settingsWindowSize: {
                width: 850,
                height: 940,
            },
            url: `https://${host}/alert-box/v3/${token}`,
            previewUrl: `https://${host}/alert-box/v3/${token}`,
            dataFetchUrl: `https://${host}/api/v5/slobs/widget/alertbox?include_linked_integrations_only=true&primary_only=false`,
            settingsSaveUrl: `https://${host}/api/v5/slobs/widget/alertbox`,
            settingsUpdateEvent: 'filteredAlertBoxSettingsUpdate',
            customCodeAllowed: true,
            customFieldsAllowed: false,
        },
        [WidgetType.ViewerCount]: {
            type: WidgetType.ViewerCount,
            defaultTransform: {
                width: 600,
                height: 200,
                x: 0,
                y: 1,
                anchor: AnchorPoint.SouthWest,
            },
            settingsWindowSize: {
                width: 600,
                height: 900,
            },
            url: `https://${host}/widgets/viewer-count?token=${token}`,
            previewUrl: `https://${host}/widgets/viewer-count?token=${token}&simulate=1`,
            dataFetchUrl: `https://${host}/api/v5/slobs/widget/viewercount`,
            settingsSaveUrl: `https://${host}/api/v5/slobs/widget/viewercount`,
            settingsUpdateEvent: 'viewerCountSettingsUpdate',
            customCodeAllowed: true,
            customFieldsAllowed: true,
        },
        [WidgetType.GameWidget]: {
            type: WidgetType.GameWidget,
            defaultTransform: {
                width: 400,
                height: 750,
                x: 0.5,
                y: 0,
                anchor: AnchorPoint.North,
            },
            settingsWindowSize: {
                width: 850,
                height: 700,
            },
            url: `https://${host}/widgets/game-widget?token=${token}`,
            previewUrl: `https://${host}/widgets/game-widget?token=${token}&simulate=1`,
            dataFetchUrl: `https://${host}/api/v5/slobs/widget/game-widget`,
            settingsSaveUrl: `https://${host}/api/v5/slobs/widget/game-widget`,
            settingsUpdateEvent: 'gameWidgetSettingsUpdate',
            customCodeAllowed: false,
            customFieldsAllowed: false,
        },
        [WidgetType.EmoteWall]: {
            type: WidgetType.EmoteWall,
            defaultTransform: {
                width: 1280,
                height: 720,
                x: 0,
                y: 0,
                anchor: AnchorPoint.NorthWest,
            },
            settingsWindowSize: {
                width: 600,
                height: 900,
            },
            url: `https://${host}/widgets/emote-wall?token=${token}`,
            previewUrl: `https://${host}/widgets/emote-wall?token=${token}&simulate=1`,
            dataFetchUrl: `https://${host}/api/v5/slobs/widget/emote-wall`,
            settingsSaveUrl: `https://${host}/api/v5/slobs/widget/emote-wall`,
            settingsUpdateEvent: 'emoteWallSettingsUpdate',
            customCodeAllowed: false,
            customFieldsAllowed: false,
        },
        [WidgetType.ChatBox]: Object.assign({ type: WidgetType.ChatBox, defaultTransform: {
                width: 600,
                height: 600,
                x: 0,
                y: 0.5,
                anchor: AnchorPoint.West,
            }, settingsWindowSize: {
                width: 850,
                height: 700,
            }, settingsUpdateEvent: 'chatBoxSettingsUpdate', customCodeAllowed: true, customFieldsAllowed: true, url: `https://${host}/widgets/chat-box/v1/${token}`, previewUrl: `https://${host}/widgets/chat-box/v1/${token}?simulate=1` }, (widgetsWithNewAPI.includes(WidgetType.ChatBox)
            ? {
                useNewWidgetAPI: true,
                dataFetchUrl: `https://${host}/api/v5/widgets/desktop/chat-box`,
                settingsSaveUrl: `https://${host}/api/v5/widgets/desktop/chat-box`,
            }
            : {
                dataFetchUrl: `https://${host}/api/v5/slobs/widget/chatbox`,
                settingsSaveUrl: `https://${host}/api/v5/slobs/widget/chatbox`,
            })),
        [WidgetType.DonationTicker]: {
            type: WidgetType.DonationTicker,
            defaultTransform: {
                width: 600,
                height: 200,
                x: 1,
                y: 1,
                anchor: AnchorPoint.SouthEast,
            },
            settingsWindowSize: {
                width: 600,
                height: 900,
            },
            url: `https://${host}/widgets/donation-ticker?token=${token}`,
            previewUrl: `https://${host}/widgets/donation-ticker?token=${token}&simulate=1`,
            dataFetchUrl: `https://${host}/api/v5/slobs/widget/ticker`,
            settingsSaveUrl: `https://${host}/api/v5/slobs/widget/ticker`,
            settingsUpdateEvent: 'donationTickerSettingsUpdate',
            customCodeAllowed: true,
            customFieldsAllowed: true,
        },
        [WidgetType.SponsorBanner]: {
            type: WidgetType.SponsorBanner,
            defaultTransform: {
                width: 600,
                height: 200,
                x: 0,
                y: 1,
                anchor: AnchorPoint.SouthWest,
            },
            settingsWindowSize: {
                width: 850,
                height: 700,
            },
            url: `https://${host}/widgets/sponsor-banner?token=${token}`,
            previewUrl: `https://${host}/widgets/sponsor-banner?token=${token}`,
            dataFetchUrl: `https://${host}/api/v5/slobs/widget/sponsorbanner`,
            settingsSaveUrl: `https://${host}/api/v5/slobs/widget/sponsorbanner`,
            settingsUpdateEvent: 'sponsorBannerSettingsUpdate',
            customCodeAllowed: true,
            customFieldsAllowed: true,
        },
        [WidgetType.CustomWidget]: {
            type: WidgetType.CustomWidget,
            defaultTransform: {
                width: 400,
                height: 750,
                x: 0.5,
                y: 0,
                anchor: AnchorPoint.North,
            },
            settingsWindowSize: {
                width: 850,
                height: 700,
            },
            url: `https://${host}/widgets/custom-widget?token=${token}`,
            previewUrl: `https://${host}/widgets/custom-widget?token=${token}`,
            dataFetchUrl: `https://${host}/api/v5/slobs/widget/customwidget`,
            settingsSaveUrl: `https://${host}/api/v5/slobs/widget/customwidget`,
            settingsUpdateEvent: 'customWidgetSettingsUpdate',
            customCodeAllowed: true,
            customFieldsAllowed: true,
        },
    };
}
//# sourceMappingURL=widgets-config.js.map