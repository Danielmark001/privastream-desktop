var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs from 'fs-extra';
import execa from 'execa';
import { FFMPEG_EXE, FFPROBE_EXE } from './constants';
import path from 'path';
export function getVideoDuration(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const { stdout } = yield execa(FFPROBE_EXE, [
            '-v',
            'error',
            '-show_entries',
            'format=duration',
            '-of',
            'default=noprint_wrappers=1:nokey=1',
            filePath,
        ]);
        const duration = parseFloat(stdout);
        return duration;
    });
}
export function getVideoResolution(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const { stdout } = yield execa(FFPROBE_EXE, [
            '-v',
            'error',
            '-select_streams',
            'v:0',
            '-show_entries',
            'stream=width,height',
            '-of',
            'csv=s=x:p=0',
            filePath,
        ]);
        const [width, height] = stdout.split('x').map(Number);
        return { width, height };
    });
}
export function getVideoFramerateAndFrameCount(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const { stdout } = yield execa(FFPROBE_EXE, [
            '-v',
            'error',
            '-select_streams',
            'v:0',
            '-show_entries',
            'stream=r_frame_rate,nb_frames',
            '-of',
            'default=noprint_wrappers=1:nokey=1',
            filePath,
        ]);
        const lines = stdout.trim().split('\n');
        const rateLine = lines[0];
        const framesLine = lines[1];
        const [num, denom] = rateLine.split('/').map(Number);
        const framerate = denom ? num / denom : parseFloat(rateLine);
        const totalFrames = parseInt(framesLine, 10);
        return { framerate, totalFrames };
    });
}
export function cutHighlightClips(videoUri, highlighterData, streamInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        const id = streamInfo.id;
        const fallbackTitle = 'awesome-stream';
        const videoDir = path.dirname(videoUri);
        const sanitizedTitle = streamInfo.title
            ? streamInfo.title.replace(/[\\/:"*?<>|]+/g, ' ')
            : fallbackTitle;
        const truncatedTitle = sanitizedTitle.length > 50 ? sanitizedTitle.slice(0, 45) + '[...]' : sanitizedTitle;
        const folderName = `${truncatedTitle}-Clips-${id.slice(id.length - 4, id.length)}`;
        const outputDir = path.join(videoDir, folderName);
        try {
            try {
                yield fs.readdir(outputDir);
            }
            catch (error) {
                yield fs.mkdir(outputDir);
            }
        }
        catch (error) {
            console.error('Error creating file directory');
            return [];
        }
        const sortedHighlights = highlighterData.sort((a, b) => a.start_time - b.start_time);
        const results = [];
        const processedFiles = new Set();
        const duration = yield getVideoDuration(videoUri);
        const probeArgs = [
            '-v',
            'error',
            '-select_streams',
            'v:0',
            '-show_entries',
            'stream=codec_name,format=duration',
            '-of',
            'default=nokey=1:noprint_wrappers=1',
            videoUri,
        ];
        let codec = '';
        try {
            const codecResult = yield execa(FFPROBE_EXE, probeArgs);
            codec = codecResult.stdout.trim();
            console.log(`Codec for ${videoUri}: ${codec}`);
        }
        catch (error) {
            console.error(`Error checking codec for ${videoUri}:`, error);
        }
        console.time('export');
        const BATCH_SIZE = 1;
        const DEFAULT_START_TRIM = 10;
        const DEFAULT_END_TRIM = 10;
        for (let i = 0; i < sortedHighlights.length; i += BATCH_SIZE) {
            const highlightBatch = sortedHighlights.slice(i, i + BATCH_SIZE);
            const batchTasks = highlightBatch.map((highlight) => {
                return () => __awaiter(this, void 0, void 0, function* () {
                    const formattedStart = highlight.start_time.toString().padStart(6, '0');
                    const formattedEnd = highlight.end_time.toString().padStart(6, '0');
                    let outputFilename = `${truncatedTitle}-Clip-${formattedStart}-${formattedEnd}`;
                    const maxPathLength = 250;
                    const currentPathLength = outputDir.length + outputFilename.length + 5;
                    if (currentPathLength > maxPathLength) {
                        const excessLength = currentPathLength - maxPathLength;
                        outputFilename = outputFilename.slice(0, outputFilename.length - excessLength);
                    }
                    const outputUri = path.join(outputDir, `${outputFilename}.mp4`);
                    if (processedFiles.has(outputUri)) {
                        console.log('File already exists');
                        return null;
                    }
                    processedFiles.add(outputUri);
                    try {
                        yield fs.access(outputUri);
                        yield fs.unlink(outputUri);
                    }
                    catch (err) {
                        if (err.code !== 'ENOENT') {
                            console.error(`Error checking existence of ${outputUri}:`, err);
                        }
                    }
                    const newClipStartTime = Math.max(0, highlight.start_time - DEFAULT_START_TRIM);
                    const actualStartTrim = highlight.start_time - newClipStartTime;
                    const newClipEndTime = Math.min(duration, highlight.end_time + DEFAULT_END_TRIM);
                    const actualEndTrim = newClipEndTime - highlight.end_time;
                    const args = [
                        '-ss',
                        newClipStartTime.toString(),
                        '-to',
                        newClipEndTime.toString(),
                        '-i',
                        videoUri,
                        '-c:v',
                        codec === 'h264' ? 'copy' : 'libx264',
                        '-c:a',
                        'aac',
                        '-strict',
                        'experimental',
                        '-b:a',
                        '192k',
                        '-movflags',
                        'faststart',
                        outputUri,
                    ];
                    try {
                        const subprocess = execa(FFMPEG_EXE, args);
                        const timeoutDuration = 1000 * 60 * 5;
                        const timeoutId = setTimeout(() => {
                            console.warn(`FFMPEG process timed out for ${outputUri}`);
                            subprocess.kill('SIGTERM', { forceKillAfterTimeout: 2000 });
                        }, timeoutDuration);
                        try {
                            yield subprocess;
                            console.log(`Created segment: ${outputUri}`);
                            const newClipData = {
                                path: outputUri,
                                aiClipInfo: {
                                    inputs: highlight.inputs,
                                    score: highlight.score,
                                    metadata: highlight.metadata,
                                },
                                startTime: highlight.start_time,
                                endTime: highlight.end_time,
                                startTrim: actualStartTrim,
                                endTrim: actualEndTrim,
                            };
                            return newClipData;
                        }
                        catch (error) {
                            console.warn(`Error during FFMPEG execution for ${outputUri}:`, error);
                            return null;
                        }
                        finally {
                            clearTimeout(timeoutId);
                        }
                    }
                    catch (error) {
                        console.error(`Error creating segment: ${outputUri}`, error);
                        return null;
                    }
                });
            });
            const batchResults = yield Promise.allSettled(batchTasks.map(task => task()));
            results.push(...batchResults
                .filter((result) => result.status === 'fulfilled')
                .map(result => result.value)
                .filter(value => value !== null));
            const failedResults = batchResults.filter(result => result.status === 'rejected');
            if (failedResults.length > 0) {
                console.error('Failed exports:', failedResults);
            }
        }
        console.timeEnd('export');
        return results;
    });
}
//# sourceMappingURL=cut-highlight-clips.js.map