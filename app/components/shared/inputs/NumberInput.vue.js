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
import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
let NumberInput = class NumberInput extends BaseInput {
    constructor() {
        super(...arguments);
        this.defaultDisplayValue = this.options.min < 0 || this.options.min == null ? '0' : String(this.options.min);
        this.displayValue = this.value == null ? this.defaultDisplayValue : String(this.value);
    }
    emitInput(value) {
        const _super = Object.create(null, {
            emitInput: { get: () => super.emitInput }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let formattedValue = value;
            if (isNaN(Number(formattedValue)))
                formattedValue = '0';
            if (formattedValue !== value)
                this.displayValue = formattedValue;
            yield this.$nextTick();
            _super.emitInput.call(this, Number(formattedValue));
        });
    }
    updateValue(value) {
        const formattedValue = String(isNaN(parseInt(value, 10)) ? 0 : parseInt(value, 10));
        this.displayValue = value == null ? this.defaultDisplayValue : formattedValue;
        this.emitInput(formattedValue);
    }
    updateDecimal(value) {
        this.displayValue = value;
        this.emitInput(value);
    }
    handleBlur(event) {
        super.emitBlur(event);
    }
    handleInput(value) {
        this.displayValue = value;
        if (value === '-' || value === '')
            return;
        if (this.options.isInteger) {
            this.updateValue(value);
        }
        else {
            this.updateDecimal(value);
        }
    }
    increment() {
        this.adjust(1);
    }
    decrement() {
        this.adjust(-1);
    }
    adjust(val) {
        var _a, _b;
        if (this.options.disabled)
            return;
        const newVal = Number(this.displayValue) + val;
        const min = (_a = this.options.min) !== null && _a !== void 0 ? _a : -Infinity;
        const max = (_b = this.options.max) !== null && _b !== void 0 ? _b : Infinity;
        if (newVal < min || newVal > max)
            return;
        this.updateValue(String(newVal));
    }
    onMouseWheelHandler(event) {
        const canChange = (event.target !== this.$refs.input || this.$refs.input === document.activeElement) &&
            this.options.isInteger &&
            !this.options.disabled;
        if (!canChange)
            return;
        if (event.deltaY > 0)
            this.decrement();
        else
            this.increment();
        event.preventDefault();
    }
    getValidations() {
        return Object.assign(Object.assign({}, super.getValidations()), { max_value: this.options.max, min_value: this.options.min });
    }
};
__decorate([
    Prop()
], NumberInput.prototype, "value", void 0);
__decorate([
    Prop()
], NumberInput.prototype, "metadata", void 0);
__decorate([
    Prop()
], NumberInput.prototype, "title", void 0);
NumberInput = __decorate([
    Component({})
], NumberInput);
export default NumberInput;
//# sourceMappingURL=NumberInput.vue.js.map