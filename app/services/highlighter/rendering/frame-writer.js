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
import { FADE_OUT_DURATION, FFMPEG_EXE } from '../constants';
import { FrameWriteError } from './errors';
export class FrameWriter {
    constructor(outputPath, audioInput, duration, options) {
        this.outputPath = outputPath;
        this.audioInput = audioInput;
        this.duration = duration;
        this.options = options;
    }
    startFfmpeg() {
        var _a;
        const args = [
            '-f',
            'rawvideo',
            '-vcodec',
            'rawvideo',
            '-pix_fmt',
            'rgba',
            '-s',
            `${this.options.width}x${this.options.height}`,
            '-r',
            `${this.options.fps}`,
            '-i',
            '-',
            '-i',
            this.audioInput,
            '-map',
            '0:v:0',
            '-map',
            '1:a:0',
            '-af',
            `afade=type=out:duration=${FADE_OUT_DURATION}:start_time=${Math.max(this.duration - (FADE_OUT_DURATION + 0.2), 0)}`,
        ];
        this.addVideoFilters(args);
        const crf = this.options.preset === 'slow' ? '18' : '21';
        args.push(...[
            '-vcodec',
            'libx264',
            '-profile:v',
            'high',
            '-preset:v',
            this.options.preset,
            '-crf',
            `${crf}`,
            '-movflags',
            'faststart',
            '-acodec',
            'aac',
            '-b:a',
            '128k',
            '-y',
            this.outputPath,
        ]);
        this.ffmpeg = execa(FFMPEG_EXE, args, {
            encoding: null,
            buffer: false,
            stdin: 'pipe',
            stdout: process.stdout,
            stderr: 'pipe',
        });
        this.exitPromise = new Promise(resolve => {
            this.ffmpeg.on('exit', code => {
                console.log('ffmpeg writer exited with code', code);
                resolve();
            });
        });
        this.ffmpeg.catch(e => {
            console.log('ffmpeg:', e);
        });
        (_a = this.ffmpeg.stderr) === null || _a === void 0 ? void 0 : _a.on('data', (data) => {
            console.log('ffmpeg:', data.toString());
        });
    }
    addVideoFilters(args) {
        const fadeFilter = `format=yuv420p,fade=type=out:duration=${FADE_OUT_DURATION}:start_time=${Math.max(this.duration - (FADE_OUT_DURATION + 0.2), 0)}`;
        if (this.options.complexFilter) {
            args.push('-vf', this.options.complexFilter + `[final]${fadeFilter}`);
        }
        else {
            args.push('-vf', fadeFilter);
        }
    }
    writeNextFrame(frameBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.ffmpeg)
                this.startFfmpeg();
            try {
                yield new Promise((resolve, reject) => {
                    var _a;
                    (_a = this.ffmpeg.stdin) === null || _a === void 0 ? void 0 : _a.write(frameBuffer, e => {
                        if (e) {
                            reject();
                            return;
                        }
                        resolve();
                    });
                });
            }
            catch (e) {
                throw new FrameWriteError();
            }
        });
    }
    end() {
        var _a, _b;
        (_b = (_a = this.ffmpeg) === null || _a === void 0 ? void 0 : _a.stdin) === null || _b === void 0 ? void 0 : _b.end();
        return this.exitPromise;
    }
}
//# sourceMappingURL=frame-writer.js.map