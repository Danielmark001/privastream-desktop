var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import { debounce } from 'lodash-decorators';
import { ObsInput } from './ObsInput';
import Utils from '../../../services/utils';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { metadata } from 'components/shared/inputs';
let ObsColorInput = class ObsColorInput extends ObsInput {
    setValue(hex) {
        const rgba = this.hexToRGB(hex);
        if (!Object.keys(rgba).every((key) => rgba[key] === this.obsColor[key])) {
            const intColor = Utils.rgbaToInt(rgba.r, rgba.g, rgba.b, rgba.a);
            this.emitInput(Object.assign(Object.assign({}, this.value), { value: intColor }));
        }
    }
    mounted() {
        this.setValue(this.hexColor);
    }
    get hexColor() {
        const rgba = Utils.intToRgba(this.value.value);
        return `#${this.intTo2hexDigit(rgba.r) +
            this.intTo2hexDigit(rgba.g) +
            this.intTo2hexDigit(rgba.b) +
            this.intTo2hexDigit(rgba.a)}`;
    }
    get obsColor() {
        const rgba = Utils.intToRgba(this.value.value);
        return {
            r: rgba.r,
            g: rgba.g,
            b: rgba.b,
            a: rgba.a,
        };
    }
    intTo2hexDigit(int) {
        let result = int.toString(16);
        if (result.length === 1)
            result = `0${result}`;
        return result;
    }
    hexToRGB(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        let a = 255;
        if (hex[8]) {
            a = parseInt(hex.slice(7, 9), 16);
        }
        return { r, g, b, a };
    }
    get metadata() {
        return metadata.color({ title: this.value.description, fullWidth: true, includeAlpha: true });
    }
    render() {
        return (React.createElement(HFormGroup, { value: this.hexColor, onInput: (hex) => this.setValue(hex), metadata: this.metadata }));
    }
};
__decorate([
    Prop()
], ObsColorInput.prototype, "value", void 0);
__decorate([
    debounce(500)
], ObsColorInput.prototype, "setValue", null);
ObsColorInput = __decorate([
    Component({})
], ObsColorInput);
ObsColorInput.obsType = 'OBS_PROPERTY_COLOR';
export default ObsColorInput;
//# sourceMappingURL=ObsColorInput.js.map