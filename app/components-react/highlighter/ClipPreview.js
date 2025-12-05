import { SCRUB_HEIGHT, SCRUB_WIDTH, SCRUB_FRAMES } from 'services/highlighter/constants';
import React, { useState } from 'react';
import { Services } from 'components-react/service-provider';
import { BoolButtonInput } from 'components-react/shared/inputs/BoolButtonInput';
import styles from './ClipPreview.m.less';
import { Button, Tooltip } from 'antd';
import { $t } from 'services/i18n';
import { isAiClip } from './utils';
import { useVuex } from 'components-react/hooks';
import ClipPreviewInfo from './ClipPreviewInfo';
export default function ClipPreview(props) {
    const { HighlighterService } = Services;
    const v = useVuex(() => ({
        clip: HighlighterService.views.clipsDictionary[props.clipId],
    }));
    const [scrubFrame, setScrubFrame] = useState(0);
    const clipThumbnail = v.clip.scrubSprite || '';
    const enabled = v.clip.deleted ? false : v.clip.enabled;
    if (!v.clip) {
        return React.createElement(React.Fragment, null, "deleted");
    }
    function mouseMove(e) {
        const frameIdx = Math.floor((e.nativeEvent.offsetX / SCRUB_WIDTH) * SCRUB_FRAMES);
        if (scrubFrame !== frameIdx) {
            setScrubFrame(frameIdx);
        }
    }
    function setEnabled(enabled) {
        HighlighterService.actions.manuallyEnableClip(v.clip.path, enabled, props.streamId);
    }
    return (React.createElement("div", { className: styles.previewClip, style: { opacity: v.clip.enabled ? 1.0 : 0.3 } },
        React.createElement("div", { style: { height: `${SCRUB_HEIGHT}px`, position: 'relative' } },
            !v.clip.deleted && (React.createElement("img", { src: clipThumbnail, className: styles.previewImage, style: {
                    width: `${SCRUB_WIDTH}px`,
                    height: `${SCRUB_HEIGHT}px`,
                    objectPosition: `-${scrubFrame * SCRUB_WIDTH}px`,
                }, onMouseMove: mouseMove, onClick: props.emitShowTrim })),
            v.clip.deleted && (React.createElement("div", { style: {
                    width: `${SCRUB_WIDTH}px`,
                    height: `${SCRUB_HEIGHT}px`,
                }, className: styles.deletedPreview },
                React.createElement("i", { className: `icon-trash ${styles.deletedIcon}` }))),
            React.createElement("div", { className: styles.flameHypescoreWrapper }, isAiClip(v.clip) && React.createElement(FlameHypeScore, { score: v.clip.aiInfo.score })),
            React.createElement("span", { className: styles.enableButton },
                React.createElement(BoolButtonInput, { tooltip: enabled ? $t('Disable clip') : $t('Enable clip'), tooltipPlacement: "top", value: enabled, onChange: setEnabled, checkboxStyles: {
                        width: '24px',
                        height: '24px',
                        fontSize: '14px',
                        background: 'white',
                        borderColor: '#333',
                    }, checkboxActiveStyles: { background: 'var(--teal-hover)' } })),
            React.createElement("div", { className: styles.previewClipMoving },
                React.createElement("div", { className: styles.controlsContainer },
                    React.createElement("div", { className: styles.durationInfo },
                        React.createElement("span", { className: styles.durationLabel }, formatSecondsToHMS(v.clip.duration - (v.clip.startTrim + v.clip.endTrim) || 0))),
                    React.createElement("div", { style: { display: 'flex', gap: '4px' } },
                        React.createElement("div", { style: {
                                fontSize: '19px',
                            } }, isAiClip(v.clip) ? (React.createElement(ClipPreviewInfo, { clip: v.clip, game: props.game })) : (React.createElement("div", { className: styles.highlighterIcon },
                            React.createElement("i", { className: "icon-highlighter" })))))),
                React.createElement("div", { className: styles.previewClipBottomBar },
                    React.createElement(Button, { size: "large", className: styles.actionButton, onClick: props.emitShowRemove },
                        React.createElement("i", { className: "icon-trash" })),
                    React.createElement("div", { style: { display: 'flex', gap: '4px' } },
                        React.createElement(Button, { size: "large", className: styles.actionButton, onClick: props.emitShowTrim },
                            React.createElement("i", { className: "icon-trim", style: { marginRight: '8px' } }),
                            " ",
                            $t('Trim')),
                        React.createElement(Tooltip, { title: $t('Open file location'), placement: "top" },
                            React.createElement(Button, { size: "large", className: styles.actionButton, onClick: props.emitOpenFileInLocation },
                                React.createElement("i", { className: "icon-pop-out-2" })))))))));
}
export function formatSecondsToHMS(seconds) {
    const totalSeconds = Math.round(seconds);
    if (totalSeconds === 0) {
        return '0s';
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${hours !== 0 ? hours.toString() + 'h ' : ''} ${minutes !== 0 ? minutes.toString() + 'm ' : ''}${remainingSeconds !== 0 ? remainingSeconds.toString() + 's' : ''}`;
}
function FlameHypeScore({ score }) {
    if (score === undefined) {
        return React.createElement(React.Fragment, null);
    }
    const normalizedScore = Math.min(1, Math.max(0, score));
    const fullFlames = Math.ceil(normalizedScore * 5);
    return (React.createElement("div", { className: "flex items-center gap-1", style: { fontSize: '19px' } },
        Array.from({ length: fullFlames }).map((_, index) => (React.createElement(React.Fragment, { key: 'on' + index }, "\uD83D\uDD25"))),
        Array.from({ length: 5 - fullFlames }).map((_, index) => (React.createElement("span", { key: 'off' + index, style: { opacity: '0.3' } }, "\uD83D\uDD25")))));
}
//# sourceMappingURL=ClipPreview.js.map