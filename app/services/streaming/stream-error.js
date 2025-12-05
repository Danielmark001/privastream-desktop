import { getPlatformService } from '../platforms';
import { $t } from 'services/i18n';
import { Services } from '../../components-react/service-provider';
import { capitalize } from 'lodash';
export const errorTypes = {
    PLATFORM_REQUEST_FAILED: {
        get message() {
            return $t('The request to the platform failed');
        },
    },
    TWITCH_MISSED_OAUTH_SCOPE: {
        get message() {
            return $t('Missing required oauth scope');
        },
    },
    TWITCH_BANNED_WORDS: {
        get message() {
            return $t('Your stream title or description contain banned words');
        },
    },
    PREPOPULATE_FAILED: {
        get message() {
            return $t('Failed to fetch platform settings');
        },
        get action() {
            return $t('error most likely occurred before going live');
        },
    },
    SETTINGS_UPDATE_FAILED: {
        get message() {
            return $t('Failed to update platform settings');
        },
    },
    RESTREAM_DISABLED: {
        get message() {
            return $t('The Multistream server is temporarily unavailable');
        },
    },
    RESTREAM_SETUP_FAILED: {
        get message() {
            return $t('Failed to configure the Multistream server');
        },
    },
    DUAL_OUTPUT_RESTREAM_DISABLED: {
        get message() {
            return $t('The Multistream server is temporarily unavailable for Dual Output');
        },
    },
    DUAL_OUTPUT_SETUP_FAILED: {
        get message() {
            return $t('Failed to configure the Dual Output service');
        },
    },
    YOUTUBE_STREAMING_DISABLED: {
        get message() {
            return $t('Your YouTube account is not enabled for live streaming');
        },
    },
    YOUTUBE_THUMBNAIL_UPLOAD_FAILED: {
        get message() {
            return $t('Failed to upload the thumbnail');
        },
    },
    YOUTUBE_TOKEN_EXPIRED: {
        get message() {
            return $t('YouTube token has expired, re-login or re-merge YouTube account');
        },
    },
    FACEBOOK_STREAMING_DISABLED: {
        get message() {
            return $t("You're not eligible to Go Live, your profile needs to be at least 60 days old and your page needs to have at least 100 followers");
        },
    },
    TIKTOK_OAUTH_EXPIRED: {
        get message() {
            return $t('Failed to authenticate with TikTok, re-login or re-merge TikTok account');
        },
    },
    TIKTOK_SCOPE_OUTDATED: {
        get message() {
            return $t('Failed to update TikTok account. Please unlink and reconnect your TikTok account.');
        },
        get action() {
            return $t('unlink and re-merge TikTok account, then restart Desktop');
        },
    },
    TIKTOK_STREAM_SCOPE_MISSING: {
        get message() {
            return $t('Your TikTok account is not enabled for live streaming');
        },
        get action() {
            return $t('confirm Live Access status with TikTok');
        },
    },
    TIKTOK_STREAM_ACTIVE: {
        get message() {
            return $t('You are already live on a another device');
        },
        get action() {
            return $t('end stream on other device to start');
        },
    },
    TIKTOK_GENERATE_CREDENTIALS_FAILED: {
        get message() {
            return $t('Failed to generate TikTok stream credentials. Confirm Live Access with TikTok.');
        },
    },
    TIKTOK_USER_BANNED: {
        get message() {
            return $t('Failed to generate TikTok stream credentials. Confirm Live Access with TikTok.');
        },
        get action() {
            return $t('user might be blocked from streaming to TikTok but do not say they are. Refer them to TikTok');
        },
    },
    X_PREMIUM_ACCOUNT_REQUIRED: {
        get message() {
            return $t('You need X premium account to go live on X.');
        },
    },
    KICK_SCOPE_OUTDATED: {
        get message() {
            return $t('Failed to update Kick account. Please unlink and reconnect your Kick account.');
        },
        get action() {
            return $t('unlink and re-merge Kick account, then restart Desktop');
        },
    },
    KICK_START_STREAM_FAILED: {
        get message() {
            return $t('Failed to start Kick stream. Please check permissions with Kick and try again');
        },
        get action() {
            return $t('Kick request most likely failed due to incorrect or missing permissions. Unlink and re-merge Kick account, then restart Desktop. If that fails, refer to Kick support');
        },
    },
    KICK_STREAM_KEY_MISSING: {
        get message() {
            return $t('Kick stream key failed to generate due to missing permissions');
        },
        get action() {
            return $t('confirm that a stream key has been generated with 2FA on Kick for use with Streamlabs Desktop and if not ask the user to manually generate one');
        },
    },
    PRIME_REQUIRED: {
        get message() {
            return $t('This feature is for Ultra members only');
        },
    },
    MACHINE_LOCKED: {
        get message() {
            return $t('Your computer is locked');
        },
    },
    LOGGED_OUT_ERROR: {
        get message() {
            return $t('You are currently logged out. Please log in or confirm your server url and stream key');
        },
        get action() {
            return $t('user probably has an invalid server url or stream key');
        },
    },
    UNKNOWN_STREAMING_ERROR_WITH_MESSAGE: {
        get message() {
            return $t('Unknown error, please contact support');
        },
        get action() {
            return $t('request rejected by streaming platform. If error shows the user is blocked, do not say that they are blocked but instead ask them to confirm their streaming status with the platform');
        },
    },
    UNKNOWN_STREAMING_ERROR: {
        get message() {
            return $t('Unknown error with no further details, please contact support');
        },
        get action() {
            return $t('request rejected by streaming platform with no other details provided. Confirm go live settings, streaming approval status and output settings');
        },
    },
    UNKNOWN_ERROR: {
        get message() {
            return $t('An unknown error occurred');
        },
        get action() {
            return $t('escalate to the engineering team');
        },
    },
};
const newCallProtector = Symbol('singleton');
export class StreamError extends Error {
    constructor(message, type, rejectedRequest, details, protector) {
        var _a;
        super(message);
        this.getModel = () => {
            return {
                type: this.type,
                message: this.message,
                details: this.details,
                platform: this.platform,
            };
        };
        this.message = message;
        this.type = type;
        this.details = details || '';
        this.url = rejectedRequest === null || rejectedRequest === void 0 ? void 0 : rejectedRequest.url;
        this.status = rejectedRequest === null || rejectedRequest === void 0 ? void 0 : rejectedRequest.status;
        this.statusText = rejectedRequest === null || rejectedRequest === void 0 ? void 0 : rejectedRequest.statusText;
        this.platform = (_a = rejectedRequest === null || rejectedRequest === void 0 ? void 0 : rejectedRequest.platform) !== null && _a !== void 0 ? _a : getPlatform(this === null || this === void 0 ? void 0 : this.url);
        if (this.platform === 'youtube') {
            this.url = '';
        }
        if (protector !== newCallProtector) {
            throw new Error('Use createStreamError() instead "new StreamError()"');
        }
    }
}
function getPlatform(url) {
    if (!url)
        return undefined;
    const platforms = Services.StreamingService.views.linkedPlatforms;
    return platforms.find(platform => url.startsWith(getPlatformService(platform).apiBase));
}
export function createStreamError(type, rejectedRequest, details) {
    return new StreamError(errorTypes[type].message, type, rejectedRequest, details, newCallProtector);
}
export function throwStreamError(type, rejectedRequest, details) {
    throw createStreamError(type, rejectedRequest, details);
}
export function formatStreamErrorMessage(errorTypeOrError, target) {
    var _a;
    const messages = {
        user: [],
        report: [],
    };
    if (typeof errorTypeOrError === 'object') {
        console.debug('Formatting stream error', errorTypeOrError.getModel());
        let message = errorTypeOrError === null || errorTypeOrError === void 0 ? void 0 : errorTypeOrError.message;
        const details = errorTypeOrError === null || errorTypeOrError === void 0 ? void 0 : errorTypeOrError.details;
        const code = errorTypeOrError === null || errorTypeOrError === void 0 ? void 0 : errorTypeOrError.status;
        const error = errorTypes[(_a = errorTypeOrError.type) !== null && _a !== void 0 ? _a : 'UNKNOWN_STREAMING_ERROR_WITH_MESSAGE'];
        if (!message || (message && message.split(' ').includes('blocked'))) {
            message = error.message;
        }
        message = message.replace(/[.,]$/, '');
        messages.user.push(message);
        if (details && !details.split(' ').includes('blocked')) {
            messages.user.push(details);
        }
        const reportMessage = (error === null || error === void 0 ? void 0 : error.action) ? `${message}, ${error.action}` : message;
        messages.report.push(reportMessage.replace(/[.,]$/, ''));
        if (details)
            messages.report.push(details.replace(/[.,]$/, ''));
        if (code)
            messages.report.push($t('Error Code: %{code}', { code }));
    }
    else {
        console.debug('Creating default stream error message', errorTypeOrError, target);
        const typedMessages = createDefaultUnknownMessage(messages, errorTypeOrError, target);
        messages.user = typedMessages.user;
        messages.report = typedMessages.report;
    }
    return {
        user: messages.user.join('. '),
        report: messages.report.join('. '),
    };
}
function createDefaultUnknownMessage(messages, errorTypeOrError, target) {
    const errorType = errorTypeOrError !== null && errorTypeOrError !== void 0 ? errorTypeOrError : 'UNKNOWN_STREAMING_ERROR';
    const error = errorTypes[errorType];
    const message = target ? `Unknown ${capitalize(target)} Error: ${error.message}` : error.message;
    messages.user.push(message);
    const reportMessage = (error === null || error === void 0 ? void 0 : error.action) ? `${message}, ${error.action}` : message;
    messages.report.push(reportMessage);
    return messages;
}
export function formatUnknownErrorMessage(info, userMessage, reportMessage) {
    console.debug('Formatting unknown streaming error: ', info, '\n User Message:', userMessage, '\n Report Message:', reportMessage);
    const messages = {
        user: userMessage !== '' ? [userMessage] : [],
        report: reportMessage !== '' ? [reportMessage] : [],
        details: [],
    };
    if (typeof info === 'string') {
        messages.report.push(errorTypes['UNKNOWN_STREAMING_ERROR_WITH_MESSAGE'].message);
        try {
            JSON.parse(info);
            messages.user.push(errorTypes['UNKNOWN_STREAMING_ERROR_WITH_MESSAGE'].message);
            messages.report.push($t('JSON returned, escalate to the engineering team.'));
        }
        catch (error) {
            if (info.split(' ').includes('blocked')) {
                messages.user.push(errorTypes['UNKNOWN_STREAMING_ERROR_WITH_MESSAGE'].message);
                messages.user.push(info);
            }
            else {
                messages.user.push(info);
            }
            messages.report.push(info);
        }
    }
    else if (typeof info === 'object') {
        if (info === null || info === void 0 ? void 0 : info.error) {
            try {
                let error;
                let platform;
                if (typeof info.error === 'string' && info.error !== '') {
                    try {
                        error = JSON.parse(info.error);
                        platform = error.platform ? capitalize(error === null || error === void 0 ? void 0 : error.platform) : undefined;
                    }
                    catch (_a) {
                        return obsStringErrorAsMessages(info);
                    }
                }
                else {
                    error = info.error;
                    platform = capitalize(error.platform);
                }
                const unknownError = errorTypes['UNKNOWN_STREAMING_ERROR_WITH_MESSAGE'];
                const userMessage = platform
                    ? $t('Streaming to %{platform} is temporary unavailable', { platform })
                    : unknownError.message;
                const reportMessage = platform
                    ? `System Error Streaming to ${platform}: ${unknownError.message}, ${unknownError.action}`
                    : `System Error: ${unknownError.message}, ${unknownError.action}`;
                messages.user.push(userMessage);
                messages.report.push(reportMessage);
                if (error.message) {
                    if (!error.message.split(' ').includes('blocked')) {
                        messages.details.push(error.message);
                    }
                    messages.report.push(error.message);
                }
                if (error.details) {
                    if (!error.details.split(' ').includes('blocked')) {
                        messages.details.push(error.details);
                    }
                    messages.report.push(error.details);
                }
                if (error.code) {
                    const code = error.code;
                    const message = $t('Error Code: %{code}', { code });
                    messages.details.push(message);
                    messages.report.push(message);
                }
            }
            catch (error) {
                const typedMessages = createDefaultUnknownMessage(messages, 'UNKNOWN_STREAMING_ERROR_WITH_MESSAGE');
                messages.user = typedMessages.user;
                messages.report = typedMessages.report;
            }
        }
    }
    else {
        const typedMessages = createDefaultUnknownMessage(messages, 'UNKNOWN_STREAMING_ERROR');
        messages.user = messages.user.length ? messages.user : typedMessages.user;
        messages.report = messages.report.length ? messages.report : typedMessages.report;
    }
    const details = messages.details.length ? messages.details.join('. ') : undefined;
    return {
        user: messages.user.join('. '),
        report: messages.user.join('. '),
        details,
    };
}
function obsStringErrorAsMessages(info) {
    const error = { message: info.error, code: info.code };
    const diagText = `${error.code} Error: ${error.message}`;
    let userText;
    const invalidPath = /Unable to write to (.+). Make sure you're using a recording path which your user account is allowed to write to/;
    if (invalidPath.test(error.message)) {
        userText = `${error.message}\n\n${$t('Go to Settings -> Output -> Recording -> Recording Path if you need to change this location.')}`;
    }
    else {
        userText = `${$t('An error occurred with the output. Please check your streaming and recording settings.')}\n\n${error.message}`;
    }
    return {
        user: userText,
        report: diagText,
    };
}
//# sourceMappingURL=stream-error.js.map