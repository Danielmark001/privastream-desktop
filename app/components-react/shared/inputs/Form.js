import React, { useContext, useEffect, useState } from 'react';
import { Form as AntForm } from 'antd';
export const FormContext = React.createContext(null);
export default React.memo(function Form(p) {
    const context = useContext(FormContext);
    const [antForm] = AntForm.useForm((context === null || context === void 0 ? void 0 : context.antForm) || p.form);
    const [contextValue, setContextValue] = useState(() => {
        const layout = p.layout || 'horizontal';
        return {
            layout,
            antForm,
        };
    });
    useEffect(() => {
        const layout = p.layout || 'horizontal';
        setContextValue(prevContext => (Object.assign(Object.assign({}, prevContext), { layout })));
    }, [p.layout]);
    const dataAttrs = {
        'data-role': 'form',
        'data-name': p.name,
    };
    const validateMessages = {
        required: '${label} is required',
        types: { number: '${label} is not a valid number' },
        string: {
            max: '${label} cannot be more than ${max} characters',
        },
        number: {
            range: '${label} must be between ${min} and ${max}',
        },
    };
    return (React.createElement(FormContext.Provider, { value: contextValue }, context ? (React.createElement("div", Object.assign({}, dataAttrs), p.children)) : (React.createElement(AntForm, Object.assign({}, dataAttrs, { validateMessages: validateMessages }, p, { form: antForm }), p.children))));
});
export function useForm() {
    return AntForm.useForm()[0];
}
export function useFormContext() {
    return useContext(FormContext);
}
//# sourceMappingURL=Form.js.map