var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import styles from './Modal.m.less';
let Modal = class Modal extends TsxComponent {
    render() {
        return (<div class={styles.wrapper}>
        <div class={styles.fader}></div>
        <div class={styles.content}>{this.$scopedSlots.default({})}</div>
      </div>);
    }
};
Modal = __decorate([
    Component({})
], Modal);
export default Modal;
//# sourceMappingURL=Modal.jsx.map