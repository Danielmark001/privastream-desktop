import React from 'react';
import { Checkbox, Tooltip } from 'antd';
import { InputComponent, useInput } from './inputs';
import { QuestionCircleOutlined } from '@ant-design/icons';
export const CheckboxInput = InputComponent((p) => {
    const { inputAttrs, wrapperAttrs } = useInput('checkbox', p);
    return (React.createElement("div", { style: wrapperAttrs.style, className: wrapperAttrs.className },
        React.createElement(Checkbox, Object.assign({}, inputAttrs, { checked: inputAttrs.value, onChange: () => inputAttrs.onChange(!inputAttrs.value) }),
            p.label,
            p.tooltip && (React.createElement(Tooltip, { title: p.tooltip },
                React.createElement(QuestionCircleOutlined, { style: { marginLeft: '7px' } }))))));
});
//# sourceMappingURL=CheckboxInput.js.map