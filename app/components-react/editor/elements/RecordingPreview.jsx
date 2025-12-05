import React, { useRef } from 'react';
import Display from 'components-react/shared/Display';
import styles from './BaseElement.m.less';
import { $t } from 'services/i18n';
import { Services } from 'components-react/service-provider';
import useBaseElement from './hooks';
import { useVuex } from 'components-react/hooks';
const mins = { x: 0, y: 0 };
export function RecordingPreview() {
    const { StreamingService } = Services;
    const containerRef = useRef(null);
    const { renderElement } = useBaseElement(<RecPreview />, mins, containerRef.current);
    const { selectiveRecording } = useVuex(() => ({
        selectiveRecording: StreamingService.state.selectiveRecording,
    }));
    function SelectiveRecordingMessage() {
        return (<div className={styles.container}>
        <span className={styles.empty}>
          {$t('This element requires Selective Recording to be enabled')}
        </span>
      </div>);
    }
    function RecPreview() {
        if (!selectiveRecording)
            return <SelectiveRecordingMessage />;
        return <Display renderingMode={2}/>;
    }
    return (<div ref={containerRef} style={{ height: '100%' }}>
      {renderElement()}
    </div>);
}
RecordingPreview.mins = mins;
//# sourceMappingURL=RecordingPreview.jsx.map