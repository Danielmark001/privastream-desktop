var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class Mutex {
    constructor() {
        this.locked = false;
        this.queue = [];
    }
    wait() {
        return new Promise(resolve => {
            if (this.locked) {
                this.queue.push(() => resolve(() => this.unlock()));
            }
            else {
                this.locked = true;
                resolve(() => this.unlock());
            }
        });
    }
    synchronize() {
        return __awaiter(this, void 0, void 0, function* () {
            const unlock = yield this.wait();
            unlock();
        });
    }
    do(fun) {
        return __awaiter(this, void 0, void 0, function* () {
            const unlock = yield this.wait();
            try {
                let val = fun();
                if (val instanceof Promise) {
                    val = yield val;
                }
                unlock();
                return val;
            }
            catch (e) {
                unlock();
                throw e;
            }
        });
    }
    unlock() {
        if (!this.locked)
            return;
        if (this.queue.length) {
            this.queue.shift()();
        }
        else {
            this.locked = false;
        }
    }
}
//# sourceMappingURL=mutex.js.map