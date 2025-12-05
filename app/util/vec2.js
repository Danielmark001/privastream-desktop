import { Vector2 } from '../../vendor/threejs/vector2';
export class Vec2 extends Vector2 {
    constructor(...args) {
        if (args.length === 0) {
            super(0, 0);
            return;
        }
        if (typeof args[0] === 'number') {
            super(args[0], args[1]);
        }
        else {
            super(args[0].x, args[0].y);
        }
        return new Proxy(this, {
            get: (target, propName) => {
                if (typeof target[propName] !== 'function' || !Vector2.prototype[propName]) {
                    return target[propName];
                }
                return (...args) => {
                    const result = new Vector2(target.x, target.y)[propName](...args);
                    if (result instanceof Vector2)
                        return new Vec2(result);
                    return result;
                };
            },
        });
    }
}
export function v2(...args) {
    return new Vec2(...args);
}
//# sourceMappingURL=vec2.js.map