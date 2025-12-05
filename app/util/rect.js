import { v2 } from './vec2';
export class Rect {
    constructor(options) {
        this.x = options.x;
        this.y = options.y;
        this.width = options.width;
        this.height = options.height;
    }
    getAspectRatio() {
        return this.width / this.height;
    }
    getPosition() {
        return v2(this.x, this.y);
    }
    setPosition(pos) {
        this.x = pos.x;
        this.y = pos.y;
    }
    getSize() {
        return v2(this.width, this.height);
    }
    getOriginFromOffset(offset) {
        return v2((offset.x - this.x) / this.width, (offset.y - this.y) / this.height);
    }
    getOffsetFromOrigin(origin) {
        return v2(this.x + this.width * origin.x, this.y + this.height * origin.y);
    }
}
//# sourceMappingURL=rect.js.map