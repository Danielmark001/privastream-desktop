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
import fs from 'fs';
import execa from 'execa';
import { FFMPEG_EXE } from '../constants';
import { AudioReadError } from './errors';
export class AudioSource {
    constructor(sourcePath, duration, startTrim, endTrim) {
        this.sourcePath = sourcePath;
        this.duration = duration;
        this.startTrim = startTrim;
        this.endTrim = endTrim;
        const parsed = path.parse(this.sourcePath);
        this.outPath = path.join(parsed.dir, `${parsed.name}-audio.flac`);
    }
    extract() {
        return __awaiter(this, void 0, void 0, function* () {
            const args = [
                '-ss',
                this.startTrim.toString(),
                '-i',
                this.sourcePath,
                '-t',
                (this.duration - this.startTrim - this.endTrim).toString(),
                '-sample_fmt',
                's32',
                '-ar',
                '48000',
                '-map',
                'a:0',
                '-c:a',
                'flac',
                '-filter:a',
                'apad',
                '-y',
                this.outPath,
            ];
            try {
                yield execa(FFMPEG_EXE, args);
            }
            catch (e) {
                console.error('Highlighter audio export error', e);
                throw new AudioReadError(this.sourcePath);
            }
        });
    }
    cleanup() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => {
                fs.unlink(this.outPath, e => {
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
//# sourceMappingURL=audio-source.js.map