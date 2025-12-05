import Vue from 'vue';
export function createProps(propsClass) {
    const propsObj = {};
    const props = new propsClass();
    Object.keys(props).forEach((key) => {
        propsObj[key] = { default: props[key] };
    });
    return propsObj;
}
export function required() {
    return null;
}
export default class TsxComponent extends Vue {
    get props() {
        return this.$props;
    }
}
//# sourceMappingURL=tsx-component.js.map