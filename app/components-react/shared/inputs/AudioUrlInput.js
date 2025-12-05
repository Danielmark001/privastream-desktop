import { InputComponent, useInput } from './inputs';
import InputWrapper from './InputWrapper';
import css from './mediaUrlInput.m.less';
import React from 'react';
import { MediaInputButtons } from './MediaUrlInput';
export const AudioUrlInput = InputComponent((p) => {
    const { wrapperAttrs, inputAttrs, dataAttrs } = useInput('audiourl', p);
    return (React.createElement(InputWrapper, Object.assign({}, wrapperAttrs),
        React.createElement("div", Object.assign({ className: css.audioInput }, dataAttrs),
            React.createElement(MediaInputButtons, { value: inputAttrs.value, onChange: inputAttrs.onChange, isAudio: true }))));
});
//# sourceMappingURL=AudioUrlInput.js.map