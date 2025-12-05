var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import path from 'path';
import { AVAILABLE_TRANSITIONS, EExportStep, transitionParams, } from '../models/rendering.models';
import { AudioCrossfader } from './audio-crossfader';
import { AudioMixer } from './audio-mixer';
import { Transitioner } from './transitioner';
import { FrameWriter } from './frame-writer';
import { HighlighterError } from './errors';
import { $t } from '../../i18n';
import * as Sentry from '@sentry/browser';
import { sample } from 'lodash';
export function startRendering(renderingConfig, handleFrame, setExportInfo, recordAnalyticsEvent) {
    return __awaiter(this, void 0, void 0, function* () {
        const renderingClips = renderingConfig.renderingClips;
        const isPreview = renderingConfig.isPreview;
        const exportInfo = renderingConfig.exportInfo;
        const exportOptions = renderingConfig.exportOptions;
        const audioInfo = renderingConfig.audioInfo;
        const transitionDuration = renderingConfig.transitionDuration;
        const transition = renderingConfig.transition;
        const useAiHighlighter = renderingConfig.useAiHighlighter;
        const streamId = renderingConfig.streamId;
        let fader = null;
        let mixer = null;
        try {
            const totalFrames = renderingClips.reduce((count, clip) => {
                return count + clip.frameSource.nFrames;
            }, 0);
            const numTransitions = renderingClips.length - 1;
            const transitionFrames = transitionDuration * exportOptions.fps;
            const totalFramesAfterTransitions = totalFrames - numTransitions * transitionFrames;
            setExportInfo({
                totalFrames: totalFramesAfterTransitions,
            });
            let currentFrame = 0;
            yield Promise.all(renderingClips.filter(c => c.hasAudio).map(clip => clip.audioSource.extract()));
            const parsed = path.parse(exportInfo.file);
            const audioConcat = path.join(parsed.dir, `${parsed.name}-concat.flac`);
            let audioMix = path.join(parsed.dir, `${parsed.name}-mix.flac`);
            fader = new AudioCrossfader(audioConcat, renderingClips, transitionDuration);
            yield fader.export();
            if (audioInfo.musicEnabled && audioInfo.musicPath) {
                mixer = new AudioMixer(audioMix, [
                    { path: audioConcat, volume: 1, loop: false },
                    {
                        path: audioInfo.musicPath,
                        volume: Math.pow(10, -1 + audioInfo.musicVolume / 100),
                        loop: true,
                    },
                ]);
                yield mixer.export();
            }
            else {
                audioMix = audioConcat;
            }
            yield Promise.all(renderingClips.map(clip => clip.audioSource.cleanup()));
            const nClips = renderingClips.length;
            setExportInfo({ step: EExportStep.FrameRender });
            let fromClip = renderingClips.shift();
            let toClip = renderingClips.shift();
            let transitioner = null;
            const exportPath = isPreview ? exportInfo.previewFile : exportInfo.file;
            const writer = new FrameWriter(exportPath, audioMix, totalFramesAfterTransitions / exportOptions.fps, exportOptions);
            while (true) {
                if (exportInfo.cancelRequested) {
                    if (fromClip)
                        fromClip.frameSource.end();
                    if (toClip)
                        toClip.frameSource.end();
                    yield writer.end();
                    break;
                }
                const fromFrameRead = yield fromClip.frameSource.readNextFrame();
                if (!fromFrameRead && fromClip.frameSource.currentFrame < fromClip.frameSource.nFrames) {
                    console.debug('Padding with repeated frame');
                    fromClip.frameSource.currentFrame++;
                }
                const actualTransitionFrames = Math.min(transitionFrames, (fromClip.frameSource.trimmedDuration / 2) * exportOptions.fps, toClip ? (toClip.frameSource.trimmedDuration / 2) * exportOptions.fps : Infinity);
                const inTransition = fromClip.frameSource.currentFrame > fromClip.frameSource.nFrames - actualTransitionFrames;
                let frameToRender;
                if (inTransition && toClip && actualTransitionFrames !== 0) {
                    yield toClip.frameSource.readNextFrame();
                    if (!transitioner) {
                        if (transition.type === 'Random') {
                            const type = sample(AVAILABLE_TRANSITIONS.filter(t => !['None', 'Random'].includes(t.type))).type;
                            transitioner = new Transitioner(type, transitionParams[type], exportOptions);
                        }
                        else {
                            transitioner = new Transitioner(transition.type, transitionParams[transition.type], exportOptions);
                        }
                    }
                    transitioner.renderTransition(fromClip.frameSource.readBuffer, toClip.frameSource.readBuffer, (toClip.frameSource.currentFrame - 1) / actualTransitionFrames);
                    frameToRender = transitioner.getFrame();
                }
                else {
                    frameToRender = fromClip.frameSource.readBuffer;
                }
                if (frameToRender) {
                    yield writer.writeNextFrame(frameToRender);
                    currentFrame++;
                    handleFrame(currentFrame);
                }
                if (fromClip.frameSource.currentFrame === fromClip.frameSource.nFrames || !frameToRender) {
                    if (transition.type === 'Random')
                        transitioner = null;
                    fromClip.frameSource.end();
                    fromClip = toClip;
                    toClip = renderingClips.shift();
                }
                if (!fromClip) {
                    console.log('Out of sources, closing file');
                    yield writer.end();
                    console.debug(`Export complete - Expected Frames: ${exportInfo.totalFrames} Actual Frames: ${currentFrame}`);
                    recordAnalyticsEvent(useAiHighlighter ? 'AIHighlighter' : 'Highlighter', {
                        type: 'ExportComplete',
                        numClips: nClips,
                        totalClips: renderingClips.length,
                        transition: transition.type,
                        transitionDuration: transition.duration,
                        resolution: exportInfo.resolution,
                        fps: exportInfo.fps,
                        preset: exportInfo.preset,
                        duration: totalFramesAfterTransitions / exportOptions.fps,
                        isPreview,
                        streamId,
                    });
                    break;
                }
            }
        }
        catch (error) {
            console.error(error);
            Sentry.withScope(scope => {
                scope.setTag('feature', 'highlighter');
                console.error('Highlighter export error', error);
            });
            if (error instanceof HighlighterError) {
                setExportInfo({ error: error.userMessage });
                recordAnalyticsEvent(useAiHighlighter ? 'AIHighlighter' : 'Highlighter', {
                    type: 'ExportError',
                    error: error.constructor.name,
                });
            }
            else {
                setExportInfo({ error: $t('An error occurred while exporting the video') });
                recordAnalyticsEvent(useAiHighlighter ? 'AIHighlighter' : 'Highlighter', {
                    type: 'ExportError',
                    error: 'Unknown',
                });
            }
        }
        finally {
            setExportInfo({
                exporting: false,
                exported: !exportInfo.cancelRequested && !isPreview && !exportInfo.error,
            });
            if (fader)
                yield fader.cleanup();
            if (mixer)
                yield mixer.cleanup();
        }
    });
}
//# sourceMappingURL=start-rendering.js.map