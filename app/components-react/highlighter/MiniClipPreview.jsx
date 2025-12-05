import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
import { CheckboxInput } from 'components-react/shared/inputs';
import React from 'react';
import { SCRUB_HEIGHT, SCRUB_WIDTH } from 'services/highlighter/constants';
import styles from './MiniClipPreview.m.less';
export default function MiniClipPreview({ clipId, streamId, showDisabled, clipStateChanged, emitPlayClip, }) {
    const { HighlighterService } = Services;
    const clip = useVuex(() => HighlighterService.views.clipsDictionary[clipId]);
    return (<div className={styles.miniClipCheckbox} key={clip.path} style={{
            display: showDisabled || clip.enabled ? 'inline-block' : 'none',
        }}>
      <CheckboxInput value={clip.enabled} onChange={(val, ev) => {
            ev === null || ev === void 0 ? void 0 : ev.stopPropagation();
            const newState = !clip.enabled;
            HighlighterService.actions.manuallyEnableClip(clip.path, newState, streamId);
            clipStateChanged(clip.path, newState);
        }} className={styles.customCheckbox}/>
      <img onClick={emitPlayClip} src={clip.scrubSprite} className={styles.thumbnailSpecs} style={{
            opacity: !clip.enabled ? '0.3' : '1',
            width: `${SCRUB_WIDTH / 6}px`,
            height: `${SCRUB_HEIGHT / 6}px`,
        }}></img>
    </div>);
}
//# sourceMappingURL=MiniClipPreview.jsx.map