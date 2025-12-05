import React from 'react';
import { InputComponent } from './inputs';
import InputWrapper from './InputWrapper';
import { CheckboxInput } from './CheckboxInput';
export const CheckboxGroup = InputComponent((p) => {
    return (React.createElement(InputWrapper, { label: p.label, rules: p.rules, name: p.name }, Object.keys(p.children).map(inputKey => {
        const meta = p.children[inputKey];
        return (React.createElement(React.Fragment, { key: inputKey },
            React.createElement(CheckboxInput, Object.assign({}, meta, { onChange: p.onChange(inputKey), value: p.values[inputKey], "data-name": inputKey, "data-value": p.values[inputKey], "data-role": "input" }))));
    })));
});
//# sourceMappingURL=CheckboxGroup.js.map