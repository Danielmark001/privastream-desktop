import * as comps from './index';
const inputComponents = comps;
export function propertyComponentForType(type) {
    const componentName = Object.keys(inputComponents).find(name => {
        const componentObsType = inputComponents[name]['obsType'];
        return Array.isArray(componentObsType)
            ? componentObsType.includes(type)
            : componentObsType === type;
    });
    if (!componentName)
        console.warn('Component not found. Type:', type);
    return inputComponents[componentName];
}
//# sourceMappingURL=Components.js.map