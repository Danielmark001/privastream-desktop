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
import { FrameSource } from './frame-source';
import { AudioSource } from './audio-source';
import { FFPROBE_EXE, SCRUB_SPRITE_DIRECTORY } from '../constants';
import fs from 'fs';
import path from 'path';
export class RenderingClip {
    constructor(sourcePath) {
        this.sourcePath = sourcePath;
        this.hasAudio = null;
        this.deleted = false;
    }
    init() {
        if (!this.initPromise) {
            this.initPromise = new Promise((resolve, reject) => {
                this.doInit().then(resolve).catch(reject);
            });
        }
        return this.initPromise;
    }
    reset(options) {
        return __awaiter(this, void 0, void 0, function* () {
            this.deleted = !(yield this.fileExists(this.sourcePath));
            if (this.deleted)
                return;
            if (!this.duration)
                yield this.readDuration();
            if (this.hasAudio == null)
                yield this.readAudio();
            this.frameSource = new FrameSource(this.sourcePath, this.duration, this.startTrim, this.endTrim, options);
            this.audioSource = new AudioSource(this.sourcePath, this.duration, this.startTrim, this.endTrim);
        });
    }
    fileExists(file) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => {
                fs.access(file, fs.constants.R_OK, e => {
                    if (e) {
                        resolve(false);
                    }
                    else {
                        resolve(true);
                    }
                });
            });
        });
    }
    doInit() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.reset({ fps: 30, width: 1280, height: 720, preset: 'ultrafast' });
            if (this.deleted)
                return;
            if (this.frameSource) {
                try {
                    const parsed = path.parse(this.sourcePath);
                    const scrubPath = path.join(SCRUB_SPRITE_DIRECTORY, `${parsed.name}-scrub.jpg`);
                    const scrubFileExists = yield this.fileExists(scrubPath);
                    if (scrubFileExists) {
                        this.frameSource.scrubJpg = scrubPath;
                    }
                    else {
                        yield this.frameSource.exportScrubbingSprite(scrubPath);
                    }
                }
                catch (error) {
                    console.log('err', error);
                }
            }
            else {
                console.log('No Framesource');
            }
        });
    }
    readDuration() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.duration)
                return;
            const { stdout } = yield execa(FFPROBE_EXE, [
                '-v',
                'error',
                '-show_entries',
                'format=duration',
                '-of',
                'default=noprint_wrappers=1:nokey=1',
                this.sourcePath,
            ]);
            this.duration = parseFloat(stdout);
        });
    }
    readAudio() {
        return __awaiter(this, void 0, void 0, function* () {
            const { stdout } = yield execa(FFPROBE_EXE, [
                '-v',
                'error',
                '-show_streams',
                '-select_streams',
                'a',
                '-of',
                'default=noprint_wrappers=1:nokey=1',
                this.sourcePath,
            ]);
            this.hasAudio = stdout.length > 0;
        });
    }
}
//# sourceMappingURL=rendering-clip.js.map