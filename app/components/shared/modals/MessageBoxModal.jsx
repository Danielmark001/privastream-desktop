var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import styles from './MessageBoxModal.m.less';
import { WindowsService } from 'services/windows';
let MessageBoxModal = class MessageBoxModal extends TsxComponent {
    onCloseClickHandler() {
        WindowsService.hideModal();
    }
    render() {
        return (<div class={styles.wrapper}>
        <div class={styles.header}>
          <i class="icon-close" onclick={() => this.onCloseClickHandler()}/>
        </div>
        <div class={styles.contentWrapper}>
          <div class={styles.content}>{this.$scopedSlots['default'](null)}</div>
        </div>
      </div>);
    }
};
MessageBoxModal = __decorate([
    Component({})
], MessageBoxModal);
export default MessageBoxModal;
//# sourceMappingURL=MessageBoxModal.jsx.map