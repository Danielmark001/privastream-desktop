var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { debounce } from 'lodash-decorators';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { Slider } from 'streamlabs-beaker';
import { Inject } from 'services/core/injector';
import { isString } from 'util';
let SliderInput = class SliderInput extends BaseInput {
    constructor() {
        super(...arguments);
        this.usePercentages = this.options.usePercentages || false;
        this.localValue = this.initializeLocalValue();
        this.timeout = null;
        this.theme = 'night-theme';
    }
    syncLocalValue(newVal) {
        this.localValue = this.usePercentages ? newVal * 100 : newVal;
    }
    mounted() {
        this.unbind = this.customizationService.state.bindProps(this, {
            theme: 'theme',
        });
    }
    destroyed() {
        this.unbind();
    }
    updateLocalValue(value) {
        if (this.timeout)
            this.timeout = window.clearTimeout(this.timeout);
        const parsedValue = Number(value);
        if ((isNaN(parsedValue) && isString(value)) || (isString(value) && value === '')) {
            this.localValue = value.trim() !== '-' ? '' : value;
        }
        else if (parsedValue < this.min) {
            this.timeout = window.setTimeout(() => this.updateLocalValue(this.min), 500);
        }
        else if (parsedValue > this.max) {
            this.localValue = this.max;
            this.updateValue(this.max);
        }
        else if (value != null && !isNaN(parsedValue) && this.localValue !== parsedValue) {
            this.localValue = parsedValue;
            this.updateValue(parsedValue);
        }
    }
    initializeLocalValue() {
        if (this.value == null)
            return this.min || 0;
        return this.options.usePercentages ? this.value * 100 : this.value;
    }
    get interval() {
        return this.options.usePercentages
            ? this.options.interval * 100 || 1
            : this.options.interval || 1;
    }
    get min() {
        return this.usePercentages ? this.options.min * 100 : this.options.min;
    }
    get max() {
        return this.usePercentages ? this.options.max * 100 : this.options.max;
    }
    updateValue(value) {
        if (isNaN(Number(value))) {
            this.emitInput(value);
        }
        else {
            this.emitInput(this.roundNumber(value));
        }
    }
    get sliderColor() {
        return {
            'night-theme': '#253239',
            'day-theme': '#eaecee',
        };
    }
    handleKeydown(event) {
        if (event.code === 'ArrowUp')
            this.updateValue(this.value + this.interval);
        if (event.code === 'ArrowDown')
            this.updateValue(this.value - this.interval);
    }
    roundNumber(num) {
        const val = this.usePercentages ? num / 100 : num;
        return parseFloat(val.toFixed(6));
    }
};
__decorate([
    Inject()
], SliderInput.prototype, "customizationService", void 0);
__decorate([
    Prop()
], SliderInput.prototype, "value", void 0);
__decorate([
    Watch('value')
], SliderInput.prototype, "syncLocalValue", null);
__decorate([
    Prop()
], SliderInput.prototype, "title", void 0);
__decorate([
    Prop()
], SliderInput.prototype, "metadata", void 0);
__decorate([
    debounce(100)
], SliderInput.prototype, "updateValue", null);
SliderInput = __decorate([
    Component({
        components: { Slider },
    })
], SliderInput);
export default SliderInput;
//# sourceMappingURL=SliderInput.vue.js.map