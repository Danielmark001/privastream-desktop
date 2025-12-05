import React, { forwardRef, useRef, useState } from 'react';
import Form, { useFormContext } from '../shared/inputs/Form';
import { CheckboxInput, ColorInput, FileInput, ListInput, SliderInput, TextAreaInput, useTextInput, } from '../shared/inputs';
import { showFileDialog } from '../shared/inputs/FileInput';
import cloneDeep from 'lodash/cloneDeep';
import { Button, Collapse, Input, InputNumber } from 'antd';
import InputWrapper from '../shared/inputs/InputWrapper';
import { $t, $translateIfExist, $translateIfExistWithCheck } from '../../services/i18n';
import Utils from 'services/utils';
import cx from 'classnames';
import Tabs from 'components-react/shared/Tabs';
import { ANT_NUMBER_FEATURES } from 'components-react/shared/inputs/NumberInput';
import { ANT_INPUT_FEATURES } from 'components-react/shared/inputs/TextInput';
export function ObsForm(p) {
    var _a;
    const inputRef = useRef(null);
    function onInputHandler(value, index) {
        const newValue = cloneDeep(p.value);
        newValue.splice(index, 1, value);
        p.onChange(newValue, index);
    }
    const name = (p === null || p === void 0 ? void 0 : p.name) || ((_a = p.value[0]) === null || _a === void 0 ? void 0 : _a.name);
    return (<Form layout={p.layout || 'vertical'} style={p.style} name={name}>
      {p.value.map((inputData, inputIndex) => {
            var _a;
            return (<ObsInput ref={inputRef} value={inputData} key={inputData.name} inputIndex={inputIndex} onChange={onInputHandler} extraProps={(_a = p.extraProps) === null || _a === void 0 ? void 0 : _a[inputData.name]}/>);
        })}
    </Form>);
}
const ObsInput = forwardRef((p, ref) => {
    var _a;
    const formContext = useFormContext();
    const layout = formContext === null || formContext === void 0 ? void 0 : formContext.layout;
    if (!p.value.visible)
        return <></>;
    const type = p.value.type;
    function onChangeHandler(...args) {
        const newVal = cloneDeep(p.value);
        newVal.value = args[0];
        p.onChange(newVal, p.inputIndex);
    }
    const extraProps = p.extraProps || {};
    const inputProps = Object.assign({ value: p.value.value, onChange: onChangeHandler, name: p.value.name, label: $translateIfExist(p.value.description), uncontrolled: false, masked: p.value.masked, disabled: !p.value.enabled }, extraProps);
    switch (type) {
        case 'OBS_PROPERTY_DOUBLE':
            return <ObsNumberInput {...inputProps} ref={ref} data-name={p.value.name}/>;
        case 'OBS_PROPERTY_INT':
            const intVal = p.value;
            return (<ObsNumberInput {...inputProps} step={1} min={intVal.minVal} max={intVal.maxVal} ref={ref} data-name={p.value.name}/>);
        case 'OBS_PROPERTY_EDIT_TEXT':
        case 'OBS_PROPERTY_TEXT':
            const textVal = p.value;
            if (textVal.multiline) {
                return <TextAreaInput {...inputProps} debounce={300} data-name={p.value.name}/>;
            }
            else if (textVal.infoField) {
                const infoField = textVal.infoField;
                switch (textVal.infoField) {
                    case infoField === 1:
                        return (<InputWrapper style={{ color: 'var(--info)' }} data-name={p.value.name}>
                {textVal.description}
              </InputWrapper>);
                    case infoField === 2:
                        return (<InputWrapper style={{ color: 'var(--warning)' }} data-name={p.value.name}>
                {textVal.description}
              </InputWrapper>);
                    default:
                        return <InputWrapper data-name={p.value.name}>{textVal.description}</InputWrapper>;
                }
            }
            else {
                return (<ObsTextInput {...inputProps} isPassword={inputProps.masked} ref={ref} data-name={p.value.name}/>);
            }
        case 'OBS_PROPERTY_LIST':
            const options = p.value.options.map(opt => {
                if (opt.value === 0 && opt.description === '') {
                    return { label: $t('Select Option'), value: 0 };
                }
                return {
                    value: opt.value,
                    label: $translateIfExistWithCheck(opt.description),
                    originalLabel: opt.description,
                };
            });
            return (<ListInput {...inputProps} options={options} allowClear={false} nolabel={p.value.description === ''} style={{
                    marginBottom: ((_a = p.value) === null || _a === void 0 ? void 0 : _a.subType) === '' ? '8px' : '24px',
                }} data-name={p.value.name}/>);
        case 'OBS_INPUT_RESOLUTION_LIST':
            const resolutions = p.value.options.map(opt => {
                if (opt.value === 0 && opt.description === '') {
                    return { label: $t('Select Option'), value: 0 };
                }
                return {
                    value: opt.value,
                    label: $translateIfExistWithCheck(opt === null || opt === void 0 ? void 0 : opt.description),
                    originalLabel: opt === null || opt === void 0 ? void 0 : opt.description,
                };
            });
            return (<ObsInputListCustomResolutionInput inputProps={inputProps} options={resolutions} data-name={p.value.name}/>);
        case 'OBS_PROPERTY_BUTTON':
            return (<InputWrapper>
          <Button onClick={() => inputProps.onChange(true)} data-name={p.value.name}>
            {inputProps.label}
          </Button>
        </InputWrapper>);
        case 'OBS_PROPERTY_BOOL':
            return (<InputWrapper style={{ marginBottom: '8px' }} nowrap={layout === 'vertical'}>
          <CheckboxInput {...inputProps} data-name={p.value.name}/>
        </InputWrapper>);
        case 'OBS_PROPERTY_FILE':
            return <FileInput {...inputProps} filters={p.value.filters}/>;
        case 'OBS_PROPERTY_COLOR':
            const rgba = Utils.intToRgba(p.value.value);
            rgba.a = rgba.a / 255;
            return (<ColorInput {...inputProps} value={rgba} onChange={(v) => {
                    inputProps.onChange(Utils.rgbaToInt(v.r, v.g, v.b, Math.round(v.a * 255)));
                }} data-name={p.value.name}/>);
        case 'OBS_PROPERTY_SLIDER':
            const sliderVal = p.value;
            return (<SliderInput {...inputProps} step={sliderVal.stepVal} min={sliderVal.minVal} max={sliderVal.maxVal} hasNumberInput={true} debounce={500} tooltipPlacement="right" data-name={p.value.name}/>);
        case 'OBS_PROPERTY_BITMASK':
            const flagsVal = p.value;
            const flags = Utils.numberToBinnaryArray(flagsVal.value, flagsVal.size).reverse();
            return (<InputWrapper label={flagsVal.description} data-name={p.value.name}>
          {flags.map((flag, index) => (<Button key={`flag-${index}`} onClick={() => {
                        const newFlags = [...flags];
                        newFlags[index] = flag === 0 ? 1 : 0;
                        inputProps.onChange(Utils.binnaryArrayToNumber(newFlags.reverse()));
                    }} style={{
                        marginRight: '5px',
                        backgroundColor: flag === 1 ? 'var(--primary)' : 'var(--dark-background)',
                        color: flag === 1 ? 'var(--action-button-text)' : 'var(--icon)',
                        borderColor: flag === 1 ? 'var(--primary)' : 'var(--icon)',
                        padding: '10px',
                        lineHeight: 0.75,
                    }}>
              {index + 1}
            </Button>))}
        </InputWrapper>);
        case 'OBS_PROPERTY_PATH':
            return (<ObsTextInput {...inputProps} style={{ marginBottom: '8px' }} addonAfter={<Button onClick={() => showFileDialog(Object.assign(Object.assign({}, inputProps), { directory: true }))}>
              {$t('Browse')}
            </Button>}/>);
        case 'OBS_PROPERTY_UINT':
            const uintVal = p.value;
            return (<ObsNumberInput {...inputProps} step={1} min={uintVal.minVal} max={uintVal.maxVal} ref={ref} data-name={p.value.name}/>);
        default:
            return <span style={{ color: 'red' }}>Unknown input type {type}</span>;
    }
});
export function ObsFormGroup(p) {
    function onChangeHandler(formData, ind) {
        const newVal = cloneDeep(p.value);
        newVal[ind].parameters = formData;
        p.onChange(newVal);
    }
    const sections = p.value.filter(section => section.parameters.filter(p => p.visible).length);
    const type = p.type || 'default';
    return (<div className="form-groups" style={{ paddingBottom: '12px' }}>
      {type === 'default' &&
            sections.map((sectionProps, ind) => (<div className="section" key={`${sectionProps.nameSubCategory}${ind}`}>
            {sectionProps.nameSubCategory !== 'Untitled' && (<h2 className="section-title">{$t(sectionProps.nameSubCategory)}</h2>)}
            <div className="section-content">
              <ObsForm value={sectionProps.parameters} onChange={formData => onChangeHandler(formData, ind)}/>
            </div>
          </div>))}

      {type === 'tabs' && <ObsTabbedFormGroup sections={sections} onChange={onChangeHandler}/>}

      {type === 'collapsible' && (<ObsCollapsibleFormGroup sections={sections} onChange={onChangeHandler}/>)}
    </div>);
}
export function ObsCollapsibleFormGroup(p) {
    return (<>
      {p.sections.map((sectionProps, ind) => (<div className="section" key={`${sectionProps.nameSubCategory}${ind}`} style={{ padding: sectionProps.nameSubCategory !== 'Untitled' ? '4px' : '16px' }}>
          {sectionProps.nameSubCategory === 'Untitled' ? (<div className="section-content">
              <ObsForm value={sectionProps.parameters} onChange={formData => p.onChange(formData, ind)}/>
            </div>) : (<ObsCollapsibleFormItem key={`${sectionProps.nameSubCategory}${ind}`} name={sectionProps.nameSubCategory} section={sectionProps} onChange={formData => p.onChange(formData, ind)}/>)}
        </div>))}
    </>);
}
export function ObsTabbedFormGroup(p) {
    const tabs = p.sections.map(sectionProps => sectionProps.nameSubCategory);
    const [currentTab, setCurrentTab] = useState(p.sections[1].nameSubCategory);
    return (<div className="section" key="tabbed-section" style={{ marginBottom: '24px' }}>
      {p.sections.map((sectionProps, ind) => (<div className="section-content" key={`${sectionProps.nameSubCategory}${ind}`}>
          {sectionProps.nameSubCategory === 'Untitled' && (<>
              <ObsForm value={sectionProps.parameters} onChange={formData => p.onChange(formData, ind)}/>
              <Tabs tabs={tabs} onChange={setCurrentTab} style={{ marginBottom: '24px' }}/>
            </>)}

          {sectionProps.nameSubCategory === currentTab && (<ObsForm name={sectionProps.nameSubCategory} value={sectionProps.parameters} onChange={formData => p.onChange(formData, ind)}/>)}
        </div>))}
    </div>);
}
const { Panel } = Collapse;
export function ObsCollapsibleFormItem(p) {
    const [expanded, setExpanded] = useState(true);
    return (<Collapse className={cx('section-content', 'section-content--collapse')} onChange={() => setExpanded(!expanded)} defaultActiveKey={[`${p.section.nameSubCategory}`]} expandIcon={({ isActive }) => (<i className={cx('fa', 'section-title__icon', {
                'fa-minus': isActive,
                'fa-plus': !isActive,
            })}/>)} bordered={false}>
      <Panel className="section-content--panel" header={p.section.nameSubCategory} key={`${p.section.nameSubCategory}`}>
        <ObsForm name={p.name} value={p.section.parameters} onChange={p.onChange}/>
      </Panel>
    </Collapse>);
}
const ObsInputListCustomResolutionInput = forwardRef((p, ref) => {
    const [custom, setCustom] = useState(false);
    const [customResolution, setCustomResolution] = useState(p.inputProps.value);
    const formContext = useFormContext();
    function onChange(val) {
        formContext === null || formContext === void 0 ? void 0 : formContext.antForm.validateFields();
        setCustomResolution(val);
        if (custom && /^[0-9]+x[0-9]+$/.test(customResolution)) {
            p.inputProps.onChange(customResolution);
        }
    }
    function onClick() {
        formContext === null || formContext === void 0 ? void 0 : formContext.antForm.validateFields();
        const isValid = /^[0-9]+x[0-9]+$/.test(customResolution);
        if (custom && !isValid)
            return;
        if (custom && isValid) {
            p.inputProps.onChange(customResolution);
            setCustomResolution('');
        }
        setCustom(!custom);
    }
    return (<>
        {custom ? (<ObsTextInput {...p.inputProps} value={customResolution} onChange={val => onChange(val)} label={p.inputProps.label} validateTrigger="onBlur" rules={[
                {
                    message: $t('The resolution must be in the format [width]x[height] (i.e. 1920x1080)'),
                    pattern: /^[0-9]+x[0-9]+$/,
                },
            ]} uncontrolled={false} name={p.inputProps.name} ref={ref}/>) : (<ListInput {...p.inputProps} allowClear={false} options={p.options}/>)}

        <Button type={custom ? 'primary' : 'default'} onClick={onClick} style={{ marginBottom: '24px' }}>
          {custom ? $t('Apply Primary') : $t('Use Custom')}
        </Button>
      </>);
});
const ObsNumberInput = forwardRef((p, ref) => {
    const { inputAttrs, wrapperAttrs, originalOnChange } = useTextInput('number', p, ANT_NUMBER_FEATURES);
    function onChangeHandler(val) {
        if (typeof val !== 'number')
            return;
        if (typeof p.max === 'number' && val > p.max)
            return;
        if (typeof p.min === 'number' && val < p.min)
            return;
        originalOnChange(val);
    }
    const rules = p.rules ? p.rules[0] : {};
    return (<InputWrapper {...wrapperAttrs} rules={[Object.assign(Object.assign({}, rules), { type: 'number' })]} style={{ width: '100%' }}>
      <InputNumber {...inputAttrs} onChange={onChangeHandler} defaultValue={p.defaultValue} ref={ref} style={{ width: '100%' }}/>
    </InputWrapper>);
});
const ObsTextInput = forwardRef((p, ref) => {
    const { inputAttrs, wrapperAttrs } = useTextInput('text', p, ANT_INPUT_FEATURES);
    const textInputAttrs = Object.assign(Object.assign({}, inputAttrs), { onFocus: p.onFocus, onKeyDown: p.onKeyDown, onMouseDown: p.onMouseDown, ref: p.inputRef, prefix: p.prefix });
    return (<InputWrapper {...wrapperAttrs} style={{ width: '100%' }}>
      <Input {...textInputAttrs} ref={ref}/>
    </InputWrapper>);
});
//# sourceMappingURL=ObsForm.jsx.map