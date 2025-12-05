var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EHighlighterView, } from 'services/highlighter/models/highlighter.models';
import styles from './StreamCard.m.less';
import { Button } from 'antd';
import { Services } from 'components-react/service-provider';
import { isAiClip } from './utils';
import { useVuex } from 'components-react/hooks';
import { $t } from 'services/i18n';
import { EAiDetectionState } from 'services/highlighter/models/ai-highlighter.models';
import * as remote from '@electron/remote';
import StreamCardInfo from './StreamCardInfo';
import StreamCardModal from './StreamCardModal';
export default function StreamCard({ streamId, emitSetView, }) {
    const [modal, setModal] = useState(null);
    const [clipsOfStreamAreLoading, setClipsOfStreamAreLoading] = useState(null);
    const { HighlighterService } = Services;
    const clips = useMemo(() => {
        return HighlighterService.views.clips
            .filter(c => { var _a; return (_a = c.streamInfo) === null || _a === void 0 ? void 0 : _a[streamId]; })
            .map(clip => {
            if (isAiClip(clip) && clip.aiInfo.moments) {
                clip.aiInfo.inputs = clip.aiInfo.moments;
            }
            return clip;
        });
    }, [HighlighterService.views.clips.filter(clips => { var _a; return (_a = clips.streamInfo) === null || _a === void 0 ? void 0 : _a[streamId]; }), streamId]);
    const stream = useVuex(() => HighlighterService.views.highlightedStreamsDictionary[streamId]);
    const [thumbnailsLoaded, setClipsLoaded] = useState(false);
    const prevStateRef = useRef(null);
    useEffect(() => {
        var _a;
        let timeout = null;
        if (prevStateRef.current === EAiDetectionState.IN_PROGRESS &&
            stream.state.type === EAiDetectionState.FINISHED &&
            !thumbnailsLoaded) {
            timeout = setTimeout(() => {
                setClipsLoaded(true);
            }, clips.length * 1000);
        }
        prevStateRef.current = ((_a = stream === null || stream === void 0 ? void 0 : stream.state) === null || _a === void 0 ? void 0 : _a.type) || null;
        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [streamId, stream]);
    if (!stream) {
        return <></>;
    }
    const game = HighlighterService.getGameByStreamId(streamId);
    function shareFeedback() {
        remote.shell.openExternal('https://support.streamlabs.com/hc/en-us/requests/new?ticket_form_id=31967205905051');
    }
    function showStreamClips() {
        if ((stream === null || stream === void 0 ? void 0 : stream.state.type) !== EAiDetectionState.IN_PROGRESS) {
            emitSetView({ view: EHighlighterView.CLIPS, id: stream === null || stream === void 0 ? void 0 : stream.id });
        }
    }
    function previewVideo(id) {
        return __awaiter(this, void 0, void 0, function* () {
            setClipsOfStreamAreLoading(id);
            try {
                yield HighlighterService.actions.return.loadClips(id);
                setClipsOfStreamAreLoading(null);
                setModal('preview');
            }
            catch (error) {
                console.error('Error loading clips for preview export', error);
                setClipsOfStreamAreLoading(null);
            }
        });
    }
    function exportVideo(id) {
        return __awaiter(this, void 0, void 0, function* () {
            setClipsOfStreamAreLoading(id);
            try {
                yield HighlighterService.actions.return.loadClips(id);
                setClipsOfStreamAreLoading(null);
                setModal('export');
            }
            catch (error) {
                console.error('Error loading clips for export', error);
                setClipsOfStreamAreLoading(null);
            }
        });
    }
    function cancelHighlightGeneration() {
        HighlighterService.actions.cancelHighlightGeneration(stream.id);
    }
    if (stream.state.type === EAiDetectionState.FINISHED && clips.length === 0) {
        return (<>
        {modal && (<StreamCardModal streamId={streamId} modal={modal} onClose={() => {
                    setModal(null);
                }} game={game}/>)}
        <div className={styles.streamCard}>
          <Button size="large" className={styles.deleteButton} onClick={e => {
                setModal('remove');
                e.stopPropagation();
            }} style={{ backgroundColor: '#00000040', border: 'none', position: 'absolute' }}>
            <i className="icon-trash"/>
          </Button>
          <div className={styles.requirements}>
            <div style={{ display: 'flex', flexDirection: 'column', width: '280px' }}>
              <h2>{$t('No clips found')}</h2>
              <p style={{ marginBottom: '8px' }}>
                {$t('Please make sure all the requirements are met:')}
              </p>
              <ul style={{ marginBottom: 0, marginLeft: '-28px' }}>
                <li>{$t('Game is supported')}</li>
                <li>{$t('Game language is English')}</li>
                <li>{$t('Map and Stats area is fully visible')}</li>
                <li>{$t('Game is fullscreen in your stream')}</li>
                <li>{$t('Game mode is supported')}</li>
              </ul>
              <a onClick={() => setModal('requirements')} style={{ marginBottom: '14px' }}>
                {$t('Show details')}
              </a>
              <p>{$t('All requirements met but no luck?')}</p>

              <a onClick={shareFeedback}>
                {$t('Take a screenshot of your stream and share it here')}
              </a>
            </div>
          </div>
          <div className={styles.streaminfoWrapper}>
            <div className={styles.titleRotatedClipsWrapper} style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
              <div className={styles.titleDateWrapper}>
                <h2 className={styles.streamcardTitle} style={{ maxWidth: '200px' }}>
                  {stream.title}
                </h2>
                <p style={{ margin: 0, fontSize: '12px' }}>
                  {new Date(stream.date).toDateString()}
                </p>
              </div>
              <Button size="large" className={styles.cancelButton} onClick={shareFeedback} icon={<i className="icon-community" style={{ marginRight: '8px' }}/>}>
                {$t('Share feedback')}
              </Button>
            </div>
          </div>
        </div>
      </>);
    }
    return (<>
      {modal && (<StreamCardModal streamId={streamId} modal={modal} onClose={() => {
                setModal(null);
            }} game={game}/>)}
      <div className={styles.streamCard} onClick={() => {
            showStreamClips();
        }}>
        <Thumbnail clips={clips} clipsOfStreamAreLoading={clipsOfStreamAreLoading} stream={stream} emitGeneratePreview={() => {
            previewVideo(streamId);
        }} emitCancelHighlightGeneration={cancelHighlightGeneration} emitRemoveStream={() => {
            setModal('remove');
        }}/>
        <div className={styles.streaminfoWrapper}>
          <div className={styles.titleRotatedClipsWrapper}>
            <div className={styles.titleDateWrapper}>
              <h2 className={styles.streamcardTitle}>{stream.title}</h2>
              <p style={{ margin: 0, fontSize: '12px' }}>{new Date(stream.date).toDateString()}</p>
            </div>
            <RotatedClips clips={clips}/>
          </div>
          <h3 className={styles.emojiWrapper}>
            {stream.state.type === EAiDetectionState.FINISHED ? (<StreamCardInfo clips={clips} game={game}/>) : (<div style={{ height: '22px' }}> </div>)}
          </h3>
          <ActionBar stream={stream} clips={clips} emitCancelHighlightGeneration={cancelHighlightGeneration} emitExportVideo={() => exportVideo(streamId)} emitShowStreamClips={showStreamClips} clipsOfStreamAreLoading={clipsOfStreamAreLoading} emitRestartAiDetection={() => {
            HighlighterService.actions.restartAiDetection(stream.path, stream);
        }} emitSetView={emitSetView} emitFeedbackForm={() => {
            setModal('feedback');
        }}/>
        </div>
      </div>
    </>);
}
function ActionBar({ stream, clips, clipsOfStreamAreLoading, emitCancelHighlightGeneration, emitExportVideo, emitShowStreamClips, emitRestartAiDetection, emitSetView, emitFeedbackForm, }) {
    const { UsageStatisticsService, HighlighterService } = Services;
    function getFailedText(state) {
        switch (state) {
            case EAiDetectionState.ERROR:
                return $t('Highlights failed');
            case EAiDetectionState.CANCELED_BY_USER:
                return $t('Highlights cancelled');
            default:
                return '';
        }
    }
    const [thumbsDownVisible, setThumbsDownVisible] = useState(!(stream === null || stream === void 0 ? void 0 : stream.feedbackLeft));
    const clickThumbsDown = () => {
        if (stream === null || stream === void 0 ? void 0 : stream.feedbackLeft) {
            return;
        }
        setThumbsDownVisible(false);
        stream.feedbackLeft = true;
        HighlighterService.updateStream(stream);
        UsageStatisticsService.recordAnalyticsEvent('AIHighlighter', {
            type: 'ThumbsDown',
            streamId: stream === null || stream === void 0 ? void 0 : stream.id,
            game: stream === null || stream === void 0 ? void 0 : stream.game,
            clips: clips === null || clips === void 0 ? void 0 : clips.length,
        });
        emitFeedbackForm(clips.length);
    };
    if ((stream === null || stream === void 0 ? void 0 : stream.state.type) === EAiDetectionState.IN_PROGRESS) {
        return (<div className={styles.progressbarBackground}>
        <div className={styles.progressbarText}>{$t('Searching for highlights...')}</div>
        <div className={styles.progressbarProgress} style={{
                opacity: stream.state.progress < 1 ? 0 : 1,
                transform: `scaleX(${stream.state.progress / 100})`,
                transformOrigin: 'left',
                transition: 'transform 1000ms',
            }}></div>

        <Button size="large" className={styles.cancelButton} onClick={e => {
                e.stopPropagation();
                emitCancelHighlightGeneration();
            }}>
          <i className="icon-close"/>
        </Button>
      </div>);
    }
    if (stream && clips.length > 0) {
        return (<div className={styles.buttonBarWrapper}>
        {thumbsDownVisible && (<Button icon={<i className="icon-thumbs-down" style={{ fontSize: '14px' }}/>} size="large" onClick={e => {
                    clickThumbsDown();
                    e.stopPropagation();
                }}/>)}
        <Button icon={<i className="icon-edit" style={{ marginRight: '4px' }}/>} size="large" onClick={emitShowStreamClips}>
          {$t('Edit Clips')}
        </Button>

        
        <Button size="large" type="primary" onClick={e => {
                emitExportVideo();
                setThumbsDownVisible(false);
                e.stopPropagation();
            }} style={{ display: 'grid', gridTemplateAreas: 'stack' }}>
          <div style={{
                visibility: clipsOfStreamAreLoading === stream.id ? 'visible' : 'hidden',
                gridArea: 'stack',
            }}>
            <i className="fa fa-spinner fa-pulse"/>
          </div>
          <span style={{
                visibility: clipsOfStreamAreLoading !== stream.id ? 'visible' : 'hidden',
                gridArea: 'stack',
            }}>
            <i className="icon-download" style={{ marginRight: '4px' }}/>
            {$t('Export highlight reel')}
          </span>
        </Button>
      </div>);
    }
    return (<div className={styles.buttonBarWrapper}>
      <div style={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
        {getFailedText(stream.state.type)}
      </div>
      <div style={{ display: 'flex', gap: '4px' }}>
        {(stream === null || stream === void 0 ? void 0 : stream.state.type) === EAiDetectionState.CANCELED_BY_USER ? (<Button size="large" onClick={e => {
                emitRestartAiDetection();
                e.stopPropagation();
            }}>
            {$t('Restart')}
          </Button>) : (<Button size="large" onClick={e => {
                emitSetView({ view: EHighlighterView.CLIPS, id: stream.id });
                e.stopPropagation();
            }}>
            {$t('Add Clips')}
          </Button>)}
      </div>
    </div>);
}
export function Thumbnail({ clips, clipsOfStreamAreLoading, stream, emitGeneratePreview, emitCancelHighlightGeneration, emitRemoveStream, }) {
    var _a, _b;
    function getThumbnailText(state) {
        if (clipsOfStreamAreLoading === (stream === null || stream === void 0 ? void 0 : stream.id)) {
            return <i className="fa fa-spinner fa-pulse"/>;
        }
        if (clips.length > 0) {
            return <PlayButton />;
        }
        switch (state) {
            case EAiDetectionState.IN_PROGRESS:
                return $t('Searching for highlights...');
            case EAiDetectionState.FINISHED:
                if (clips.length === 0) {
                    return $t('Not enough highlights found');
                }
                return <PlayButton />;
            case EAiDetectionState.CANCELED_BY_USER:
                return $t('Highlights cancelled');
            case EAiDetectionState.ERROR:
                return $t('Highlights cancelled');
            default:
                return '';
        }
    }
    return (<div className={`${styles.thumbnailWrapper} `}>
      <Button size="large" className={styles.deleteButton} onClick={e => {
            if (stream.state.type === EAiDetectionState.IN_PROGRESS) {
                emitCancelHighlightGeneration();
            }
            emitRemoveStream();
            e.stopPropagation();
        }} style={{ backgroundColor: '#00000040', border: 'none', position: 'absolute' }}>
        <i className="icon-trash"/>
      </Button>
      <img onClick={e => {
            if (stream.state.type !== EAiDetectionState.IN_PROGRESS) {
                emitGeneratePreview();
                e.stopPropagation();
            }
        }} style={{ height: '100%' }} src={((_a = clips.find(clip => { var _a, _b; return ((_b = (_a = clip === null || clip === void 0 ? void 0 : clip.streamInfo) === null || _a === void 0 ? void 0 : _a[stream.id]) === null || _b === void 0 ? void 0 : _b.orderPosition) === 0; })) === null || _a === void 0 ? void 0 : _a.scrubSprite) ||
            ((_b = clips.find(clip => clip.scrubSprite)) === null || _b === void 0 ? void 0 : _b.scrubSprite)}/>
      <div className={styles.centeredOverlayItem}>
        <div onClick={e => {
            if (stream.state.type !== EAiDetectionState.IN_PROGRESS) {
                emitGeneratePreview();
                e.stopPropagation();
            }
        }}>
          {getThumbnailText(stream.state.type)}
        </div>
      </div>
    </div>);
}
export function RotatedClips({ clips }) {
    return (<div style={{ width: '74px', position: 'relative' }}>
      {clips.length > 0 ? (<div style={{ transform: 'translateX(-10px)' }}>
          <div className={styles.clipsAmount}>
            <span>{clips.length}</span>
            <span>clips</span>
          </div>
          {clips.slice(0, 3).map((clip, index) => (<div className={styles.thumbnailWrapperSmall} style={{
                    rotate: `${(index - 1) * 6}deg`,
                    scale: '1.2',
                    transform: `translate(${(index - 1) * 9}px, ${index === 1 ? 0 + 4 : 2 + 4}px)`,
                    zIndex: index === 1 ? 10 : 0,
                }} key={index}>
              <img style={{ height: '100%' }} src={clip.scrubSprite || ''}/>
            </div>))}
        </div>) : ('')}
    </div>);
}
export const PlayButton = () => (<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M31.3111 17.05L12.9395 4.36284C11.6534 3.45661 10 4.36284 10 5.8128V31.1872C10 32.6372 11.6534 33.5434 12.9395 32.6372L31.3111 19.95C32.2296 19.225 32.2296 17.775 31.3111 17.05" fill="white"/>
  </svg>);
export const PauseButton = () => (<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="7" y="5" width="10" height="28" rx="2" fill="white"/>
    <rect x="21" y="5" width="10" height="28" rx="2" fill="white"/>
  </svg>);
//# sourceMappingURL=StreamCard.jsx.map