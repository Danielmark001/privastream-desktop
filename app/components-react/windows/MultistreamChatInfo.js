import React from 'react';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import { $t } from 'services/i18n';
import styles from './MultistreamChatInfo.m.less';
import { Row, Col } from 'antd';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import cx from 'classnames';
export default function MultistreamChatInfo() {
    const platforms = [
        {
            icon: 'youtube',
            name: $t('YouTube'),
            read: true,
            write: true,
        },
        {
            icon: 'twitch',
            name: $t('Twitch'),
            read: true,
            write: true,
        },
        {
            icon: 'facebook',
            name: $t('Facebook Pages'),
            read: true,
            write: true,
        },
        {
            icon: 'facebook',
            name: $t('Facebook Profiles'),
            read: true,
            write: false,
        },
        {
            icon: 'twitter',
            name: $t('X (Twitter)'),
            read: true,
            write: false,
        },
        {
            icon: 'trovo',
            name: $t('Trovo'),
            read: true,
            write: false,
        },
        {
            icon: 'instagram',
            name: $t('Instagram Live'),
            read: false,
            write: false,
        },
        {
            icon: 'tiktok',
            name: $t('TikTok'),
            read: false,
            write: false,
        },
        {
            icon: 'kick',
            name: $t('Kick'),
            read: true,
            write: false,
        },
    ];
    return (React.createElement(ModalLayout, { className: styles.chatInfoContainer },
        React.createElement(Row, { className: styles.chatInfoRow },
            React.createElement(Col, { span: 10, className: cx(styles.chatInfoCol, styles.infoHeading) }, $t('Platform')),
            React.createElement(Col, { span: 7, className: cx(styles.chatInfoCol, styles.infoHeading) }, $t('Read')),
            React.createElement(Col, { span: 7, className: cx(styles.chatInfoCol, styles.infoHeading) }, $t('Post Comments'))),
        platforms.map(platform => (React.createElement(Row, { key: `${platform.name.toLowerCase().split(' ').join('-')}-chat-info`, className: styles.chatInfoRow },
            React.createElement(Col, { span: 10, className: cx(styles.chatInfoCol, styles.platform) },
                React.createElement(PlatformLogo, { platform: platform.icon, className: cx(styles.chatPlatformIcon, styles[`platform-logo-${platform.icon}`]) }),
                platform.name),
            React.createElement(Col, { span: 7, className: cx(styles.chatInfoCol, {
                    [styles.iconCheck]: platform.read,
                    [styles.iconCross]: !platform.read,
                }) },
                React.createElement("i", { className: platform.read ? 'icon-check-mark' : 'icon-close' })),
            React.createElement(Col, { span: 7, className: cx(styles.chatInfoCol, {
                    [styles.iconCheck]: platform.write,
                    [styles.iconCross]: !platform.write,
                }) },
                React.createElement("i", { className: platform.write ? 'icon-check-mark' : 'icon-close' })))))));
}
//# sourceMappingURL=MultistreamChatInfo.js.map