import React, { useEffect, useRef } from 'react';
import { Input } from 'antd';
import { InputComponent, useInput } from './inputs';
import InputWrapper from './InputWrapper';
import CodeMirror from 'codemirror';
import { Services } from '../../service-provider';
import { getDefined } from '../../../util/properties-type-guards';
export const CodeInput = InputComponent((p) => {
    const { inputAttrs, wrapperAttrs } = useInput('code', p);
    const textAreaRef = useRef();
    const codemirrorRef = useRef();
    const value = inputAttrs.value || '';
    useEffect(() => {
        const $textarea = textAreaRef.current.resizableTextArea.textArea;
        const options = Object.assign(Object.assign({}, codemirrorOptions.common), { mode: codemirrorOptions[p.lang].mode, theme: Services.CustomizationService.isDarkTheme ? 'material' : 'xq-light' });
        const codemirror = (codemirrorRef.current = CodeMirror.fromTextArea($textarea, options));
        codemirror.setSize('100%', p.height || 100);
        codemirror.on('changes', (cm, changeObj) => {
            inputAttrs.onChange(cm.getValue());
        });
        return () => codemirror.getWrapperElement().remove();
    }, [p.lang, p.height]);
    useEffect(() => {
        const cm = getDefined(codemirrorRef.current);
        const cmVal = cm.getValue();
        if (cmVal !== value)
            cm.setValue(value);
    }, [value]);
    return (<InputWrapper {...wrapperAttrs}>
      <Input.TextArea ref={textAreaRef}/>
    </InputWrapper>);
});
const codemirrorOptions = {
    common: {
        keyMap: 'sublime',
        lineNumbers: true,
        autofocus: true,
        tabSize: 2,
        autoRefresh: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        autoCloseTags: true,
        extraKeys: {
            Tab: 'emmetExpandAbbreviation',
            Enter: 'emmetInsertLineBreak',
        },
    },
    html: {
        mode: 'htmlmixed',
    },
    css: {
        mode: 'text/css',
    },
    js: {
        mode: 'javascript',
    },
    json: {
        mode: 'javascript',
    },
};
//# sourceMappingURL=CodeInput.jsx.map