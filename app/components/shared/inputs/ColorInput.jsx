var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import cx from 'classnames';
import { Component, Prop } from 'vue-property-decorator';
import { Sketch } from 'vue-color';
import { BaseInput } from './BaseInput';
import styles from './ColorInput.m.less';
import { $t } from 'services/i18n';
import { Inject } from 'services';
import { loadColorPicker } from 'util/slow-imports';
import { OS, getOS } from 'util/operating-systems';
let ColorInput = class ColorInput extends BaseInput {
    constructor() {
        super(...arguments);
        this.pickerVisible = false;
    }
    togglePicker() {
        this.pickerVisible = !this.pickerVisible;
    }
    eyedrop(e) {
        return __awaiter(this, void 0, void 0, function* () {
            e.stopPropagation();
            const colorPicker = (yield loadColorPicker()).default;
            this.usageStatisticsService.recordFeatureUsage('screenColorPicker');
            colorPicker.startColorPicker((data) => {
                if (data.event === 'mouseClick') {
                    this.emitInput(`#${data.hex}`);
                }
            }, () => { }, { onMouseMoveEnabled: true, showPreview: true, showText: false, previewSize: 35 });
        });
    }
    get pickerBody() {
        return (<transition name="colorpicker-slide">
        {this.pickerVisible && (<div class={cx(styles.colorpickerContainer, {
                    [styles.hiddenAlpha]: !this.metadata.includeAlpha,
                })}>
            <Sketch value={{ hex: this.value }} onInput={(value) => this.emitInput(this.metadata.includeAlpha ? value.hex8 : value.hex)} class={styles.colorpickerMenu}/>
          </div>)}
      </transition>);
    }
    render() {
        return (<div data-role="input" data-type="color" data-name={this.options.name} class="input-wrapper" style={this.metadata.fullWidth && 'width: 100%'}>
        <div class={styles.colorpicker}>
          <div class={styles.colorpickerText} onClick={() => this.togglePicker()}>
            <input class={styles.colorpickerInput} name="colorpicker-input" type="text" readonly value={this.value}/>
            {getOS() === OS.Windows && (<i class="fas fa-eye-dropper" onClick={(e) => this.eyedrop(e)} vTooltip={{ content: $t('Pick Screen Color'), placement: 'bottom' }}/>)}
            <div class={styles.colorpickerSwatch} style={`background-color: ${this.value}`}/>
          </div>
          {this.pickerBody}
        </div>
      </div>);
    }
};
__decorate([
    Prop()
], ColorInput.prototype, "value", void 0);
__decorate([
    Prop({ default: () => ({}) })
], ColorInput.prototype, "metadata", void 0);
__decorate([
    Prop()
], ColorInput.prototype, "title", void 0);
__decorate([
    Inject()
], ColorInput.prototype, "usageStatisticsService", void 0);
ColorInput = __decorate([
    Component({})
], ColorInput);
export default ColorInput;
//# sourceMappingURL=ColorInput.jsx.map