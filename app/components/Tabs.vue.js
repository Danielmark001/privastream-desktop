var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import Scrollable from './shared/Scrollable';
let Tabs = class Tabs extends Vue {
    showTab(tab) {
        this.$emit('input', tab);
    }
    mounted() {
        if (!this.value)
            this.showTab(this.tabs[0].value);
    }
};
__decorate([
    Prop()
], Tabs.prototype, "tabs", void 0);
__decorate([
    Prop()
], Tabs.prototype, "value", void 0);
__decorate([
    Prop()
], Tabs.prototype, "className", void 0);
__decorate([
    Prop()
], Tabs.prototype, "hideContent", void 0);
Tabs = __decorate([
    Component({ components: { Scrollable } })
], Tabs);
export default Tabs;
//# sourceMappingURL=Tabs.vue.js.map