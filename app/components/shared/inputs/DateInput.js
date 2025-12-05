var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import Datepicker from 'vuejs-datepicker';
import * as locales from 'vuejs-datepicker/dist/locale';
import { Inject } from 'services/core';
import styles from './DateInput.m.less';
let DateInput = class DateInput extends BaseInput {
    constructor() {
        super(...arguments);
        this.locale = locales[this.i18nService.state.locale.split('-')[0]];
    }
    get date() {
        return this.value ? new Date(this.value) : null;
    }
    getOptions() {
        const options = super.getOptions();
        return Object.assign(Object.assign({}, options), { disablePastDates: false });
    }
    get disabledDates() {
        if (this.options.disablePastDates)
            return null;
        return { to: new Date(Date.now() - 1000 * 60 * 60 * 24) };
    }
    emitInput(val, ev) {
        if (!val) {
            super.emitInput(val, ev);
            return;
        }
        const date = new Date(val);
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        super.emitInput(date.valueOf(), ev);
    }
    render() {
        return (React.createElement("span", { "data-role": "input", "data-type": "date", "data-name": this.options.name, class: styles['date-input'] },
            React.createElement(Datepicker, { language: this.locale, value: this.date, disabledDates: this.disabledDates, onInput: (value, ev) => this.emitInput(value ? +value : null, ev) }),
            React.createElement("input", { type: "hidden", value: this.value, name: this.options.uuid, "v-validate": this.validate })));
    }
};
__decorate([
    Inject()
], DateInput.prototype, "i18nService", void 0);
__decorate([
    Prop()
], DateInput.prototype, "value", void 0);
__decorate([
    Prop({ default: () => ({}) })
], DateInput.prototype, "metadata", void 0);
__decorate([
    Prop()
], DateInput.prototype, "title", void 0);
DateInput = __decorate([
    Component({ components: { Datepicker } })
], DateInput);
export default DateInput;
//# sourceMappingURL=DateInput.js.map