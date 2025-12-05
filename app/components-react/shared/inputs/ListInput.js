import { Select, Row, Col } from 'antd';
import React, { useRef } from 'react';
import { InputComponent, useInput } from './inputs';
import InputWrapper from './InputWrapper';
import { useDebounce } from '../../hooks';
import omit from 'lodash/omit';
import { getDefined } from '../../../util/properties-type-guards';
import { findDOMNode } from 'react-dom';
const ANT_SELECT_FEATURES = [
    'showSearch',
    'loading',
    'placeholder',
    'notFoundContent',
    'onDropdownVisibleChange',
    'onSearch',
    'onSelect',
    'allowClear',
    'defaultActiveFirstOption',
    'listHeight',
    'filterOption',
    'suffixIcon',
    'size',
    'dropdownMatchSelectWidth',
];
export const ListInput = InputComponent((p) => {
    var _a;
    const { inputAttrs, wrapperAttrs, form } = useInput('list', p, ANT_SELECT_FEATURES);
    if (!form)
        console.error('ListInput component should be wrapped in Form');
    const options = p.options;
    const debouncedSearch = useDebounce(p.debounce, startSearch);
    const $inputRef = useRef(null);
    function startSearch(searchStr) {
        p.onSearch && p.onSearch(searchStr);
    }
    function onSearchHandler(searchStr) {
        p.onBeforeSearch && p.onBeforeSearch(searchStr);
        if (!p.onSearch)
            return;
        if (p.debounce) {
            debouncedSearch(searchStr);
        }
        else {
            startSearch(searchStr);
        }
    }
    function getPopupContainer() {
        const $el = getDefined(findDOMNode($inputRef.current));
        return $el.closest('.os-content, body');
    }
    const selectedOption = options === null || options === void 0 ? void 0 : options.find(opt => opt.value === p.value);
    return (React.createElement(InputWrapper, Object.assign({}, wrapperAttrs, { extra: (_a = p === null || p === void 0 ? void 0 : p.description) !== null && _a !== void 0 ? _a : selectedOption === null || selectedOption === void 0 ? void 0 : selectedOption.description, nolabel: p === null || p === void 0 ? void 0 : p.nolabel }),
        React.createElement(Select, Object.assign({ ref: $inputRef }, omit(inputAttrs, 'onChange'), { value: inputAttrs.value, optionFilterProp: "label", optionLabelProp: "labelrender", onSearch: p.showSearch ? onSearchHandler : undefined, onChange: val => p.onChange && p.onChange(val), onSelect: p.onSelect, defaultValue: p.defaultValue, getPopupContainer: getPopupContainer, "data-value": inputAttrs.value, "data-selected-option-label": selectedOption === null || selectedOption === void 0 ? void 0 : selectedOption.label, "data-show-search": !!inputAttrs['showSearch'], "data-loading": !!inputAttrs['loading'], dropdownMatchSelectWidth: p.dropdownMatchSelectWidth }), options && options.map((opt, ind) => renderOption(opt, ind, p)))));
});
export function renderOption(opt, ind, inputProps) {
    var _a;
    const attrs = {
        'data-option-list': inputProps.name,
        'data-option-label': (_a = opt.originalLabel) !== null && _a !== void 0 ? _a : opt.label,
        'data-option-value': opt.value,
        label: opt.label,
        value: opt.value,
        key: `${ind}-${opt.value}`,
    };
    const labelEl = (() => {
        if (inputProps.labelRender) {
            return inputProps.labelRender(opt);
        }
        else if (inputProps.hasImage) {
            return renderLabelWithImage(opt);
        }
        else {
            return opt.label;
        }
    })();
    const children = (() => {
        if (inputProps.optionRender) {
            return inputProps.optionRender(opt);
        }
        else if (inputProps.hasImage) {
            return renderOptionWithImage(opt, inputProps);
        }
        else {
            return opt.label;
        }
    })();
    return (React.createElement(Select.Option, Object.assign({}, attrs, { labelrender: labelEl }), children));
}
function renderOptionWithImage(opt, inputProps) {
    const src = opt.image;
    const { width, height } = inputProps.imageSize ? inputProps.imageSize : { width: 15, height: 15 };
    const imageStyle = {
        width: `${width}px`,
        height: `${height}px`,
    };
    return (React.createElement(Row, { gutter: 8, align: "middle", wrap: false },
        React.createElement(Col, null,
            src &&
                (typeof src === 'string' ? (React.createElement("img", { src: src, alt: "", style: imageStyle })) : (React.createElement("div", null, src))),
            !src && React.createElement("div", { style: imageStyle })),
        React.createElement(Col, null, opt.label)));
}
function renderLabelWithImage(opt) {
    const src = opt.image;
    const [width, height] = [15, 15];
    const imageStyle = {
        width: `${width}px`,
        height: `${height}px`,
    };
    return (React.createElement(Row, { gutter: 8 },
        React.createElement(Col, null,
            src &&
                (typeof src === 'string' ? (React.createElement("img", { src: src, alt: "", style: imageStyle })) : (React.createElement("div", null, src))),
            !src && React.createElement("div", { style: imageStyle })),
        React.createElement(Col, null, opt.label)));
}
//# sourceMappingURL=ListInput.js.map