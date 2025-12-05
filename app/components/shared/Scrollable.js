var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue';
import TsxComponent, { createProps } from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
class ScrollableProps {
    constructor() {
        this.className = '';
        this.isResizable = true;
        this.horizontal = false;
        this.autoSizeCapable = false;
    }
}
let Scrollable = class Scrollable extends TsxComponent {
    render() {
        return (React.createElement(OverlayScrollbarsComponent, { options: {
                autoUpdate: true,
                autoUpdateInterval: 200,
                className: this.props.className,
                resize: this.props.isResizable ? 'both' : 'none',
                sizeAutoCapable: this.props.autoSizeCapable,
                scrollbars: { clickScrolling: true },
                overflowBehavior: { x: this.props.horizontal ? 'scroll' : 'hidden' },
            } }, this.$slots.default));
    }
};
Scrollable = __decorate([
    Component({ props: createProps(ScrollableProps) })
], Scrollable);
export default Scrollable;
//# sourceMappingURL=Scrollable.js.map