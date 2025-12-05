import { Form } from 'antd';
import React, { useContext } from 'react';
import omit from 'lodash/omit';
import { FormContext } from './Form';
import { InputComponent, layoutPresets } from './inputs';
export default InputComponent(function InputWrapper(p) {
    const layoutPreset = useLayout(p);
    const formItemProps = omit(p, 'nowrap', 'nolabel');
    const label = !p.nolabel ? p.label || ' ' : null;
    return p.nowrap ? (<>{p.children}</>) : (<Form.Item colon={false} {...layoutPreset} {...formItemProps} label={label}>
      {formItemProps.children}
    </Form.Item>);
});
function useLayout(p) {
    const context = useContext(FormContext);
    const contextLayout = context === null || context === void 0 ? void 0 : context.layout;
    const wrapperLayout = p.layout;
    const layout = wrapperLayout || contextLayout || 'inline';
    return layoutPresets[layout] || {};
}
//# sourceMappingURL=InputWrapper.jsx.map