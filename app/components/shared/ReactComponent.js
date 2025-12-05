var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import TsxComponent, { createProps } from '../tsx-component';
import isEqual from 'lodash/isEqual';
const reactBuild = require('components-react');
const ReactDOM = require('react-dom');
const React = require('react');
import { Component, Prop, Watch } from 'vue-property-decorator';
class WrapperProps {
    constructor() {
        this.name = null;
        this.componentProps = null;
        this.wrapperStyles = null;
        this.mins = null;
    }
}
let ReactComponent = class ReactComponent extends TsxComponent {
    mounted() {
        const className = this.props.name;
        const componentClass = reactBuild.components[className];
        ReactDOM.render(React.createElement(componentClass, Object.assign(Object.assign({}, this.props.componentProps), { key: className }), null), this.$refs.container);
    }
    beforeDestroy() {
        ReactDOM.unmountComponentAtNode(this.$refs.container);
    }
    refreshReactComponent(componentProps, oldComponentProps) {
        const serializedProps = JSON.parse(JSON.stringify(componentProps));
        const serializedOldProps = JSON.parse(JSON.stringify(oldComponentProps));
        if (isEqual(serializedProps, serializedOldProps))
            return;
        ReactDOM.unmountComponentAtNode(this.$refs.container);
        const className = this.props.name;
        const componentClass = reactBuild.components[className];
        ReactDOM.render(React.createElement(componentClass, Object.assign(Object.assign({}, this.props.componentProps), { key: className }), null), this.$refs.container);
    }
    render() {
        return React.createElement("div", { class: "react", ref: "container", style: this.props.wrapperStyles });
    }
};
__decorate([
    Prop()
], ReactComponent.prototype, "mins", void 0);
__decorate([
    Watch('componentProps', { deep: true })
], ReactComponent.prototype, "refreshReactComponent", null);
ReactComponent = __decorate([
    Component({ props: createProps(WrapperProps) })
], ReactComponent);
export default ReactComponent;
//# sourceMappingURL=ReactComponent.js.map