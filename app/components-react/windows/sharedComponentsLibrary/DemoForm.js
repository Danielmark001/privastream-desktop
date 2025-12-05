var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React from 'react';
import { Example, useSharedComponentsLibrary } from './SharedComponentsLibrary';
import Utils from '../../../services/utils';
import { ListInput } from '../../shared/inputs/ListInput';
import Form from '../../shared/inputs/Form';
import { CheckboxInput, FileInput, NumberInput, SliderInput, SwitchInput, TagsInput, TextAreaInput, TextInput, } from '../../shared/inputs';
import InputWrapper from '../../shared/inputs/InputWrapper';
import { injectQuery, injectState } from 'slap';
export function DemoForm() {
    const { layout, formState, citiesQuery, colorOptions, genderOptions, addIntroduction, setSearchStr, } = useSharedComponentsLibrary().extend(module => {
        const formState = injectState({
            name: '',
            gender: '',
            age: 0,
            colors: [],
            city: '',
            weight: 65,
            addIntroduction: false,
            introduction: '',
            plusOneName: '',
            confirm1: false,
            confirm2: false,
            saveFilePath: '',
            searchStr: '',
        });
        const citiesQuery = injectQuery(fetchCities, () => formState.searchStr);
        return {
            formState,
            citiesQuery,
            genderOptions: [
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'other' },
            ],
            colorOptions: [
                { value: 1, label: 'Red' },
                { value: 2, label: 'Green' },
                { value: 3, label: 'Blue' },
                { value: 4, label: 'Orange' },
            ],
        };
    });
    const bind = formState.bind;
    return (React.createElement(Form, { layout: layout, name: "demo-form" },
        React.createElement(Example, { title: "Demo Form" },
            React.createElement(TextInput, Object.assign({}, bind.name, { label: 'Name', required: true })),
            React.createElement(ListInput, Object.assign({}, bind.gender, { label: 'Gender', options: genderOptions })),
            React.createElement(NumberInput, Object.assign({}, bind.age, { label: 'Age' })),
            React.createElement(ListInput, Object.assign({}, bind.city, { label: 'City', placeholder: "Start typing for search", options: citiesQuery.data, showSearch: true, onSearch: search => setSearchStr(search), loading: citiesQuery.isLoading })),
            React.createElement(SliderInput, Object.assign({}, bind.weight, { label: 'Weight', min: 1, max: 300 })),
            React.createElement(TagsInput, Object.assign({ label: "Pick your favorite colors" }, bind.colors, { options: colorOptions })),
            React.createElement(FileInput, Object.assign({ label: "Save to File", save: true }, bind.saveFilePath)),
            React.createElement(SwitchInput, Object.assign({}, bind.addIntroduction, { label: 'Add Introduction' })),
            addIntroduction && React.createElement(TextAreaInput, Object.assign({}, bind.introduction, { label: 'Introduction' })),
            React.createElement(InputWrapper, null,
                React.createElement(CheckboxInput, Object.assign({}, bind.confirm1, { label: 'Confirm you allow processing your data' })),
                React.createElement(CheckboxInput, Object.assign({}, bind.confirm2, { required: true, label: 'Confirm you love Streamlabs' }))))));
}
function fetchCities(searchStr) {
    return __awaiter(this, void 0, void 0, function* () {
        const availableCities = ['Tokyo', 'Delhi', 'Shanghai', 'MexicoCity', 'Cairo'];
        yield Utils.sleep(1000);
        if (!searchStr)
            return [];
        const cities = availableCities.filter(cityName => cityName.toLowerCase().startsWith(searchStr.toLowerCase()));
        return cities.map(cityName => ({ label: cityName, value: cityName }));
    });
}
//# sourceMappingURL=DemoForm.js.map