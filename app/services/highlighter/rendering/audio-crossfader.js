var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import execa from 'execa';
import fs from 'fs';
import { FFMPEG_EXE } from '../constants';
import { AudioMixError } from './errors';
export class AudioCrossfader {
    constructor(outputPath, clips, transitionDuration) {
        this.outputPath = outputPath;
        this.clips = clips;
        this.transitionDuration = transitionDuration;
    }
    export() {
        return __awaiter(this, void 0, void 0, function* () {
            const inputArgs = this.clips.reduce((args, clip) => {
                if (clip.hasAudio) {
                    return [...args, '-i', clip.audioSource.outPath];
                }
                else {
                    return [
                        ...args,
                        '-f',
                        'lavfi',
                        '-t',
                        clip.frameSource.trimmedDuration.toString(),
                        '-i',
                        'anullsrc',
                    ];
                }
            }, []);
            const args = [...inputArgs];
            const filterGraph = this.getFilterGraph();
            if (filterGraph.length > 0) {
                args.push('-filter_complex', filterGraph);
            }
            args.push('-c:a', 'flac', '-y', this.outputPath);
            try {
                yield execa(FFMPEG_EXE, args);
            }
            catch (e) {
                console.error('Highlighter audio crossfade error', e);
                throw new AudioMixError();
            }
        });
    }
    getFilterGraph() {
        let inStream = '[0:a]';
        const filterGraph = this.clips
            .slice(0, -1)
            .map((clip, i) => {
            const outStream = `[concat${i}]`;
            const overlap = Math.min(this.transitionDuration, clip.frameSource.trimmedDuration / 2, this.clips[i + 1] ? this.clips[i + 1].frameSource.trimmedDuration / 2 : Infinity);
            let filter;
            if (overlap === 0) {
                filter = 'concat=v=0:a=1';
            }
            else {
                filter = `acrossfade=d=${overlap}:c1=tri:c2=tri`;
            }
            let ret = `${inStream}[${i + 1}:a]${filter}`;
            inStream = outStream;
            if (i < this.clips.length - 2)
                ret += outStream;
            return ret;
        })
            .join(',');
        return filterGraph;
    }
    cleanup() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => {
                fs.unlink(this.outputPath, e => {
                    if (e) {
                        console.log(e);
                        resolve();
                        return;
                    }
                    resolve();
                });
            });
        });
    }
}
//# sourceMappingURL=audio-crossfader.js.map