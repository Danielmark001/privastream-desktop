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
import { FFMPEG_EXE, SCRUB_FRAMES, SCRUB_HEIGHT, SCRUB_WIDTH, } from '../constants';
import { FrameReadError } from './errors';
export class FrameSource {
    get nFrames() {
        return Math.round(this.trimmedDuration * this.options.fps);
    }
    get trimmedDuration() {
        return this.duration - this.startTrim - this.endTrim;
    }
    constructor(sourcePath, duration, startTrim, endTrim, options) {
        this.sourcePath = sourcePath;
        this.duration = duration;
        this.startTrim = startTrim;
        this.endTrim = endTrim;
        this.options = options;
        this.writeBuffer = Buffer.allocUnsafe(this.options.width * this.options.height * 4);
        this.readBuffer = Buffer.allocUnsafe(this.options.width * this.options.height * 4);
        this.byteIndex = 0;
        this.finished = false;
        this.error = false;
        this.currentFrame = 0;
    }
    exportScrubbingSprite(path) {
        return __awaiter(this, void 0, void 0, function* () {
            this.scrubJpg = path;
            const args = [
                '-i',
                this.sourcePath,
                '-vf',
                `scale=${SCRUB_WIDTH}:${SCRUB_HEIGHT},fps=${SCRUB_FRAMES / this.duration},tile=${SCRUB_FRAMES}x1`,
                '-frames:v',
                '1',
                '-y',
                this.scrubJpg,
            ];
            yield execa(FFMPEG_EXE, args);
        });
    }
    startFfmpeg() {
        var _a;
        const args = [
            '-ss',
            this.startTrim.toString(),
            '-i',
            this.sourcePath,
            '-t',
            (this.duration - this.startTrim - this.endTrim).toString(),
            '-vf',
            `fps=${this.options.fps},scale=${this.options.width}:${this.options.height}`,
            '-map',
            'v:0',
            '-vcodec',
            'rawvideo',
            '-pix_fmt',
            'rgba',
            '-f',
            'image2pipe',
            '-',
        ];
        this.ffmpeg = execa(FFMPEG_EXE, args, {
            encoding: null,
            buffer: false,
            stdin: 'ignore',
            stdout: 'pipe',
            stderr: process.stderr,
        });
        this.ffmpeg.on('exit', code => {
            console.debug(`Highlighter Frame Count: Expected: ${this.nFrames} Actual: ${this.currentFrame}`);
            this.finished = true;
            if (code)
                this.error = true;
            if (this.onFrameComplete)
                this.onFrameComplete(false);
        });
        (_a = this.ffmpeg.stdout) === null || _a === void 0 ? void 0 : _a.on('data', (chunk) => {
            this.handleChunk(chunk);
        });
        this.ffmpeg.catch(e => {
            if (e.signal === 'SIGTERM')
                return;
            console.error('ffmpeg:', e);
        });
    }
    readNextFrame() {
        return new Promise((resolve, reject) => {
            var _a;
            if (!this.ffmpeg)
                this.startFfmpeg();
            if (this.onFrameComplete) {
                console.log('Cannot read next frame while frame read is in progress');
                resolve(false);
                return;
            }
            if (this.error) {
                throw new FrameReadError(this.sourcePath);
            }
            if (this.finished) {
                resolve(false);
                return;
            }
            this.onFrameComplete = frameRead => {
                this.error ? reject(new FrameReadError(this.sourcePath)) : resolve(frameRead);
            };
            (_a = this.ffmpeg.stdout) === null || _a === void 0 ? void 0 : _a.resume();
        });
    }
    end() {
        if (this.ffmpeg)
            this.ffmpeg.kill();
    }
    handleChunk(chunk) {
        var _a;
        const frameByteSize = this.options.width * this.options.height * 4;
        const bytesToCopy = this.byteIndex + chunk.length > frameByteSize ? frameByteSize - this.byteIndex : chunk.length;
        chunk.copy(this.writeBuffer, this.byteIndex, 0, bytesToCopy);
        this.byteIndex += bytesToCopy;
        if (this.byteIndex >= frameByteSize) {
            (_a = this.ffmpeg.stdout) === null || _a === void 0 ? void 0 : _a.pause();
            this.swapBuffers();
            this.currentFrame++;
            if (this.onFrameComplete)
                this.onFrameComplete(true);
            this.onFrameComplete = null;
            const remainingBytes = chunk.length - bytesToCopy;
            if (remainingBytes > 0) {
                chunk.copy(this.writeBuffer, this.byteIndex, bytesToCopy);
                this.byteIndex += remainingBytes;
            }
        }
    }
    swapBuffers() {
        const newRead = this.writeBuffer;
        this.writeBuffer = this.readBuffer;
        this.readBuffer = newRead;
        this.byteIndex = 0;
    }
}
//# sourceMappingURL=frame-source.js.map