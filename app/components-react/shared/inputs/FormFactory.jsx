var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useMemo } from 'react';
import { Button } from 'antd';
import debounce from 'lodash/debounce';
import cloneDeep from 'lodash/cloneDeep';
import * as inputs from './inputList';
import Form, { useForm } from './Form';
import { ButtonGroup } from 'components-react/shared/ButtonGroup';
import { $t } from 'services/i18n';
const componentTable = {
    file: inputs.FileInput,
    text: inputs.TextInput,
    number: inputs.NumberInput,
    slider: inputs.SliderInput,
    checkbox: inputs.CheckboxInput,
    list: inputs.ListInput,
    switch: inputs.SwitchInput,
    autocomplete: inputs.AutocompleteInput,
    checkboxGroup: inputs.CheckboxGroup,
    radio: inputs.RadioInput,
    textarea: inputs.TextAreaInput,
    color: inputs.ColorInput,
    mediaurl: inputs.MediaUrlInput,
    imagepicker: inputs.ImagePickerInput,
    time: inputs.TimeInput,
    animation: inputs.AnimationInput,
    duration: inputs.DurationInput,
};
export default function FormFactory(p) {
    const form = useForm();
    useMemo(() => form.setFieldsValue(cloneDeep(p.values)), []);
    function submit() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield form.validateFields();
            }
            catch (e) {
                return;
            }
            if (p.onSubmit)
                p.onSubmit();
        });
    }
    return (<Form {...p.formOptions} id={p.name} name={p.name} form={form} onFieldsChange={() => debounce(form.validateFields, 500)()}>
      {Object.keys(p.metadata).map((inputKey) => (<FormInput key={inputKey} id={inputKey} metadata={p.metadata[inputKey]} values={p.values} onChange={p.onChange}/>))}
      {p.onSubmit && (<ButtonGroup>
          {p.onCancel && <Button onClick={p.onCancel}>{$t('Cancel')}</Button>}
          <Button type="primary" onClick={submit}>
            {$t('Save')}
          </Button>
        </ButtonGroup>)}
    </Form>);
}
function FormInput(p) {
    const { children, type } = p.metadata;
    if (!type)
        return <></>;
    const Input = componentTable[type];
    let handleChange = p.onChange(p.id);
    if (type === 'checkboxGroup')
        handleChange = p.onChange;
    if (p.metadata.onChange)
        handleChange = p.metadata.onChange;
    return (<>
      <Input {...p.metadata} name={p.id} value={p.values[p.id]} values={type === 'checkboxGroup' && p.values} onChange={handleChange}/>
      {!!children &&
            type !== 'checkboxGroup' &&
            Object.keys(children)
                .filter(childKey => children[childKey].displayed)
                .map(childKey => (<FormInput key={childKey} id={childKey} metadata={children[childKey]} values={p.values} onChange={p.onChange}/>))}
    </>);
}
//# sourceMappingURL=FormFactory.jsx.map