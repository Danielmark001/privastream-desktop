import createTransition from './create-transition';
import transitions from 'gl-transitions';
import { Texture2D } from './texture-2d';
export class Transitioner {
    constructor(transitionType, params = {}, options) {
        this.transitionType = transitionType;
        this.params = params;
        this.options = options;
        this.canvas = document.createElement('canvas');
        this.gl = this.canvas.getContext('webgl');
        this.readBuffer = Buffer.allocUnsafe(this.options.width * this.options.height * 4);
        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.transitionSrc = transitions.find((t) => t.name === this.transitionType);
    }
    renderTransition(fromFrame, toFrame, progress) {
        const transition = createTransition(this.gl, this.transitionSrc);
        const fromTexture = new Texture2D(this.gl, this.options.width, this.options.height, fromFrame);
        const toTexture = new Texture2D(this.gl, this.options.width, this.options.height, toFrame);
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 4, 4, -1]), this.gl.STATIC_DRAW);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        transition.draw(progress, fromTexture, toTexture, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight, this.params);
        fromTexture.dispose();
        toTexture.dispose();
    }
    getFrame() {
        this.gl.readPixels(0, 0, this.options.width, this.options.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.readBuffer);
        return this.readBuffer;
    }
}
//# sourceMappingURL=transitioner.js.map