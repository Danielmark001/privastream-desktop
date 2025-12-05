import React, { useState } from 'react';
import { Services } from '../service-provider';
import { $t } from 'services/i18n';
import { clipboard } from 'electron';
import { getPlatformService } from 'services/platforms';
import { Button, message } from 'antd';
import { CloseOutlined, ShareAltOutlined } from '@ant-design/icons';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import Tooltip from 'components-react/shared/Tooltip';
import styles from './ShareStreamLink.m.less';
export const ShareStreamLink = () => {
    const [expanded, setExpanded] = useState(false);
    const toggleExpanded = () => setExpanded(expanded => !expanded);
    const { StreamingService } = Services;
    const items = StreamingService.views.enabledPlatforms.map(platform => {
        const service = getPlatformService(platform);
        const streamPageUrl = service.streamPageUrl;
        if (!streamPageUrl) {
            return;
        }
        const tooltip = $t('Copy %{platform} link', {
            platform: StreamingService.views.getPlatformDisplayName(platform),
        });
        return (React.createElement(Tooltip, { key: platform, placement: "right", title: tooltip, autoAdjustOverflow: false },
            React.createElement(Button, { type: "text", "aria-label": tooltip, onClick: () => copyToClipboard(streamPageUrl), icon: React.createElement(PlatformLogo, { platform: platform }) })));
    });
    const single = items.length < 2;
    return (React.createElement("div", { className: styles.shareStreamLinksContainer }, single ? (React.createElement(Tooltip, { placement: "right", title: $t('Copy stream link') },
        React.createElement(Button, { type: "text", icon: React.createElement(ShareAltOutlined, null), "aria-label": $t('Copy stream link'), onClick: () => copyToClipboard(getPlatformService(StreamingService.views.enabledPlatforms[0]).streamPageUrl) }))) : (React.createElement(React.Fragment, null,
        React.createElement(Tooltip, { placement: "right", title: $t('Share stream link') },
            React.createElement(Button, { type: "text", icon: expanded ? React.createElement(CloseOutlined, null) : React.createElement(ShareAltOutlined, null), "aria-label": $t('Share stream link'), onClick: () => toggleExpanded() })),
        React.createElement("div", { style: {
                flex: 1,
                display: expanded ? 'flex' : 'none',
                justifyContent: 'space-between',
                transition: 'all 1s ease-in-out',
            } }, items)))));
};
const copyToClipboard = (link) => {
    clipboard.writeText(link);
    message.open({
        type: 'success',
        content: $t('Copied to clipboard'),
        duration: 2,
        style: {
            padding: 0,
            marginTop: '-5px',
        },
    });
};
//# sourceMappingURL=ShareStreamLink.js.map