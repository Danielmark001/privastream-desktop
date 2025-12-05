import React, { useState } from 'react';
import { AutoComplete } from 'antd';
import { InputComponent } from './inputs';
import InputWrapper from './InputWrapper';
export const AutocompleteInput = InputComponent((p) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    function handleChange(val) {
        if (p.onChange) {
            p.onChange(val);
        }
    }
    function handleSelect(val) {
        handleChange(val);
        setDropdownOpen(false);
    }
    return (<InputWrapper label={p.label} rules={p.rules} name={p.name}>
      <AutoComplete options={p.options} value={p.value} onFocus={() => setDropdownOpen(true)} onBlur={() => setDropdownOpen(false)} open={dropdownOpen} onChange={handleChange} onSelect={handleSelect} data-value={p.value} data-name={p.name}/>
    </InputWrapper>);
});
//# sourceMappingURL=AutocompleteInput.jsx.map