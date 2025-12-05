var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { exec } from 'child_process';
import { AvatarUpdater } from './avatar-updater';
import { Service } from 'services/core';
import path from 'path';
import { promises as fs } from 'fs';
export class StreamAvatarService extends Service {
    init() {
        this.avatarUpdater = new AvatarUpdater();
    }
    isAvatarUpdateAvailable() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.avatarUpdater.isNewVersionAvailable();
        });
    }
    updateAvatar(progressCb, handler) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.avatarUpdater.update(progressCb, handler);
        });
    }
    attachOutputHandler(proc, handler) {
        if (!handler) {
            return;
        }
        if (proc.stdout) {
            proc.stdout.on('data', (data) => {
                handler('stdout', data.toString());
            });
        }
        if (proc.stderr) {
            proc.stderr.on('data', (data) => {
                handler('stderr', data.toString());
            });
        }
        return proc;
    }
    startAvatarProcess(renderOffscreen, handler) {
        if (this.avatarProc && this.avatarProc.exitCode != null) {
            this.avatarProc.kill();
        }
        this.avatarProc = this.avatarUpdater.startAvatarProcess(renderOffscreen);
        this.attachOutputHandler(this.avatarProc, handler);
    }
    stopAvatarProcess() {
        if (this.avatarProc) {
            exec(`taskkill /pid ${this.avatarProc.pid} /T /F`);
        }
    }
    getAssets() {
        return __awaiter(this, void 0, void 0, function* () {
            const assetsPath = path.join(AvatarUpdater.basepath, 'StreamlabsAIAvatar/Assets');
            const files = [];
            const walk = (dir) => __awaiter(this, void 0, void 0, function* () {
                const dirents = yield fs.readdir(dir, { withFileTypes: true });
                for (const dirent of dirents) {
                    const res = path.join(dir, dirent.name);
                    if (dirent.isDirectory()) {
                        yield walk(res);
                    }
                    else if (dirent.isFile() && path.extname(dirent.name).toLowerCase() === '.webm') {
                        files.push(res);
                    }
                }
            });
            yield walk(assetsPath);
            return files;
        });
    }
}
//# sourceMappingURL=stream-avatar-service.js.map