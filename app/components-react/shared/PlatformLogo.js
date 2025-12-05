import React from 'react';
import cx from 'classnames';
import css from './PlatformLogo.m.less';
import { Services } from 'components-react/service-provider';
import { useRealmObject } from 'components-react/hooks/realm';
export const sizeMap = {
    small: 14,
    medium: 40,
};
export default function PlatformLogo(p) {
    var _a;
    const { CustomizationService } = Services;
    const isDark = useRealmObject(CustomizationService.state).isDarkTheme;
    function iconForPlatform() {
        return {
            twitch: 'fab fa-twitch',
            youtube: 'youtube',
            facebook: 'fab fa-facebook',
            tiktok: 'tiktok',
            trovo: 'fab fa-trovo',
            dlive: 'dlive',
            nimotv: 'nimotv',
            twitter: 'twitter',
            streamlabs: 'icon-streamlabs',
            instagram: 'instagram',
            kick: 'kick',
        }[p.platform];
    }
    const size = p.size && ((_a = sizeMap[p.size]) !== null && _a !== void 0 ? _a : p.size);
    const sizeStyle = size
        ? {
            fontSize: `${size}px`,
            width: `${size}px`,
            height: `${size}px`,
            maxHeight: `${size}px`,
            maxWidth: `${size}px`,
        }
        : undefined;
    const colorStyle = p.color ? { color: p.color } : undefined;
    const style = Object.assign(Object.assign(Object.assign({}, sizeStyle), colorStyle), p === null || p === void 0 ? void 0 : p.style);
    let color = p.color;
    if (['twitter', 'tiktok'].includes(p.platform) && !isDark) {
        color = 'black';
    }
    return (React.createElement(React.Fragment, null, (p === null || p === void 0 ? void 0 : p.fontIcon) ? (React.createElement("i", { className: cx(`icon-${p === null || p === void 0 ? void 0 : p.fontIcon}`, p.className), style: style })) : (React.createElement("i", { className: cx(iconForPlatform(), !p.nocolor && css[p.platform], p.className, {
            [css['trovo--black']]: p.platform === 'trovo' && p.color === 'black',
            [css['twitter--black']]: p.platform === 'twitter' && color === 'black',
            [css['tiktok--black']]: p.platform === 'tiktok' && color === 'black',
        }), style: style }))));
}
//# sourceMappingURL=PlatformLogo.js.map