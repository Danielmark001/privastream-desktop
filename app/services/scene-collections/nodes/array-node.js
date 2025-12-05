var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Node } from './node';
import compact from 'lodash/compact';
export class ArrayNode extends Node {
    save(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const values = yield Promise.all(this.getItems(context).map(item => {
                return this.saveItem(item, context);
            }));
            this.data = { items: compact(values) };
        });
    }
    load(context) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.beforeLoad(context);
            const afterLoadItemsCallbacks = [];
            if (!this.data.items)
                return;
            for (const item of this.data.items) {
                try {
                    afterLoadItemsCallbacks.push(yield this.loadItem(item, context));
                }
                catch (e) {
                    console.error('Array node step failed', e);
                }
            }
            for (const cb of afterLoadItemsCallbacks) {
                if (cb) {
                    try {
                        yield cb();
                    }
                    catch (e) {
                        console.error('Array node callback failed', e);
                    }
                }
            }
            yield this.afterLoad(context);
        });
    }
    beforeLoad(context) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    afterLoad(context) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}
//# sourceMappingURL=array-node.js.map