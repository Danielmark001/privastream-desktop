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
export class AudioMixer {
    constructor(outputPath, inputs) {
        this.outputPath = outputPath;
        this.inputs = inputs;
    }
    export() {
        return __awaiter(this, void 0, void 0, function* () {
            const inputArgs = this.inputs.reduce((args, input) => {
                return [...args, '-stream_loop', input.loop ? '-1' : '0', '-i', input.path];
            }, []);
            const args = [...inputArgs];
            const inputMap = this.inputs.map((_, index) => `[${index}:a]`).join('');
            const filterGraph = `${inputMap}amix=inputs=${this.inputs.length}:duration=first:weights=${this.inputs.map(i => i.volume).join(' ')}`;
            args.push('-filter_complex', filterGraph);
            args.push('-c:a', 'flac', '-y', this.outputPath);
            try {
                yield execa(FFMPEG_EXE, args);
            }
            catch (e) {
                console.error('Highlighter audio mix error', e);
                throw new AudioMixError();
            }
        });
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
//# sourceMappingURL=audio-mixer.js.map