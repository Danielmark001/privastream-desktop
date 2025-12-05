import React from 'react';
import cx from 'classnames';
import { InputComponent } from './inputs';
import styles from './ImagePickerInput.m.less';
export const ImagePickerInput = InputComponent((p) => {
    var _a;
    return (React.createElement("div", { className: styles.imagePicker }, (_a = p.options) === null || _a === void 0 ? void 0 : _a.map(opt => (React.createElement("div", { key: opt.value, className: cx(styles.imageOption, p.value === opt.value && styles.active), onClick: () => p.onChange && p.onChange(opt.value) }, typeof opt.image === 'string' ? React.createElement("img", { src: opt.image }) : opt.image)))));
});
//# sourceMappingURL=ImagePickerInput.js.map