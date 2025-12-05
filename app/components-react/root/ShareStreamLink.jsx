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
        return (<Tooltip key={platform} placement="right" title={tooltip} autoAdjustOverflow={false}>
        <Button type="text" aria-label={tooltip} onClick={() => copyToClipboard(streamPageUrl)} icon={<PlatformLogo platform={platform}/>}/>
      </Tooltip>);
    });
    const single = items.length < 2;
    return (<div className={styles.shareStreamLinksContainer}>
      {single ? (<Tooltip placement="right" title={$t('Copy stream link')}>
          <Button type="text" icon={<ShareAltOutlined />} aria-label={$t('Copy stream link')} onClick={() => copyToClipboard(getPlatformService(StreamingService.views.enabledPlatforms[0]).streamPageUrl)}/>
        </Tooltip>) : (<>
          <Tooltip placement="right" title={$t('Share stream link')}>
            <Button type="text" icon={expanded ? <CloseOutlined /> : <ShareAltOutlined />} aria-label={$t('Share stream link')} onClick={() => toggleExpanded()}/>
          </Tooltip>
          <div style={{
                flex: 1,
                display: expanded ? 'flex' : 'none',
                justifyContent: 'space-between',
                transition: 'all 1s ease-in-out',
            }}>
            {items}
          </div>
        </>)}
    </div>);
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
//# sourceMappingURL=ShareStreamLink.jsx.map