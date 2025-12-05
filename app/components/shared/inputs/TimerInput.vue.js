var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import Scrollable from 'components/shared/Scrollable';
let TimerInput = class TimerInput extends BaseInput {
    constructor() {
        super(...arguments);
        this.holdTimeout = null;
        this.holdInterval = null;
        this.hour = 3600;
        this.minute = 60;
        this.second = 1;
        this.showTimerDropdown = false;
        this.max = this.metadata.max || 3600;
        this.min = this.metadata.min || 0;
        this.format = this.metadata.format || 'ms';
        this.hasHours = /h/.test(this.format);
        this.hasSeconds = /s/.test(this.format);
    }
    get hours() {
        return this.generateTime(this.max / 3600);
    }
    get minutes() {
        return this.generateTime(60);
    }
    get seconds() {
        return this.generateTime(60);
    }
    hideTimerDropdown() {
        this.showTimerDropdown = false;
    }
    generateTime(time) {
        const times = [];
        for (let num = 0; num < time; num++) {
            const fill = num > 9 ? '' : '0';
            times.push(fill + num);
        }
        return times;
    }
    isActiveHour(hour) {
        const currentHour = Math.floor(this.value / 3600);
        return hour === currentHour;
    }
    isActiveMinute(minute) {
        const currentMinute = Math.floor((this.value % 3600) / 60);
        return minute === currentMinute;
    }
    isActiveSecond(second) {
        const currentSecond = Math.floor(((this.value % 3600) % 60) / 60);
        return second === currentSecond;
    }
    setHour(val) {
        const currentMinsInSecs = Math.floor(this.value % 3600);
        const hour = parseInt(val, 10) * 3600;
        this.updateValue(currentMinsInSecs + hour);
    }
    setMinute(val) {
        const currentHrsInSecs = Math.floor(this.value / 3600) * 3600;
        const minute = parseInt(val, 10) * 60;
        this.updateValue(currentHrsInSecs + minute);
    }
    setSecond(val) {
        const currentMinsInSecs = Math.floor((this.value % 3600) / 60) * 60;
        this.updateValue(currentMinsInSecs + parseInt(val, 10));
    }
    updateValue(value) {
        this.emitInput(value);
    }
    getHours(seconds) {
        const hour = Math.floor(seconds / 3600);
        return `${hour < 10 ? '0' : ''}${hour}`;
    }
    getMinutes(seconds) {
        const min = Math.floor((seconds % 3600) / 60);
        return `${min < 10 ? '0' : ''}${min}`;
    }
    getSeconds(seconds) {
        const sec = Math.floor((seconds % 3600) % 60);
        return `${sec < 10 ? '0' : ''}${sec}`;
    }
    increment(unitInSeconds) {
        const val = this.value + unitInSeconds <= this.max ? this.value + unitInSeconds : this.max;
        this.updateValue(val);
    }
    decrement(unitInSeconds) {
        const bot = this.min >= 0 && this.min < this.max ? this.min : 0;
        const val = this.value - unitInSeconds >= bot ? this.value - unitInSeconds : bot;
        this.updateValue(val);
    }
    beginHold(callback, param) {
        callback(param);
        this.holdTimeout = window.setTimeout(() => {
            this.holdInterval = window.setInterval(() => {
                callback(param);
            }, 100);
        }, 500);
    }
    releaseHold() {
        if (this.holdTimeout !== null) {
            clearTimeout(this.holdTimeout);
            this.holdTimeout = null;
        }
        if (this.holdInterval !== null) {
            clearInterval(this.holdInterval);
            this.holdInterval = null;
        }
    }
};
__decorate([
    Prop()
], TimerInput.prototype, "value", void 0);
__decorate([
    Prop()
], TimerInput.prototype, "title", void 0);
__decorate([
    Prop()
], TimerInput.prototype, "metadata", void 0);
TimerInput = __decorate([
    Component({ components: { Scrollable } })
], TimerInput);
export default TimerInput;
//# sourceMappingURL=TimerInput.vue.js.map