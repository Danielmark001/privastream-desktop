import { useWidget } from './useWidget';
import Form from '../../shared/inputs/Form';
import { ColorInput, ListInput, MediaUrlInput, AudioUrlInput, SliderInput, TextInput, } from '../../shared/inputs';
import React from 'react';
import { Button, Collapse } from 'antd';
import { $t } from '../../../services/i18n';
import InputWrapper from '../../shared/inputs/InputWrapper';
import { assertIsDefined } from '../../../util/properties-type-guards';
export function CustomFieldsSection() {
    const { openCustomCodeEditor } = useWidget();
    return (React.createElement(Collapse, { bordered: false },
        React.createElement(Collapse.Panel, { header: $t('Custom Fields'), key: 1 },
            React.createElement(CustomFields, null),
            React.createElement(InputWrapper, null,
                React.createElement(Button, { onClick: openCustomCodeEditor }, "Add or Remove Fields")))));
}
export function CustomFields() {
    const { customCode, updateCustomCode } = useWidget();
    assertIsDefined(customCode);
    const json = customCode.custom_json || {};
    function onFieldChange(fieldName, value) {
        const newFieldProps = Object.assign(Object.assign({}, json[fieldName]), { value });
        updateCustomCode({ custom_json: Object.assign(Object.assign({}, json), { [fieldName]: newFieldProps }) });
    }
    const fieldsProps = Object.keys(json).map(name => (Object.assign(Object.assign({ name }, json[name]), { onChange: (value) => {
            onFieldChange(name, value);
        } })));
    return (React.createElement(Form, { layout: "horizontal" }, fieldsProps.map(props => (React.createElement(CustomField, Object.assign({}, props, { key: props.name }))))));
}
function CustomField(p) {
    const commonProps = { name: p.name, label: p.label, value: p.value, onChange: p.onChange };
    switch (p.type) {
        case 'colorpicker':
            return React.createElement(ColorInput, Object.assign({}, commonProps));
        case 'slider':
            return React.createElement(SliderInput, Object.assign({}, commonProps, { min: p.min, max: p.max, step: p.steps, debounce: 500 }));
        case 'textfield':
            return React.createElement(TextInput, Object.assign({}, commonProps));
        case 'dropdown':
            return (React.createElement(ListInput, Object.assign({}, commonProps, { options: Object.keys(p.options).map(key => ({ value: key, label: p.options[key] })) })));
        case 'sound-input':
            return React.createElement(AudioUrlInput, Object.assign({}, commonProps));
        case 'image-input':
            return React.createElement(MediaUrlInput, Object.assign({}, commonProps));
        default:
            return React.createElement(React.Fragment, null);
    }
}
export const DEFAULT_CUSTOM_FIELDS = {
    customField1: {
        label: 'Color Picker Example',
        type: 'colorpicker',
        value: '#000EF0',
    },
    customField2: {
        label: 'Slider Example',
        type: 'slider',
        value: 100,
        max: 200,
        min: 100,
        steps: 4,
    },
    customField3: {
        label: 'Textfield Example',
        type: 'textfield',
        value: 'Hi There',
    },
    customField4: {
        label: 'Font Picker Example',
        type: 'fontpicker',
        value: 'Open Sans',
    },
    customField5: {
        label: 'Dropdown Example',
        type: 'dropdown',
        options: {
            optionA: 'Option A',
            optionB: 'Option B',
            optionC: 'Option C',
        },
        value: 'optionB',
    },
    customField6: {
        label: 'Image Input Example',
        type: 'image-input',
        value: null,
    },
    customField7: {
        label: 'Sound Input Example',
        type: 'sound-input',
        value: null,
    },
};
//# sourceMappingURL=CustomFields.js.map