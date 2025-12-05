import { Select, Tag } from 'antd';
import React, { useMemo } from 'react';
import { InputComponent, useInput } from './inputs';
import InputWrapper from './InputWrapper';
import { renderOption } from './ListInput';
import keyBy from 'lodash/keyBy';
import { $t } from '../../../services/i18n';
import Message from '../Message';
const ANT_SELECT_FEATURES = ['showSearch', 'loading', 'size'];
export const TagsInput = InputComponent((p) => {
    const { inputAttrs, wrapperAttrs } = useInput('tags', p, ['tokenSeparators', 'dropdownStyle']);
    const options = p.options || [];
    const tagsMap = useMemo(() => keyBy(options, 'value'), [options]);
    function renderTag(tagProps) {
        const tag = p.options
            ?
                tagsMap[tagProps['value']]
            :
                { label: tagProps['value'], value: tagProps['value'] };
        if (p.tagRender) {
            return p.tagRender(tagProps, tag);
        }
        return React.createElement(Tag, Object.assign({}, tagProps), tag.label);
    }
    function dropdownRender(menu) {
        var _a, _b;
        const maxTagsReached = p.max && ((_b = (_a = inputAttrs.value) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) >= p.max;
        return (React.createElement("div", null,
            maxTagsReached && (React.createElement(Message, { type: "warning" }, $t('You can only select up to %{max} items', { max: p.max }))),
            menu));
    }
    function onChangeHandler(values) {
        const max = p.max;
        const count = values.length;
        if (max && count > max)
            values.pop();
        inputAttrs.onChange(values);
    }
    const displayValue = (inputAttrs.value || []).map((val) => { var _a; return (_a = tagsMap[val]) === null || _a === void 0 ? void 0 : _a.label; });
    return (React.createElement(InputWrapper, Object.assign({}, wrapperAttrs),
        React.createElement(Select, Object.assign({}, inputAttrs, { optionFilterProp: 'label', mode: p.mode || 'multiple', allowClear: true, onChange: val => onChangeHandler(val), tagRender: renderTag, placeholder: p.placeholder || $t('Start typing to search'), dropdownRender: dropdownRender, "data-value": JSON.stringify(inputAttrs.value), "data-display-value": JSON.stringify(displayValue), "data-show-search": inputAttrs['showSearch'] }), options.length > 0 && options.map((opt, ind) => renderOption(opt, ind, p)))));
});
//# sourceMappingURL=TagsInput.js.map