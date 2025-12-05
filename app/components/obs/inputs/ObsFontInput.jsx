var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import { ObsInput } from './ObsInput';
import GoogleFontSelector from './ObsGoogleFontSelector';
import ObsSystemFontSelector from './ObsSystemFontSelector.vue';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { metadata } from 'components/shared/inputs';
import { $t } from 'services/i18n';
let ObsFontInput = class ObsFontInput extends ObsInput {
    constructor() {
        super(...arguments);
        this.isGoogleFont = !!this.value.value.path;
    }
    setFont(font) {
        this.emitInput(font);
    }
    setGoogleFont(font) {
        this.emitInput(Object.assign(Object.assign({}, this.value), { value: {
                path: font.path,
                face: font.face,
                flags: font.flags,
                size: Number(font.size),
            } }));
    }
    get googleFont() {
        return {
            path: this.value.value.path,
            face: this.value.value.face,
            flags: this.value.value.flags,
            size: this.value.value.size,
        };
    }
    setFontType(val) {
        this.isGoogleFont = val;
    }
    render() {
        return (<div>
        <HFormGroup value={this.isGoogleFont} onInput={(val) => this.setFontType(val)} metadata={metadata.bool({ title: $t('Use Google Font') })}/>
        {this.isGoogleFont && (<GoogleFontSelector value={this.googleFont} onInput={font => this.setGoogleFont(font)}/>)}
        {!this.isGoogleFont && (<ObsSystemFontSelector value={this.value} onInput={font => this.setFont(font)}/>)}
      </div>);
    }
};
__decorate([
    Prop()
], ObsFontInput.prototype, "value", void 0);
ObsFontInput = __decorate([
    Component({})
], ObsFontInput);
ObsFontInput.obsType = 'OBS_PROPERTY_FONT';
export default ObsFontInput;
//# sourceMappingURL=ObsFontInput.jsx.map