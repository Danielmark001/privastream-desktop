import React, { useEffect, useContext, useCallback, useRef } from 'react';
import { FormContext } from './Form';
import { useDebounce, useThrottle } from '../../hooks';
import { useOnCreate, useForceUpdate, createFormBinding } from 'slap';
import uuid from 'uuid';
import { $t } from '../../../services/i18n';
import pick from 'lodash/pick';
import isEqual from 'lodash/isEqual';
import * as InputComponents from './inputList';
export const layoutPresets = {
    horizontal: {
        labelCol: { span: 8 },
        wrapperCol: { span: 16 },
    },
    vertical: {
        labelCol: { span: 24 },
        wrapperCol: { span: 24 },
    },
};
export function useInput(type, inputProps, antFeatures) {
    const { name, value, label } = inputProps;
    const inputPropsRef = useRef(inputProps);
    inputPropsRef.current = inputProps;
    const uncontrolled = (() => {
        if (inputProps.debounce)
            return true;
        if ('uncontrolled' in inputProps)
            return inputProps.uncontrolled;
        return false;
    })();
    const formContext = useContext(FormContext);
    const form = formContext === null || formContext === void 0 ? void 0 : formContext.antForm;
    const inputId = useOnCreate(() => {
        const id = `${name}-${uuid()}`;
        return id;
    });
    const localValueRef = useRef(value);
    const prevValueRef = useRef(value);
    if (!isEqual(value, prevValueRef.current)) {
        localValueRef.current = value;
        prevValueRef.current = value;
    }
    function setLocalValue(newVal) {
        localValueRef.current = newVal;
    }
    useEffect(() => {
        if (form) {
            const Component = getInputComponentByType(type);
            if (!Component) {
                throw new Error(`Component "${type}" not found.`);
            }
            const newVal = Component.getAntdValue ? Component.getAntdValue(value) : value;
            form.setFieldsValue({ [inputId]: newVal });
        }
    }, [value]);
    const forceUpdate = useForceUpdate();
    function emitChange(newVal) {
        if (uncontrolled)
            prevValueRef.current = newVal;
        inputPropsRef.current.onChange && inputPropsRef.current.onChange(newVal);
    }
    const emitChangeDebounced = useDebounce(inputProps.debounce, emitChange);
    const emitChangeThrottled = useThrottle(inputProps.throttle, emitChange);
    const onChange = useCallback((newVal) => {
        if (isEqual(newVal, localValueRef.current))
            return;
        const props = inputPropsRef.current;
        if (uncontrolled) {
            localValueRef.current = newVal;
            forceUpdate();
        }
        props.onInput && props.onInput(newVal);
        if (!props.onChange)
            return;
        if (props.debounce) {
            emitChangeDebounced(newVal);
        }
        else if (props.throttle) {
            emitChangeThrottled(newVal);
        }
        else {
            emitChange(newVal);
        }
    }, []);
    const dataAttrs = {
        'data-type': type,
        'data-name': name,
        'data-title': label,
        'data-id': inputId,
    };
    const rules = createValidationRules(type, inputProps);
    const wrapperAttrs = Object.assign(Object.assign({}, pick(inputProps, [
        'className',
        'style',
        'key',
        'label',
        'extra',
        'labelCol',
        'wrapperCol',
        'disabled',
        'readOnly',
        'nowrap',
        'layout',
        'rules',
        'tooltip',
        'hidden',
    ])), { rules, 'data-role': 'input-wrapper', name: inputId });
    const wrapperAttrsRef = useRef(wrapperAttrs);
    Object.assign(wrapperAttrsRef.current, wrapperAttrs);
    const inputAttrs = Object.assign(Object.assign(Object.assign({}, pick(inputProps, 'disabled', 'readOnly', 'placeholder', 'size', antFeatures || [])), dataAttrs), { 'data-role': 'input', name: inputId, value: localValueRef.current, onChange });
    const inputAttrsRef = useRef(inputAttrs);
    Object.assign(inputAttrsRef.current, inputAttrs);
    return {
        inputAttrs: inputAttrsRef.current,
        wrapperAttrs: wrapperAttrsRef.current,
        dataAttrs,
        forceUpdate,
        setLocalValue,
        emitChange,
        form,
    };
}
export function useTextInput(type, p, antFeatures) {
    const uncontrolled = p.uncontrolled === true || p.uncontrolled !== false;
    const { inputAttrs, wrapperAttrs, forceUpdate, setLocalValue, emitChange } = useInput(type, Object.assign({ uncontrolled }, p), antFeatures);
    const onChange = useCallback((ev) => {
        if (!uncontrolled || p.debounce) {
            inputAttrs.onChange(ev.target.value);
        }
        else {
            setLocalValue(ev.target.value);
            forceUpdate();
        }
    }, []);
    const onBlur = useCallback((ev) => {
        const newVal = type === 'number' ? Number(ev.target.value) : ev.target.value;
        if (uncontrolled && p.value !== newVal) {
            emitChange(newVal);
        }
        p.onBlur && p.onBlur(ev);
    }, []);
    const textInputAttrs = Object.assign(Object.assign({}, inputAttrs), { onChange,
        onBlur });
    const inputAttrsRef = useRef(textInputAttrs);
    Object.assign(inputAttrsRef.current, textInputAttrs);
    return {
        wrapperAttrs,
        inputAttrs: inputAttrsRef.current,
        originalOnChange: inputAttrs.onChange,
    };
}
export function createBinding(stateGetter, stateSetter, extraPropsGenerator) {
    return createFormBinding(stateGetter, stateSetter, extraPropsGenerator).proxy;
}
export function bindFormState(getFormState, updateFormState, extraProps) {
    const formState = getFormState();
    const result = {};
    for (const fieldName in formState) {
        result[fieldName] = {
            name: fieldName,
            value: formState[fieldName],
            onChange: (value) => {
                updateFormState({ [fieldName]: value });
            },
        };
    }
    extraProps !== null && extraProps !== void 0 ? extraProps : Object.assign(result, extraProps);
    return result;
}
function createValidationRules(type, inputProps) {
    const rules = inputProps.rules ? [...inputProps.rules] : [];
    if (inputProps.required) {
        rules.push({ required: true, message: $t('The field is required') });
    }
    if (type === 'text' && inputProps.max) {
        rules.push({
            max: inputProps.max,
            message: $t('This field may not be greater than %{value} characters.', {
                value: inputProps.max,
            }),
        });
    }
    return rules;
}
export function InputComponent(f) {
    return React.memo(f, (prevProps, newProps) => {
        const keys = Object.keys(newProps);
        if (keys.length !== Object.keys(prevProps).length)
            return false;
        for (const key of keys) {
            if (key === 'value' && !isEqual(newProps[key], prevProps[key]))
                return false;
            if (newProps[key] !== prevProps[key])
                return false;
        }
        return true;
    });
}
export function getInputComponentByType(type) {
    const name = Object.keys(InputComponents).find(componentName => {
        return componentName.split('Input')[0].toLowerCase() === type;
    });
    return name ? InputComponents[name] : null;
}
//# sourceMappingURL=inputs.js.map