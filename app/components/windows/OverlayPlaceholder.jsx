var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import styles from './OverlayPlaceholder.m.less';
let OverlayPlaceholder = class OverlayPlaceholder extends TsxComponent {
    render() {
        return (<div class={styles.container}>
        <div class={styles.outline}>
          <h1 class={styles.title}>{this.title}</h1>
        </div>
      </div>);
    }
};
__decorate([
    Prop()
], OverlayPlaceholder.prototype, "title", void 0);
OverlayPlaceholder = __decorate([
    Component({})
], OverlayPlaceholder);
export default OverlayPlaceholder;
//# sourceMappingURL=OverlayPlaceholder.jsx.map