export class Texture2D {
    constructor(gl, width, height, data) {
        this.gl = gl;
        this.width = width;
        this.height = height;
        const texture = this.gl.createTexture();
        if (!texture)
            throw new Error('Failed to initialize WebGL texture!');
        this.texture = texture;
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.width, this.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, data);
    }
    get shape() {
        return [this.width, this.height];
    }
    bind(texUnit) {
        this.gl.activeTexture(this.gl.TEXTURE0 + texUnit);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        return this.gl.getParameter(this.gl.ACTIVE_TEXTURE) - this.gl.TEXTURE0;
    }
    dispose() {
        this.gl.deleteTexture(this.texture);
    }
}
//# sourceMappingURL=texture-2d.js.map