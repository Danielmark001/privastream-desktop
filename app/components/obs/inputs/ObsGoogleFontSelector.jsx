var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import * as fi from 'node-fontinfo';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from '../../../services/core/injector';
import { ObsInput } from './ObsInput';
import ObsFontSizeSelector from './ObsFontSizeSelector.vue';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { $t } from 'services/i18n';
import { formMetadata, metadata } from 'components/shared/inputs';
let GoogleFontSelector = class GoogleFontSelector extends ObsInput {
    constructor() {
        super(...arguments);
        this.fontFamilies = [];
        this.fontStyles = [];
        this.selectedFamily = '';
        this.selectedStyle = '';
        this.actualFamily = '';
        this.actualStyle = 0;
        this.isLoading = true;
    }
    created() {
        this.isLoading = true;
        this.fontLibraryService.getManifest().then(manifest => {
            this.isLoading = false;
            this.fontFamilies = manifest.families.map(family => ({
                title: family.name,
                value: family.name,
            }));
            if (this.value.path)
                this.updateSelectionFromPath();
        });
    }
    updateSelectionFromPath() {
        this.fontLibraryService.lookupFontInfo(this.value.path).then(info => {
            this.selectedFamily = info.family;
            this.selectedStyle = info.style;
            this.updateStyles();
        });
    }
    updateStyles() {
        if (this.selectedFamily) {
            this.fontLibraryService.findFamily(this.selectedFamily).then(fam => {
                this.fontStyles = fam.styles.map(sty => ({ title: sty.name, value: sty.name }));
            });
        }
    }
    setFamily(familyName) {
        this.isLoading = true;
        this.selectedFamily = familyName;
        this.fontLibraryService.findFamily(familyName).then(family => {
            const style = family.styles[0];
            this.updateStyles();
            this.setStyle(style.name);
        });
    }
    setStyle(styleName) {
        this.isLoading = true;
        this.selectedStyle = styleName;
        this.fontLibraryService.findStyle(this.selectedFamily, styleName).then(style => {
            this.fontLibraryService.downloadFont(style.file).then(fontPath => {
                const fontInfo = fi.getFontInfo(fontPath);
                if (!fontInfo) {
                    this.actualFamily = 'Arial';
                    this.actualStyle = 0;
                }
                else {
                    this.actualFamily = fontInfo.family_name;
                    this.actualStyle =
                        (fontInfo.italic ? 2 : 0) | (fontInfo.bold ? 1 : 0);
                }
                this.value.face = this.actualFamily;
                this.value.flags = this.actualStyle;
                this.emitInput(Object.assign(Object.assign({}, this.value), { path: fontPath }));
                this.isLoading = false;
            });
        });
    }
    setSize(size) {
        this.emitInput(Object.assign(Object.assign({}, this.value), { size }));
    }
    get metadata() {
        return formMetadata({
            fontFamily: metadata.list({
                title: $t('Font Family'),
                disabled: this.isLoading,
                options: this.fontFamilies,
                fullWidth: true,
            }),
            fontStyle: metadata.list({
                title: $t('Font Style'),
                disabled: this.isLoading,
                options: this.fontStyles,
                allowEmpty: false,
                fullWidth: true,
            }),
        });
    }
    render() {
        return (<div class="google-font-selector">
        <div>
          <HFormGroup value={this.selectedFamily} onInput={(family) => this.setFamily(family)} metadata={this.metadata.fontFamily}/>
          <HFormGroup value={this.selectedStyle} onInput={(style) => this.setStyle(style)} metadata={this.metadata.fontStyle}/>
          <ObsFontSizeSelector value={this.value.size} onInput={(size) => this.setSize(size)}/>
        </div>
      </div>);
    }
};
__decorate([
    Inject()
], GoogleFontSelector.prototype, "fontLibraryService", void 0);
__decorate([
    Inject()
], GoogleFontSelector.prototype, "sourcesService", void 0);
__decorate([
    Prop()
], GoogleFontSelector.prototype, "value", void 0);
GoogleFontSelector = __decorate([
    Component({})
], GoogleFontSelector);
export default GoogleFontSelector;
//# sourceMappingURL=ObsGoogleFontSelector.jsx.map