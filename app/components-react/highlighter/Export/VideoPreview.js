import React, { useRef } from 'react';
import { Services } from 'components-react/service-provider';
import styles from './ExportModal.m.less';
export default function VideoPreview() {
    const { HighlighterService } = Services;
    const exportInfo = useRef(HighlighterService.views.getCacheBustingUrl(HighlighterService.views.exportInfo.file));
    return (React.createElement("div", { className: styles.videoPreview },
        React.createElement("video", { src: exportInfo.current, controls: true })));
}
//# sourceMappingURL=VideoPreview.js.map