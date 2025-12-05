import { TwitchService } from './twitch';
import { YoutubeService } from './youtube';
import { FacebookService } from './facebook';
import { TikTokService } from './tiktok';
import { InstagramService } from './instagram';
import { TwitterPlatformService } from './twitter';
import { TrovoService } from './trovo';
import { $t } from 'services/i18n';
import { KickService } from './kick';
export var EPlatformCallResult;
(function (EPlatformCallResult) {
    EPlatformCallResult[EPlatformCallResult["Success"] = 0] = "Success";
    EPlatformCallResult[EPlatformCallResult["Error"] = 1] = "Error";
    EPlatformCallResult[EPlatformCallResult["TwitchTwoFactor"] = 2] = "TwitchTwoFactor";
    EPlatformCallResult[EPlatformCallResult["YoutubeStreamingDisabled"] = 3] = "YoutubeStreamingDisabled";
    EPlatformCallResult[EPlatformCallResult["TwitchScopeMissing"] = 4] = "TwitchScopeMissing";
    EPlatformCallResult[EPlatformCallResult["TikTokStreamScopeMissing"] = 5] = "TikTokStreamScopeMissing";
    EPlatformCallResult[EPlatformCallResult["TikTokScopeOutdated"] = 6] = "TikTokScopeOutdated";
    EPlatformCallResult[EPlatformCallResult["KickScopeOutdated"] = 7] = "KickScopeOutdated";
    EPlatformCallResult[EPlatformCallResult["TokenExpired"] = 8] = "TokenExpired";
})(EPlatformCallResult || (EPlatformCallResult = {}));
export var EPlatform;
(function (EPlatform) {
    EPlatform["Twitch"] = "twitch";
    EPlatform["YouTube"] = "youtube";
    EPlatform["Facebook"] = "facebook";
    EPlatform["TikTok"] = "tiktok";
    EPlatform["Trovo"] = "trovo";
    EPlatform["Twitter"] = "twitter";
    EPlatform["Instagram"] = "instagram";
    EPlatform["Kick"] = "kick";
})(EPlatform || (EPlatform = {}));
export const platformList = [
    EPlatform.Facebook,
    EPlatform.TikTok,
    EPlatform.Trovo,
    EPlatform.Twitch,
    EPlatform.YouTube,
    EPlatform.Twitter,
    EPlatform.Instagram,
    EPlatform.Kick,
];
export const platformLabels = (platform) => ({
    [EPlatform.Twitch]: $t('Twitch'),
    [EPlatform.YouTube]: $t('YouTube'),
    [EPlatform.Facebook]: $t('Facebook'),
    [EPlatform.TikTok]: $t('TikTok'),
    [EPlatform.Trovo]: $t('Trovo'),
    [EPlatform.Twitter]: 'Twitter',
    [EPlatform.Instagram]: $t('Instagram'),
    [EPlatform.Kick]: $t('Kick'),
}[platform]);
export function getPlatformService(platform) {
    return {
        twitch: TwitchService.instance,
        youtube: YoutubeService.instance,
        facebook: FacebookService.instance,
        tiktok: TikTokService.instance,
        trovo: TrovoService.instance,
        kick: KickService.instance,
        twitter: TwitterPlatformService.instance,
        instagram: InstagramService.instance,
    }[platform];
}
export const externalAuthPlatforms = ['youtube', 'twitch', 'twitter', 'tiktok', 'kick'];
//# sourceMappingURL=index.js.map