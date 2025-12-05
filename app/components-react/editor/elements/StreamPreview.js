import React, { useRef } from 'react';
import Display from 'components-react/shared/Display';
import styles from './BaseElement.m.less';
import { $t } from 'services/i18n';
import { Services } from 'components-react/service-provider';
import useBaseElement from './hooks';
import { useVuex } from 'components-react/hooks';
const mins = { x: 0, y: 0 };
export function StreamPreview() {
    const { StreamingService } = Services;
    const containerRef = useRef(null);
    const { renderElement } = useBaseElement(React.createElement(StreamPreviewElement, null), mins, containerRef.current);
    const { selectiveRecording } = useVuex(() => ({
        selectiveRecording: StreamingService.state.selectiveRecording,
    }));
    function SelectiveRecordingMessage() {
        return (React.createElement("div", { className: styles.container },
            React.createElement("span", { className: styles.empty }, $t('This element requires Selective Recording to be enabled'))));
    }
    function StreamPreviewElement() {
        if (!selectiveRecording)
            return React.createElement(SelectiveRecordingMessage, null);
        return React.createElement(Display, { renderingMode: 1 });
    }
    return (React.createElement("div", { ref: containerRef, style: { height: '100%' } }, renderElement()));
}
StreamPreview.mins = mins;
//# sourceMappingURL=StreamPreview.js.map