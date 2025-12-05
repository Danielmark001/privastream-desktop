export const metadata = {
    any: (options) => options,
    text: (options) => (Object.assign(Object.assign({}, options), { type: 'text' })),
    textarea: (options) => (Object.assign(Object.assign({}, options), { type: 'textarea' })),
    number: (options) => (Object.assign(Object.assign({}, options), { type: 'number' })),
    slider: (options) => (Object.assign(Object.assign({}, options), { type: 'slider' })),
    bool: (options) => (Object.assign(Object.assign({}, options), { type: 'checkbox' })),
    switch: (options) => (Object.assign(Object.assign({}, options), { type: 'switch' })),
    list: (options) => (Object.assign(Object.assign({}, options), { type: 'list' })),
    color: (options) => (Object.assign(Object.assign({}, options), { type: 'color' })),
    fontSize: (options) => (Object.assign(Object.assign({ min: 8, max: 80, step: 1 }, options), { type: 'slider' })),
    autocomplete: (options) => (Object.assign(Object.assign({}, options), { type: 'autocomplete' })),
    seconds: (options) => (Object.assign(Object.assign({ min: 0, step: 1000, tipFormatter: (ms) => `${ms / 1000}s` }, options), { type: 'slider' })),
    file: (options) => (Object.assign(Object.assign({}, options), { type: 'file' })),
    radio: (options) => (Object.assign(Object.assign({}, options), { type: 'radio' })),
};
//# sourceMappingURL=metadata.js.map