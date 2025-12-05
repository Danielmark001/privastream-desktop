import React from 'react';
import { Checkbox, Tooltip } from 'antd';
import { InputComponent, useInput } from './inputs';
import { QuestionCircleOutlined } from '@ant-design/icons';
export const CheckboxInput = InputComponent((p) => {
    const { inputAttrs, wrapperAttrs } = useInput('checkbox', p);
    return (<div style={wrapperAttrs.style} className={wrapperAttrs.className}>
      <Checkbox {...inputAttrs} checked={inputAttrs.value} onChange={() => inputAttrs.onChange(!inputAttrs.value)}>
        {p.label}
        {p.tooltip && (<Tooltip title={p.tooltip}>
            <QuestionCircleOutlined style={{ marginLeft: '7px' }}/>
          </Tooltip>)}
      </Checkbox>
    </div>);
});
//# sourceMappingURL=CheckboxInput.jsx.map