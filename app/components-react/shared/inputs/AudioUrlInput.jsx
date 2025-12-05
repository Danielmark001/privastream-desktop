import { InputComponent, useInput } from './inputs';
import InputWrapper from './InputWrapper';
import css from './mediaUrlInput.m.less';
import React from 'react';
import { MediaInputButtons } from './MediaUrlInput';
export const AudioUrlInput = InputComponent((p) => {
    const { wrapperAttrs, inputAttrs, dataAttrs } = useInput('audiourl', p);
    return (<InputWrapper {...wrapperAttrs}>
      <div className={css.audioInput} {...dataAttrs}>
        <MediaInputButtons value={inputAttrs.value} onChange={inputAttrs.onChange} isAudio/>
      </div>
    </InputWrapper>);
});
//# sourceMappingURL=AudioUrlInput.jsx.map