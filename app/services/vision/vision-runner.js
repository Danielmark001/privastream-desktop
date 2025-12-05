var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import { platform } from 'node:process';
import * as remote from '@electron/remote';
import http from 'http';
import Emittery from 'emittery';
import pMemoize from 'p-memoize';
export class VisionRunner extends Emittery {
    constructor() {
        super(...arguments);
        this.ensureStarted = pMemoize((...args_1) => __awaiter(this, [...args_1], void 0, function* ({ debugMode = false } = {}) {
            this.log('ensureStarted(): { debugMode=', debugMode, ' }');
            if (this.isRunning) {
                this.log('Already running');
                return {
                    pid: this.proc.pid,
                    port: this.port,
                };
            }
            return yield this.restart({ debugMode });
        }), { cache: false });
        this.stop = pMemoize(() => __awaiter(this, void 0, void 0, function* () {
            yield this.stopChild();
        }), { cache: false });
    }
    log(...args) {
        console.log('[VisionRunner]', ...args);
    }
    get isRunning() {
        return !!this.proc && this.proc.exitCode == null;
    }
    restart() {
        return __awaiter(this, arguments, void 0, function* ({ debugMode = false } = {}) {
            this.log('restart(): { debugMode=', debugMode, ' }');
            yield this.stopChild();
            const binaryPath = path.resolve(path.join(remote.app.getPath('userData'), '..', 'streamlabs-vision'), 'bin', 'vision.exe');
            const port = yield getFreePort();
            const args = ['--port', `${port}`];
            if (debugMode) {
                args.push('--debug');
            }
            const child = spawn(binaryPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
            this.proc = child;
            child.stdout.setEncoding('utf8');
            child.stderr.setEncoding('utf8');
            child.stdout.on('data', (data) => this.emit('stdout', data));
            child.stderr.on('data', (data) => this.emit('stderr', data));
            child.once('exit', (code, signal) => {
                this.proc = undefined;
                this.port = undefined;
                this.emit('exit', { code, signal });
            });
            this.port = port;
            return { pid: child.pid, port };
        });
    }
    stopChild() {
        return __awaiter(this, void 0, void 0, function* () {
            const proc = this.proc;
            if (!proc)
                return;
            try {
                if (platform === 'win32') {
                    proc.kill();
                }
                else {
                    proc.kill('SIGTERM');
                }
                yield Promise.race([once(proc, 'exit'), new Promise(res => setTimeout(res, 10000))]);
                if (!proc.killed) {
                    proc.kill('SIGKILL');
                }
            }
            catch (err) {
                this.log('Error stopping child process:', err);
            }
        });
    }
}
function getFreePort() {
    return new Promise(resolve => {
        const server = http.createServer();
        server.on('listening', () => {
            const port = server.address().port;
            server.close();
            server.unref();
            resolve(port);
        });
        server.listen();
    });
}
//# sourceMappingURL=vision-runner.js.map