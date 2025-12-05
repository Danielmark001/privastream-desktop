import React, { useEffect, useRef, useState } from 'react';
import { Services } from 'components-react/service-provider';
import { $t } from 'services/i18n';
import { sortClipsByOrder, getCombinedClipsDuration } from './utils';
import MiniClipPreview from './MiniClipPreview';
import { PauseButton, PlayButton } from './StreamCard';
import styles from './PreviewModal.m.less';
import { Button } from 'antd';
import { CheckboxInput } from 'components-react/shared/inputs';
import { formatSecondsToHMS } from './ClipPreview';
import { useVuex } from 'components-react/hooks';
export default function PreviewModal({ close, streamId, emitSetShowModal, }) {
    const { HighlighterService, UsageStatisticsService } = Services;
    const clips = useVuex(() => HighlighterService.getClips(HighlighterService.views.clips, streamId));
    const { intro, outro } = HighlighterService.views.video;
    const audioSettings = HighlighterService.views.audio;
    const sortedClips = [...sortClipsByOrder(clips, streamId)];
    const initialIndex = getInitialIndex(intro.duration, sortedClips);
    const [currentClipIndex, setCurrentClipIndex] = useState(initialIndex);
    const currentClipIndexRef = useRef(initialIndex);
    const [showDisabled, setShowDisabled] = useState(true);
    useEffect(() => {
        UsageStatisticsService.recordShown('ClipsPreview', streamId);
    }, []);
    function getInitialIndex(introDuration, sortedClips) {
        if (introDuration)
            return 0;
        const firstEnabledIndex = sortedClips.findIndex(clip => clip.enabled);
        return firstEnabledIndex === -1 ? 0 : firstEnabledIndex;
    }
    const playlist = [
        ...(intro.duration && intro.path
            ? [
                {
                    src: intro.path,
                    path: intro.path,
                    start: 0,
                    end: intro.duration,
                    type: 'video/mp4',
                    enabled: true,
                    duration: intro.duration,
                },
            ]
            : []),
        ...sortedClips.map((clip) => ({
            src: clip.path + `#t=${clip.startTrim},${clip.duration - clip.endTrim}`,
            path: clip.path,
            start: clip.startTrim,
            end: clip.duration - clip.endTrim,
            type: 'video/mp4',
            enabled: clip.enabled,
            duration: clip.duration - clip.endTrim - clip.startTrim,
        })),
        ...(outro.duration && outro.path
            ? [
                {
                    src: outro.path,
                    path: outro.path,
                    start: 0,
                    end: outro.duration,
                    type: 'video/mp4',
                    enabled: true,
                    duration: outro.duration,
                },
            ]
            : []),
    ];
    const videoPlayer = useRef(null);
    const containerRef = useRef(null);
    const audio = useRef(null);
    const isChangingClip = useRef(false);
    const [isPlaying, setIsPlaying] = useState(true);
    function isRoughlyEqual(a, b, tolerance = 0.3) {
        return Math.abs(a - b) <= tolerance;
    }
    const findNextEnabledClipIndex = (currentIndex) => {
        const enabledIndices = playlist
            .map((clip, index) => (clip.enabled ? index : -1))
            .filter(index => index !== -1);
        if (enabledIndices.length === 0)
            return currentIndex;
        const nextIndex = enabledIndices.find(index => index > currentIndex);
        return nextIndex !== null && nextIndex !== void 0 ? nextIndex : enabledIndices[0];
    };
    const nextClip = () => {
        if (!isChangingClip.current) {
            isChangingClip.current = true;
            setCurrentClipIndex(prevIndex => {
                const newIndex = findNextEnabledClipIndex(prevIndex);
                playAudio(newIndex, true);
                return newIndex;
            });
        }
    };
    useEffect(() => {
        if (!videoPlayer.current) {
            return;
        }
        const handleEnded = () => {
            nextClip();
        };
        const handlePause = () => {
            const currentTime = videoPlayer.current.currentTime;
            const endTime = playlist[currentClipIndexRef.current].end;
            if (currentTime >= endTime || isRoughlyEqual(currentTime, endTime)) {
                nextClip();
            }
        };
        const handlePlay = () => {
            setIsPlaying(true);
        };
        const handleAudioEnd = () => {
            audio.current.currentTime = 0;
            audio.current.play().catch(e => console.error('Error playing audio:', e));
        };
        videoPlayer.current.addEventListener('ended', handleEnded);
        videoPlayer.current.addEventListener('play', handlePlay);
        videoPlayer.current.addEventListener('pause', handlePause);
        if (audioSettings.musicEnabled && audioSettings.musicPath && playlist.length > 0) {
            audio.current = new Audio(audioSettings.musicPath);
            audio.current.volume = audioSettings.musicVolume / 100;
            audio.current.autoplay = true;
            audio.current.addEventListener('ended', handleAudioEnd);
        }
        return () => {
            var _a, _b, _c;
            (_a = videoPlayer.current) === null || _a === void 0 ? void 0 : _a.removeEventListener('ended', handleEnded);
            (_b = videoPlayer.current) === null || _b === void 0 ? void 0 : _b.removeEventListener('play', handlePlay);
            (_c = videoPlayer.current) === null || _c === void 0 ? void 0 : _c.removeEventListener('pause', handlePause);
            if (audio.current) {
                audio.current.pause();
                audio.current.removeEventListener('ended', handleAudioEnd);
                audio.current = null;
            }
        };
    }, [playlist.filter(clip => clip.enabled).length, videoPlayer.current]);
    useEffect(() => {
        var _a;
        currentClipIndexRef.current = currentClipIndex;
        if (videoPlayer.current === null || playlist.length === 0) {
            return;
        }
        videoPlayer.current.src = playlist[currentClipIndex].src;
        videoPlayer.current.load();
        videoPlayer.current.play().catch(e => console.error('Error playing video:', e));
        isChangingClip.current = false;
        (_a = document.getElementById('preview-' + currentClipIndex)) === null || _a === void 0 ? void 0 : _a.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center',
        });
    }, [currentClipIndex]);
    function togglePlay() {
        var _a, _b;
        const currentPlayer = videoPlayer.current;
        if (currentPlayer === null || currentPlayer === void 0 ? void 0 : currentPlayer.paused) {
            currentPlayer.play().catch(e => console.error('Error playing video:', e));
            if (audio.current && audio.current.currentTime > 0) {
                (_a = audio.current) === null || _a === void 0 ? void 0 : _a.play().catch(e => console.error('Error playing audio:', e));
            }
        }
        else {
            setIsPlaying(false);
            currentPlayer === null || currentPlayer === void 0 ? void 0 : currentPlayer.pause();
            (_b = audio.current) === null || _b === void 0 ? void 0 : _b.pause();
        }
    }
    function playPauseButton() {
        if (isPlaying) {
            return <PauseButton />;
        }
        else {
            return <PlayButton />;
        }
    }
    function jumpToClip(index) {
        if (currentClipIndex === index) {
            return;
        }
        setCurrentClipIndex(index);
        playAudio(index);
    }
    function playAudio(index, continuation = false) {
        if (continuation || !audio.current) {
            return;
        }
        const startTime = playlist
            .filter((_, i) => i < index)
            .reduce((acc, curr) => acc + (curr.end - curr.start), 0);
        if (startTime < audio.current.duration) {
            audio.current.currentTime = startTime;
        }
        else {
            const start = startTime % audio.current.duration;
            audio.current.currentTime = start;
        }
        audio.current.play().catch(e => console.error('Error playing audio:', e));
    }
    const handleScroll = (event) => {
        if (containerRef.current) {
            containerRef.current.scrollLeft += event.deltaY;
        }
    };
    if (playlist.length === 0) {
        return (<div>
        <h2>{$t('Preview')}</h2>
        <p>{$t('Select at least one clip to preview your video')}</p>
      </div>);
    }
    return (<div>
      <h2>{$t('Preview')}</h2>
      <p>
        This is just a preview of your highlight reel. Loading times between clips are possible.
      </p>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}>
        <video onClick={togglePlay} ref={videoPlayer} className={styles.videoPlayer}/>
      </div>
      <div style={{ display: 'flex', marginTop: '16px', minHeight: '50px' }}>
        <div style={{ cursor: 'pointer' }} onClick={() => togglePlay()}>
          {playPauseButton()}
        </div>
        <div ref={containerRef} onWheel={handleScroll} className={styles.timeline}>
          <div className={styles.timelineItemWrapper}>
            {playlist.map(({ path }, index) => {
            let content;
            if (path === intro.path || path === outro.path) {
                content = (<div style={{ height: '34px', borderRadius: '6px', overflow: 'hidden' }} onClick={() => {
                        jumpToClip(index);
                    }}>
                    <video id={'preview-' + index} style={{ height: '100%' }} src={path} controls={false} autoPlay={false} muted playsInline></video>
                  </div>);
            }
            else {
                content = (<MiniClipPreview clipId={path} streamId={streamId} showDisabled={showDisabled} clipStateChanged={(clipId, newState) => {
                        playlist[index].enabled = newState;
                        if (playlist[index].path === playlist[currentClipIndex].path) {
                            if (newState === true)
                                return;
                            const nextEnabledClipIndex = findNextEnabledClipIndex(index);
                            jumpToClip(nextEnabledClipIndex);
                        }
                    }} emitPlayClip={() => {
                        jumpToClip(index);
                    }}></MiniClipPreview>);
            }
            return (<div key={'preview-mini' + index} id={'preview-' + index} className={styles.timelineItem} style={{
                    outline: index === currentClipIndex ? '1px solid var(--teal-hover)' : 'unset',
                    outlineOffset: '-2px',
                }}>
                  {content}
                </div>);
        })}
          </div>
        </div>
      </div>
      <div className={styles.actionWrapper}>
        <div className={styles.videoDurationWrapper}>
          <span>0m 0s</span>

          <span>
            {formatSecondsToHMS(getCombinedClipsDuration(playlist.map(clip => {
            return {
                duration: clip.enabled ? clip.duration : 0,
                path: clip.path,
                startTrim: 0,
                endTrim: 0,
            };
        })))}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <CheckboxInput label={'Show disabled clips'} value={showDisabled} onChange={() => {
            setShowDisabled(!showDisabled);
        }}/>
          <Button type="primary" disabled={playlist.filter(clip => clip.enabled).length === 0} onClick={() => {
            emitSetShowModal('export');
        }}>
            {$t('Export')}
          </Button>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=PreviewModal.jsx.map