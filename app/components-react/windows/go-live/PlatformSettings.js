import { CommonPlatformFields } from './CommonPlatformFields';
import { useGoLiveSettings } from './useGoLiveSettings';
import { $t } from '../../../services/i18n';
import React from 'react';
import { TwitchEditStreamInfo } from './platforms/TwitchEditStreamInfo';
import { Section } from './Section';
import { YoutubeEditStreamInfo } from './platforms/YoutubeEditStreamInfo';
import { TikTokEditStreamInfo } from './platforms/TiktokEditStreamInfo';
import FacebookEditStreamInfo from './platforms/FacebookEditStreamInfo';
import { getDefined } from '../../../util/properties-type-guards';
import { TrovoEditStreamInfo } from './platforms/TrovoEditStreamInfo';
import { TwitterEditStreamInfo } from './platforms/TwitterEditStreamInfo';
import { InstagramEditStreamInfo } from './platforms/InstagramEditStreamInfo';
import { KickEditStreamInfo } from './platforms/KickEditStreamInfo';
import AdvancedSettingsSwitch from './AdvancedSettingsSwitch';
export default function PlatformSettings() {
    const { canShowAdvancedMode, settings, error, isAdvancedMode, enabledPlatforms, getPlatformDisplayName, isLoading, updatePlatform, commonFields, updateCommonFields, descriptionIsRequired, isUpdateMode, isTikTokConnected, layout, } = useGoLiveSettings().extend(settings => ({
        get descriptionIsRequired() {
            const fbSettings = settings.state.platforms['facebook'];
            const descriptionIsRequired = fbSettings && fbSettings.enabled && !fbSettings.useCustomFields;
            return descriptionIsRequired;
        },
        get isTikTokConnected() {
            return settings.state.isPlatformLinked('tiktok');
        },
        get layout() {
            return settings.isAdvancedMode ? 'horizontal' : 'vertical';
        },
    }));
    const shouldShowSettings = !error && !isLoading;
    let layoutMode;
    if (canShowAdvancedMode) {
        layoutMode = isAdvancedMode ? 'multiplatformAdvanced' : 'multiplatformSimple';
    }
    else {
        layoutMode = 'singlePlatform';
    }
    function createPlatformBinding(platform) {
        return {
            isUpdateMode,
            layoutMode,
            get value() {
                return getDefined(settings.platforms[platform]);
            },
            get enabledPlatformsCount() {
                return enabledPlatforms.length;
            },
            onChange(newSettings) {
                updatePlatform(platform, newSettings);
            },
        };
    }
    return (React.createElement("div", { style: { minHeight: '150px', flex: 1 } }, shouldShowSettings && (React.createElement("div", { style: { width: '100%' } },
        React.createElement("div", { style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
                fontSize: '16px',
            } },
            React.createElement("div", null, $t('Stream Information:')),
            React.createElement(AdvancedSettingsSwitch, null)),
        canShowAdvancedMode && (React.createElement(Section, { isSimpleMode: !isAdvancedMode, title: $t('Common Stream Settings') },
            React.createElement(CommonPlatformFields, { descriptionIsRequired: descriptionIsRequired, value: commonFields, onChange: updateCommonFields, enabledPlatforms: enabledPlatforms, layout: layout }))),
        enabledPlatforms.map((platform) => (React.createElement(Section, { title: $t('%{platform} Settings', { platform: getPlatformDisplayName(platform) }), isSimpleMode: !isAdvancedMode, key: platform },
            platform === 'twitch' && (React.createElement(TwitchEditStreamInfo, Object.assign({}, createPlatformBinding('twitch'), { layout: layout }))),
            platform === 'facebook' && (React.createElement(FacebookEditStreamInfo, Object.assign({}, createPlatformBinding('facebook'), { layout: layout }))),
            platform === 'youtube' && (React.createElement(YoutubeEditStreamInfo, Object.assign({}, createPlatformBinding('youtube'), { layout: layout }))),
            platform === 'tiktok' && isTikTokConnected && (React.createElement(TikTokEditStreamInfo, Object.assign({}, createPlatformBinding('tiktok'), { layout: layout }))),
            platform === 'kick' && (React.createElement(KickEditStreamInfo, Object.assign({}, createPlatformBinding('kick'), { layout: layout }))),
            platform === 'trovo' && (React.createElement(TrovoEditStreamInfo, Object.assign({}, createPlatformBinding('trovo'), { layout: layout }))),
            platform === 'twitter' && (React.createElement(TwitterEditStreamInfo, Object.assign({}, createPlatformBinding('twitter'), { layout: layout }))),
            platform === 'instagram' && (React.createElement(InstagramEditStreamInfo, Object.assign({}, createPlatformBinding('instagram'), { layout: layout }))))))))));
}
//# sourceMappingURL=PlatformSettings.js.map