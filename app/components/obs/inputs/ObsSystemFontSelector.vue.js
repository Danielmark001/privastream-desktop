var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import { ObsInput } from './ObsInput';
import { ListInput } from 'components/shared/inputs/inputs';
import ObsFontSizeSelector from './ObsFontSizeSelector.vue';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import fontManager from 'font-manager';
let ObsSystemFontSelector = class ObsSystemFontSelector extends ObsInput {
    constructor() {
        super(...arguments);
        this.fonts = [];
    }
    mounted() {
        fontManager.getAvailableFonts((fonts) => (this.fonts = fonts));
    }
    setFamily(family) {
        const regular = this.fonts.find(font => font.style === 'Regular' && font.family === family);
        const fontForStyle = regular || this.fonts.find(font => font.family === family);
        this.setFont({
            face: family,
            flags: this.getFlagsFromFont(fontForStyle),
            style: fontForStyle.style,
        });
    }
    getFlagsFromFont(font) {
        return ((font.italic ? 2 : 0) |
            (font.oblique ? 2 : 0) |
            (font.weight > 400 ? 1 : 0));
    }
    setStyle(style) {
        if (!this.value.value.style) {
            this.value.value.style = 'Regular';
        }
        const font = this.fonts.find(f => f.style === style && f.family === this.selectedFont.family);
        this.setFont({ flags: this.getFlagsFromFont(font), style: font.style });
    }
    setSize(size) {
        this.setFont({ size: Number(size) });
    }
    setFont(args) {
        if (args.size === this.value.value.size)
            return;
        const fontObj = Object.assign(Object.assign(Object.assign({}, this.value.value), args), { path: '' });
        this.emitInput(Object.assign(Object.assign({}, this.value), { value: fontObj }));
    }
    get selectedFont() {
        const { face, style } = this.value.value;
        return this.fonts.find(font => face === font.family && style === font.style);
    }
    get stylesForFamily() {
        return this.fonts
            .filter(font => font.family === this.value.value.face)
            .map(font => ({ value: font.style, title: font.style }));
    }
    get fontFamilies() {
        return this.fonts
            .filter((font, idx, self) => self.findIndex(f => f.family === font.family) === idx)
            .map(font => ({ value: font.family, title: font.family }));
    }
    get familyMetadata() {
        return {
            options: this.fontFamilies,
            allowEmpty: false,
            disabled: this.value.enabled === false || this.fonts.length === 0,
        };
    }
    familyOptionStyle(val) {
        return { fontFamily: val };
    }
    styleOptionStyle(val) {
        if (!this.selectedFont)
            return;
        const fontStyle = this.fonts.find(font => font.family === this.selectedFont.family && font.style === val);
        if (!fontStyle)
            return;
        return {
            fontFamily: this.selectedFont.family,
            fontStyle: fontStyle.italic ? 'italic' : 'regular',
            fontWeight: fontStyle.weight,
        };
    }
    get styleMetadata() {
        return {
            options: this.stylesForFamily,
            allowEmpty: false,
            disabled: this.value.enabled === false || this.fonts.length === 0,
        };
    }
};
__decorate([
    Prop()
], ObsSystemFontSelector.prototype, "value", void 0);
ObsSystemFontSelector = __decorate([
    Component({
        components: { ListInput, FontSizeSelector: ObsFontSizeSelector, HFormGroup },
    })
], ObsSystemFontSelector);
export default ObsSystemFontSelector;
//# sourceMappingURL=ObsSystemFontSelector.vue.js.map