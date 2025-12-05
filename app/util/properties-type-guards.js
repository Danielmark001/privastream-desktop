export function isNumberProperty(property) {
    return property.type === 2 || property.type === 3;
}
export function isTextProperty(property) {
    return property.type === 4;
}
export function isPathProperty(property) {
    return property.type === 5;
}
export function isListProperty(property) {
    return property.type === 6;
}
export function isEditableListProperty(property) {
    return property.type === 10;
}
export function isBooleanProperty(property) {
    return property.type === 1;
}
export function isButtonProperty(property) {
    return property.type === 8;
}
export function isColorProperty(property) {
    return property.type === 7;
}
export function isFontProperty(property) {
    return property.type === 9;
}
export function isEmptyProperty(property) {
    switch (property.type) {
        case 1:
        case 8:
        case 7:
        case 9:
        case 0:
            return true;
    }
    return false;
}
export function assertIsDefined(val) {
    if (val === undefined || val === null) {
        throw new Error(`Expected 'val' to be defined, but received ${val}`);
    }
    return null;
}
export function getDefined(val) {
    assertIsDefined(val);
    return val;
}
//# sourceMappingURL=properties-type-guards.js.map