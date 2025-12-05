import { isEditableListProperty, isFontProperty, isListProperty, isNumberProperty, isPathProperty, isTextProperty, } from '../../../util/properties-type-guards';
import { $translateIfExist } from 'services/i18n';
import TsxComponent from 'components/tsx-component';
function parsePathFilters(filterStr) {
    const filters = filterStr.split(';;').filter(item => item);
    if (filterStr === '*.*') {
        return [
            {
                name: 'All Files',
                extensions: ['*'],
            },
        ];
    }
    return filters.map(filter => {
        const match = filter.match(/^(.*)\((.*)\)$/);
        const desc = match[1].replace(/^\s+/, '').replace(/\s+$/, '');
        let types = match[2].split(' ');
        types = types.map(type => {
            return type.match(/^\*\.(.+)$/)[1];
        });
        return {
            name: desc,
            extensions: types,
        };
    });
}
export function obsValuesToInputValues(obsProps, options = {}) {
    const resultProps = [];
    for (const obsProp of obsProps) {
        let prop = Object.assign({}, obsProp);
        let valueObject;
        let obsValue = obsProp.currentValue;
        if (options.valueGetter) {
            valueObject = options.valueGetter(obsProp.name);
            obsValue = valueObject;
        }
        if (options.valueIsObject) {
            obsValue = obsValue.value;
        }
        prop.value = obsValue;
        prop.masked = !!obsProp.masked;
        prop.enabled = !!obsProp.enabled;
        prop.visible = !!obsProp.visible;
        prop.description = $translateIfExist(obsProp.description);
        if (options.disabledFields && options.disabledFields.includes(prop.name)) {
            prop.visible = false;
        }
        if (['OBS_PROPERTY_LIST', 'OBS_INPUT_RESOLUTION_LIST'].includes(obsProp.type)) {
            const listOptions = [];
            if (options.transformListOptions) {
                for (const listOption of obsProp.values || []) {
                    listOptions.push({
                        value: listOption[Object.keys(listOption)[0]],
                        description: Object.keys(listOption)[0],
                    });
                }
            }
            if (options.subParametersGetter) {
                listOptions.push(...options.subParametersGetter(prop.name));
            }
            for (const listOption of listOptions) {
                if (listOption.description === void 0)
                    listOption.description = listOption['name'];
            }
            const needToSetDefaultValue = listOptions.length && prop.value === void 0;
            if (needToSetDefaultValue)
                prop.value = listOptions[0].value;
            prop.options = listOptions;
        }
        else if (obsProp.type === 'OBS_PROPERTY_BOOL') {
            prop.value = !!prop.value;
        }
        else if (['OBS_PROPERTY_INT', 'OBS_PROPERTY_FLOAT', 'OBS_PROPERTY_DOUBLE'].includes(obsProp.type)) {
            prop = Object.assign(Object.assign({}, prop), { value: Number(prop.value), minVal: obsProp.minVal, maxVal: obsProp.maxVal, stepVal: obsProp.stepVal });
            if (obsProp.subType === 'OBS_NUMBER_SLIDER') {
                prop.type = 'OBS_PROPERTY_SLIDER';
            }
        }
        else if (obsProp.type === 'OBS_PROPERTY_BITMASK') {
            prop = Object.assign(Object.assign({}, prop), { value: Number(prop.value), showDescription: true, size: 6 });
        }
        else if (obsProp.type === 'OBS_PROPERTY_PATH') {
            if (valueObject && valueObject.type === 'OBS_PATH_FILE') {
                prop = Object.assign(Object.assign({}, prop), { type: 'OBS_PROPERTY_FILE', filters: parsePathFilters(valueObject.filter) });
            }
        }
        else if (obsProp.type === 'OBS_PROPERTY_FONT') {
            prop.value = valueObject;
        }
        else if (obsProp.type === 'OBS_PROPERTY_EDITABLE_LIST') {
            prop = Object.assign(Object.assign({}, prop), { value: valueObject, filters: parsePathFilters(valueObject.filter), defaultPath: valueObject.default_path });
        }
        resultProps.push(prop);
    }
    return resultProps;
}
export function inputValuesToObsValues(props, options = {}) {
    const obsProps = [];
    for (const prop of props) {
        const obsProp = Object.assign({}, prop);
        obsProps.push(obsProp);
        if (prop.type === 'OBS_PROPERTY_BOOL') {
            if (options.boolToString)
                obsProp.currentValue = obsProp.currentValue ? 'true' : 'false';
        }
        else if (prop.type === 'OBS_PROPERTY_INT') {
            if (options.intToString)
                obsProp.currentValue = String(obsProp.currentValue);
        }
        if (options.valueToObject &&
            !['OBS_PROPERTY_FONT', 'OBS_PROPERTY_EDITABLE_LIST', 'OBS_PROPERTY_BUTTON'].includes(prop.type)) {
            obsProp.value = { value: obsProp.value };
        }
        if (options.valueToCurrentValue) {
            obsProp.currentValue = obsProp.value;
        }
    }
    return obsProps;
}
export function getPropertiesFormData(obsSource) {
    const formData = [];
    const obsProps = obsSource.properties;
    const obsSettings = obsSource.settings;
    if (!obsProps)
        return null;
    if (!obsProps.count())
        return null;
    let obsProp = obsProps.first();
    do {
        let obsType;
        switch (obsProp.type) {
            case 1:
                obsType = 'OBS_PROPERTY_BOOL';
                break;
            case 2:
                obsType = 'OBS_PROPERTY_INT';
                break;
            case 3:
                obsType = 'OBS_PROPERTY_FLOAT';
                break;
            case 6:
                obsType = 'OBS_PROPERTY_LIST';
                break;
            case 4:
                obsType = 'OBS_PROPERTY_TEXT';
                break;
            case 7:
                obsType = 'OBS_PROPERTY_COLOR';
                break;
            case 9:
                obsType = 'OBS_PROPERTY_FONT';
                break;
            case 10:
                obsType = 'OBS_PROPERTY_EDITABLE_LIST';
                break;
            case 8:
                obsType = 'OBS_PROPERTY_BUTTON';
                break;
            case 5:
                switch (obsProp.details.type) {
                    case 0:
                        obsType = 'OBS_PROPERTY_FILE';
                        break;
                    case 2:
                        obsType = 'OBS_PROPERTY_PATH';
                        break;
                }
                break;
        }
        const formItem = {
            value: obsProp.value,
            name: obsProp.name,
            description: $translateIfExist(obsProp.description),
            enabled: obsProp.enabled,
            visible: obsProp.visible,
            type: obsType,
        };
        if (isListProperty(obsProp)) {
            formItem.options = obsProp.details.items.map(option => {
                return { value: option.value, description: option.name };
            });
        }
        if (isNumberProperty(obsProp)) {
            Object.assign(formItem, {
                minVal: obsProp.details.min,
                maxVal: obsProp.details.max,
                stepVal: obsProp.details.step,
            });
            if (obsProp.details.type === 1) {
                formItem.type = 'OBS_PROPERTY_SLIDER';
            }
        }
        if (isEditableListProperty(obsProp)) {
            Object.assign(formItem, {
                filters: parsePathFilters(obsProp.details.filter),
                defaultPath: obsProp.details.defaultPath,
            });
        }
        if (isPathProperty(obsProp)) {
            Object.assign(formItem, {
                filters: parsePathFilters(obsProp.details.filter),
                defaultPath: obsProp.details.defaultPath,
            });
        }
        if (isTextProperty(obsProp)) {
            Object.assign(formItem, {
                multiline: obsProp.details.type === 2,
                infoField: obsProp.details.type === 3,
                infoType: obsProp.details.infoType,
            });
        }
        if (isFontProperty(obsProp)) {
            formItem.value.path = obsSource.settings['custom_font'];
        }
        formData.push(formItem);
    } while ((obsProp = obsProp.next()));
    return formData;
}
export function setPropertiesFormData(obsSource, form) {
    const buttons = [];
    const formInputs = [];
    let properties = null;
    form.forEach(item => {
        if (item.type === 'OBS_PROPERTY_BUTTON') {
            if (item.value)
                buttons.push(item);
        }
        else {
            formInputs.push(item);
        }
    });
    if (buttons.length !== 0)
        properties = obsSource.properties;
    for (const button of buttons) {
        const obsButtonProp = properties.get(button.name);
        obsButtonProp.buttonClicked(obsSource);
    }
    let settings = {};
    formInputs.forEach(property => {
        settings[property.name] = property.value;
        if (property.type === 'OBS_PROPERTY_FONT') {
            settings['custom_font'] = property.value.path;
            delete settings[property.name].path;
        }
    });
    if (formInputs.length === 0)
        return;
    obsSource.update(settings);
    const updatedFormData = getPropertiesFormData(obsSource);
    let needUpdatePropsAgain = false;
    updatedFormData.forEach(prop => {
        if (prop.type !== 'OBS_PROPERTY_LIST')
            return;
        const listProp = prop;
        if (obsSource.id === 'av_capture_input' && listProp.value === -1)
            return;
        if (!listProp.options.length)
            return;
        const optionExists = !!listProp.options.find(option => option.value === listProp.value);
        if (optionExists)
            return;
        needUpdatePropsAgain = true;
        listProp.value = listProp.options[0].value;
    });
    if (needUpdatePropsAgain)
        settings = setPropertiesFormData(obsSource, updatedFormData);
    return settings;
}
export class ObsInput extends TsxComponent {
    emitInput(eventData) {
        this.$emit('input', eventData);
    }
}
//# sourceMappingURL=ObsInput.js.map