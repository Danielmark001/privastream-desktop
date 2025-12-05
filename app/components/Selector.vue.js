var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import draggable from 'vuedraggable';
import Scrollable from 'components/shared/Scrollable';
let Selector = class Selector extends Vue {
    constructor() {
        super(...arguments);
        this.draggableSelector = this.draggable ? '.selector-item' : 'none';
    }
    handleChange(change) {
        const order = this.normalizedItems.map(item => item.value);
        this.$emit('sort', { change, order });
    }
    handleSelect(ev, index) {
        const value = this.normalizedItems[index].value;
        this.$emit('select', value, ev);
    }
    handleContextMenu(ev, index) {
        if (index !== void 0) {
            const value = this.normalizedItems[index].value;
            this.handleSelect(ev, index);
            this.$emit('contextmenu', value);
            return;
        }
        this.$emit('contextmenu');
    }
    handleDoubleClick(ev, index) {
        const value = this.normalizedItems[index].value;
        this.handleSelect(ev, index);
        this.$emit('dblclick', value);
    }
    get normalizedItems() {
        return this.items.map(item => {
            if (typeof item === 'string') {
                return { name: item, value: item };
            }
            return item;
        });
    }
};
__decorate([
    Prop()
], Selector.prototype, "items", void 0);
__decorate([
    Prop()
], Selector.prototype, "activeItems", void 0);
__decorate([
    Prop({ default: true })
], Selector.prototype, "draggable", void 0);
Selector = __decorate([
    Component({
        components: { draggable, Scrollable },
    })
], Selector);
export default Selector;
//# sourceMappingURL=Selector.vue.js.map